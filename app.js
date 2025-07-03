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
    return await res.json();
  } catch (err) {
    alert('Failed to register. Try again.');
    return null;
  }
}

// Log spin result
async function logSpin(name, prize) {
  try {
    const res = await fetch(`${API_BASE}/spin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, prize })
    });
    return await res.json();
  } catch (err) {
    alert('Failed to log spin.');
    return { score: currentPoints, spinsLeft };
  }
}

// Fetch leaderboard
async function fetchLeaderboard() {
  try {
    const res = await fetch(`${API_BASE}/leaderboard`);
    return await res.json();
  } catch (err) {
    return [];
  }
}

function updateSpinsDisplay() {
  spinsLeftEl.textContent = `Spins left today: ${spinsLeft}`;
  spinBtn.disabled = spinsLeft === 0 || spinning;
}

function initWheel() {
  const anglePerSection = 360 / wheelSections.length;
  wheel.innerHTML = '';
  wheel.style.position = 'relative';

  wheelSections.forEach((section, index) => {
    const sectionEl = document.createElement('div');
    sectionEl.className = 'wheel-section';
    sectionEl.style.backgroundColor = section.color;
    sectionEl.style.transform = `rotate(${anglePerSection * index}deg)`;
    sectionEl.style.transformOrigin = '0% 100%';
    sectionEl.style.position = 'absolute';
    sectionEl.style.left = '50%';
    sectionEl.style.top = '0';
    sectionEl.style.width = '50%';
    sectionEl.style.height = '50%';
    sectionEl.style.clipPath = 'polygon(0 0, 100% 100%, 0 100%)';

    const textEl = document.createElement('div');
    textEl.textContent = section.text;
    textEl.style.position = 'absolute';
    textEl.style.left = '30%';
    textEl.style.bottom = '30%';
    textEl.style.transform = 'rotate(45deg)';
    textEl.style.transformOrigin = '0 0';
    textEl.style.color = 'white';
    textEl.style.fontWeight = 'bold';
    textEl.style.fontSize = '16px';
    textEl.style.textShadow = '1px 1px 2px rgba(0,0,0,0.5)';

    sectionEl.appendChild(textEl);
    wheel.appendChild(sectionEl);
  }

  );

  const centerCircle = document.createElement('div');
  centerCircle.style.position = 'absolute';
  centerCircle.style.width = '20%';
  centerCircle.style.height = '20%';
  centerCircle.style.backgroundColor = 'white';
  centerCircle.style.borderRadius = '50%';
  centerCircle.style.left = '40%';
  centerCircle.style.top = '40%';
  centerCircle.style.zIndex = '10';
  wheel.appendChild(centerCircle);

  updateSpinsDisplay();
}

async function spinWheel() {
  if (spinning || spinsLeft <= 0) return;

  spinning = true;
  spinBtn.disabled = true;

  const newRotation = currentRotation + 1800 + Math.floor(Math.random() * 360);
  currentRotation = newRotation;
  wheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
  wheel.style.transform = `rotate(${newRotation}deg)`;

  setTimeout(async () => {
    spinning = false;
    const angle = newRotation % 360;
    const sectionSize = 360 / wheelSections.length;
    const winningIndex = Math.floor((360 - angle) / sectionSize) % wheelSections.length;
    const winningSection = wheelSections[winningIndex];
    resultEl.textContent = `You won ${winningSection.value} points!`;

    const result = await logSpin(currentUser, winningSection.value);
    currentPoints = result.score;
    spinsLeft = result.spinsLeft;
    updateSpinsDisplay();
    await updateLeaderboard();
  }, 4000);
}

async function updateLeaderboard() {
  leaderboard = await fetchLeaderboard();
  leaderboardBody.innerHTML = '';

  leaderboard.forEach((user, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${user.name}</td>
      <td>${user.score}</td>
      <td>${user.lastSpin ? new Date(user.lastSpin).toLocaleTimeString() : '-'}</td>
    `;
    leaderboardBody.appendChild(row);
  });
}

async function handleNameInput() {
  const name = playerInput.value.trim();
  if (!name) return alert('Enter your email or phone');

  const userData = await registerPlayer(name);
  if (userData) {
    currentUser = name;
    currentPoints = userData.score;
    spinsLeft = userData.spinsLeft;

    nameInputContainer.style.display = 'none';
    gameContainer.style.display = 'flex';

    initWheel();
    updateSpinsDisplay();
    await updateLeaderboard();
  }
}

function init() {
  gameContainer.style.display = 'none';
  spinBtn.addEventListener('click', spinWheel);
  saveNameBtn.addEventListener('click', handleNameInput);
  playerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleNameInput();
  });
}

init();
