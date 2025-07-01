
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: false
}));
app.options('*', cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('🎉 Lucky Wheel API is running!');
});

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

app.post('/register', (req, res) => {
  const { name } = req.body;
  db.get('SELECT * FROM players WHERE name = ?', [name], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) return res.status(400).json({ error: 'Name already taken' });

    db.run('INSERT INTO players (name) VALUES (?)', [name], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT * FROM players WHERE name = ?', [name], (err, newRow) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ score: newRow.points, spinsLeft: newRow.spinsLeft });
      });
    });
  });
});

app.get('/player/:name', (req, res) => {
  const name = req.params.name;
  db.get('SELECT * FROM players WHERE name = ?', [name], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Player not found' });
    res.json(row);
  });
});

app.post('/spin', (req, res) => {
  const { name, prize } = req.body;
  db.get('SELECT * FROM players WHERE name = ?', [name], (err, player) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const newPoints = player.points + prize;
    const newSpinsLeft = player.spinsLeft - 1;
    const now = new Date().toISOString();

    db.run(
      'UPDATE players SET points = ?, spinsLeft = ?, lastSpin = ? WHERE name = ?',
      [newPoints, newSpinsLeft, now, name],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ score: newPoints, spinsLeft: newSpinsLeft });
      }
    );
  });
});

app.get('/leaderboard', (req, res) => {
  db.all(
    'SELECT name, points AS score, lastSpin FROM players ORDER BY points DESC LIMIT 10',
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
