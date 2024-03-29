"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNoodlParseServer = void 0;
const path_1 = __importDefault(require("path"));
const parse_server_1 = __importStar(require("parse-server"));
const mongodb_1 = require("./mongodb");
function createNoodlParseServer({ port = 3000, databaseURI, masterKey, appId, functionOptions, parseOptions = {}, }) {
    const serverURL = `http://localhost:${port}/`;
    const logger = new mongodb_1.LoggerAdapter({
        databaseURI
    });
    // Create files adapter
    let filesAdapter;
    if (process.env.S3_BUCKET) {
        console.log('Using AWS S3 file storage with bucket ' + process.env.S3_BUCKET);
        if (!process.env.S3_SECRET_KEY || !process.env.S3_BUCKET) {
            throw Error("You must provide S3_SECRET_KEY and S3_ACCESS_KEY environment variables in addition to S3_BUCKET for S3 file storage.");
        }
        filesAdapter = new parse_server_1.S3Adapter(process.env.S3_ACCESS_KEY, process.env.S3_SECRET_KEY, process.env.S3_BUCKET, {
            region: process.env.S3_REGION,
            bucketPrefix: process.env.S3_BUCKET_PREFIX,
            directAccess: process.env.S3_DIRECT_ACCESS === 'true'
        });
    }
    else if (process.env.GCS_BUCKET) {
        const GCSAdapter = require('parse-server-gcs-adapter');
        if (!process.env.GCP_PROJECT_ID || !process.env.GCP_CLIENT_EMAIL || !process.env.GCP_PRIVATE_KEY) {
            throw Error("You must provide GCP_PROJECT_ID, GCP_CLIENT_EMAIL, GCP_PRIVATE_KEY environment variables in addition to GCS_BUCKET for GCS file storage.");
        }
        console.log('Using GCS file storage with bucket ' + process.env.GCS_BUCKET);
        filesAdapter = new GCSAdapter(process.env.GCP_PROJECT_ID, {
            client_email: process.env.GCP_CLIENT_EMAIL,
            private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/gm, '\n')
        }, process.env.GCS_BUCKET, {
            directAccess: process.env.GCS_DIRECT_ACCESS === 'true',
            bucketPrefix: process.env.GCS_BUCKET_PREFIX
        });
    }
    const server = new parse_server_1.default({
        databaseURI,
        cloud: path_1.default.resolve(__dirname, './static/cloud.cjs'),
        push: false,
        appId,
        masterKey,
        serverURL,
        appName: "Noodl App",
        // allowCustomObjectId is needed for Noodl's cached model writes
        allowCustomObjectId: true,
        loggerAdapter: logger,
        // We do this just to get the right behaviour for emailVerified (no emails are sent)
        publicServerURL: process.env.PUBLIC_SERVER_URL || 'https://you-need-to-set-public-server-env-to-support-files',
        verifyUserEmails: true,
        emailAdapter: {
            sendMail: () => { },
            sendVerificationEmail: () => { },
            sendPasswordResetEmail: () => { }
        },
        filesAdapter,
        ...parseOptions,
    });
    return {
        functionOptions: {
            timeOut: functionOptions.timeOut || 15,
            memoryLimit: functionOptions.memoryLimit || 256
        },
        options: {
            port,
            appId,
            masterKey,
        },
        server,
        logger,
    };
}
exports.createNoodlParseServer = createNoodlParseServer;
