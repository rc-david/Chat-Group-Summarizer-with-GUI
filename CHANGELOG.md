# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.9] - 2023-10-27

### Fixed
- **Module Resolution**: Moved `error-handler.js` to the project root to resolve a `MODULE_NOT_FOUND` error.
- Updated the `require` path in `index.js` to point to the new location.

## [1.5.8] - 2023-10-27

### Changed
- **Documentation**: Added "Output" and "Troubleshooting" sections to the `README.md` to improve clarity on where reports are saved and how to resolve common issues.

### Fixed
- Corrected a formatting error in the changelog.

## [1.5.7] - 2023-10-27

### Changed
- **Documentation**: Added a dedicated "Output" section to the `README.md` to clarify where the generated summary reports are saved.

## [1.5.6] - 2023-10-27

### Changed
- **Documentation**: Clarified in the `README.md` that `package.json` serves as the project's requirements file and `npm install` is the command to install all dependencies.

## [1.5.5] - 2023-10-27

### Changed
- **Documentation**: Added a troubleshooting entry to `README.md` to clarify the usage of `npm run`.

## [1.5.4] - 2023-10-27

### Fixed
- **Module Import**: Corrected the import for `GenAI` to be a top-level import from `@ringcentral/sdk`, resolving a persistent `MODULE_NOT_FOUND` error.

## [1.5.3] - 2023-10-27

### Fixed
- Corrected the import path for the `GenAI` module in `index.js` to resolve a `MODULE_NOT_FOUND` error. The correct path is `@ringcentral/sdk/lib/ai/gen-ai`.

## [1.5.2] - 2023-10-27

### Added
- **Documentation**: Added a "Troubleshooting" section to the `README.md` to address common issues like `Cannot find module` errors.

## [1.5.1] - 2023-10-27

### Changed
- **Documentation**: Improved the `README.md` to provide a clearer, step-by-step guide for running the application locally after configuration is complete.

## [1.5.0] - 2023-10-27

### Added
- **Project Configuration**: Added a `package.json` file to define project metadata, scripts, and dependencies. This is essential for `npm install` to work correctly.

## [1.4.0] - 2023-10-27

### Changed
- **BREAKING**: Renamed environment variables `RC_APP_KEY` to `RC_CLIENT_ID` and `RC_APP_SECRET` to `RC_CLIENT_SECRET` to align with official RingCentral terminology.
- Updated the RingCentral SDK initialization to use `clientId` and `clientSecret` properties.
- Updated `README.md` and `.env.example` to reflect the new variable names.

## [1.3.0] - 2023-10-27

### Added
- **Environment File Template**: Added a `.env.example` file to serve as a template for users, simplifying the setup process.

## [1.2.0] - 2023-10-27

### Changed
- **Integrated Error Handling**: Refactored the main application logic in `index.js` to fully utilize the `error-handler` module. Errors from API calls and file system operations are now caught and propagated to a central handler, providing clear, actionable feedback.
- Replaced synchronous file system methods with asynchronous `fs/promises`.

### Added
- **Improved Documentation**: Updated `README.md` with a detailed "Configuration and Authentication" section. It now explains the JWT authentication flow vs. SSO and provides clear steps for generating the necessary credentials from the RingCentral Developer Portal.

## [1.1.0] - 2023-10-27

### Added

- **Robust Error Handling**: Implemented a centralized error handling module (`src/error-handler.js`).
- Custom error classes (`APIError`, `FileSystemError`, `ConfigError`) provide specific, actionable feedback for common failure points.
- Error messages are now user-friendly and designed to help a junior administrator troubleshoot issues with configuration, API connectivity, or file permissions.
- Added a global `unhandledRejection` handler to catch unexpected promise errors.

## [1.0.0] - 2023-10-27

### Added

- Initial script implementation.
- Fetches daily or weekly chat messages from a specified RingCentral group chat.
- Uses Google's Gemini Pro to summarize the conversation.
- Generates a structured markdown report with sections for Key Decisions, Action Items, Team Updates, and Overall Sentiment.
- Saves the report to a `./reports` directory with a timestamped filename.
- Caches user names to reduce API calls to RingCentral.
- Configuration is managed via a `.env` file.