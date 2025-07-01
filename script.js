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
    const playerNameInput = document.getElementById('player-name');
    const startGameBtn = document.getElementById('start-game');
    const logoutBtn = document.getElementById('logout-btn');

    // Config
    const API_BASE = 'https://lucky-wheel-gz2p.onrender.com';
    const prizes = [100, 200, 300, 400, 500, 600, 700, 800];
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
    const CHALLENGE_DURATION = 30;

    // State
    let spinning = false;
    let currentPoints = 0;
    let spinsLeft = 2;
    let challengeEndDate = new Date();
    let currentRotation = 0;

    // Check for auto-login on page load
    window.addEventListener('DOMContentLoaded', async () => {
      if (auth.isAuthenticated()) {
        const userData = await auth.login(auth.currentUser);
        if (userData) {
          startGameWithUser(userData);
        } else {
          auth.logout();
        }
      }
    });

    // Modified start game function
    async function startGameWithUser(userData) {
      currentPoints = parseInt(userData.score || 0);
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

    // Modified start game button handler
    startGameBtn.addEventListener('click', async () => {
      const name = playerNameInput.value.trim();
      if (name) {
        const userData = await registerPlayer(name);
        if (userData) {
          startGameWithUser(userData);
        }
      } else {
        alert('Please enter your name');
      }
    });

    // Add logout functionality
    logoutBtn.addEventListener('click', () => {
      auth.logout();
      location.reload();
    });

    // Rest of your existing code remains the same...
    // [Include all your existing functions: drawWheel, spinWheel, finishSpin, etc.]
    // Make sure to update any references to currentUser to use auth.currentUser instead
