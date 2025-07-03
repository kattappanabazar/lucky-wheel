const API_BASE = 'http://localhost:3000'; // Replace with deployed URL if needed

const wheelSections = [
  { text: "100", value: 100, color: "#FF5733" },
  { text: "200", value: 200, color: "#33FF57" },
  { text: "50", value: 50, color: "#3357FF" },
  { text: "300", value: 300, color: "#F3FF33" },
  { text: "150", value: 150, color: "#FF33F3" },
  { text: "250", value: 250, color: "#33FFF3" },
  { text: "75", value: 75, color: "#F333FF" },
  { text: "400", value: 400, color: "#33FFAA" }
];

let spinning = false;
let currentUser = '';
let currentPoints = 0;
let spinsLeft = 0;
let currentRotation = 0;
let leaderboard = [];

const wheel = document.getElementById('wheel');
const spinBtn = document.getElementById('spin-btn');
const spinsLeftEl = document.getElementById('spins-left');
const resultEl = document.getElementById('result');
const leaderboardBody = document.getElementById('leaderboard-body');
const nameInputContainer = document.getElementById('name-input-container');
const gameContainer = document.getElementById('game-container');
const playerInput = document.getElementById('player-name');
const saveNameBtn = document.getElementById('save-name');

// Register or fetch player
async function registerPlayer(name) {
  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
