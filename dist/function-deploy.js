"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployFunctions = exports.getLatestVersion = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const utils_1 = require("./utils");
// Get the latest version of cloud functions deploy, if not provided in header
async function fetchLatestVersion({ appId, masterKey, port }) {
    const res = await (0, node_fetch_1.default)('http://localhost:' + port + '/classes/Ndl_CF?limit=1&order=-createdAt&keys=version', {
        headers: {
            'X-Parse-Application-Id': appId,
            'X-Parse-Master-Key': masterKey
        }
    });
    if (!res.ok) {
        return undefined;
    }
    const json = await res.json();
    if (json.results && json.results.length === 1) {
        return {
            functionVersion: json.results[0].version,
        };
    }
    return undefined;
}
let _latestVersionCache = undefined;
async function getLatestVersion(options) {
    if (_latestVersionCache && (_latestVersionCache.ttl === undefined || _latestVersionCache.ttl > Date.now())) {
        return _latestVersionCache;
    }
    _latestVersionCache = undefined;
    const latestVersion = await fetchLatestVersion(options);
    if (latestVersion) {
        _latestVersionCache = {
            ...latestVersion,
            ttl: Date.now() + 15 * 1000 // Cache for 15s
        };
        return _latestVersionCache;
    }
}
exports.getLatestVersion = getLatestVersion;
async function deployFunctions({ port, appId, masterKey, runtime, data }) {
    const deploy = "const _exportedComponents = " + data;
    const version = utils_1.Utils.randomString(16);
    // Split deploy into 100kb sizes
    const chunks = utils_1.Utils.chunkString(deploy, 100 * 1024);
    // Upload all (must be waterfall so they get the right created_at)
    const serverUrl = 'http://localhost:' + port;
    for (let i = 0; i < chunks.length; i++) {
        await (0, node_fetch_1.default)(serverUrl + '/classes/Ndl_CF', {
            method: 'POST',
            body: JSON.stringify({
                code: chunks[i],
                version,
                runtime,
                ACL: {
                    "*": {
                        read: false,
                        write: false
                    }
                }
            }), // Make it only accessible to masterkey
            headers: {
                'X-Parse-Application-Id': appId,
                'X-Parse-Master-Key': masterKey
            }
        });
    }
    return {
        version
    };
}
exports.deployFunctions = deployFunctions;
