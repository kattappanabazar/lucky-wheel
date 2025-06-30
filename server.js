const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: 'https://lucky-wheel-1-a0wa.onrender.com',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

// Handle preflight requests (important!)
app.options('*', cors());

app.use(bodyParser.json());

// DB setup
const db = new sqlite3.Database('./wheel.db', (err) => {
  if (err) console.error('DB error:', err.message);
  else console.log('Connected to database.');
});

db.run(`CREATE TABLE IF NOT EXISTS players (
  name TEXT PRIMARY KEY,
  points INTEGER DEFAULT 0,
  spinsLeft INTEGER DEFAULT 2,
  lastSpin TEXT
)`);

// Register new player
app.post('/register', (req, res) => {
  const { name } = req.body;
  db.run('INSERT OR IGNORE INTO players (name) VALUES (?)', [name], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Get player data
app.get('/player/:name', (req, res) => {
  db.get('SELECT * FROM players WHERE name = ?', [req.params.name], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Player not found' });
    res.json(row);
  });
});

// Update player after spin
app.post('/update', (req, res) => {
  const { name, points, spinsLeft, lastSpin } = req.body;
  db.run('UPDATE players SET points = ?, spinsLeft = ?, lastSpin = ? WHERE name = ?', 
    [points, spinsLeft, lastSpin, name], 
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
});

// Leaderboard
app.get('/leaderboard', (req, res) => {
  db.all('SELECT * FROM players ORDER BY points DESC LIMIT 10', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
