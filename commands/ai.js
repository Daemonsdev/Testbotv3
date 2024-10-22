const axios = require('axios');

module.exports = {
  name: 'ai',
  description: 'Ask a question or analyze an image using the Gemini AI',
  author: 'Heru',
  role: 1,
  async execute(senderId, args, pageAccessToken, sendMessage, receivedMessage) {
    const prompt = args.join(' ');

    try {
      // Check if the message contains an image attachment
      if (receivedMessage.attachments && receivedMessage.attachments[0].type === 'image') {
        let attachment_url = receivedMessage.attachments[0].payload.url;

        // Ask user for action on the image (describe or analyze)
        const messageReply = {
          text: "I received an image. What would you like me to do?",
          quick_replies: [
            {
              content_type: "text",
              title: "Describe this photo",
              payload: `DESCRIBE_PHOTO_${attachment_url}`
            },
            {
              content_type: "text",
              title: "Analyze this photo",
              payload: `ANALYZE_PHOTO_${attachment_url}`
            }
          ]
        };
        await sendMessage(senderId, messageReply, pageAccessToken);
        return;
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

// Function to handle quick replies for describing or analyzing the image
module.exports.handleQuickReply = async (senderId, payload, pageAccessToken, sendMessage) => {
  try {
    if (payload.startsWith('DESCRIBE_PHOTO_')) {
      let imageUrl = payload.split('DESCRIBE_PHOTO_')[1];

      // Call Gemini API for image description
      const geminiApiUrl = `https://joshweb.click/gemini?prompt=Describe&url=${encodeURIComponent(imageUrl)}`;
      const geminiResponse = await axios.get(geminiApiUrl);
      const description = geminiResponse.data.gemini || 'No description available.';

      await sendMessage(senderId, { text: `📸 | Description: ${description}` }, pageAccessToken);
    } else if (payload.startsWith('ANALYZE_PHOTO_')) {
      let imageUrl = payload.split('ANALYZE_PHOTO_')[1];

      // Call Gemini API for image analysis
      const geminiApiUrl = `https://joshweb.click/gemini?prompt=Analyze&url=${encodeURIComponent(imageUrl)}`;
      const geminiResponse = await axios.get(geminiApiUrl);
      const analysis = geminiResponse.data.gemini || 'No analysis available.';

      await sendMessage(senderId, { text: `🔍 | Analysis: ${analysis}` }, pageAccessToken);
    }
  } catch (error) {
    console.error('Error handling quick reply:', error);
    sendMessage(senderId, { text: 'Sorry, there was an error processing the image.' }, pageAccessToken);
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
  
