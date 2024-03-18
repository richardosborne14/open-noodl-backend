"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
// The logger that is needed by the cloud functions
// it passes the logs to the parse server logger
class Logger {
    constructor(noodlServer) {
        this.noodlServer = noodlServer;
    }
    log(level, message) {
        setImmediate(() => {
            this.noodlServer.logger._log(level, message);
        });
    }
}
exports.Logger = Logger;
