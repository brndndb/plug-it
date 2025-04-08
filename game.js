// Game variables
let canvas, ctx;
let game = {
    isRunning: false,
    difficulty: 'medium',
    level: 1,
    score: 0,
    lives: 3,
    gravity: 0.5,
    highScores: []
};

// Game objects
let player = {
    x: 50,
    y: 400,
    width: 32,
    height: 48,
    speedX: 0,
    speedY: 0,
    isJumping: false,
    jumpPower: -12,
    color: '#0074D9', // Blue color for the plug
    baseSpeed: 5,
    speedBoost: 0,
    invincible: false,
    invincibleTime: 0
};

let levelWidth = 800;

// Add these variables at the top of your game.js file, with other game variables
let camera = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    smoothFactor: 0.1  // Lower = smoother camera (0.05 to 0.15 is good)
};

// Add physics variables for more natural movement
function initializePhysics() {
    player.friction = 0.8;  // Ground friction (0-1, higher = more slippery)
    player.airFriction = 0.95;  // Air friction (0-1, higher = more control in air)
    player.acceleration = 0.5;  // How quickly player speeds up
    player.deceleration = 0.8;  // How quickly player slows down when not pressing keys
}

// Create sound objects
const sounds = {
    jump: new Audio('https://assets.codepen.io/21542/howler-push.mp3'),
    coin: new Audio('https://assets.codepen.io/21542/howler-sfx-levelup.mp3'),
    death: new Audio('https://assets.codepen.io/21542/howler-sfx-liquid.mp3'),
    levelComplete: new Audio('https://assets.codepen.io/21542/howler-sfx-coin3.mp3')
};

// Background elements
const background = {
    clouds: [
        { x: 100, y: 50, width: 160, height: 50, speed: 0.3 },
        { x: 400, y: 80, width: 120, height: 40, speed: 0.2 },
        { x: 700, y: 60, width: 140, height: 45, speed: 0.25 }
    ],
    mountains: [],
    trees: [
        { x: 50, y: 410, height: 40, width: 30 },
        { x: 300, y: 420, height: 30, width: 25 },
        { x: 600, y: 415, height: 35, width: 28 },
        { x: 750, y: 420, height: 30, width: 25 }
    ]
};

// Add power-up types
const powerUpTypes = {
    SPEED_BOOST: {
        color: '#39CCCC',
        effect: function() {
            player.speedBoost = 2;
            setTimeout(() => { player.speedBoost = 0; }, 5000);
            createFloatingMessage('Speed Boost!', player.x, player.y - 30, '#39CCCC');
        }
    },
    EXTRA_LIFE: {
        color: '#FF4136',
        effect: function() {
            if (game.lives < 5) {
                game.lives++;
                document.getElementById('lives').textContent = game.lives;
                createFloatingMessage('Extra Life!', player.x, player.y - 30, '#FF4136');
            } else {
                game.score += 200;
                document.getElementById('score').textContent = game.score;
                createFloatingMessage('+200', player.x, player.y - 30, '#FFDC00');
            }
        }
    },
    INVINCIBILITY: {
        color: '#7FDBFF',
        effect: function() {
            player.invincible = true;
            player.invincibleTime = Date.now() + 5000;
            createFloatingMessage('Invincibility!', player.x, player.y - 30, '#7FDBFF');
        }
    }
};

// Add effects object
const effects = {
    particles: [],
    messages: []
};

// Preload sounds
function preloadSounds() {
    for (const sound in sounds) {
        sounds[sound].load();
    }
}

// Add tutorial state
let tutorialActive = false;
let tutorialStep = 0;

// Level timer variables
let levelStartTime = 0;
let levelCurrentTime = 0;
let isPaused = false;

// Add achievements system
const achievements = {
    COIN_COLLECTOR: {
        id: 'COIN_COLLECTOR',
        name: 'Coin Collector',
        description: 'Collect 10 coins',
        icon: '🪙',
        unlocked: false,
        progress: 0,
        target: 10
    },
    SURVIVOR: {
        id: 'SURVIVOR',
        name: 'Survivor',
        description: 'Complete a level without losing lives',
        icon: '🛡️',
        unlocked: false
    },
    SPEED_RUNNER: {
        id: 'SPEED_RUNNER',
        name: 'Speed Runner',
        description: 'Complete a level in under 30 seconds',
        icon: '⏱️',
        unlocked: false
    },
    POWER_UP_MASTER: {
        id: 'POWER_UP_MASTER',
        name: 'Power-Up Master',
        description: 'Collect all types of power-ups',
        icon: '⭐',
        unlocked: false,
        progress: {
            'SPEED_BOOST': false,
            'EXTRA_LIFE': false,
            'INVINCIBILITY': false
        }
    }
};

// Add animation frames to player
function initializeAnimations() {
    player.animations = {
        idle: {
            frames: 4,
            currentFrame: 0,
            frameTime: 0,
            frameDelay: 15 // Update every 15 game ticks
        },
        run: {
            frames: 6,
            currentFrame: 0,
            frameTime: 0,
            frameDelay: 8 // Update every 8 game ticks (faster)
        },
        jump: {
            frames: 2,
            currentFrame: 0,
            frameTime: 0,
            frameDelay: 20
        }
    };
    player.currentAnimation = 'idle';
}






// Game controls
const keys = {
    ArrowRight: false,
    ArrowLeft: false,
    ArrowUp: false,
    Space: false
};

// Level configurations
const levels = [
    {
        platforms: [
            { x: 0, y: 450, width: 800, height: 50 }, // Ground
            { x: 200, y: 350, width: 100, height: 20 },
            { x: 400, y: 300, width: 100, height: 20 },
            { x: 600, y: 250, width: 100, height: 20 }
        ],
        obstacles: [
            { x: 300, y: 430, width: 20, height: 20 },
            { x: 500, y: 430, width: 20, height: 20 }
        ],
        coins: [
            { x: 250, y: 320, width: 20, height: 20, collected: false },
            { x: 450, y: 270, width: 20, height: 20, collected: false },
            { x: 650, y: 220, width: 20, height: 20, collected: false }
        ],
        outlet: { x: 720, y: 410, width: 40, height: 40 },
        powerUps: [] // Initialize powerUps array
    },
    {
        platforms: [
            { x: 0, y: 450, width: 800, height: 50 }, // Ground
            { x: 150, y: 380, width: 80, height: 20 },
            { x: 300, y: 330, width: 80, height: 20 },
            { x: 450, y: 280, width: 80, height: 20 },
            { x: 600, y: 230, width: 80, height: 20 }
        ],
        obstacles: [
            { x: 250, y: 430, width: 20, height: 20 },
            { x: 400, y: 430, width: 20, height: 20 },
            { x: 550, y: 430, width: 20, height: 20 },
            { x: 330, y: 310, width: 20, height: 20 }
        ],
        coins: [
            { x: 180, y: 350, width: 20, height: 20, collected: false },
            { x: 330, y: 300, width: 20, height: 20, collected: false },
            { x: 480, y: 250, width: 20, height: 20, collected: false },
            { x: 630, y: 200, width: 20, height: 20, collected: false }
        ],
        outlet: { x: 720, y: 410, width: 40, height: 40 },
        powerUps: [] // Initialize powerUps array
    },
    {
        platforms: [
            { x: 0, y: 450, width: 800, height: 50 }, // Ground
            { x: 100, y: 400, width: 60, height: 20 },
            { x: 240, y: 350, width: 60, height: 20 },
            { x: 380, y: 300, width: 60, height: 20 },
            { x: 520, y: 250, width: 60, height: 20 },
            { x: 660, y: 200, width: 60, height: 20 }
        ],
        obstacles: [
            { x: 200, y: 430, width: 20, height: 20 },
            { x: 340, y: 430, width: 20, height: 20 },
            { x: 480, y: 430, width: 20, height: 20 },
            { x: 620, y: 430, width: 20, height: 20 },
            { x: 300, y: 330, width: 20, height: 20 },
            { x: 440, y: 280, width: 20, height: 20 }
        ],
        coins: [
            { x: 130, y: 370, width: 20, height: 20, collected: false },
            { x: 270, y: 320, width: 20, height: 20, collected: false },
            { x: 410, y: 270, width: 20, height: 20, collected: false },
            { x: 550, y: 220, width: 20, height: 20, collected: false },
            { x: 690, y: 170, width: 20, height: 20, collected: false }
        ],
        outlet: { x: 720, y: 160, width: 40, height: 40 },
        powerUps: [] // Initialize powerUps array
    }
];

