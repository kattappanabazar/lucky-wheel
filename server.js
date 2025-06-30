const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));


const app = express();
const PORT = 3000;

// Middleware
app.use(cors());

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
const db = new sqlite3.Database('./wheel_game.db');

// Initialize database tables
db.serialize(() => {
  // Players table
  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      score INTEGER DEFAULT 0,
      spins_left INTEGER DEFAULT 2,
      last_spin_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Daily spins tracking
  db.run(`
    CREATE TABLE IF NOT EXISTS daily_spins (
      player_id INTEGER,
      spin_date TEXT,
      FOREIGN KEY(player_id) REFERENCES players(id),
      PRIMARY KEY(player_id, spin_date)
    )
  `);
});

// Helper function to check if player can spin today
async function canSpinToday(playerId) {
  const today = new Date().toISOString().split('T')[0];
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT 1 FROM daily_spins WHERE player_id = ? AND spin_date = ?`,
      [playerId, today],
      (err, row) => resolve(!row)
    );
  });
}

// Register new player
app.post('/register', (req, res) => {
  const { name } = req.body;
  if (!name || name.length < 3) {
    return res.status(400).json({ error: 'Name must be at least 3 characters' });
  }

  db.run(
    `INSERT OR IGNORE INTO players (name) VALUES (?)`,
    [name],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(409).json({ error: 'Name already exists' });
      }

      db.get(
        `SELECT id, name, score, spins_left FROM players WHERE id = ?`,
        [this.lastID],
        (err, player) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json(player);
        }
      );
    }
  );
});

// Handle spin action
app.post('/spin', async (req, res) => {
  const { name, prize } = req.body;
  const prizeAmount = parseInt(prize);
  
  if (!name || isNaN(prizeAmount)) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  try {
    // Get player info
    const player = await new Promise((resolve, reject) => {
      db.get(
        `SELECT id, name, score, spins_left FROM players WHERE name = ?`,
        [name],
        (err, row) => err ? reject(err) : resolve(row)
      );
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Check if player can spin today
    const canSpin = await canSpinToday(player.id);
    if (!canSpin && player.spins_left <= 0) {
      return res.status(403).json({ error: 'No spins left for today' });
    }

    // Update player stats
    const today = new Date().toISOString().split('T')[0];
    const newScore = player.score + prizeAmount;
    const newSpinsLeft = canSpin ? player.spins_left - 1 : 0;

    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE players SET score = ?, spins_left = ?, last_spin_date = CURRENT_TIMESTAMP WHERE id = ?`,
        [newScore, newSpinsLeft, player.id],
        (err) => err ? reject(err) : resolve()
      );
    });

    // Record the spin if it's the first today
    if (canSpin) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO daily_spins (player_id, spin_date) VALUES (?, ?)`,
          [player.id, today],
          (err) => err ? reject(err) : resolve()
        );
      });
    }

    // Reset spins at midnight
    setTimeout(() => {
      db.run(
        `UPDATE players SET spins_left = 2 WHERE id = ?`,
        [player.id]
      );
    }, getMillisecondsUntilMidnight());

    res.json({
      name: player.name,
      score: newScore,
      spinsLeft: newSpinsLeft,
      prize: prizeAmount
    });

  } catch (err) {
    console.error('Spin error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get leaderboard
app.get('/leaderboard', (req, res) => {
  db.all(
    `SELECT name, score, last_spin_date FROM players ORDER BY score DESC LIMIT 10`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Helper function to calculate milliseconds until midnight
function getMillisecondsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0, 0, 0
  );
  return midnight - now;
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('API Endpoints:');
  console.log(`- POST /register - Register new player`);
  console.log(`- POST /spin - Make a spin`);
  console.log(`- GET /leaderboard - Get top 10 players`);
});

// Handle process exit
process.on('SIGINT', () => {
  db.close();
  process.exit();
});
