// Wheel configuration
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

// Game state
let spinsLeft = 2;
let spinning = false;
let currentUser = localStorage.getItem('wheelPlayerName') || "";
let leaderboard = [];
let currentRotation = 0;

// DOM elements
const wheel = document.getElementById('wheel');
const spinBtn = document.getElementById('spin-btn');
const spinsLeftEl = document.getElementById('spins-left');
const resultEl = document.getElementById('result');
const leaderboardBody = document.getElementById('leaderboard-body');
const nameInputContainer = document.getElementById('name-input-container');
const gameContainer = document.getElementById('game-container');
const playerNameInput = document.getElementById('player-name');
const saveNameBtn = document.getElementById('save-name');

// Initialize the wheel
function initWheel() {
  const anglePerSection = 360 / wheelSections.length;
  
  wheel.innerHTML = ''; // Clear any existing elements
  
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
    
    // Create text element
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
  });
  
  // Add center circle to hide the pointy ends
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

// Update spins left display
function updateSpinsDisplay() {
  spinsLeftEl.textContent = `Spins left today: ${spinsLeft}`;
  spinBtn.disabled = spinsLeft === 0 || spinning;
}

// Spin the wheel
function spinWheel() {
  if (spinning || spinsLeft <= 0) return;
  
  spinning = true;
  spinBtn.disabled = true;
  
  // Calculate new rotation (5 full rotations + random angle)
  const newRotation = currentRotation + 1800 + Math.floor(Math.random() * 360);
  currentRotation = newRotation;
  
  // Apply the rotation with smooth transition
  wheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
  wheel.style.transform = `rotate(${newRotation}deg)`;
  
  setTimeout(() => {
    spinning = false;
    const angle = newRotation % 360;
    const sectionSize = 360 / wheelSections.length;
    const winningIndex = Math.floor((360 - angle) / sectionSize) % wheelSections.length;
    const winningSection = wheelSections[winningIndex];
    
    resultEl.textContent = `You won ${winningSection.value} points!`;
    
    // Decrement spins only after the spin is complete
    spinsLeft--;
    updateSpinsDisplay();
    localStorage.setItem('wheelSpinsLeft', spinsLeft.toString());
    
    updateLeaderboard(winningSection.value);
  }, 4000);
}

// Update leaderboard with new points
function updateLeaderboard(points) {
  // Find or create user in leaderboard
  let user = leaderboard.find(u => u.name === currentUser);
  const now = new Date();
  
  if (!user) {
    user = {
      name: currentUser,
      points: 0,
      lastSpin: now
    };
    leaderboard.push(user);
  }
  
  user.points += points;
  user.lastSpin = now;
  
  // Sort leaderboard by points (descending)
  leaderboard.sort((a, b) => b.points - a.points);
  
  renderLeaderboard();
  
  // Save leaderboard to localStorage
  localStorage.setItem('wheelLeaderboard', JSON.stringify(leaderboard));
}

// Render the leaderboard
function renderLeaderboard() {
  leaderboardBody.innerHTML = '';
  
  leaderboard.forEach((user, index) => {
    const row = document.createElement('tr');
    
    const rankCell = document.createElement('td');
    rankCell.textContent = index + 1;
    
    const nameCell = document.createElement('td');
    nameCell.textContent = user.name;
    
    const pointsCell = document.createElement('td');
    pointsCell.textContent = user.points;
    
    const lastSpinCell = document.createElement('td');
    lastSpinCell.textContent = user.lastSpin.toLocaleTimeString();
    
    row.appendChild(rankCell);
    row.appendChild(nameCell);
    row.appendChild(pointsCell);
    row.appendChild(lastSpinCell);
    
    leaderboardBody.appendChild(row);
  });
}

// Reset spins at midnight
function checkAndResetSpins() {
  const now = new Date();
  const lastReset = localStorage.getItem('wheelLastReset');
  const lastResetDate = lastReset ? new Date(lastReset) : null;
  
  if (!lastResetDate || lastResetDate.getDate() !== now.getDate()) {
    spinsLeft = 2;
    localStorage.setItem('wheelLastReset', now.toString());
    localStorage.setItem('wheelSpinsLeft', spinsLeft.toString());
    updateSpinsDisplay();
  }
}

// Load saved spins
function loadSpins() {
  const savedSpins = localStorage.getItem('wheelSpinsLeft');
  if (savedSpins) {
    spinsLeft = parseInt(savedSpins);
  }
}

// Handle name input
function handleNameInput() {
  const name = playerNameInput.value.trim();
  if (name) {
    currentUser = name;
    localStorage.setItem('wheelPlayerName', name);
    nameInputContainer.style.display = 'none';
    gameContainer.style.display = 'flex';
    loadSpins();
    checkAndResetSpins();
    updateSpinsDisplay();
  }
}

// Initialize the game
function init() {
  // Load leaderboard from localStorage
  const savedLeaderboard = localStorage.getItem('wheelLeaderboard');
  if (savedLeaderboard) {
    leaderboard = JSON.parse(savedLeaderboard);
    // Convert string dates back to Date objects
    leaderboard.forEach(user => {
      user.lastSpin = new Date(user.lastSpin);
    });
  } else {
    // Default leaderboard
    leaderboard = [
      { name: "Player1", points: 500, lastSpin: new Date() },
      { name: "Player2", points: 300, lastSpin: new Date(Date.now() - 3600000) },
      { name: "Player3", points: 200, lastSpin: new Date(Date.now() - 86400000) }
    ];
  }
  
  renderLeaderboard();
  
  // Check if player name is already set
  if (currentUser) {
    playerNameInput.value = currentUser;
    nameInputContainer.style.display = 'none';
    gameContainer.style.display = 'flex';
    initWheel();
    loadSpins();
    checkAndResetSpins();
  } else {
    gameContainer.style.display = 'none';
  }
  
  // Check for reset every minute
  setInterval(checkAndResetSpins, 60000);
  
  // Event listeners
  spinBtn.addEventListener('click', spinWheel);
  saveNameBtn.addEventListener('click', handleNameInput);
  playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleNameInput();
  });
}

// Start the game
init();