// Update the window.onload function to initialize physics
window.onload = function() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Initialize background mountains now that canvas is defined
    background.mountains = [
        { x: 0, height: 120, width: canvas.width * 1.5 }
    ];
    
    // Load saved data
    loadHighScores();
    loadAchievements();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update start screen
    updateStartScreen();
    updateStartScreenWithSaveLoad();
    updateStartScreenWithAchievements();
    
    // Preload sounds
    preloadSounds();
    
    // Show tutorial on first play
    if (!localStorage.getItem('tutorialShown')) {
        setTimeout(showTutorial, 500);
    }
    
    // Show start screen
    showStartScreen();
    
    initializeAchievements();
    
    // Initialize player properties
    player.speedBoost = 0;
    player.invincible = false;
    player.invincibleTime = 0;
    
    // Initialize physics properties
    initializePhysics();
    
    // Initialize player jump buffer
    player.jumpBufferTimer = 0;
    
    // Set up mobile controls if needed
    setupMobileControls();
    
    // Add sound toggle
    addSoundToggle();
    
    // Add window resize handler for responsive canvas
    window.addEventListener('resize', adjustCanvasSize);
    adjustCanvasSize();
};

function adjustCanvasSize() {
    // Only apply responsive scaling on smaller screens
    if (window.innerWidth < 850) {
        const containerWidth = document.getElementById('gameContainer').offsetWidth;
        const ratio = canvas.height / canvas.width;
        
        // Keep aspect ratio
        canvas.style.width = containerWidth + 'px';
        canvas.style.height = (containerWidth * ratio) + 'px';
    } else {
        // Reset to default on larger screens
        canvas.style.width = '';
        canvas.style.height = '';
    }
}

function setupMobileControls() {
    // Check if we're on a mobile device
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        const controlsContainer = document.createElement('div');
        controlsContainer.id = 'mobileControls';
        controlsContainer.style.cssText = `
            position: absolute;
            bottom: 10px;
            left: 0;
            width: 100%;
            display: flex;
            justify-content: space-between;
            padding: 0 10px;
            z-index: 100;
        `;
        
        // Left button
        const leftBtn = document.createElement('button');
        leftBtn.innerHTML = '←';
        leftBtn.style.cssText = `
            width: 60px;
            height: 60px;
            background-color: rgba(0, 0, 0, 0.5);
            border: 2px solid white;
            border-radius: 50%;
            color: white;
            font-size: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            user-select: none;
            -webkit-user-select: none;
        `;
        
        // Right button
        const rightBtn = document.createElement('button');
        rightBtn.innerHTML = '→';
        rightBtn.style.cssText = leftBtn.style.cssText;
        
        // Jump button
        const jumpBtn = document.createElement('button');
        jumpBtn.innerHTML = '↑';
        jumpBtn.style.cssText = leftBtn.style.cssText;
        
        // Pause button
        const pauseBtn = document.createElement('button');
        pauseBtn.innerHTML = '❚❚';
        pauseBtn.style.cssText = leftBtn.style.cssText;
        
        // Event listeners with touch support
        leftBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            keys.ArrowLeft = true;
        });
        
        leftBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            keys.ArrowLeft = false;
        });
        
        rightBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            keys.ArrowRight = true;
        });
        
        rightBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            keys.ArrowRight = false;
        });
        
        jumpBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            keys.Space = true;
        });
        
        jumpBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            keys.Space = false;
        });
        
        pauseBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            if (game.isRunning) {
                togglePause();
            }
        });
        
        // Movement controls container (left side)
        const moveControls = document.createElement('div');
        moveControls.style.display = 'flex';
        moveControls.style.gap = '10px';
        moveControls.appendChild(leftBtn);
        moveControls.appendChild(rightBtn);
        
        // Action controls container (right side)
        const actionControls = document.createElement('div');
        actionControls.style.display = 'flex';
        actionControls.style.gap = '10px';
        actionControls.appendChild(jumpBtn);
        actionControls.appendChild(pauseBtn);
        
        controlsContainer.appendChild(moveControls);
        controlsContainer.appendChild(actionControls);
        
        document.getElementById('gameContainer').appendChild(controlsContainer);
        
        // Show controls only when game is running
        document.addEventListener('gameStateChange', function(e) {
            controlsContainer.style.display = e.detail.isRunning ? 'flex' : 'none';
        });
    }
}

function addSoundToggle() {
    const soundToggle = document.createElement('button');
    soundToggle.id = 'soundToggle';
    soundToggle.className = 'button';
    soundToggle.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 100;
        font-size: 20px;
    `;
    
    // Check if sound is muted in localStorage
    let soundMuted = localStorage.getItem('powerPlugSoundMuted') === 'true';
    updateSoundState(soundMuted);
    
    soundToggle.innerHTML = soundMuted ? '🔇' : '🔊';
    
    soundToggle.addEventListener('click', function() {
        soundMuted = !soundMuted;
        updateSoundState(soundMuted);
        soundToggle.innerHTML = soundMuted ? '🔇' : '🔊';
        localStorage.setItem('powerPlugSoundMuted', soundMuted);
    });
    
    document.getElementById('gameContainer').appendChild(soundToggle);
}

function updateSoundState(muted) {
    for (const sound in sounds) {
        sounds[sound].muted = muted;
    }
}

function initializeAchievements() {
    // If achievements haven't been initialized yet
    if (!localStorage.getItem('powerPlugAchievements')) {
        // Set initial state
        for (const id in achievements) {
            if (id === 'POWER_UP_MASTER') {
                achievements[id].progress = {
                    'SPEED_BOOST': false,
                    'EXTRA_LIFE': false,
                    'INVINCIBILITY': false
                };
            } else if (achievements[id].target) {
                achievements[id].progress = 0;
            }
            achievements[id].unlocked = false;
        }
        saveAchievements();
    }
}

function loadHighScores() {
    const savedScores = localStorage.getItem('powerPlugScores');
    if (savedScores) {
        game.highScores = JSON.parse(savedScores);
    }
}

function loadAchievements() {
    const savedAchievements = localStorage.getItem('powerPlugAchievements');
    if (savedAchievements) {
        const loaded = JSON.parse(savedAchievements);
        
        // Update loaded achievements
        for (const id in loaded) {
            if (achievements[id]) {
                achievements[id] = loaded[id];
            }
        }
    }
}

function saveAchievements() {
    localStorage.setItem('powerPlugAchievements', JSON.stringify(achievements));
}

// Add these functions to the game.js file to fix the reference errors

// Save score function
function saveScore() {
    const playerName = document.getElementById('playerName').value.trim();
    if (playerName === '') {
        alert('Please enter your name');
        return;
    }
    
    // Add score to high scores
    game.highScores.push({
        name: playerName,
        score: game.score,
        difficulty: game.difficulty,
        level: game.level
    });
    
    // Sort high scores
    game.highScores.sort((a, b) => b.score - a.score);
    
    // Keep only top 10
    if (game.highScores.length > 10) {
        game.highScores = game.highScores.slice(0, 10);
    }
    
    // Save to local storage
    localStorage.setItem('powerPlugScores', JSON.stringify(game.highScores));
    
    // Show high scores
    document.getElementById('gameOver').style.display = 'none';
    showHighScores();
}

// Make sure showHighScores function exists
function showHighScores() {
    const scoresList = document.getElementById('scoresList');
    scoresList.innerHTML = '';
    
    if (game.highScores.length === 0) {
        scoresList.innerHTML = '<p>No scores yet</p>';
    } else {
        const table = document.createElement('table');
        table.innerHTML = `
            <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Score</th>
                <th>Difficulty</th>
                <th>Level</th>
            </tr>
        `;
        
        game.highScores.forEach((score, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${score.name}</td>
                <td>${score.score}</td>
                <td>${score.difficulty}</td>
                <td>${score.level}</td>
            `;
            table.appendChild(row);
        });
        
        scoresList.appendChild(table);
    }
    
    document.getElementById('highScores').style.display = 'flex';
}

