require('dotenv').config();

const { Client, GatewayIntentBits, Intents, MessageAttachment } = require('discord.js');
const axios = require('axios');

const apiUrl = 'https://reverse.mubi.tech/v1/chat/completions';
const imageApiUrl = 'https://reverse.mubi.tech/image/generate';
const token = process.env.DISCORD_TOKEN;

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    // Add more intents if needed based on your bot's functionality
  ],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === 'ask-ai') {
    const prompt = options.getString('prompt');

    try {
      // Acknowledge the interaction
      await interaction.deferReply();

      // Call the AI API
      const response = await axios.post(apiUrl, {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      });

      // Extract the bot response from the API response
      const botResponse = response.data.choices[0].message.content;

      // Send the AI response to the Discord channel
      await interaction.editReply(`AI Response: ${botResponse}`);
    } catch (error) {
      console.error('Error fetching AI response:', error.message);
      await interaction.followUp('Error fetching AI response. Please try again later.');
    }
  } else if (commandName === 'image') {
    const prompt = options.getString('prompt');
    const requestedModel = options.getString('model');

    try {
      // Call the Image Generator API
      const imageResponse = await generateImage({ PROMPT: prompt, MODEL: requestedModel });

      // Send the Image Generator response to the Discord channel
      await interaction.reply(`Image Response: ${imageResponse}`);

      // Send the image as an attachment to the server
      const channel = client.channels.cache.get(interaction.channelId);
      const imageBuffer = Buffer.from(imageResponse, 'base64');
      const attachment = new MessageAttachment(imageBuffer, 'generated_image.png');
      channel.send({ files: [attachment] });
    } catch (error) {
      console.error('Error generating image:', error.message);
      await interaction.reply('Error generating image. Please try again later.');
    }
  }
});

// Function to generate images using the Image Generator API
async function generateImage(args) {
  const prompt = args.PROMPT;
  const requestedModel = args.MODEL;

  try {
    const response = await axios.post(imageApiUrl, {
      model: requestedModel,
      prompt: prompt,
    });

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
    }

    const botResponse = response.data.results;
    return botResponse;
  } catch (error) {
    console.error('Error sending prompt to Image Generator', error.message);
    return `Error: ${error.message}`;
  }
}

client.login(token);
