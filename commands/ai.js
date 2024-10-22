const axios = require('axios');

module.exports = {
  name: 'ai',
  description: 'Ask a question or analyze an image using the Gemini AI',
  author: 'Heru',
  role: 1,
  async execute(senderId, args, pageAccessToken, sendMessage) {
    const prompt = args.join(' ');

    try {
      // Check if the message contains an image attachment
      if (args.attachments) {
        let attachment_url = args.attachments[0].payload.url;

        // Send the image for recognition using the Gemini API
        const geminiApiUrl = `https://joshweb.click/gemini?prompt=${encodeURIComponent(prompt)}&url=${encodeURIComponent(attachment_url)}`;
        const geminiResponse = await axios.get(geminiApiUrl);
        const recognitionResult = geminiResponse.data.gemini || 'No recognition result available.';

        const formattedResponse = 
`🔍 | 𝙂𝙚𝙢𝙞𝙣𝙞'𝙨 𝙍𝙚𝙘𝙤𝙜𝙣𝙞𝙩𝙞𝙤𝙣:
${recognitionResult}`;

        await sendMessage(senderId, { text: formattedResponse }, pageAccessToken);
        return;  // Stop further processing since the image was handled
      }

      // If no image, process the text query with Heru AI
      const heruApiUrl = `https://heru-ai-1kgm.vercel.app/heru?prompt=${encodeURIComponent(prompt)}`;
      const heruResponse = await axios.get(heruApiUrl);
      const textResponse = heruResponse.data.response;

      // Send the response, split into chunks if necessary
      await sendResponseInChunks(senderId, textResponse, pageAccessToken, sendMessage);
    } catch (error) {
      console.error('Error during API call:', error);
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
