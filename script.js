// DOM Elements
const wheel = document.getElementById('wheel');
const ctx = wheel.getContext('2d');
const spinBtn = document.getElementById('spin-btn');
const resultEl = document.getElementById('result');
const spinsLeftEl = document.getElementById('spins-left');
const currentPointsEl = document.getElementById('current-points');
const leaderboardTable = document.querySelector('#leaderboard-table tbody');
const timeLeftEl = document.getElementById('time-left');
const nameEntry = document.getElementById('name-entry');
const gameContainer = document.getElementById('game-container');
const playerContactInput = document.getElementById('player-contact');
const startGameBtn = document.getElementById('start-game');

// Config
const API_BASE = 'https://lucky-wheel-gz2p.onrender.com';
const prizes = [100, 200, 300, 400, 500, 600, 700, 800];
const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
const CHALLENGE_DURATION = 30;

// State
let spinning = false;
let currentUser = '';
let currentPoints = 0;
let spinsLeft = 2;
let challengeEndDate = new Date();
let currentRotation = 0;

// API Functions
async function registerPlayer(name) {
  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });

    if (!res.ok) throw new Error('Registration failed');

    const userData = await fetch(`${API_BASE}/player/${name}`);
    if (!userData.ok) throw new Error('Failed to fetch player after register');
    return await userData.json();

  } catch (error) {
    console.error('Registration error:', error);
    alert('Failed to register. Please try again.');
    return null;
  }
}

async function logSpin(name, prize) {
  try {
    const res = await fetch(`${API_BASE}/spin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, prize })
    });
    if (!res.ok) throw new Error('Spin logging failed');
    return await res.json();
  } catch (error) {
    console.error('Spin logging error:', error);
    alert('Failed to log spin.');
    return { score: currentPoints, spinsLeft };
  }
}

async function fetchLeaderboard() {
  try {
    const res = await fetch(`${API_BASE}/leaderboard`);
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
    return await res.json();
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return [];
  }
}

// Game Mechanics
function drawWheel() {
  const centerX = wheel.width / 2;
  const centerY = wheel.height / 2;
  const radius = wheel.width / 2;
  const segmentAngle = (2 * Math.PI) / prizes.length;

  ctx.clearRect(0, 0, wheel.width, wheel.height);

  prizes.forEach((prize, index) => {
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius,
            index * segmentAngle,
            (index + 1) * segmentAngle);
    ctx.closePath();
    ctx.fillStyle = colors[index];
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(index * segmentAngle + segmentAngle / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`$${prize}`, radius - 20, 10);
    ctx.restore();
  });
}

function spinWheel() {
  if (spinning || spinsLeft <= 0) return;

  spinning = true;
  spinBtn.disabled = true;
  resultEl.textContent = "Spinning...";

  const spinDuration = 4000;
  const startTime = Date.now();
  const rotations = 5;
  const segmentAngle = (2 * Math.PI) / prizes.length;
  const randomOffset = Math.random() * (2 * Math.PI);
  const targetAngle = currentRotation + (rotations * 2 * Math.PI) + randomOffset;

  function animate() {
    const now = Date.now();
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / spinDuration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const angle = currentRotation + easeOut * (targetAngle - currentRotation);

    ctx.clearRect(0, 0, wheel.width, wheel.height);
    ctx.save();
    ctx.translate(wheel.width / 2, wheel.height / 2);
    ctx.rotate(angle);
    ctx.translate(-wheel.width / 2, -wheel.height / 2);
    drawWheel();
    ctx.restore();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      currentRotation = angle % (2 * Math.PI);
      finishSpin(currentRotation);
    }
  }

  animate();
}

async function finishSpin(finalAngle) {
  spinning = false;
  spinBtn.disabled = false;

  const segmentAngle = (2 * Math.PI) / prizes.length;
  const offset = Math.PI / 2;
  const adjustedAngle = (finalAngle + offset) % (2 * Math.PI);
  const normalizedAngle = (2 * Math.PI - adjustedAngle) % (2 * Math.PI);
  const prizeIndex = Math.floor(normalizedAngle / segmentAngle);
  const prize = prizes[prizeIndex]
