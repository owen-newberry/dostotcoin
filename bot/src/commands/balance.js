module.exports = {
  name: 'balance',
  description: 'Show your Dostotcoin balance',
  async run(client, message, args, db) {
    const uid = message.author.id;
    const bal = db.getBalance(uid);
    await message.reply(`You have ${bal} DostotCoin in your wallet.`);
  }
};
