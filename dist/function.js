"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeFunction = exports.FunctionLogger = void 0;
const cfcontext_1 = require("./cfcontext");
// The logger that is needed by the cloud functions
// it passes the logs to the parse server logger
class FunctionLogger {
    constructor(noodlParseServer) {
        this.noodlParseServer = noodlParseServer;
    }
    log(level, message) {
        setImmediate(function () {
            this.noodlParseServer.logger._log(level, message);
        });
    }
}
exports.FunctionLogger = FunctionLogger;
async function executeFunction({ port, appId, masterKey, version, logger, headers, functionId, body, timeOut = 15, memoryLimit = 256 }) {
    // Prepare the context
    let cachedContext = await (0, cfcontext_1.getCachedContext)({
        backendEndpoint: 'http://localhost:' + port,
        appId,
        masterKey,
        version,
        logger,
        timeout: timeOut * 1000,
        memoryLimit,
    });
    (0, cfcontext_1.scheduleContextCachePurge)();
    // Execute the request
    const response = await cachedContext.handleRequest({
        functionId,
        headers,
        body: JSON.stringify(body),
    });
    return response;
}
exports.executeFunction = executeFunction;
