module.exports = {
  name: 'coinflip',
  description: 'Bet on a coinflip: dst coinflip <wager> <h|t>',
  async run(client, message, args, db) {
    // args: [ 'coinflip', '<wager>', '<h|t>' ] or message content split
    const uid = message.author.id;
    const wager = Number(args[1]);
    const choice = (args[2] || '').toLowerCase();

    if (!Number.isInteger(wager) || wager <= 0) {
      return message.reply('Usage: dst coinflip <wager as positive integer> <h|t>');
    }
    if (!['h', 't', 'heads', 'tails'].includes(choice)) {
      return message.reply('Choose h or t for heads or tails.');
    }

    const current = db.getBalance(uid);
    if (current < wager) return message.reply('You do not have enough Dostotcoin for that wager.');

    const flip = Math.random() < 0.5 ? 'h' : 't';
    const won = (flip === 'h' && (choice === 'h' || choice === 'heads')) || (flip === 't' && (choice === 't' || choice === 'tails'));

    if (won) {
      db.changeBalance(uid, wager);
      const newbal = db.getBalance(uid);
      return message.reply(`It was ${flip === 'h' ? 'Heads' : 'Tails'}! You won ${wager} D$T!\nYou have ${newbal} DostotCoin in your wallet.`);
    } else {
      db.changeBalance(uid, -wager);
      const newbal = db.getBalance(uid);
      return message.reply(`It was ${flip === 'h' ? 'Heads' : 'Tails'}! You lost ${wager} D$T.\nYou have ${newbal} DostotCoin in your wallet.`);
    }
  }
};
