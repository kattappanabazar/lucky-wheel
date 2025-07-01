
const API_BASE = 'https://lucky-wheel-1-z88q.onrender.com'; // Replace with actual backend URL

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
const playerNameInput = document.getElementById('player-name');
const startGameBtn = document.getElementById('start-game');

const prizes = [100, 200, 300, 400, 500, 600, 700, 800];
const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
const CHALLENGE_DURATION = 30;

let spinning = false;
let currentUser = '';
let currentPoints = 0;
let spinsLeft = 2;
let challengeEndDate = new Date();
let currentRotation = 0;

async function registerPlayer(name) {
  const res = await fetch(\`\${API_BASE}/register\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  return await res.json();
}

async function logSpin(name, prize) {
  const res = await fetch(\`\${API_BASE}/spin\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, prize })
  });
  return await res.json();
}

async function fetchLeaderboard() {
  const res = await fetch(\`\${API_BASE}/leaderboard\`);
  return await res.json();
}

async function fetchPlayer(name) {
  const res = await fetch(\`\${API_BASE}/player/\${name}\`);
  return await res.json();
}

function drawWheel() {
  const centerX = wheel.width / 2;
  const centerY = wheel.height / 2;
  const radius = wheel.width / 2;
  const segmentAngle = (2 * Math.PI) / prizes.length;

  ctx.clearRect(0, 0, wheel.width, wheel.height);

  prizes.forEach((prize, index) => {
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, index * segmentAngle, (index + 1) * segmentAngle);
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
  const prize = prizes[prizeIndex];

  resultEl.textContent = `You won $${prize}!`;

  const response = await logSpin(currentUser, prize);
  currentPoints = response.score;
  spinsLeft = response.spinsLeft;

  updateUI();
  await updateLeaderboard();
}

function updateUI() {
  spinsLeftEl.textContent = spinsLeft;
  currentPointsEl.textContent = `$${currentPoints}`;
  spinBtn.disabled = spinsLeft <= 0;
}

async function updateLeaderboard() {
  const data = await fetchLeaderboard();
  leaderboardTable.innerHTML = '';

  data.forEach((user, index) => {
    const row = document.createElement('tr');
    row.innerHTML = \`
      <td>\${index + 1}</td>
      <td>\${user.name}</td>
      <td>$\${user.score}</td>
      <td>\${new Date(user.lastSpin).toLocaleDateString()}</td>
    \`;
    leaderboardTable.appendChild(row);
  });
}

function updateTimer() {
  const now = new Date();
  const timeLeft = challengeEndDate - now;

  if (timeLeft <= 0) {
    timeLeftEl.textContent = "Challenge ended!";
    spinBtn.disabled = true;
    return;
  }

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  timeLeftEl.textContent = \`\${days} days \${hours} hours\`;
}

async function startGame(name) {
  const userData = await fetchPlayer(name);
  if (userData) {
    currentUser = name;
    currentPoints = userData.points;
    spinsLeft = userData.spinsLeft;
    nameEntry.style.display = 'none';
    gameContainer.style.display = 'block';

    challengeEndDate = new Date();
    challengeEndDate.setDate(challengeEndDate.getDate() + CHALLENGE_DURATION);

    updateUI();
    drawWheel();
    updateLeaderboard();
    updateTimer();
    setInterval(updateTimer, 1000);
  }
}

startGameBtn.addEventListener('click', async () => {
  const name = playerNameInput.value.trim();
  if (name) {
    try {
      const res = await registerPlayer(name);
      if (res) {
        localStorage.setItem('savedPlayer', name);
        startGame(name);
      }
    } catch (err) {
      alert('Name already taken or server error.');
    }
  }
});

// Auto-login if saved
const savedName = localStorage.getItem('savedPlayer');
if (savedName) startGame(savedName);

drawWheel();
spinBtn.addEventListener('click', spinWheel);
