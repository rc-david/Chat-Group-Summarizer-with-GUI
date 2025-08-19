# Chat Group Summarizer

This project provides a way to summarize chat conversations from RingCentral's Glip service. By using this tool, you can generate daily and weekly reports of your group chat conversations.

## Getting Started

Follow these steps to set up and run the project:

1.  **Clone the Repository**: Get a local copy of the project.
2.  **Install Dependencies**: Open your terminal in the project folder and run `npm install`. This command reads the `package.json` file (which acts as a requirements file) and automatically downloads all the necessary libraries for the project.
3.  **Create Environment File**: Copy the template file by running `copy .env.example .env` (on Windows) or `cp .env.example .env` (on Mac/Linux).
4.  **Configure Credentials**: Open the new `.env` file and fill it out using the detailed instructions in the **Configuration and Authentication** section below.
5.  **Run the Summarizer**: Once your `.env` file is complete, you can generate a report using the commands in the **Usage** section.

## Configuration and Authentication

This application requires several environment variables to be set in a `.env` file in the project root.

### Environment Variables

*   `RC_SERVER`: Your RingCentral API server URL (e.g., `https://platform.ringcentral.com`).
*   `RC_CLIENT_ID`: Your RingCentral application's **Client ID**.
*   `RC_CLIENT_SECRET`: Your RingCentral application's **Client Secret**.
*   `RC_JWT`: A valid JSON Web Token for server-to-server authentication.
*   `RC_CHAT_ID`: The ID of the group chat you want to summarize.
*   `GEMINI_API_KEY`: Your API key for the Google Gemini service. You can generate this key from the Google AI Studio. **Note:** This should be the simple API key string, not a JSON service account file downloaded from Google Cloud Platform.

### How Authentication Works (JWT vs. SSO)

You may use Single Sign-On (SSO) to log into the RingCentral web portal, but this script does **not** use SSO directly. It uses **JWT (JSON Web Token)** authentication, which is designed for server-to-server interactions where no user is present to log in.

You will use your regular RingCentral account (likely via SSO) to log into the RingCentral Developer Portal to perform a one-time setup to generate this JWT.

### Generating a JWT Token

1.  **Create an App**: Log into the RingCentral Developer Portal and create a new app.
2.  **App Type & Platform**: Choose "REST API App" for the App Type and "Server/Bot" for the Platform Type.
3.  **Permissions**: Grant the app the necessary API permissions. For this script, you will need `ReadAccounts` and `Glip`.
4.  **Authentication**: In the app's settings, find the "Authentication" section. Ensure `JWT` is selected as the security mechanism.
5.  **Generate JWT**: On your app's main dashboard page in the developer portal, you will find a section for generating a JWT. Use this built-in tool to create a long-lived token. It will use your Client ID and Client Secret automatically. **You do not need to configure an OAuth Redirect URI for this type of application.**
6.  **Store Credentials**: Copy the `RC_CLIENT_ID`, `RC_CLIENT_SECRET`, and the generated `RC_JWT` into your `.env` file.

> **Note on receiving credentials:** If someone provided you with the app credentials (for example, in a JSON file), that file likely contains your `RC_CLIENT_ID` and `RC_CLIENT_SECRET`. You still need to obtain the `RC_JWT` string. The easiest way is to use the credentials to log into the RingCentral Developer Portal, find the application, and use the portal's JWT generation tool as described above. The script does not read the JSON file directly.

#### Token Lifetime and Refreshing

The JWT you generate in the developer portal is a long-lived credential. When the application uses this JWT to log in, the RingCentral SDK automatically receives and manages short-lived access tokens and refresh tokens behind the scenes. **You do not need to write any code to handle token refreshing; the SDK does it for you.** Your primary responsibility is to ensure the JWT in your `.env` file has not expired or been revoked.

### Finding your Group Chat ID

Navigate to the desired group chat in the RingCentral app, click the three-dots menu, and select **"Copy conversation link"**. The link will look like `https://app.ringcentral.com/glip/groups/123456789`. The number at the end is your `RC_CHAT_ID`.
## Usage

Once you have completed the setup and configuration, you can generate reports from your terminal using the following npm scripts.

### Daily Report

This will generate an "End of Day" summary of the chat conversation from the beginning of the current day.

```bash
npm run report:daily
```

Or simply:

```bash
npm start
```

### Weekly Report

This will generate a summary of all conversations from the last 7 days.

```bash
npm run report:weekly
```

This will generate a new Markdown file in the `reports` directory with the summary.