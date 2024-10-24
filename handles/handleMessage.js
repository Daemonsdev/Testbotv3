const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { sendMessage } = require('./sendMessage');

// Import the getAttachments function
async function getAttachments(mid, pageAccessToken) {
  if (!mid) {
    console.error("No message ID provided for getAttachments.");
    throw new Error("No message ID provided.");
  }

  try {
    const { data } = await axios.get(`https://graph.facebook.com/v21.0/${mid}/attachments`, {
      params: { access_token: pageAccessToken }
    });

    if (data && data.data.length > 0 && data.data[0].image_data) {
      return data.data[0].image_data.url;
    } else {
      console.error("No image found in the replied message.");
      throw new Error("No image found in the replied message.");
    }
  } catch (error) {
    console.error("Error fetching attachments:", error);
    throw new Error("Failed to fetch attachments.");
  }
}

const commands = new Map();

// ANSI escape codes for coloring
const colors = {
  blue: '\x1b[34m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

// Load all command modules dynamically
const commandFiles = fs.readdirSync(path.join(__dirname, '../commands')).filter(file => file.endsWith('.js'));

console.log(`${colors.blue}Loading command files:${colors.reset}`);
for (const file of commandFiles) {
  try {
    const command = require(`../commands/${file}`);
    if (command.name && typeof command.execute === 'function' && typeof command.role !== 'undefined') {
      commands.set(command.name, command);
      console.log(`${colors.blue}Successfully loaded command: ${command.name}${colors.reset}`);
    } else {
      throw new Error(`Invalid command structure in file: ${file}. Command role is missing.`);
    }
  } catch (error) {
    console.error(`${colors.red}Failed to load command from file: ${file}${colors.reset}`, error);
  }
}

async function handleMessage(event, pageAccessToken) {
  const senderId = event.sender.id;
  const messageText = event.message.text ? event.message.text.toLowerCase() : null;
  const mid = event.message.mid || null;  // Message ID for fetching attachments

  console.log(`${colors.blue}Received message: ${messageText}${colors.reset}`);

  const args = messageText ? messageText.split(' ') : [];
  const commandName = args.shift();

  console.log(`${colors.blue}Command name: ${commandName}${colors.reset}`);

  const config = require('../config.json'); // Import config.json

  if (mid) {
    try {
      // Attempt to fetch image attachments if a message ID is provided
      const imageUrl = await getAttachments(mid, pageAccessToken);
      console.log(`${colors.blue}Image URL: ${imageUrl}${colors.reset}`);
      sendMessage(senderId, { text: `Here is the image you requested: ${imageUrl}` }, pageAccessToken);
    } catch (error) {
      console.error(`${colors.red}Failed to retrieve attachments:${colors.reset}`, error);
      sendMessage(senderId, { text: 'Could not retrieve any attachments.' }, pageAccessToken);
    }
  } else if (commands.has(commandName)) {
    const command = commands.get(commandName);
    // Check if the sender is authorized to use the command
    if (command.role === 0 && !config.adminId.includes(senderId)) {
      sendMessage(senderId, { text: 'You are not authorized to use this command.' }, pageAccessToken);
      return;
    }
    try {
      await command.execute(senderId, args, pageAccessToken, sendMessage);
    } catch (error) {
      console.error(`${colors.red}Error executing command ${commandName}:${colors.reset}`, error);
      sendMessage(senderId, { text: 'There was an error executing that command.' }, pageAccessToken);
    }
  } else {
    console.log(`${colors.red}Command not found: ${commandName}${colors.reset}`);
    // Default to 'universal' command
    if (commands.has('ai')) {
      try {
        await commands.get('ai').execute(senderId, [commandName, ...args], pageAccessToken, sendMessage);
      } catch (error) {
        console.error(`${colors.red}Error executing default universal command:${colors.reset}`, error);
        sendMessage(senderId, { text: 'There was an error processing your request.' }, pageAccessToken);
      }
    } else {
      sendMessage(senderId, { text: 'Command not found and no default action available.' }, pageAccessToken);
    }
  }
}

module.exports = { handleMessage };
                   
