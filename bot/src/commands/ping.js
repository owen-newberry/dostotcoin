module.exports = {
  name: 'ping',
  description: 'health check',
  async run(client, message, args, db) {
    await message.reply('Pong!');
  }
};
