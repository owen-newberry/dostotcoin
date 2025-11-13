module.exports = {
  name: 'leaderboard',
  description: 'Show top balances',
  async run(client, message, args, db) {
    const all = db.getAllBalances();
    if (!all || all.length === 0) return message.reply('No balances yet.');

    const sorted = all.sort((a, b) => b.balance - a.balance).slice(0, 20);
    // try to resolve usernames
    const lines = await Promise.all(sorted.map(async (row, idx) => {
      try {
        const user = await client.users.fetch(row.id);
        return `${idx + 1}. ${user.tag} - ${row.balance} D$T`;
      } catch (e) {
        return `${idx + 1}. ${row.id} - ${row.balance} D$T`;
      }
    }));

    await message.reply(lines.join('\n'));
  }
};
