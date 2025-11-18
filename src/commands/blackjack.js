const activeGames = new Map();

function createDeck() {
  const suits = ['♠','♥','♦','♣'];
  const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const deck = [];
  for (const s of suits) for (const r of ranks) deck.push({ r, s });
  return deck;
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function draw(deck) {
  return deck.pop();
}

function cardToString(c) {
  return `${c.r}${c.s}`;
}

function handValue(cards) {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    if (c.r === 'A') { aces++; total += 1; }
    else if (['J','Q','K'].includes(c.r)) total += 10;
    else total += Number(c.r);
  }
  // upgrade aces from 1 to 11 as long as it doesn't bust
  for (let i = 0; i < aces; i++) {
    if (total + 10 <= 21) total += 10;
  }
  return total;
}

function prettyHand(cards, hideFirst = false) {
  if (hideFirst) {
    if (cards.length === 0) return '';
    const rest = cards.slice(1).map(cardToString).join(' ');
    return `? ${rest}`;
  }
  return cards.map(cardToString).join(' ');
}

module.exports = {
  name: 'blackjack',
  description: 'Play a round of blackjack: dst blackjack <wager>',
  async run(client, message, args, db) {
    // enforce channel restriction
    if (!message.channel || message.channel.name !== 'the-casino') {
      return message.reply('Blackjack may only be played in #the-casino.');
    }

    const uid = message.author.id;
    if (activeGames.has(uid)) return message.reply('You already have an active blackjack game. Finish it before starting a new one.');

    const wager = Number(args[1]);
    if (!Number.isInteger(wager) || wager <= 0) return message.reply('Usage: dst blackjack <wager as positive integer>');

    const balance = db.getBalance(uid);
    if (balance < wager) return message.reply('You do not have enough Dostotcoin for that wager.');

    // Deduct wager up-front to hold the bet
    db.changeBalance(uid, -wager);

    // prepare deck and hands
    const deck = createDeck();
    shuffle(deck);
    const player = [draw(deck), draw(deck)];
    const dealer = [draw(deck), draw(deck)];

    const isPlayerNatural = handValue(player) === 21;
    const isDealerNatural = handValue(dealer) === 21;

    // record active game so user can't start another
    activeGames.set(uid, true);

    try {
      await message.reply(`Dealer shows: ${cardToString(dealer[0])}\nYour hand: ${prettyHand(player)} (Total: ${handValue(player)})`);

      // If player has natural blackjack
      if (isPlayerNatural) {
        if (isDealerNatural) {
          // push
          db.changeBalance(uid, wager); // return wager
          activeGames.delete(uid);
          return message.reply(`Both you and the dealer have Blackjack! Push — your wager has been returned.`);
        } else {
          // player wins 3:2 (1.5x)
          const payout = Math.round(wager * 2.5); // we already deducted wager; add total payout
          db.changeBalance(uid, payout);
          activeGames.delete(uid);
          return message.reply(`Blackjack! You win ${Math.round(wager * 1.5)} D$T (paid 3:2). Your new balance is ${db.getBalance(uid)}.`);
        }
      }

      // Player turn: allow hit/stand via message
      let playerBusted = false;
      while (true) {
        const total = handValue(player);
        if (total > 21) { playerBusted = true; break; }

        await message.reply("Type 'hit' or 'stand' (you have 30s). You can also reply 'h' or 's'.");
        const filter = (m) => m.author.id === uid && ['hit','stand','h','s'].includes(m.content.toLowerCase());
        const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000 });
        if (!collected || collected.size === 0) {
          // timeout -> treat as stand
          break;
        }
        const cmd = collected.first().content.toLowerCase();
        if (cmd.startsWith('h')) {
          player.push(draw(deck));
          await message.reply(`You draw: ${cardToString(player[player.length - 1])}. Your hand: ${prettyHand(player)} (Total: ${handValue(player)})`);
          continue;
        } else {
          // stand
          break;
        }
      }

      if (playerBusted) {
        activeGames.delete(uid);
        return message.reply(`You busted with ${handValue(player)}. You lost ${wager} D$T. Your balance is ${db.getBalance(uid)}.`);
      }

      // Dealer's turn: reveal and hit until 17 or more
      let dealerTotal = handValue(dealer);
      await message.reply(`Dealer reveals: ${prettyHand(dealer)} (Total: ${dealerTotal})`);
      while (dealerTotal < 17) {
        const c = draw(deck);
        dealer.push(c);
        dealerTotal = handValue(dealer);
        await message.reply(`Dealer draws ${cardToString(c)}. Dealer total is now ${dealerTotal}`);
      }

      const playerTotal = handValue(player);

      // Determine outcome
      if (dealerTotal > 21 || playerTotal > dealerTotal) {
        // player wins
        const payout = wager * 2; // returns wager + winnings
        db.changeBalance(uid, payout);
        activeGames.delete(uid);
        return message.reply(`You win! ${playerTotal} vs ${dealerTotal}. You gain ${wager} D$T. New balance: ${db.getBalance(uid)}.`);
      } else if (playerTotal === dealerTotal) {
        // push
        db.changeBalance(uid, wager); // return wager
        activeGames.delete(uid);
        return message.reply(`Push: ${playerTotal} vs ${dealerTotal}. Your wager has been returned. Balance: ${db.getBalance(uid)}.`);
      } else {
        // dealer wins
        activeGames.delete(uid);
        return message.reply(`Dealer wins ${dealerTotal} vs ${playerTotal}. You lost ${wager} D$T. Balance: ${db.getBalance(uid)}.`);
      }
    } catch (e) {
      activeGames.delete(uid);
      console.error('Blackjack command error', e);
      // return wager in case of error
      db.changeBalance(uid, wager);
      return message.reply('An error occurred during the game. Your wager has been returned.');
    }
  }
};
