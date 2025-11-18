require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const path = require('path');
const fs = require('fs');

const db = require('./db');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

const COMMAND_PREFIX = 'dst';

// load commands dynamically from the commands folder
const commands = new Map();
const requireCommand = (p) => {
  try {
    const mod = require(p);
    if (mod && mod.name) commands.set(mod.name, mod);
  } catch (e) {
    console.warn('Failed to load command', p, e);
  }
};

try {
  const cmdsDir = path.join(__dirname, 'commands');
  const files = fs.readdirSync(cmdsDir).filter((f) => f.endsWith('.js'));
  for (const f of files) {
    requireCommand(`./commands/${f}`);
  }
} catch (e) {
  console.warn('Could not read commands directory', e);
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author?.bot) return;

  // Mineshaft counting mechanic
  try {
    if (message.channel && message.channel.name === 'the-mineshaft') {
      const state = db.getMineshaftState();
      const chanId = message.channel.id;
      // Default the stored "last" value so the first accepted number becomes 3651
      const DEFAULT_MINESHAFT_LAST = 3650; // next correct number will be 3651
      const last = (Object.prototype.hasOwnProperty.call(state, chanId) ? Number(state[chanId]) : DEFAULT_MINESHAFT_LAST);
      const num = Number(message.content.trim());
      if (Number.isInteger(num) && num === last + 1) {
        // award 1 D$T
        db.changeBalance(message.author.id, 1);
        state[chanId] = num;
        db.setMineshaftState(state);
        await message.reply(`Correct! ${message.author.username} earns 1 D$T.`);
        return; // don't process as a command
      }
    }
  } catch (e) {
    console.error('Mineshaft handler error', e);
  }

  // simple command parser: messages starting with 'dst'
  const content = message.content.trim();
  if (!content.toLowerCase().startsWith(COMMAND_PREFIX)) return;
  const parts = content.split(/\s+/);
  // parts[0] is 'dst'
  const cmd = parts[1] ? parts[1].toLowerCase() : null;
  if (!cmd) return;

  const command = commands.get(cmd);
  if (!command) return message.reply(`Unknown command: ${cmd}`);

  try {
    await command.run(client, message, parts.slice(1), db);
  } catch (e) {
    console.error('Command error', e);
    message.reply('An error occurred while running the command.');
  }
});

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error('BOT_TOKEN not set in environment. Copy .env.example to .env and add your token.');
  process.exit(1);
}

client.login(token);
