module.exports = {
  name: 'balance',
  description: 'Show your Dostotcoin balance',
  async run(client, message, args, db) {
    // enforce channel restriction
    if (!message.channel || message.channel.name !== 'dostot-coin') {
      return message.reply('This command can only be used in #dostot-coin.');
    }

    const uid = message.author.id;
    const bal = db.getBalance(uid);
    await message.reply(`You have ${bal} DostotCoin in your wallet.`);
  }
};
