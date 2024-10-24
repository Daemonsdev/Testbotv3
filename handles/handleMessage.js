const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { sendMessage } = require('./sendMessage');

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

// Function to get attachments
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

// Handle incoming messages
async function handleMessage(event, pageAccessToken) {
  const senderId = event.sender.id;

  if (event.message && event.message.text) {
    const messageText = event.message.text.trim().toLowerCase();
    const args = messageText.split(' ');
    const commandName = args.shift();

    console.log(`${colors.blue}Received message: ${messageText}${colors.reset}`);
    console.log(`${colors.blue}Command name: ${commandName}${colors.reset}`);

    const config = require('../config.json'); // Import config.json

    if (commands.has(commandName)) {
      const command = commands.get(commandName);

      // Check if the sender is authorized to use the command
      if (command.role === 0 && !config.adminId.includes(senderId)) {
        sendMessage(senderId, { text: 'You are not authorized to use this command.' }, pageAccessToken);
        return;
      }

      try {
        let imageUrl = '';

        // Check if replying to a message with an attachment
        if (event.message.reply_to && event.message.reply_to.mid) {
          try {
            imageUrl = await getAttachments(event.message.reply_to.mid, pageAccessToken);
          } catch (error) {
            console.error("Failed to get attachment:", error);
          }
        } else if (event.message.attachments && event.message.attachments[0]?.type === 'image') {
          imageUrl = event.message.attachments[0].payload.url;
        }

        await command.execute(senderId, args, pageAccessToken, sendMessage, imageUrl);
      } catch (error) {
        console.error(`${colors.red}Error executing command ${commandName}:${colors.reset}`, error);
        sendMessage(senderId, { text: 'There was an error executing that command.' }, pageAccessToken);
      }
    } else {
      console.log(`${colors.red}Command not found: ${commandName}${colors.reset}`);

      // Default to 'ai' command if available
      if (commands.has('ai')) {
        try {
          await commands.get('ai').execute(senderId, [commandName, ...args], pageAccessToken, sendMessage);
        } catch (error) {
          console.error(`${colors.red}Error executing default ai command:${colors.reset}`, error);
          sendMessage(senderId, { text: 'There was an error processing your request.' }, pageAccessToken);
        }
      } else {
        sendMessage(senderId, { text: 'Command not found and no default action available.' }, pageAccessToken);
      }
    }
  }
}

module.exports = { handleMessage };
    
