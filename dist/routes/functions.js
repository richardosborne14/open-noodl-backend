"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeFunctions = void 0;
const function_1 = require("../function");
const function_deploy_1 = require("../function-deploy");
const logger_1 = require("../logger");
async function routeFunctions(noodlServer, req, res, next) {
    try {
        const path = req.url;
        const functionId = decodeURIComponent(path.split("/")[2]);
        if (functionId === undefined)
            return next();
        console.log("Running cloud function " + functionId);
        let requestVersion = req.headers["x-noodl-cloud-version"];
        let version = requestVersion
            ? { functionVersion: String(requestVersion) }
            : await (0, function_deploy_1.getLatestVersion)(noodlServer.options);
        // Execute the request
        const cfResponse = await (0, function_1.executeFunction)({
            port: noodlServer.options.port,
            appId: noodlServer.options.appId,
            masterKey: noodlServer.options.masterKey,
            version,
            logger: new logger_1.Logger(noodlServer),
            headers: req.headers,
            functionId,
            body: req.body,
            timeOut: noodlServer.functionOptions.timeOut,
            memoryLimit: noodlServer.functionOptions.memoryLimit,
        });
        if (cfResponse.headers) {
            res
                .status(cfResponse.statusCode)
                .set(cfResponse.headers)
                .send(cfResponse.body);
        }
        else {
            res
                .status(cfResponse.statusCode)
                .set({ "Content-Type": "application/json" })
                .send(cfResponse.body);
        }
    }
    catch (e) {
        console.log("Something went wrong when running function", e);
        res.status(400).json({
            error: "Something when wrong...",
        });
    }
}
exports.routeFunctions = routeFunctions;