// Apply difficulty settings
function applyDifficultySettings() {
    const difficultySettings = {
        easy: {
            lives: 5,
            gravity: 0.4,
            jumpPower: -10,          // Reduced jump power
            playerSpeed: 2.5,        // Reduced from 4
            obstacleSpeed: 0,
            powerUpFrequency: 2.5,
            extraPlatforms: 3,
            playerColor: '#2ECC40',  // Green
            coinValue: 150
        },
        medium: {
            lives: 3,
            gravity: 0.5,
            jumpPower: -11,          // Reduced jump power
            playerSpeed: 3,          // Reduced from 5
            obstacleSpeed: 0.4,      // Slightly reduced
            powerUpFrequency: 1.5,
            extraPlatforms: 1,
            playerColor: '#0074D9',  // Blue
            coinValue: 100
        },
        hard: {
            lives: 1,
            gravity: 0.6,
            jumpPower: -12,          // Reduced jump power
            playerSpeed: 3.5,        // Reduced from 6
            obstacleSpeed: 0.7,      // Slightly reduced
            powerUpFrequency: 1,
            extraPlatforms: 0,
            playerColor: '#FF4136',  // Red
            coinValue: 200
        }
    };
    
    const settings = difficultySettings[game.difficulty];
    
    // Apply settings
    game.lives = settings.lives;
    game.gravity = settings.gravity;
    player.jumpPower = settings.jumpPower;
    player.baseSpeed = settings.playerSpeed;
    player.color = settings.playerColor;
    game.coinValue = settings.coinValue;
    
    // Reset obstacles first
    levels.forEach(level => {
        level.obstacles.forEach(obstacle => {
            delete obstacle.speedX;
            delete obstacle.startX;
            delete obstacle.range;
        });
    });
    
    // Make some obstacles move in medium and hard modes
    if (game.difficulty !== 'easy') {
        levels.forEach(level => {
            level.obstacles.forEach((obstacle, index) => {
                if (index % 2 === 0) { // Make some obstacles move
                    obstacle.speedX = settings.obstacleSpeed;
                    obstacle.startX = obstacle.x;
                    obstacle.range = 100; // Range of movement
                }
            });
        });
    }
    
    // Add power-ups based on difficulty
    levels.forEach(level => {
        // Clear existing power-ups
        level.powerUps = [];
        
        // Add power-ups based on difficulty
        for (let i = 0; i < settings.powerUpFrequency; i++) {
            // Make sure we have platforms to place power-ups on
            if (level.platforms.length > 1) {
                const platform = level.platforms[Math.floor(Math.random() * (level.platforms.length - 1)) + 1];
                
                const types = Object.keys(powerUpTypes);
                const randomType = types[Math.floor(Math.random() * types.length)];
                
                level.powerUps.push({
                    x: platform.x + platform.width/2 - 15,
                    y: platform.y - 30,
                    width: 30,
                    height: 30,
                    type: randomType,
                    collected: false,
                    pulseRate: 0.005 + (Math.random() * 0.01),
                    pulseTime: 0
                });
            }
        }
    });
    
    // Store original platform configurations if not already stored
    if (!window.originalLevels) {
        window.originalLevels = JSON.parse(JSON.stringify(levels));
    } else {
        // Reset to original platforms before adding difficulty-specific ones
        levels.forEach((level, levelIndex) => {
            level.platforms = JSON.parse(JSON.stringify(window.originalLevels[levelIndex].platforms));
        });
    }
    
    // Add extra platforms for easier difficulties
    if (settings.extraPlatforms > 0) {
        levels.forEach(level => {
            // Use smart platform placement instead of random locations
            for (let i = 0; i < settings.extraPlatforms; i++) {
                // Find gaps between existing platforms to place new platforms
                let platforms = level.platforms.filter(p => p.y < 450); // Exclude ground
                
                // Sort platforms by x position to find gaps
                platforms.sort((a, b) => a.x - b.x);
                
                // Find the largest horizontal gap
                let maxGap = 0;
                let gapX = 100;
                let gapY = 350;
                
                // Check gaps between existing platforms
                for (let j = 0; j < platforms.length - 1; j++) {
                    const currentPlatform = platforms[j];
                    const nextPlatform = platforms[j + 1];
                    
                    const gap = nextPlatform.x - (currentPlatform.x + currentPlatform.width);
                    
                    if (gap > maxGap && gap > 100) { // Minimum gap size to add a platform
                        maxGap = gap;
                        gapX = currentPlatform.x + currentPlatform.width + gap / 2 - 35; // Center in the gap
                        
                        // Choose y position that makes a reachable jump (between the two platforms)
                        const avgY = (currentPlatform.y + nextPlatform.y) / 2;
                        // Vary the height slightly for variety
                        gapY = avgY + (Math.random() * 40 - 20);
                        
                        // Keep within reasonable jump height
                        gapY = Math.max(200, Math.min(400, gapY));
                    }
                }
                
                // If we didn't find a good gap, find a vertical gap where a platform could help player reach higher
                if (maxGap < 100) {
                    // Look for places where platforms are stacked too high to reach with a normal jump
                    for (let j = 0; j < platforms.length; j++) {
                        for (let k = 0; k < platforms.length; k++) {
                            const lowerPlatform = platforms[j];
                            const upperPlatform = platforms[k];
                            
                            // Check if one platform is above another at a height that might be hard to reach
                            if (upperPlatform.y < lowerPlatform.y && 
                                Math.abs(upperPlatform.x - lowerPlatform.x) < 150 &&
                                lowerPlatform.y - upperPlatform.y > 120) { // Too high to jump
                                
                                // Place a stepping platform in between
                                gapX = (lowerPlatform.x + upperPlatform.x) / 2;
                                gapY = lowerPlatform.y - 60; // A jumpable height above lower platform
                            }
                        }
                    }
                }
                
                // Final fallback - place platforms to help reach the outlet
                if (maxGap < 100) {
                    const outlet = level.outlet;
                    const platformsNearOutlet = platforms.filter(p => 
                        Math.abs(p.x - outlet.x) < 200 && p.y < outlet.y);
                    
                    if (platformsNearOutlet.length === 0 && outlet.y < 400) {
                        // No platforms near the outlet, add one
                        gapX = outlet.x - 80 - (i * 20); // Slightly offset for multiple platforms
                        gapY = outlet.y + 40 + (i * 30);
                    }
                }
                
                // Add the new platform
                level.platforms.push({
                    x: gapX,
                    y: gapY,
                    width: 70,
                    height: 20
                });
            }
        });
    }
    
    // Update UI
    document.getElementById('lives').textContent = game.lives;
    document.getElementById('score').textContent = game.score;
    document.getElementById('level').textContent = game.level;
}


function setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', function(e) {
        if (e.code === 'ArrowRight') keys.ArrowRight = true;
        if (e.code === 'ArrowLeft') keys.ArrowLeft = true;
        if (e.code === 'ArrowUp' || e.code === 'Space') {
            keys.Space = true;
            // Prevent spacebar from scrolling the page
            if (e.code === 'Space') e.preventDefault();
        }
        
        // Add pause key
        if (e.code === 'Escape' && game.isRunning) {
            togglePause();
        }
        
        // Add save keyboard shortcut
        if (e.code === 'KeyS' && e.ctrlKey && game.isRunning) {
            e.preventDefault();
            saveGameState();
        }
    });

    document.addEventListener('keyup', function(e) {
        if (e.code === 'ArrowRight') keys.ArrowRight = false;
        if (e.code === 'ArrowLeft') keys.ArrowLeft = false;
        if (e.code === 'ArrowUp' || e.code === 'Space') keys.Space = false;
    });

    // Difficulty buttons
    document.getElementById('easyBtn').addEventListener('click', function() {
        startGame('easy');
    });
    
    document.getElementById('mediumBtn').addEventListener('click', function() {
        startGame('medium');
    });
    
    document.getElementById('hardBtn').addEventListener('click', function() {
        startGame('hard');
    });

    // Level complete button
    document.getElementById('nextLevelBtn').addEventListener('click', function() {
        document.getElementById('levelComplete').style.display = 'none';
        loadLevel(game.level);
    });

    // Game over buttons
    document.getElementById('saveScoreBtn').addEventListener('click', saveScore);
    document.getElementById('restartBtn').addEventListener('click', function() {
        document.getElementById('gameOver').style.display = 'none';
        showStartScreen();
    });

    // High scores button
    document.getElementById('backBtn').addEventListener('click', function() {
        document.getElementById('highScores').style.display = 'none';
        showStartScreen();
    });
}

