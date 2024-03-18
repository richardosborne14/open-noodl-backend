require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createNoodlServer } = require("@noodl/cloudservice");

// Function to safely parse number environment variables
function _getNumberEnv(value) {
  const val = Number(value);
  return isNaN(val) ? undefined : val;
}

// Default to 3000 if PORT is not defined or invalid
const port = _getNumberEnv(process.env.PORT) || 3000;

const server = express();

// Apply CORS with preflight cache age
server.use(cors({
  maxAge: 86400, // 24 hours
}));

// Body parser middleware for URL encoded form data
server.use(express.urlencoded({
  extended: true,
}));

// Body parser middleware for JSON, with limit
server.use(express.json({
  limit: "2mb", // Increase or adjust as necessary
}));

const noodlServer = createNoodlServer({
  port,
  databaseURI: String(process.env.DATABASE_URI),
  masterKey: String(process.env.MASTER_KEY),
  appId: String(process.env.APP_ID),
  functionOptions: {
    timeOut: _getNumberEnv(process.env.CLOUD_FUNCTIONS_TIMEOUT) || 15, // Fallback to 15 if not specified
    memoryLimit: _getNumberEnv(process.env.CLOUD_FUNCTIONS_MEMORY_LIMIT) || 256, // Fallback to 256 if not specified
  },
  parseOptions: {
    maxUploadSize: process.env.MAX_UPLOAD_SIZE || "20mb", // Adjust the max upload size or use the environment variable
  },
});

// Use Noodl middleware for all routes
server.use("/", noodlServer.middleware);

// Start listening on the specified port, binding to all network interfaces
server.listen(port, '0.0.0.0', () => {
  console.log(`Noodl Cloud Service listening at http://0.0.0.0:${port}`);
  console.log('Current Environment Variables:', process.env);
});
