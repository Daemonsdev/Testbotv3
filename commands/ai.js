const axios = require('axios');
const { sendMessage } = require('./sendMessage');

module.exports = {
  name: 'heru',
  description: 'Ask a question to the Heru AI',
  author: 'Heru',
  role: 1,
  async execute(senderId, args, pageAccessToken, sendMessage) {
    const prompt = args.join(' ');

    try {
      if (args.attachments) {
        let attachment_url = args.attachments[0].payload.url;
        
        // what if ganto
        const imageResponse = {
          attachment: {
            type: 'image',
            payload: {
              url: attachment_url,
              is_reusable: true
            }
          }
        };
        await sendMessage(senderId, imageResponse, pageAccessToken);
        return; 
      }

      const apiUrl = `https://heru-ai-1kgm.vercel.app/heru?prompt=${encodeURIComponent(prompt)}`;
      const response = await axios.get(apiUrl);
      const text = response.data.response;

      // Send the response, split into chunks if necessary
      await sendResponseInChunks(senderId, text, pageAccessToken, sendMessage);
    } catch (error) {
      console.error('Error calling Heru AI API:', error);
      sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
    }
  }
};

async function sendResponseInChunks(senderId, text, pageAccessToken, sendMessage) {
  const maxMessageLength = 2000;
  if (text.length > maxMessageLength) {
    const messages = splitMessageIntoChunks(text, maxMessageLength);
    for (const message of messages) {
      await sendMessage(senderId, { text: message }, pageAccessToken);
    }
  } else {
    await sendMessage(senderId, { text }, pageAccessToken);
  }
}

function splitMessageIntoChunks(message, chunkSize) {
  const chunks = [];
  let chunk = '';
  const words = message.split(' ');

  for (const word of words) {
    if ((chunk + word).length > chunkSize) {
      chunks.push(chunk.trim());
      chunk = '';
    }
    chunk += `${word} `;
  }

  if (chunk) {
    chunks.push(chunk.trim());
  }

  return chunks;
}
