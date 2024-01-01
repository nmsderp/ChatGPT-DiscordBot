require('dotenv').config();

const { Client, GatewayIntentBits, Intents } = require('discord.js');
const axios = require('axios');

const apiUrl = 'https://api.tmrace.net/v1/chat/completions';
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
  }
});

client.login(token);