function showTutorial() {
    tutorialActive = true;
    tutorialStep = 0;
    
    // Create tutorial overlay
    const tutorialOverlay = document.createElement('div');
    tutorialOverlay.id = 'tutorialOverlay';
    tutorialOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        z-index: 150;
    `;
    
    const tutorialContent = document.createElement('div');
    tutorialContent.id = 'tutorialContent';
    tutorialContent.style.cssText = `
        background-color: rgba(0, 0, 0, 0.8);
        padding: 20px;
        border-radius: 10px;
        max-width: 80%;
        text-align: center;
    `;
    
    const tutorialTitle = document.createElement('h2');
    tutorialTitle.textContent = 'Welcome to Power Plug Adventure!';
    
    const tutorialText = document.createElement('p');
    tutorialText.id = 'tutorialText';
    tutorialText.textContent = 'You are a plug on a mission to reach the outlet! Use arrow keys to move and space to jump.';
    
    const nextBtn = document.createElement('button');
    nextBtn.className = 'button';
    nextBtn.textContent = 'Next';
    nextBtn.addEventListener('click', advanceTutorial);
    
    tutorialContent.appendChild(tutorialTitle);
    tutorialContent.appendChild(tutorialText);
    tutorialContent.appendChild(nextBtn);
    tutorialOverlay.appendChild(tutorialContent);
    
    document.getElementById('gameContainer').appendChild(tutorialOverlay);
}

function advanceTutorial() {
    tutorialStep++;
    
    const tutorialText = document.getElementById('tutorialText');
    const nextBtn = document.querySelector('#tutorialContent .button');
    
    switch(tutorialStep) {
        case 1:
            tutorialText.innerHTML = 'Collect coins for points!<br><img src="https://via.placeholder.com/50" alt="Coin icon">';
            break;
        case 2:
            tutorialText.innerHTML = 'Avoid obstacles or you\'ll lose a life!<br><img src="https://via.placeholder.com/50" alt="Obstacle icon">';
            break;
        case 3:
            tutorialText.innerHTML = 'Find power-ups for special abilities!<br><img src="https://via.placeholder.com/50" alt="Power-up icon">';
            break;
        case 4:
            tutorialText.innerHTML = 'Reach the outlet at the end of each level to progress!<br><img src="https://via.placeholder.com/50" alt="Outlet icon">';
            break;
        case 5:
            tutorialText.innerHTML = 'Ready to play?';
            nextBtn.textContent = 'Start Game!';
            break;
        case 6:
            // Remove tutorial overlay
            document.getElementById('tutorialOverlay').remove();
            tutorialActive = false;
            
            // Check if this is the first time playing
            if (!localStorage.getItem('tutorialShown')) {
                localStorage.setItem('tutorialShown', 'true');
            }
            break;
    }
}

function updateStartScreen() {
    const startScreen = document.getElementById('startScreen');
    
    // Add tutorial button
    const tutorialBtn = document.createElement('button');
    tutorialBtn.id = 'tutorialBtn';
    tutorialBtn.className = 'button';
    tutorialBtn.textContent = 'How to Play';
    tutorialBtn.style.marginTop = '20px';
    
    tutorialBtn.addEventListener('click', showTutorial);
    
    // Add high scores button
    const scoresBtn = document.createElement('button');
    scoresBtn.id = 'scoresBtn';
    scoresBtn.className = 'button';
    scoresBtn.textContent = 'High Scores';
    scoresBtn.style.marginTop = '10px';
    
    scoresBtn.addEventListener('click', function() {
        document.getElementById('startScreen').style.display = 'none';
        showHighScores();
    });
    
    // Append buttons
    startScreen.appendChild(tutorialBtn);
    startScreen.appendChild(scoresBtn);
}

function updateStartScreenWithSaveLoad() {
    const startScreen = document.getElementById('startScreen');
    
    // Check if there's a save
    const hasSave = localStorage.getItem('powerPlugSave') !== null;
    
    if (hasSave) {
        const continueBtn = document.createElement('button');
        continueBtn.id = 'continueBtn';
        continueBtn.className = 'button';
        continueBtn.textContent = 'Continue';
        continueBtn.style.marginBottom = '20px';
        
        continueBtn.addEventListener('click', function() {
            if (loadGameState()) {
                document.getElementById('startScreen').style.display = 'none';
                loadLevel(game.level);
            }
        });
        
        // Insert as first button
        startScreen.insertBefore(continueBtn, startScreen.firstChild);
    }
}

function updateStartScreenWithAchievements() {
    const startScreen = document.getElementById('startScreen');
    
    // Add achievements button
    const achievementsBtn = document.createElement('button');
    achievementsBtn.id = 'achievementsBtn';
    achievementsBtn.className = 'button';
    achievementsBtn.textContent = 'Achievements';
    achievementsBtn.style.marginTop = '10px';
    
    achievementsBtn.addEventListener('click', function() {
        document.getElementById('startScreen').style.display = 'none';
        showAchievementsScreen();
    });
    
    // Append button
    startScreen.appendChild(achievementsBtn);
}

function showStartScreen() {
    document.getElementById('startScreen').style.display = 'flex';
    game.isRunning = false;
    
    // Dispatch game state change event
    const event = new CustomEvent('gameStateChange', { 
        detail: { isRunning: false } 
    });
    document.dispatchEvent(event);
}

// Update startGame to use difficulty settings
function startGame(difficulty) {
    console.log('Starting game with difficulty:', difficulty);
    game.difficulty = difficulty;
    game.level = 1;
    game.score = 0;
    game.lives = 3; // Reset lives
    
    // Apply difficulty settings
    applyDifficultySettings();
    
    // Hide start screen
    document.getElementById('startScreen').style.display = 'none';
    
    // Reset player
    player.x = 50;
    player.y = 400;
    player.speedX = 0;
    player.speedY = 0;
    player.isJumping = false;
    player.speedBoost = 0;
    player.invincible = false;
    
    // Make sure UI is updated
    document.getElementById('score').textContent = game.score;
    document.getElementById('level').textContent = game.level;
    document.getElementById('lives').textContent = game.lives;
    
    // Load the first level
    loadLevel(game.level);
}

// Then update the loadLevel function to set the proper level width:
function loadLevel(levelNum) {
    // Reset player position
    player.x = 50;
    player.y = 400;
    player.speedX = 0;
    player.speedY = 0;
    player.isJumping = false;
    
    // Set level width based on the rightmost platform or object
    let rightmostX = 0;
    const level = levels[levelNum-1];
    
    // Check platforms
    level.platforms.forEach(platform => {
        const platformRight = platform.x + platform.width;
        if (platformRight > rightmostX) rightmostX = platformRight;
    });
    
    // Check outlet
    const outletRight = level.outlet.x + level.outlet.width;
    if (outletRight > rightmostX) rightmostX = outletRight;
    
    // Set level width with some extra space
    levelWidth = Math.max(rightmostX + 200, canvas.width);
    
    // Reset level coins
    level.coins.forEach(coin => {
        coin.collected = false;
    });
    
    // Reset power-ups if they exist
    if (level.powerUps && level.powerUps.length > 0) {
        level.powerUps.forEach(powerUp => {
            powerUp.collected = false;
        });
    }
    
    // Start level timer
    startLevelTimer();
    
    // Start tracking if player loses lives
    game.levelStartLives = game.lives;
    
    setGameRunning(true);
    gameLoop();
}

function startLevelTimer() {
    levelStartTime = Date.now();
    levelCurrentTime = 0;
}

function updateLevelTimer() {
    if (game.isRunning && !isPaused) {
        levelCurrentTime = Date.now() - levelStartTime;
    }
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function gameLoop() {
    if (!game.isRunning) return;
    if (isPaused) {
        // If paused, just request the next frame without updating
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    update();
    draw();
    updateLevelTimer();
    updateJumpBuffer();    

    // Check invincibility timer
    if (player.invincible && Date.now() > player.invincibleTime) {
        player.invincible = false;
    }
    
    // Continue the game loop
    requestAnimationFrame(gameLoop);
}

function setGameRunning(isRunning) {
    game.isRunning = isRunning;
    
    // Dispatch custom event for UI elements
    const event = new CustomEvent('gameStateChange', { 
        detail: { isRunning: isRunning } 
    });
    document.dispatchEvent(event);
    
    // If game is running, start the loop
    if (isRunning) {
        gameLoop();
    }
}

function collides(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function update() {
    // Apply gravity
    player.speedY += game.gravity;
    
    // Handle controls with acceleration/deceleration for smoother movement
    let targetSpeedX = 0;
    if (keys.ArrowRight) {
        // Accelerate right
        targetSpeedX = player.baseSpeed + (player.speedBoost || 0);
        player.speedX += player.acceleration;
        if (player.speedX > targetSpeedX) player.speedX = targetSpeedX;
    } else if (keys.ArrowLeft) {
        // Accelerate left
        targetSpeedX = -player.baseSpeed - (player.speedBoost || 0);
        player.speedX -= player.acceleration;
        if (player.speedX < targetSpeedX) player.speedX = targetSpeedX;
    } else {
        // Decelerate when no keys pressed
        player.speedX *= player.isJumping ? player.airFriction : player.deceleration;
        
        // Stop completely if very slow
        if (Math.abs(player.speedX) < 0.1) {
            player.speedX = 0;
        }
    }
    
    // Handle jumping with a little delay for better feel
    if (keys.Space && !player.isJumping && !player.jumpBufferTimer) {
        player.speedY = player.jumpPower;
        player.isJumping = true;
        sounds.jump.currentTime = 0;
        sounds.jump.play();
        
        // Add jump effect particles
        createJumpParticles(player.x + player.width/2, player.y + player.height);
    }

    // Update player position
    player.x += player.speedX;
    player.y += player.speedY;
    
    
    // Boundary checking
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    
    const currentLevel = levels[game.level - 1];
    
    // Check platform collisions
    let onGround = false;
    currentLevel.platforms.forEach(platform => {
        if (collides(player, platform)) {
            // Coming from above (landing)
            if (player.speedY > 0 && player.y + player.height - player.speedY <= platform.y) {
                player.y = platform.y - player.height;
                player.speedY = 0;
                player.isJumping = false;
                onGround = true;
            }
            // Hit from below
            else if (player.speedY < 0 && player.y - player.speedY >= platform.y + platform.height) {
                player.y = platform.y + platform.height;
                player.speedY = 0;
            }
            // Hit from left
            else if (player.speedX > 0 && player.x + player.width - player.speedX <= platform.x) {
                player.x = platform.x - player.width;
            }
            // Hit from right
            else if (player.speedX < 0 && player.x - player.speedX >= platform.x + platform.width) {
                player.x = platform.x + platform.width;
            }
        }
    });
    
    // Check for coin collisions
    currentLevel.coins.forEach(coin => {
        if (!coin.collected && collides(player, coin)) {
            coin.collected = true;
            game.score += 100;
            document.getElementById('score').textContent = game.score;
            
            // Play sound
            sounds.coin.currentTime = 0;
            sounds.coin.play();
            
            // Update achievements
            if (achievements.COIN_COLLECTOR && !achievements.COIN_COLLECTOR.unlocked) {
                achievements.COIN_COLLECTOR.progress++;
                if (achievements.COIN_COLLECTOR.progress >= achievements.COIN_COLLECTOR.target) {
                    achievements.COIN_COLLECTOR.unlocked = true;
                    showAchievementNotification(achievements.COIN_COLLECTOR);
                }
                saveAchievements();
            }
            
            // Create particles
            createCoinParticles(coin.x + coin.width/2, coin.y + coin.height/2);
        }
    });
    
    // Check for obstacle collisions (if not invincible)
    if (!player.invincible) {
        for (let i = 0; i < currentLevel.obstacles.length; i++) {
            const obstacle = currentLevel.obstacles[i];
            
            // Update dynamic obstacles
            if (obstacle.speedX) {
                obstacle.x += obstacle.speedX;
                
                // Reverse direction at boundaries
                if (obstacle.x <= obstacle.startX - obstacle.range || obstacle.x >= obstacle.startX + obstacle.range) {
                    obstacle.speedX *= -1;
                }
            }
            
            if (collides(player, obstacle)) {
                playerHit();
                break; // Exit loop after first hit
            }
        }
    }
    
    // Check for power-up collisions
    if (currentLevel.powerUps) {
        currentLevel.powerUps.forEach(powerUp => {
            if (!powerUp.collected && collides(player, powerUp)) {
                powerUp.collected = true;
                
                // Apply power-up effect
                if (powerUpTypes[powerUp.type]) {
                    powerUpTypes[powerUp.type].effect();
                    
                    // Update achievement for power-ups
                    if (achievements.POWER_UP_MASTER && !achievements.POWER_UP_MASTER.unlocked) {
                        achievements.POWER_UP_MASTER.progress[powerUp.type] = true;
                        
                        // Check if all power-ups have been collected
                        let allCollected = true;
                        for (const type in achievements.POWER_UP_MASTER.progress) {
                            if (!achievements.POWER_UP_MASTER.progress[type]) {
                                allCollected = false;
                                break;
                            }
                        }
                        
                        if (allCollected) {
                            achievements.POWER_UP_MASTER.unlocked = true;
                            showAchievementNotification(achievements.POWER_UP_MASTER);
                        }
                        
                        saveAchievements();
                    }
                }
            }
        });
    }
    
    // Check for level completion (reaching the outlet)
    if (collides(player, currentLevel.outlet)) {
        completeLevel();
    }
    
    // Check if player fell off the screen
    if (player.y > canvas.height) {
        playerHit();
        // Reset player position to prevent multiple hits
        player.x = 50;
        player.y = 400;
    }
    
  // Update particles
  updateParticles();
  
  // Update floating messages
  updateFloatingMessages();

  // Fix the function name - use capital C
  updateCamera();
}

// Create jump particles for better feedback
function createJumpParticles(x, y) {
    for (let i = 0; i < 8; i++) {
        effects.particles.push({
            x: x - 10 + Math.random() * 20,
            y: y,
            speedX: (Math.random() - 0.5) * 3,
            speedY: Math.random() * 2 + 1,
            size: Math.random() * 4 + 2,
            color: '#FFFFFF',
            life: 20 + Math.random() * 10
        });
    }
}

// Add a jump buffer timer for more forgiving controls (call in game loop)
function updateJumpBuffer() {
    // Make sure jumpBufferTimer is initialized
    if (typeof player.jumpBufferTimer === 'undefined') {
        player.jumpBufferTimer = 0;
    }
    
    if (keys.Space && !player.isJumping) {
        player.jumpBufferTimer = 8; // Allow jump to trigger within 8 frames of pressing Space
    } else if (player.jumpBufferTimer > 0) {
        player.jumpBufferTimer--;
    }
}

function updateCamera() {
    // Only use horizontal camera (no vertical scrolling)
    // Set camera to follow player horizontally
    const targetX = Math.max(0, player.x - canvas.width/2);
    
    // Don't go beyond level bounds
    camera.x = Math.min(targetX, Math.max(0, levelWidth - canvas.width));
    camera.y = 0; // No vertical scrolling
}


// Player hit function
function playerHit() {
    if (player.invincible) return;
    
    game.lives--;
    document.getElementById('lives').textContent = game.lives;
    
    // Play sound
    sounds.death.currentTime = 0;
    sounds.death.play();
    
    // Create particles
    createHitParticles(player.x + player.width/2, player.y + player.height/2);
    
    // Flash player
    player.invincible = true;
    player.invincibleTime = Date.now() + 1500; // Temporary invincibility after hit
    
    // Check game over
    if (game.lives <= 0) {
        gameOver();
    }
}

// Complete level function
function completeLevel() {
    // Stop the game
    setGameRunning(false);
    
    // Play sound
    sounds.levelComplete.currentTime = 0;
    sounds.levelComplete.play();
    
    // Calculate time bonus
    const timeBonus = Math.max(0, 30000 - levelCurrentTime);
    const timeBonusPoints = Math.floor(timeBonus / 100);
    
    // Add bonus points
    game.score += timeBonusPoints;
    
    // Check for achievements
    
    // Speed Runner achievement
    if (levelCurrentTime < 30000 && !achievements.SPEED_RUNNER.unlocked) {
        achievements.SPEED_RUNNER.unlocked = true;
        showAchievementNotification(achievements.SPEED_RUNNER);
        saveAchievements();
    }
    
    // Survivor achievement
    if (game.lives === game.levelStartLives && !achievements.SURVIVOR.unlocked) {
        achievements.SURVIVOR.unlocked = true;
        showAchievementNotification(achievements.SURVIVOR);
        saveAchievements();
    }
    
    // Update level complete screen
    document.getElementById('levelScore').textContent = `Score: ${game.score} (Time Bonus: ${timeBonusPoints})`;
    
    // Increment level
    game.level++;
    
    // Check if there are more levels
    if (game.level > levels.length) {
        // Game completed
        document.getElementById('nextLevelBtn').textContent = "Restart Game";
        document.getElementById('nextLevelBtn').onclick = function() {
            document.getElementById('levelComplete').style.display = 'none';
            game.level = 1;
            showStartScreen();
        };
    } else {
        // More levels to play
        document.getElementById('nextLevelBtn').textContent = "Next Level";
        document.getElementById('nextLevelBtn').onclick = function() {
            document.getElementById('levelComplete').style.display = 'none';
            loadLevel(game.level);
        };
    }
    
    // Show level complete screen
    document.getElementById('levelComplete').style.display = 'flex';
}

// Game over function
function gameOver() {
    // Stop the game
    setGameRunning(false);
    
    // Update game over screen
    document.getElementById('finalScore').textContent = `Final Score: ${game.score}`;
    
    // Show game over screen
    document.getElementById('gameOver').style.display = 'flex';
}

// Particles functions
function createCoinParticles(x, y) {
    for (let i = 0; i < 10; i++) {
        effects.particles.push({
            x: x,
            y: y,
            speedX: (Math.random() - 0.5) * 5,
            speedY: (Math.random() - 0.5) * 5,
            size: Math.random() * 5 + 2,
            color: '#FFD700', // Gold
            life: 40
        });
    }
}

function createHitParticles(x, y) {
    for (let i = 0; i < 20; i++) {
        effects.particles.push({
            x: x,
            y: y,
            speedX: (Math.random() - 0.5) * 8,
            speedY: (Math.random() - 0.5) * 8,
            size: Math.random() * 6 + 2,
            color: '#FF4136', // Red
            life: 30
        });
    }
}

function updateParticles() {
    // Update and remove dead particles
    for (let i = effects.particles.length - 1; i >= 0; i--) {
        const particle = effects.particles[i];
        
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.life--;
        
        if (particle.life <= 0) {
            effects.particles.splice(i, 1);
        }
    }
}

function createFloatingMessage(text, x, y, color) {
    effects.messages.push({
        text: text,
        x: x,
        y: y,
        color: color || '#FFFFFF',
        life: 60,
        speedY: -1
    });
}

function updateFloatingMessages() {
    // Update and remove expired messages
    for (let i = effects.messages.length - 1; i >= 0; i--) {
        const message = effects.messages[i];
        
        message.y += message.speedY;
        message.life--;
        
        if (message.life <= 0) {
            effects.messages.splice(i, 1);
        }
    }
}

//Draw function

function draw() {
    // Clear with sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#64B5F6');
    skyGradient.addColorStop(1, '#90CAF9');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Save the context state before applying camera transform
    ctx.save();
    
    // Apply camera transform - this is the key change
    ctx.translate(-Math.floor(camera.x), -Math.floor(camera.y));
    
    // Draw all game elements with camera offset
    drawBackground();
    
    // Draw game elements
    const currentLevel = levels[game.level - 1];
    
    // Draw platforms
    currentLevel.platforms.forEach(platform => {
        // Platform base
        const platformGradient = ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
        platformGradient.addColorStop(0, '#8B5A2B');  // Lighter brown
        platformGradient.addColorStop(1, '#704214');  // Darker brown
        ctx.fillStyle = platformGradient;
        
        roundRect(ctx, platform.x, platform.y, platform.width, platform.height, 4);
        
        // Add wood grain texture
        ctx.strokeStyle = 'rgba(139, 69, 19, 0.5)';
        ctx.lineWidth = 1;
        
        // Horizontal grain lines
        for (let i = 0; i < platform.height; i += 4) {
            ctx.beginPath();
            ctx.moveTo(platform.x, platform.y + i);
            ctx.lineTo(platform.x + platform.width, platform.y + i);
            ctx.stroke();
        }
    });
    
    // Draw shining coins with animation
    ctx.fillStyle = '#FFD700';  // Gold
    currentLevel.coins.forEach(coin => {
        if (!coin.collected) {
            // Pulsing animation
            const pulse = 1 + 0.1 * Math.sin(Date.now() / 200);
            const radius = (coin.width / 2) * pulse;
            
            // Coin outer circle with gradient
            const coinGradient = ctx.createRadialGradient(
                coin.x + coin.width/2, coin.y + coin.height/2, 0,
                coin.x + coin.width/2, coin.y + coin.height/2, radius
            );
            coinGradient.addColorStop(0, '#FFF380');  // Light gold at center
            coinGradient.addColorStop(0.8, '#FFD700');  // Gold
            coinGradient.addColorStop(1, '#B8860B');  // Dark gold at edge
            
            ctx.fillStyle = coinGradient;
            ctx.beginPath();
            ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Add $ symbol
            ctx.fillStyle = '#8B6508';  // Dark gold for symbol
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', coin.x + coin.width/2, coin.y + coin.height/2);
            
            // Add shine effect
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(coin.x + coin.width/3, coin.y + coin.height/3, coin.width/8, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    // Draw power-ups with pulsing effect
    if (currentLevel.powerUps) {
        currentLevel.powerUps.forEach(powerUp => {
            if (!powerUp.collected) {
                // Calculate pulse size
                powerUp.pulseTime = (powerUp.pulseTime || 0) + powerUp.pulseRate;
                const pulseScale = 1 + 0.2 * Math.sin(powerUp.pulseTime);
                
                // Draw power-up
                ctx.fillStyle = powerUpTypes[powerUp.type].color;
                
                // Use a more interesting shape for power-ups
                const centerX = powerUp.x + powerUp.width/2;
                const centerY = powerUp.y + powerUp.height/2;
                const size = powerUp.width/2 * pulseScale;
                
                ctx.beginPath();
                // Draw a star shape
                for (let i = 0; i < 5; i++) {
                    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                    const outerX = centerX + Math.cos(angle) * size;
                    const outerY = centerY + Math.sin(angle) * size;
                    
                    if (i === 0) {
                        ctx.moveTo(outerX, outerY);
                    } else {
                        ctx.lineTo(outerX, outerY);
                    }
                    
                    // Inner points of the star
                    const innerAngle = angle + Math.PI / 5;
                    const innerX = centerX + Math.cos(innerAngle) * (size / 2);
                    const innerY = centerY + Math.sin(innerAngle) * (size / 2);
                    ctx.lineTo(innerX, innerY);
                }
                
                ctx.closePath();
                ctx.fill();
                
                // Glow effect
                ctx.shadowColor = powerUpTypes[powerUp.type].color;
                ctx.shadowBlur = 10 * pulseScale;
                ctx.fill();
                ctx.shadowBlur = 0; // Reset shadow blur
            }
        });
    }
    
    // Draw obstacles
    currentLevel.obstacles.forEach(obstacle => {
        drawObstacle(obstacle);
    });

    // Draw outlet
    ctx.fillStyle = '#FFFFFF'; // White for the outlet
    const outlet = currentLevel.outlet;
    
    // Draw outlet with socket detail
    ctx.fillRect(outlet.x, outlet.y, outlet.width, outlet.height);
    
    // Draw socket holes
    ctx.fillStyle = '#000000';
    ctx.fillRect(outlet.x + outlet.width/4, outlet.y + outlet.height/3, outlet.width/5, outlet.height/3);
    ctx.fillRect(outlet.x + outlet.width*2/4, outlet.y + outlet.height/3, outlet.width/5, outlet.height/3);
    
    // Draw player (plug)
    if (player.invincible) {
        // Flashing effect during invincibility
        if (Math.floor(Date.now() / 100) % 2 === 0) {
            drawPlayer();
        }
    } else {
        drawPlayer();
    }
    
    // Draw particles
    effects.particles.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life / 40; // Fade out as life decreases
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1; // Reset alpha
    
    // Draw floating messages
    effects.messages.forEach(message => {
        ctx.fillStyle = message.color;
        ctx.globalAlpha = message.life / 60; // Fade out as life decreases
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(message.text, message.x, message.y);
    });
    ctx.globalAlpha = 1; // Reset alpha
    
    
    // Restore the context to remove camera transform for UI elements
    ctx.restore();
        
    // Draw UI elements
    drawUI();
}

function drawObstacle(obstacle) {
    // Gradient fill for the obstacle
    const gradient = ctx.createLinearGradient(obstacle.x, obstacle.y, obstacle.x, obstacle.y + obstacle.height);
    gradient.addColorStop(0, '#FF6B6B');  // Lighter red
    gradient.addColorStop(1, '#C62828');  // Darker red
    
    ctx.fillStyle = gradient;
    roundRect(ctx, obstacle.x, obstacle.y, obstacle.width, obstacle.height, 2);
    
    // Add warning pattern
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    
    // Draw a danger icon
    ctx.beginPath();
    ctx.moveTo(obstacle.x + obstacle.width/2, obstacle.y + 5);
    ctx.lineTo(obstacle.x + obstacle.width - 5, obstacle.y + obstacle.height - 5);
    ctx.lineTo(obstacle.x + 5, obstacle.y + obstacle.height - 5);
    ctx.closePath();
    ctx.fill();
    
    // Add exclamation mark
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2 + 2);
}

// Visual Enhancement: Better Player Graphics
function drawPlayer() {
    // Draw plug body with gradient
    const gradient = ctx.createLinearGradient(player.x, player.y, player.x + player.width, player.y + player.height);
    gradient.addColorStop(0, player.color);
    gradient.addColorStop(1, darkenColor(player.color, 30));
    
    // Add slight rounded corners effect
    ctx.fillStyle = gradient;
    roundRect(ctx, player.x, player.y, player.width, player.height, 5);
    
    // Draw plug prongs with metallic effect
    const prongGradient = ctx.createLinearGradient(player.x, player.y - 15, player.x, player.y);
    prongGradient.addColorStop(0, '#E0E0E0');
    prongGradient.addColorStop(1, '#A0A0A0');
    ctx.fillStyle = prongGradient;
    
    roundRect(ctx, player.x + 5, player.y - 15, 5, 15, 2);
    roundRect(ctx, player.x + player.width - 10, player.y - 15, 5, 15, 2);
    
    // Draw face with more detail
    ctx.fillStyle = '#FFFFFF';
    
    // Draw eyes with expressions
    const eyeY = player.isJumping ? player.y + 15 : player.y + 20;
    
    // Eyes with pupils
    ctx.fillRect(player.x + 7, eyeY, 6, 5);
    ctx.fillRect(player.x + player.width - 13, eyeY, 6, 5);
    
    // Pupils that follow movement direction
    ctx.fillStyle = '#000000';
    const pupilOffset = player.speedX > 0 ? 1 : (player.speedX < 0 ? -1 : 0);
    ctx.fillRect(player.x + 9 + pupilOffset, eyeY + 1, 2, 3);
    ctx.fillRect(player.x + player.width - 11 + pupilOffset, eyeY + 1, 2, 3);
    
    // Mouth with expression
    ctx.beginPath();
    if (player.isJumping) {
        // Determined straight mouth when jumping
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.moveTo(player.x + 10, player.y + 30);
        ctx.lineTo(player.x + player.width - 10, player.y + 30);
    } else if (player.speedX !== 0) {
        // Smiling mouth when moving
        ctx.fillStyle = '#000000';
        ctx.arc(player.x + player.width/2, player.y + 30, 5, 0, Math.PI);
        ctx.fill();
    } else {
        // Neutral mouth when standing still
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.moveTo(player.x + 12, player.y + 32);
        ctx.lineTo(player.x + player.width - 12, player.y + 32);
    }
    ctx.stroke();
    ctx.lineWidth = 1;
    
    // Draw speed lines when moving fast
    if (Math.abs(player.speedX) > player.baseSpeed) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        const direction = player.speedX > 0 ? -1 : 1;
        
        for (let i = 0; i < 3; i++) {
            const offset = i * 10;
            ctx.beginPath();
            ctx.moveTo(player.x + (direction > 0 ? 0 : player.width) + direction * offset, player.y + 10);
            ctx.lineTo(player.x + (direction > 0 ? 0 : player.width) + direction * (offset + 15), player.y + 10);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(player.x + (direction > 0 ? 0 : player.width) + direction * offset, player.y + 30);
            ctx.lineTo(player.x + (direction > 0 ? 0 : player.width) + direction * (offset + 15), player.y + 30);
            ctx.stroke();
        }
    }
    
    // Glow effect when invincible
    if (player.invincible) {
        ctx.strokeStyle = '#7FDBFF';
        ctx.lineWidth = 3;
        roundRect(ctx, player.x - 3, player.y - 3, player.width + 6, player.height + 6, 6, true, false);
        ctx.lineWidth = 1;
    }
}

// Rounded rectangle utility function
function roundRect(ctx, x, y, width, height, radius, stroke = false, fill = true) {
    if (typeof radius === 'undefined') {
        radius = 5;
    }
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }
}


// Smooth parallax background
function drawBackground() {
    // Distant mountains move slower (parallax effect)
    const mountainParallax = 0.2;
    
    // Draw mountains with parallax
    ctx.fillStyle = '#4B5320'; // Mountain color
    background.mountains.forEach(mountain => {
        const mountainX = mountain.x - camera.x * mountainParallax;
        
        ctx.beginPath();
        ctx.moveTo(mountainX, canvas.height);
        ctx.lineTo(mountainX + mountain.width/3, canvas.height - mountain.height);
        ctx.lineTo(mountainX + mountain.width/2, canvas.height - mountain.height*0.7);
        ctx.lineTo(mountainX + mountain.width*2/3, canvas.height - mountain.height*0.9);
        ctx.lineTo(mountainX + mountain.width, canvas.height);
        ctx.closePath();
        ctx.fill();
        
        // Snow caps
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(mountainX + mountain.width/3, canvas.height - mountain.height);
        ctx.lineTo(mountainX + mountain.width/3 + 20, canvas.height - mountain.height + 15);
        ctx.lineTo(mountainX + mountain.width/2, canvas.height - mountain.height*0.7);
        ctx.lineTo(mountainX + mountain.width*2/3 - 20, canvas.height - mountain.height*0.9 + 10);
        ctx.lineTo(mountainX + mountain.width*2/3, canvas.height - mountain.height*0.9);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#4B5320'; // Reset mountain color
    });
    
    // Clouds with parallax effect
    const cloudParallax = 0.4;
    ctx.fillStyle = '#FFFFFF';
    background.clouds.forEach(cloud => {
        // Update cloud position with game time, adjusted for camera
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.width < 0) {
            cloud.x = canvas.width;
        }
        
        // Draw cloud with parallax
        const cloudX = cloud.x - camera.x * cloudParallax;
        
        ctx.beginPath();
        ctx.arc(cloudX, cloud.y, cloud.height/2, 0, Math.PI * 2);
        ctx.arc(cloudX + cloud.width*0.4, cloud.y - cloud.height*0.1, cloud.height*0.6, 0, Math.PI * 2);
        ctx.arc(cloudX + cloud.width*0.7, cloud.y, cloud.height*0.4, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Trees with minimal parallax (they're closer to foreground)
    const treeParallax = 0.8;
    background.trees.forEach(tree => {
        const treeX = tree.x - camera.x * treeParallax;
        
        // Draw tree trunk
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(treeX, tree.y, tree.width, tree.height);
        
        // Draw foliage with more detail
        const gradient = ctx.createRadialGradient(
            treeX + tree.width/2, tree.y - tree.height, 0,
            treeX + tree.width/2, tree.y - tree.height, tree.width*2
        );
        gradient.addColorStop(0, '#3E9B4F'); // Lighter green in center
        gradient.addColorStop(1, '#1F7A31'); // Darker green at edges
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(treeX - tree.width, tree.y);
        ctx.lineTo(treeX + tree.width*2, tree.y);
        ctx.lineTo(treeX + tree.width/2, tree.y - tree.height*2);
        ctx.closePath();
        ctx.fill();
        
        // Additional foliage layers
        ctx.beginPath();
        ctx.moveTo(treeX - tree.width*0.8, tree.y - tree.height*1.5);
        ctx.lineTo(treeX + tree.width*1.8, tree.y - tree.height*1.5);
        ctx.lineTo(treeX + tree.width/2, tree.y - tree.height*3);
        ctx.closePath();
        ctx.fill();
    });
}

// Color utility function
function darkenColor(hex, percent) {
    // Convert hex to RGB
    let r = parseInt(hex.substr(1, 2), 16);
    let g = parseInt(hex.substr(3, 2), 16);
    let b = parseInt(hex.substr(5, 2), 16);
    
    // Darken
    r = Math.floor(r * (100 - percent) / 100);
    g = Math.floor(g * (100 - percent) / 100);
    b = Math.floor(b * (100 - percent) / 100);
    
    // Convert back to hex
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}


// Add these missing functions to your game.js file

// Draw UI function
function drawUI() {
    // Draw timer
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Time: ${formatTime(levelCurrentTime)}`, canvas.width / 2, 25);
}

