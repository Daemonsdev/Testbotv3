const fs = require('fs');
const path = require('path');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'help',
  description: 'Show available commands',
  role: 1,
  author: 'heru',
  execute(senderId, args, pageAccessToken) {
    const commandsDir = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));

    const commands = commandFiles.map((file, index) => {
      const command = require(path.join(commandsDir, file));
      return {
        title: command.name,
        description: command.description,
        payload: `${command.name.toUpperCase()}_PAYLOAD` // Assuming you handle payloads for commands
      };
    });

    const totalCommands = commandFiles.length;
    const commandsPerPage = 5; // Number of commands per page
    const totalPages = Math.ceil(totalCommands / commandsPerPage);
    let page = parseInt(args[0], 10);

    if (isNaN(page) || page < 1) {
      page = 1;
    }

    if (args[0] && args[0].toLowerCase() === 'all') {
      const helpMessage = `🌟 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 𝙻𝚒𝚜𝚝:\n📕 𝚃𝚘𝚝𝚊𝚕 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 𝙻𝚒𝚜𝚝: ${totalCommands}\n\n${commands.map((cmd, index) => `${index + 1}. ${cmd.title} - ${cmd.description}`).join('\n')}`;

      return sendMessage(senderId, { text: helpMessage }, pageAccessToken);
    }

    const startIndex = (page - 1) * commandsPerPage;
    const endIndex = startIndex + commandsPerPage;
    const commandsForPage = commands.slice(startIndex, endIndex);

    if (commandsForPage.length === 0) {
      return sendMessage(senderId, { text: `Invalid page number. There are only ${totalPages} pages.` }, pageAccessToken);
    }

    // Building quick replies for available commands
    const quickReplies = commandsForPage.map((cmd) => ({
      content_type: "text",
      title: cmd.title,
      payload: cmd.payload
    }));

    const helpMessage = `🌟 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 𝙻𝚒𝚜𝚝 (Page ${page} of ${totalPages}):\n📕 𝚃𝚘𝚝𝚊𝚕 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 𝙻𝚒𝚜𝚝: ${totalCommands}\n\n𝚃𝚢𝚙𝚎 "𝚑𝚎𝚕𝚙 [𝚙𝚊𝚐𝚎]" 𝚝𝚘 𝚜𝚎𝚎 𝚊𝚗𝚘𝚝𝚑𝚎𝚛 𝚙𝚊𝚐𝚎 𝚕𝚒𝚜𝚝..`;

    // Send the message with quick replies for commands
    sendMessage(senderId, {
      text: helpMessage,
      quick_replies: quickReplies,
      buttons: [
        {
          type: "web_url",
          url: "https://www.facebook.com/jaymar.dev.00", // Link to developer's Facebook profile
          title: "Contact Developer"
        }
      ]
    }, pageAccessToken);
  }
};
