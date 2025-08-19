// index.js (Upgraded for Confluence-Friendly Output)

import 'dotenv/config';
import { promises as fsPromises, createWriteStream } from 'fs';
import path from 'path';
import express from 'express';
import showdown from 'showdown';
import { format } from 'date-fns';
import * as RingCentralSDK from '@ringcentral/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { handleError, ConfigError } from './error-handler.js';

// --- SETUP ---
const personCache = {};
const app = express();
const port = 3000;
const reportsDir = './reports';
const mdConverter = new showdown.Converter({ openLinksInNewWindow: true });

const PRESET_CHAT_GROUPS = {
    '7595909126': 'Global CC TAM',
    '21861851142': 'Global RingEX TAM',
    '1310416902': 'Global Advanced Support (UC)',
    '17273856006': 'CC Support (NA, EMEA, and APAC)',
    '122943823878': 'TAM Message Board'
};

// --- API ENDPOINTS ---

app.get('/', (req, res) => res.sendFile(path.resolve(process.cwd(), 'index.html')));

app.get('/reports', async (req, res) => {
  try {
    await fsPromises.mkdir(reportsDir, { recursive: true });
    const files = await fsPromises.readdir(reportsDir);
    res.json(files.filter(file => file.endsWith('.md')).sort().reverse());
  } catch (error) {
    res.status(500).json({ error: 'Failed to read reports directory.' });
  }
});

app.get('/report/:filename', async (req, res) => {
  try {
    const filePath = path.join(reportsDir, req.params.filename);
    const markdown = await fsPromises.readFile(filePath, 'utf-8');
    const html = mdConverter.makeHtml(markdown);
    res.json({ markdown, html }); // Send both formats
  } catch (error) {
    res.status(404).send('Report not found.');
  }
});

app.get('/generate-report', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const { debug } = req.query;
  const isDebugMode = debug === 'true';
  let logStream;

  if (isDebugMode) {
      logStream = createWriteStream('debug.log', { flags: 'a' });
      logStream.write(`\n--- NEW DEBUG SESSION: ${new Date().toISOString()} ---\n`);
  }

  const logDebug = (message) => {
      if (isDebugMode) {
          console.log(message);
          logStream.write(`${message}\n`);
      }
  };

  const sendEvent = (type, message, data = {}) => {
      res.write(`data: ${JSON.stringify({ type, message, ...data })}\n\n`);
  };

  try {
    const RingCentral = RingCentralSDK.SDK;
    sendEvent('status', 'Initializing SDKs...');
    const rcsdk = new RingCentral({ server: process.env.RC_SERVER, clientId: process.env.RC_CLIENT_ID, clientSecret: process.env.RC_CLIENT_SECRET });
    const platform = rcsdk.platform();
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    sendEvent('status', 'Logging into RingCentral...');
    await platform.login({ jwt: process.env.RC_JWT });
    sendEvent('status', 'Successfully logged in!');

    const { dateFrom, timeFrom, dateTo, timeTo } = req.query;
    let { chatId: chatIds } = req.query;
    if (!Array.isArray(chatIds)) chatIds = [chatIds];

    const startDateTime = new Date(`${dateFrom}T${timeFrom}:00Z`);
    const endDateTime = new Date(`${dateTo}T${timeTo}:00Z`);
    
    if (!chatIds || chatIds.length === 0) {
        throw new ConfigError('No Chat ID provided.');
    }

    let allConversations = [];
    for (const chatId of chatIds) {
        const groupName = PRESET_CHAT_GROUPS[chatId] || `Custom Group (${chatId})`;
        sendEvent('status', `Fetching messages from ${groupName}...`);
        const messages = await fetchChatMessages(platform, chatId, startDateTime, endDateTime, logDebug);
        sendEvent('status', `Found ${messages.length} messages in ${groupName}.`);
        if (messages.length > 0) {
            allConversations.push({ groupName, messages, chatId });
        }
    }

    if (allConversations.length === 0) {
      sendEvent('status', 'No new messages found in any selected groups.');
      sendEvent('done');
      return;
    }
    
    sendEvent('status', 'Analyzing conversations with Gemini AI...');
    const summary = await summarizeConversations(platform, genAI, allConversations, sendEvent);
    sendEvent('status', 'Analysis complete.');

    sendEvent('status', 'Saving report file...');
    const { filePath, html, markdown } = await generateMarkdownReport(summary, startDateTime, endDateTime);
    sendEvent('status', `Report saved to ${filePath}`);
    sendEvent('report', 'Report content generated.', { html, markdown });
    sendEvent('done');

  } catch (error) {
    const { name, message } = handleError(error, false);
    logDebug(`[ERROR] ${name}: ${message}\n${error.stack}`);
    sendEvent('error', name, { details: message });
  } finally {
    if (logStream) logStream.end();
    res.end();
  }
});

app.listen(port, () => {
  console.log(`Chat Summarizer is running at http://localhost:${port}`);
});