// Achievement notification function
function showAchievementNotification(achievement) {
    // Create achievement popup
    const achievementPopup = document.createElement('div');
    achievementPopup.style.cssText = `
        position: absolute;
        top: 50px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.8);
        color: #FFD700;
        padding: 10px 20px;
        border-radius: 10px;
        text-align: center;
        z-index: 200;
        animation: slide-in 0.5s ease-out, fade-out 0.5s ease-in 4s forwards;
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
    `;
    
    achievementPopup.innerHTML = `
        <h3>Achievement Unlocked!</h3>
        <p>${achievement.icon} ${achievement.name}</p>
        <p>${achievement.description}</p>
    `;
    
    document.getElementById('gameContainer').appendChild(achievementPopup);
    
    // Remove popup after animation
    setTimeout(() => {
        achievementPopup.remove();
    }, 5000);
}

// Save game state function
function saveGameState() {
    const saveData = {
        level: game.level,
        score: game.score,
        lives: game.lives,
        difficulty: game.difficulty,
        achievements: achievements
    };
    
    localStorage.setItem('powerPlugSave', JSON.stringify(saveData));
    console.log('Game saved!');
    
    // Show save notification
    createFloatingMessage('Game Saved!', canvas.width/2, canvas.height/2, '#FFFFFF');
}

