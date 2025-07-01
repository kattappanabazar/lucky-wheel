const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// ✅ CORS configuration
const corsOptions = {
  origin: '*', // Change to specific domain if needed
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: false
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(bodyParser.json());

// ✅ Health check
app.get('/', (req, res) => {
  res.send('🎉 Lucky Wheel API is running!');
});

// ✅ SQLite setup
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

// ✅ Register player
app.post('/register', (req, res) => {
  const { name } = req.body;
  db.run('INSERT OR IGNORE INTO players (name) VALUES (?)', [name], (err) => {
    if (err) return res.status(500).json({ error: err.message });

    db.get('SELECT * FROM players WHERE name = ?', [name], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ name: row.name, score: row.points, spinsLeft: row.spinsLeft, lastSpin: row.lastSpin });
    });
  });
});

// ✅ Get player details
app.get('/player/:name', (req, res) => {
  const { name } = req.params;
  db.get('SELECT * FROM players WHERE name = ?', [name], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Player not found' });

    res.json({
      name: row.name,
      score: row.points,
      spinsLeft: row.spinsLeft,
      lastSpin: row.lastSpin
    });
  });
});

// ✅ Spin & update player
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

        // ✅ Send updated info
        res.json({ score: newPoints, spinsLeft: newSpinsLeft });
      }
    );
  });
});


// ✅ Leaderboard
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

// ✅ Start server
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
