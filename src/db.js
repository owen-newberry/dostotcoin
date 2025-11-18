const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_PATH || path.join(__dirname, '..', 'data');
const BALANCES_FILE = path.join(DATA_DIR, 'balances.json');
const MINESHAFT_FILE = path.join(DATA_DIR, 'mineshaft.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(BALANCES_FILE)) fs.writeFileSync(BALANCES_FILE, JSON.stringify({}), 'utf8');
  if (!fs.existsSync(MINESHAFT_FILE)) fs.writeFileSync(MINESHAFT_FILE, JSON.stringify({}), 'utf8');
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8') || '{}');
  } catch (e) {
    console.error('Failed to read JSON', file, e);
    return {};
  }
}

function writeJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write JSON', file, e);
  }
}

ensureDataDir();

module.exports = {
  getBalance(userId) {
    const all = readJson(BALANCES_FILE);
    return Number(all[userId] || 0);
  },
  setBalance(userId, amount) {
    const all = readJson(BALANCES_FILE);
    all[userId] = Number(amount);
    writeJson(BALANCES_FILE, all);
    return all[userId];
  },
  changeBalance(userId, delta) {
    const all = readJson(BALANCES_FILE);
    const prev = Number(all[userId] || 0);
    const next = prev + Number(delta);
    all[userId] = next;
    writeJson(BALANCES_FILE, all);
    return next;
  },
  getAllBalances() {
    const all = readJson(BALANCES_FILE);
    // returns array of { id, balance }
    return Object.keys(all).map((id) => ({ id, balance: Number(all[id] || 0) }));
  },
  // Mineshaft state
  getMineshaftState() {
    return readJson(MINESHAFT_FILE);
  },
  setMineshaftState(state) {
    writeJson(MINESHAFT_FILE, state);
  }
};