// Load game state function
function loadGameState() {
    const savedData = localStorage.getItem('powerPlugSave');
    
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            
            // Restore game state
            game.level = data.level;
            game.score = data.score;
            game.lives = data.lives;
            game.difficulty = data.difficulty;
            
            // Restore achievements if present
            if (data.achievements) {
                for (const id in data.achievements) {
                    if (achievements[id]) {
                        achievements[id] = data.achievements[id];
                    }
                }
            }
            
            // Update UI
            document.getElementById('score').textContent = game.score;
            document.getElementById('level').textContent = game.level;
            document.getElementById('lives').textContent = game.lives;
            
            console.log('Game loaded!');
            return true;
        } catch (error) {
            console.error('Error loading saved game:', error);
            return false;
        }
    }
    
    return false;
}

// Show achievements screen function
function showAchievementsScreen() {
    // Create achievements screen
    const achievementsScreen = document.createElement('div');
    achievementsScreen.id = 'achievementsScreen';
    achievementsScreen.className = 'menu-screen';
    achievementsScreen.style.display = 'flex';
    
    // Add header
    const header = document.createElement('h1');
    header.textContent = 'Achievements';
    
    // Create achievements list
    const achievementsList = document.createElement('div');
    achievementsList.id = 'achievementsList';
    
    // Add each achievement
    for (const id in achievements) {
        const achievement = achievements[id];
        
        const achievementItem = document.createElement('div');
        achievementItem.className = 'achievement-item';
        achievementItem.style.cssText = `
            background-color: ${achievement.unlocked ? 'rgba(75, 75, 75, 0.8)' : 'rgba(50, 50, 50, 0.8)'};
            color: ${achievement.unlocked ? '#FFD700' : '#AAAAAA'};
            margin: 10px 0;
            padding: 15px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            transition: all 0.3s ease;
            border: 2px solid ${achievement.unlocked ? '#FFD700' : '#555555'};
        `;
        
        achievementItem.innerHTML = `
            <div style="font-size: 30px; margin-right: 15px;">${achievement.icon}</div>
            <div>
                <h3>${achievement.name}</h3>
                <p>${achievement.description}</p>
                ${achievement.target ? 
                    `<progress value="${achievement.progress}" max="${achievement.target}" style="width: 100%;"></progress>
                    <p>${achievement.progress}/${achievement.target}</p>` : 
                    (achievement.progress && typeof achievement.progress === 'object' ? 
                        `<p>Progress: ${Object.values(achievement.progress).filter(Boolean).length}/${Object.keys(achievement.progress).length}</p>` : 
                        '')
                }
            </div>
        `;
        
        achievementsList.appendChild(achievementItem);
    }
    
    // Add back button
    const backButton = document.createElement('button');
    backButton.className = 'button';
    backButton.textContent = 'Back to Menu';
    backButton.addEventListener('click', function() {
        achievementsScreen.remove();
        showStartScreen();
    });
    
    // Assemble screen
    achievementsScreen.appendChild(header);
    achievementsScreen.appendChild(achievementsList);
    achievementsScreen.appendChild(backButton);
    
    document.getElementById('gameContainer').appendChild(achievementsScreen);
}

