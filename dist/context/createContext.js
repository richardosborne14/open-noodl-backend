"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContext = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const isolated_vm_1 = __importDefault(require("isolated-vm"));
const snapshot_1 = require("./snapshot");
function internalServerError(state, message) {
    Object.keys(state.responseHandlers).forEach((k) => {
        if (typeof state.responseHandlers[k] === "function") {
            state.responseHandlers[k]({
                statusCode: 500,
                body: JSON.stringify({ error: message || "Internal server error" }),
            });
            delete state.responseHandlers[k];
        }
    });
}
async function contextEval(state, script) {
    if (state.isolate.isDisposed)
        return;
    try {
        await state.context.eval(script, { timeout: state.env.functionTimeout * 1000 });
    }
    catch (e) {
        console.log("contextEval", e);
        if (e.message ===
            "Isolate was disposed during execution due to memory limit") {
            // Isolate was disposed, return out of memory error for all pending requests
            internalServerError(state, "Out of memory");
        }
    }
    if (state.isolate.isDisposed) {
        // The isolate was disposed, end all currently pending requests
        internalServerError(state, undefined);
    }
}
function checkMemUsage(state) {
    if (state.isolate.isDisposed)
        return; // Ignore already disposed isolate
    const heap = state.isolate.getHeapStatisticsSync();
    const memUsage = heap.total_heap_size / (1024 * 1024);
    if (memUsage > state.env.memoryLimit * 0.8) {
        // Mem usage has exceeded 80% of limit
        // discard the context, a new context will be created for new incoming requests
        // and this one will be cleaned up
        const uri = state.env.appId + "/" + state.env.version;
        if (!state.markedToBeDiscarded) {
            // Make sure it has not already been marked
            state.markedToBeDiscarded = true;
            console.log(`Marking context ${uri} as to be discarded due to memory limit, will be discarded in 2 mins.`);
            state.global.cache[uri + "/discarded/" + Date.now()] = state.global.cache[uri];
            state.ttl = Date.now() + 2 * 60 * 1000; // Kill in 3 minutes
            delete state.global.cache[uri];
        }
    }
}
async function handleRequest(state, options) {
    return new Promise((resolve) => {
        let hasResponded = false;
        const token = Math.random().toString(26).slice(2);
        state.ttl = Date.now() + 10 * 60 * 1000; // Keep context alive
        state.responseHandlers[token] = (response) => {
            if (hasResponded)
                return;
            hasResponded = true;
            checkMemUsage(state);
            resolve(response);
        };
        try {
            const _req = {
                function: options.functionId,
                headers: options.headers,
                body: options.body, // just forward the raw body
            };
            // TODO: Here is a race condition between setTimeout and contextEval.
            //       Where contextEval also have the same timeout.
            setTimeout(() => {
                if (hasResponded)
                    return;
                hasResponded = true;
                checkMemUsage(state);
                resolve({
                    statusCode: 500,
                    body: JSON.stringify({ error: "timeout" }),
                });
            }, state.env.functionTimeout * 1000);
            contextEval(state, `_noodl_handleReq('${token}',${JSON.stringify(_req)})`)
                .then(() => {
                // All good
            })
                .catch((e) => {
                if (hasResponded)
                    return;
                hasResponded = true;
                checkMemUsage(state);
                resolve({
                    statusCode: 500,
                    body: JSON.stringify({ error: e.message }),
                });
                console.log("Error while running function:", e);
            });
        }
        catch (e) {
            if (hasResponded)
                return;
            hasResponded = true;
            checkMemUsage(state);
            resolve({
                statusCode: 500,
                body: JSON.stringify({ error: e.message }),
            });
            console.log("Error while running function:", e);
        }
    });
}
/**
 * Create an isolated context for a specific environment
 * @param env
 * @returns
 */
