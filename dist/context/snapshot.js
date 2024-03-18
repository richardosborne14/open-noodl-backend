"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRuntimeSnapshot = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const isolated_vm_1 = __importDefault(require("isolated-vm"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Create a snapshot of a given runtime if needed
// of serve from the cache
const snapshots = {};
function createSnapshot(script) {
    return isolated_vm_1.default.Isolate.createSnapshot([
        {
            code: `var _noodl_handleReq, _noodl_api_response,_noodl_process_jobs;`,
        }, // Must declare, otherwise we will get error when trying to set as global from function
        { code: script },
    ]);
}
async function fetchRuntime(url) {
    console.log("- Loading runtime script");
    const res = await (0, node_fetch_1.default)(url);
    const script = await res.text();
    return createSnapshot(script);
}
async function getRuntimeSnapshot(functionRuntimeVersion) {
    const cloudRuntimeUrl = process.env.NOODL_CLOUD_RUNTIMES_LOCATION;
    if (cloudRuntimeUrl) {
        const url = cloudRuntimeUrl.replace("{runtime}", functionRuntimeVersion);
        if (snapshots[url]) {
            try {
                await snapshots[url];
            }
            catch (e) {
                console.log(`Disposing runtime snapshot due to error in create: `, e);
                delete snapshots[url];
            }
        }
        if (!snapshots[url]) {
            snapshots[url] = fetchRuntime(url);
        }
        console.log("- Using runtime: " + url);
        return snapshots[url];
    }
    // Create a snapshot with the builtin cloud runtime
    if (!snapshots['__builtin']) {
        const filePath = path_1.default.join(__dirname, '../static/cloud-runtime.js');
        if (!fs_1.default.existsSync(filePath)) {
            throw new Error("Failed to find builtin cloud runtime: " + filePath);
        }
        const fileContent = fs_1.default.readFileSync(filePath, 'utf-8');
        snapshots['__builtin'] = Promise.resolve(createSnapshot(fileContent));
        console.log("- Using runtime: builtin");
    }
    return snapshots['__builtin'];
}
exports.getRuntimeSnapshot = getRuntimeSnapshot;
