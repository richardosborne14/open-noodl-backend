"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNoodlServer = void 0;
const parse_1 = require("./parse");
const functions_1 = require("./routes/functions");
const functions_admin_1 = require("./routes/functions-admin");
function createMiddleware(noodlServer) {
    return async function middleware(req, res, next) {
        if (req.url.startsWith('/functions/') && req.method === 'POST') {
            (0, functions_1.routeFunctions)(noodlServer, req, res, next);
        }
        else if (req.url.startsWith('/functions-admin')) {
            (0, functions_admin_1.routeFunctionsAdmin)(noodlServer, req, res, next);
        }
        else {
            next();
        }
    };
}
function createNoodlServer(options) {
    const noodlServer = (0, parse_1.createNoodlParseServer)(options);
    const cfMiddleware = createMiddleware(noodlServer);
    // Combine the Noodl Cloud Function middleware with the Parse middleware into one middleware.
    const middleware = (req, res, next) => {
        cfMiddleware(req, res, () => {
            noodlServer.server.app(req, res, next);
        });
    };
    return {
        noodlServer,
        middleware
    };
}
exports.createNoodlServer = createNoodlServer;