async function createContext(global, env) {
    if (env.version === undefined) {
        throw Error("No version specified when creating context.");
    }
    // Load custom code
    console.log("Creating context for version " + env.version);
    console.log("- Loading cloud deploy");
    const res = await (0, node_fetch_1.default)(env.backendEndpoint +
        '/classes/Ndl_CF?where={"version":"' +
        env.version +
        '"}', {
        headers: {
            "X-Parse-Application-Id": env.appId,
            "X-Parse-Master-Key": env.masterKey,
        },
    });
    const data = await res.json();
    let code = "", cloudRuntime = "";
    if (data.results && data.results.length > 0) {
        data.results.sort((a, b) => a._created_at - b._created_at);
        cloudRuntime = data.results[0].runtime;
        data.results.forEach((d) => {
            code += d.code;
        });
    }
    else {
        throw Error(`No cloud functions found for env ${env.appId} and version ${env.version}.`);
    }
    const snapshot = await (0, snapshot_1.getRuntimeSnapshot)(cloudRuntime);
    console.log("- Starting up isolate");
    const isolate = new isolated_vm_1.default.Isolate({ memoryLimit: env.memoryLimit, snapshot });
    const context = await isolate.createContext();
    const jail = context.global;
    // Bootstrap message handler
    jail.setSync("global", context.global.derefInto());
    // ---------------- API ----------------
    let ongoingAPICalls = 0;
    const maxOngoingAPICalls = 100;
    function _api_respond(token, res) {
        ongoingAPICalls--;
        if (ongoingAPICalls < 0)
            ongoingAPICalls = 0;
        if (token !== undefined) {
            contextEval(state, "_noodl_api_response('" + token + "'," + JSON.stringify(res) + ")");
        }
    }
    // Loggers
    const logger = env.logger;
    const apiFunctions = {
        log: function (token, args) {
            logger.log(args.level || "info", typeof args === "string" ? args : args.message);
            _api_respond(token);
        },
        fetch: function (token, args) {
            (0, node_fetch_1.default)(args.url, args)
                .then((r) => {
                r.text()
                    .then((text) => {
                    _api_respond(token, {
                        ok: r.ok,
                        redirected: r.redirected,
                        statusText: r.statusText,
                        status: r.status,
                        headers: r.headers.raw(),
                        body: text,
                    });
                })
                    .catch((e) => {
                    _api_respond(token, { error: e.message || true });
                });
            })
                .catch((e) => {
                _api_respond(token, { error: e.message || true });
            });
        },
        setTimeout: function (token, millis) {
            setTimeout(() => {
                _api_respond(token);
            }, millis);
        },
    };
    jail.setSync("_noodl_api_call", function (functionName, token, args) {
        ongoingAPICalls++;
        if (!apiFunctions[functionName]) {
            _api_respond(token, { error: "No such API function" });
            return;
        }
        if (ongoingAPICalls >= maxOngoingAPICalls) {
            // Protect against user code flooding API calls
            _api_respond(token, { error: "Too many API calls" });
            console.log("Warning too many concurrent ongoing api calls...");
            return;
        }
        //console.log('API Call: ' + functionName + ' with args ', args)
        try {
            const _args = JSON.parse(JSON.stringify(args)); // extra safe
            apiFunctions[functionName](token, _args);
        }
        catch (e) {
            console.log("Warning failed to execute api function: ", e);
            _api_respond(token, { error: "Failed to execute API call" });
        }
    });
    // event queue
    let hasScheduledProcessJobs = false;
    jail.setSync("_noodl_request_process_jobs", function () {
        if (hasScheduledProcessJobs)
            return;
        hasScheduledProcessJobs = true;
        setImmediate(() => {
            hasScheduledProcessJobs = false;
            contextEval(state, "_noodl_process_jobs()");
        });
    });
    // Some cloud services related stuff
    jail.setSync("_noodl_cloudservices", {
        masterKey: env.masterKey,
        endpoint: env.backendEndpoint,
        appId: env.appId,
    }, { copy: true });
    // Result from request
    jail.setSync("_noodl_response", function (token, args) {
        if (typeof state.responseHandlers[token] === "function") {
            state.responseHandlers[token](args);
            delete state.responseHandlers[token];
        }
    });
    try {
        const script = await isolate.compileScript(code);
        await script.run(context, {
            timeout: env.initializeTimeout * 1000, // 15 s to initialize
        });
    }
    catch (e) {
        console.log("Failed when compiling and running cloud function code");
        isolate.dispose();
        throw e;
    }
    const state = {
        global,
        env,
        context,
        isolate,
        markedToBeDiscarded: false,
        ttl: Date.now() + 10 * 60 * 1000,
        responseHandlers: {}
    };
    return {
        state,
        eval: (script) => contextEval(state, script),
        handleRequest: (options) => handleRequest(state, options),
    };
}
exports.createContext = createContext;
