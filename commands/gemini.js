const axios = require('axios');

module.exports = {
  name: 'gemini',
  description: 'Ask a question to Gemini',
  author: 'Heru',
  role: 1,
  async execute(senderId, args, pageAccessToken, sendMessage, replyTo, imageUrl) {
    const prompt = args.join(' ');
    try {
      const apiUrl = `https://joshweb.click/gemini?prompt=${encodeURIComponent(prompt)}&url=${encodeURIComponent(imageUrl)}`;
      const response = await axios.get(apiUrl);
      const text = response.data.gemini;

      // Send the response, split into chunks if necessary
      await sendResponseInChunks(senderId, text, pageAccessToken, sendMessage, replyTo);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken, replyTo);
    }
  }
};

async function sendResponseInChunks(senderId, text, pageAccessToken, sendMessage, replyTo) {
  const maxMessageLength = 2000;
  if (text.length > maxMessageLength) {
    const messages = splitMessageIntoChunks(text, maxMessageLength);
    for (const message of messages) {
      await sendMessage(senderId, { text: message, reply_to: replyTo }, pageAccessToken);
    }
  } else {
    await sendMessage(senderId, { text, reply_to: replyTo }, pageAccessToken);
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
    
