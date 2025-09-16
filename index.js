require('dotenv/config');
const express = require("express");
const { Client, IntentsBitField } = require('discord.js');
const { CommandHandler } = require('djs-commander');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.get("/", (req, res) => res.send("Bot is running!"));
app.listen(5000, '0.0.0.0', () => {
  console.log(`Web server running on port 5000`);
});

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

new CommandHandler({
  client,
  eventsPath: path.join(__dirname, 'events'),
  commandsPath: path.join(__dirname, 'commands'),
});

(async () => {
  try {
    if (!process.env.TOKEN) {
      console.error("❌ TOKEN environment variable is not set");
      process.exit(1);
    }
    
    // Try to connect to database if MongoDB URI is properly formatted
    if (process.env.MONGODB_URI && (process.env.MONGODB_URI.startsWith('mongodb://') || process.env.MONGODB_URI.startsWith('mongodb+srv://'))) {
      console.log("🔄 Attempting to connect to database...");
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("✅ Connected to the database.");
    } else {
      console.log("⚠️  Database connection skipped - invalid or missing MONGODB_URI");
      console.log("   Bot will run but economy features may not work properly.");
      console.log("   Please provide a valid MongoDB connection string starting with 'mongodb://' or 'mongodb+srv://'");
    }
    
    console.log("🔄 Logging into Discord...");
    await client.login(process.env.TOKEN);
    console.log("✅ Discord bot logged in successfully!");
    
  } catch (error) {
    console.error("❌ Error during startup:", error.message);
    if (error.message.includes("TOKEN")) {
      console.error("Please check your Discord bot token and try again.");
    } else {
      console.error("Please check your environment variables and try again.");
    }
    process.exit(1);
  }
})();