// --- HELPER FUNCTIONS ---

const fetchChatMessages = async (platform, chatId, dateFrom, dateTo, logDebug) => {
  const params = { recordCount: 250 };
  
  let endpoint;
  try {
    endpoint = `/restapi/v1.0/glip/teams/${chatId}/posts`;
    await platform.get(endpoint, { qs: { recordCount: 1 } });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      endpoint = `/restapi/v1.0/glip/chats/${chatId}/posts`;
    } else { throw error; }
  }

  logDebug(`[DEBUG] Using endpoint: ${endpoint}`);
  const resp = await platform.get(endpoint, { qs: params });
  const json = await resp.json();
  const allRecords = json.records || [];

  return allRecords.filter(record => {
      const messageTime = new Date(record.creationTime);
      return messageTime >= dateFrom && messageTime <= dateTo;
  }).reverse();
};

const getPersonName = async (platform, personId) => {
    if (personCache[personId]) return personCache[personId];
    try {
        const resp = await platform.get(`/restapi/v1.0/glip/persons/${personId}`);
        const json = await resp.json();
        return `${json.firstName} ${json.lastName}`;
    } catch (e) {
        return `User (${personId})`;
    }
};

const summarizeConversations = async (platform, genAI, conversations, sendEvent) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  let fullConversationText = '';
  for (const convo of conversations) {
      fullConversationText += `\n\n--- START OF CONVERSATION FROM GROUP: ${convo.groupName} ---\n`;
      const formattedMessages = await Promise.all(convo.messages.map(async (message) => {
          if (!message.text) return null;
          const authorName = await getPersonName(platform, message.creatorId);
          const postDate = format(new Date(message.creationTime), 'MM/dd/yyyy @ hh:mm a zzz');
          const postLink = `https://app.ringcentral.com/l/messages/${convo.chatId}/${message.id}`;
          return `[${authorName} at ${postDate}]: ${message.text} (Link: ${postLink})`;
      }));
      fullConversationText += formattedMessages.filter(Boolean).join('\n');
      fullConversationText += `\n--- END OF CONVERSATION FROM GROUP: ${convo.groupName} ---\n`;
  }

  const prompt = `
    You are an expert analyst summarizing team chat conversations for a manager. Your goal is to create a clean, scannable Markdown report suitable for copying into Confluence.
    Analyze the following chat logs.

    Generate a detailed report in **pure Markdown format**.

    First, create a high-level summary section:
    ## Daily Case/Issue Summary
    * Identify all unique cases or incidents (e.g., INC-44958, SE Case 28743083) mentioned.
    * For each, provide a concise, one-sentence summary of the updates that occurred ONLY within the provided time period.

    ---

    Second, create a detailed breakdown section:
    ## Detailed Analysis
    *For each distinct topic or incident, create a sub-section.*
    ### [Topic or Incident Title]
    * **Summary:** A concise paragraph summarizing the key points, discussions, and outcomes for this topic.
    * **Timeline & Key Posts:**
        * **[Date @ Time Timezone] by [Author]:** [Summary of the post's content]. ([View Post](link))
        * **[Date @ Time Timezone] by [Author]:** [Summary of the post's content]. ([View Post](link))

    Ensure there is a clear line separator (---) between the high-level summary and the detailed breakdown.

    Here are the chat logs:
    ${fullConversationText}
  `;

  let retries = 3;
  let delay = 2000;
  while (retries > 0) {
    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        if (error.message.includes('503')) {
            retries--;
            if (retries > 0) {
                sendEvent('status', `Gemini API is busy. Retrying in ${delay / 1000} seconds... (${retries} retries left)`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            } else {
                throw new Error("Gemini API is overloaded after multiple retries.");
            }
        } else {
            throw error;
        }
    }
  }
};

const generateMarkdownReport = async (summary, dateFrom, dateTo) => {
  const fromStr = format(dateFrom, 'MM-dd-yyyy-HH-mm');
  const toStr = format(dateTo, 'MM-dd-yyyy-HH-mm');
  const isSingleDay = format(dateFrom, 'MM-dd-yyyy') === format(dateTo, 'MM-dd-yyyy');

  const filename = isSingleDay
    ? `Analysis-${fromStr}.md`
    : `Analysis-${fromStr}_to_${toStr}.md`;
  
  const title = isSingleDay
    ? `# Chat Analysis for ${format(dateFrom, 'MM-dd-yyyy')}`
    : `# Chat Analysis from ${format(dateFrom, 'MM-dd-yyyy')} to ${format(dateTo, 'MM-dd-yyyy')}`;
  
  const reportGeneratedTime = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
  const content = `${title}\n\n*Report generated on ${reportGeneratedTime}*\n\n${summary}`;
  
  await fsPromises.mkdir(reportsDir, { recursive: true });
  await fsPromises.writeFile(path.join(reportsDir, filename), content);
  
  const html = mdConverter.makeHtml(content);
  return { filePath: path.join(reportsDir, filename), html, markdown: content };
};
