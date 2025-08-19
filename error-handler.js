// error-handler.js

/**
 * @file Centralized error handling for the application.
 */

// Base class for custom application errors. This helps distinguish between operational errors and programmer bugs.
class AppError extends Error {
  constructor(message, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.isOperational = isOperational; // Operational errors are expected (e.g., API timeout).
    Error.captureStackTrace(this, this.constructor);
  }
}

// For errors related to external APIs (RingCentral, Gemini).
export class APIError extends AppError {
  constructor(message, statusCode, service) {
    super(message);
    this.statusCode = statusCode;
    this.service = service;
  }
}

// For errors related to file system operations.
export class FileSystemError extends AppError {
  constructor(message, path) {
    super(message);
    this.path = path;
  }
}

// For configuration errors (e.g., missing .env variables).
export class ConfigError extends AppError {
  constructor(message) {
    super(message);
  }
}

/**
 * Logs a user-friendly error message and exits the process.
 * Designed to be clear and actionable for a junior administrator.
 * @param {Error} err The error object.
 */
export function handleError(err) {
  console.error("\n❌ An error occurred! ❌\n");

  if (err instanceof ConfigError) {
    console.error(`[Configuration Error]: ${err.message}`);
    console.error("👉 Action: Please check your .env file and ensure all required variables are set correctly.");
    console.error("   Refer to the README.md for a list of required environment variables.");
  } else if (err instanceof APIError) {
    console.error(`[API Error]: Failed to communicate with the ${err.service} service.`);
    if (err.statusCode) console.error(`   - Status Code: ${err.statusCode}`);
    console.error(`   - Details: ${err.message}`);
    console.error("👉 Action: Please check your internet connection, the API key for that service in your .env file, and the service's status page.");
  } else if (err instanceof FileSystemError) {
    console.error(`[File System Error]: ${err.message}`);
    if (err.path) console.error(`   - Path: ${err.path}`);
    console.error("👉 Action: Please check that you have write permissions for the directory and that the disk is not full.");
  } else if (err.isOperational) {
    console.error(`[Application Error]: ${err.message}`);
  } else {
    console.error("[Unexpected Error]: An unknown error occurred. This might be a bug in the script.");
    console.error("Please report this issue to the developer with the following details:");
    console.error(err.stack);
  }

  console.error("\nScript will now exit.");
  process.exit(1);
}
