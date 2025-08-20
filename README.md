# RingRecap: The Chat Summarizer

This project provides a way to summarize chat conversations from RingCentral's Glip service. By using this tool, you can generate daily and weekly reports of your group chat conversations.

***

## Getting Started

Follow these steps to set up and run the project.

### 1. Clone the Repository

First, you need a local copy of the project's code. This is done by cloning the repository using Git.

* **Open your terminal** (Command Prompt or PowerShell on Windows, Terminal on macOS)
* Navigate to the directory where you want to store the project
* Run the `git clone` command with the repository's URL:
    ```bash
    git clone https://github.com/rc-david/Chat-Group-Summarizer-with-GUI.git
    ```

### 2. Install Dependencies

Once you have the project files, you need to install the necessary libraries it depends on.

* Navigate into the project folder you just created:
    ```bash
    cd Chat-Group-Summarizer-with-GUI
    ```
* Run the installation command. This reads the `package.json` file and downloads all required libraries into a `node_modules` folder
    ```bash
    npm install
    ```

### 3. Create the Environment File

You need to create a local environment file to store your credentials. This is done by making a copy of the provided template file.

* While inside the project folder in your terminal, run the command for your operating system:

    * **On Windows (Command Prompt):**
        ```cmd
        copy .env.example .env
        ```
    * **On macOS / Linux (Terminal):**
        ```bash
        cp .env.example .env
        ```

### 4. Configure Credentials

Open the new `.env` file with a text editor. You will need to fill in the required values as described in the **Configuration and Authentication** section below.

### 5. Run the Summarizer

Once your `.env` file is complete and saved, you can generate a report using the commands in the **Usage** section.

***

## Configuration and Authentication

This application requires several environment variables to be set in the `.env` file.

### Environment Variables Explained

* `RC_SERVER`: The RingCentral API server URL (e.g., `https://platform.ringcentral.com`)
* `RC_CLIENT_ID`: Your RingCentral application's **Client ID**
* `RC_CLIENT_SECRET`: Your RingCentral application's **Client Secret**
* `RC_JWT`: A valid JSON Web Token for server-to-server authentication
* `RC_CHAT_ID`: The ID of the group chat you want to summarize
* `GEMINI_API_KEY`: Your API key for the Google Gemini service, which can be generated from Google AI Studio

### How Authentication Works (JWT vs. SSO)

While you may use Single Sign-On (SSO) to log into the RingCentral web portal, this script uses **JWT (JSON Web Token)** authentication. JWT is designed for server-to-server interactions where a user isn't present to log in. You will use your standard RingCentral account to log into the Developer Portal for a one-time setup to generate this JWT.

### Generating a JWT Token

1.  Log into the **RingCentral Developer Portal** and create a new app
2.  Choose **"REST API App"** for the App Type and **"Server/Bot"** for the Platform Type
3.  Grant the app the `Read Messages` and `Team Messaging` API permissions
4.  In the app's settings, go to the **Authentication** tab and ensure `JWT` is the selected security mechanism
5.  On your app's main dashboard page in the developer portal, you will find a section for generating a JWT. Use this built-in tool to create a long-lived token
6.  Copy the `RC_CLIENT_ID`, `RC_CLIENT_SECRET`, and the generated `RC_JWT` into your `.env` file

> **Note on receiving credentials:** If someone provided you with app credentials, you still need to obtain the `RC_JWT` string. The easiest way is to use the credentials to log into the RingCentral Developer Portal, find the application, and use the portal's JWT generation tool.

### Token Lifetime and Refreshing

The JWT you generate is a long-lived credential. The RingCentral SDK automatically uses this JWT to manage short-lived access and refresh tokens. **You do not need to write any code to handle token refreshing.** Just ensure the `RC_JWT` in your `.env` file has not expired.

### Finding your Group Chat ID

1.  In the RingCentral app, navigate to your group chat, click the **three-dots menu**, and select **"Copy conversation link"**
2.  The link will look like `https://app.ringcentral.com/glip/groups/123456789`
3.  The number at the end (`123456789`) is your `RC_CHAT_ID`. Copy this into your `.env` file

***

## Usage

Once configured, you can generate reports from your terminal using these npm scripts. Reports are saved as Markdown files in the `reports` directory.

### Daily Report

This generates a summary of the chat conversation from the beginning of the current day.
```bash
npm start
npm start index.js