// Toggle pause function
function togglePause() {
    isPaused = !isPaused;
    
    if (isPaused) {
        // Create pause screen
        const pauseOverlay = document.createElement('div');
        pauseOverlay.id = 'pauseOverlay';
        pauseOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            z-index: 150;
        `;
        
        const pauseTitle = document.createElement('h2');
        pauseTitle.textContent = 'PAUSED';
        
        const resumeBtn = document.createElement('button');
        resumeBtn.className = 'button';
        resumeBtn.textContent = 'Resume Game';
        resumeBtn.addEventListener('click', function() {
            togglePause();
            pauseOverlay.remove();
        });
        
        const saveBtn = document.createElement('button');
        saveBtn.className = 'button';
        saveBtn.textContent = 'Save Game';
        saveBtn.addEventListener('click', function() {
            saveGameState();
            // Update button text to confirm save
            saveBtn.textContent = 'Game Saved!';
            setTimeout(() => {
                saveBtn.textContent = 'Save Game';
            }, 2000);
        });
        
        const mainMenuBtn = document.createElement('button');
        mainMenuBtn.className = 'button';
        mainMenuBtn.textContent = 'Main Menu';
        mainMenuBtn.addEventListener('click', function() {
            if (confirm('Return to main menu? Progress in the current level will be lost.')) {
                isPaused = false;
                pauseOverlay.remove();
                showStartScreen();
            }
        });
        
        pauseOverlay.appendChild(pauseTitle);
        pauseOverlay.appendChild(resumeBtn);
        pauseOverlay.appendChild(saveBtn);
        pauseOverlay.appendChild(mainMenuBtn);
        
        document.getElementById('gameContainer').appendChild(pauseOverlay);
    } else {
        // Remove any existing pause overlay
        const pauseOverlay = document.getElementById('pauseOverlay');
        if (pauseOverlay) {
            pauseOverlay.remove();
        }
        
        // Resume game loop
        if (game.isRunning) {
            requestAnimationFrame(gameLoop);
        }
    }
}
