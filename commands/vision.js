const axios = require("axios");
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: "vision",
  description: "Interact with Google Gemini for image recognition and text queries.",
  role: 1,
  author: "heru",

  async execute(chilli, pogi, kalamansi, event) {
    const kalamansiPrompt = pogi.join(" ");
    
    if (!kalamansiPrompt) {
      return sendMessage(chilli, { text: `Please enter your question or image to analyz` }, kalamansi);
    }

    sendMessage(chilli, { text: "Please wait... 🔎" }, kalamansi);

    try {
      let imageUrl = "";

      // Safely check if event.message exists before accessing reply_to
      if (event.message?.reply_to?.mid) {
        imageUrl = await getRepliedImage(event.message.reply_to.mid, kalamansi);
      } 
      // Safely check if attachments exist before accessing them
      else if (event.message?.attachments && event.message.attachments[0]?.type === 'image') {
        imageUrl = event.message.attachments[0].payload.url;
      }

      const apiUrl = `https://joshweb.click/gemini`;

      const chilliResponse = await handleImageRecognition(apiUrl, kalamansiPrompt, imageUrl);
      const result = chilliResponse.gemini;

      sendLongMessage(chilli, result, kalamansi);

    } catch (error) {
      console.error("Error in Gemini command:", error);
      sendMessage(chilli, { text: `Error: ${error.message || "Something went wrong."}` }, kalamansi);
    }
  }
};

async function handleImageRecognition(apiUrl, prompt, imageUrl) {
  const { data } = await axios.get(apiUrl, {
    params: {
      prompt,
      url: imageUrl || ""
    }
  });

  return data;
}

async function getRepliedImage(mid, kalamansi) {
  const { data } = await axios.get(`https://graph.facebook.com/v21.0/${mid}/attachments`, {
    params: { access_token: kalamansi }
  });

  if (data && data.data.length > 0 && data.data[0].image_data) {
    return data.data[0].image_data.url;
  } else {
    return "";
  }
}

function sendLongMessage(chilli, text, kalamansi) {
  const maxMessageLength = 2000;
  const delayBetweenMessages = 1000;

  if (text.length > maxMessageLength) {
    const messages = splitMessageIntoChunks(text, maxMessageLength);
    sendMessage(chilli, { text: messages[0] }, kalamansi);

    messages.slice(1).forEach((message, index) => {
      setTimeout(() => sendMessage(chilli, { text: message }, kalamansi), (index + 1) * delayBetweenMessages);
    });
  } else {
    sendMessage(chilli, { text }, kalamansi);
  }
}

function splitMessageIntoChunks(message, chunkSize) {
  const regex = new RegExp(`.{1,${chunkSize}}`, 'g');
  return message.match(regex);
  }
    
