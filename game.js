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
    // Level 1 (Easy)
    {
        platforms: [
            { x: 0, y: 450, width: 800, height: 50 }, // Ground
            { x: 100, y: 370, width: 110, height: 20 },
            { x: 280, y: 350, width: 100, height: 20 },
            { x: 450, y: 320, width: 115, height: 20 },
            { x: 620, y: 290, width: 100, height: 20 }
        ],
        obstacles: [
            { x: 200, y: 430, width: 20, height: 20 },
            { x: 350, y: 430, width: 20, height: 20 },
            { x: 530, y: 430, width: 20, height: 20 }
        ],
        coins: [
            { x: 140, y: 340, width: 20, height: 20, collected: false },
            { x: 320, y: 320, width: 20, height: 20, collected: false },
            { x: 490, y: 290, width: 20, height: 20, collected: false },
            { x: 650, y: 260, width: 20, height: 20, collected: false }
        ],
        outlet: { x: 670, y: 240, width: 40, height: 40 },
        powerUps: [
            {
                x: 485, y: 285, width: 30, height: 30, type: 'SPEED_BOOST',
                collected: false, pulseRate: 0.008, pulseTime: 0
            }
        ]
    },
    // Level 2 (Medium)
    {
        platforms: [
            { x: 0, y: 450, width: 800, height: 50 }, // Ground
            { x: 120, y: 370, width: 90, height: 20 },
            { x: 280, y: 340, width: 80, height: 20 },
            { x: 440, y: 310, width: 80, height: 20 },
            { x: 600, y: 260, width: 90, height: 20 }
        ],
        obstacles: [
            { x: 200, y: 430, width: 20, height: 20 },
            { x: 360, y: 430, width: 20, height: 20 },
            { x: 520, y: 430, width: 20, height: 20 },
            { x: 310, y: 320, width: 20, height: 20, speedX: 0.4, startX: 310, range: 50 }
        ],
        coins: [
            { x: 160, y: 340, width: 20, height: 20, collected: false },
            { x: 315, y: 310, width: 20, height: 20, collected: false },
            { x: 475, y: 280, width: 20, height: 20, collected: false },
            { x: 635, y: 230, width: 20, height: 20, collected: false }
        ],
        outlet: { x: 650, y: 210, width: 40, height: 40 },
        powerUps: [
            {
                x: 325, y: 305, width: 30, height: 30, type: 'INVINCIBILITY',
                collected: false, pulseRate: 0.01, pulseTime: 0
            }
        ]
    },
    // Level 3 (Hard)
    {
        platforms: [
            { x: 0, y: 450, width: 800, height: 50 }, // Ground
            { x: 120, y: 390, width: 70, height: 20 },
            { x: 260, y: 330, width: 65, height: 20 },
            { x: 400, y: 270, width: 60, height: 20 },
            { x: 540, y: 220, width: 75, height: 20 }
        ],
        obstacles: [
            { x: 190, y: 430, width: 20, height: 20 },
            { x: 330, y: 430, width: 20, height: 20 },
            { x: 470, y: 430, width: 20, height: 20 },
            { x: 290, y: 310, width: 20, height: 20, speedX: 0.7, startX: 290, range: 40 },
            { x: 430, y: 250, width: 20, height: 20, speedX: 0.7, startX: 430, range: 35 }
        ],
        coins: [
            { x: 145, y: 360, width: 20, height: 20, collected: false },
            { x: 285, y: 300, width: 20, height: 20, collected: false },
            { x: 425, y: 240, width: 20, height: 20, collected: false },
            { x: 575, y: 190, width: 20, height: 20, collected: false }
        ],
        outlet: { x: 575, y: 170, width: 40, height: 40 },
        powerUps: [
            {
                x: 285, y: 295, width: 30, height: 30, type: 'EXTRA_LIFE',
                collected: false, pulseRate: 0.012, pulseTime: 0
            }
        ]
    }
];

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

    // IMPORTANT: Call this function to initialize dynamic level generation
    initializeDynamicLevels();
};

function initializeDynamicLevels() {
    console.log("Initializing dynamic level generation");
    // Ensure the game always uses generateDynamicLevel when loading levels
    
    // Store the original loadLevel function for reference
    const originalLoadLevel = loadLevel;
    
    // Override loadLevel to use our dynamic generation
    loadLevel = function(levelNum) {
        console.log("Loading dynamically generated level:", levelNum);
        
        // Reset player position
        player.x = 50;
        player.y = 400;
        player.speedX = 0;
        player.speedY = 0;
        player.isJumping = false;
        
        // Generate a new level or get an existing one
        let level;
        if (levelNum <= levels.length) {
            // Replace the existing level with a new one
            levels[levelNum - 1] = generateDynamicLevel(levelNum);
            level = levels[levelNum - 1];
        } else {
            // Create a new level and add it to the levels array
            level = generateDynamicLevel(levelNum);
            levels.push(level);
        }
        
        // Set level width based on the rightmost platform or object
        let rightmostX = 0;
        
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
        
        // Prepare level objects
        prepareLevel(levelNum);
        
        // Start tracking if player loses lives
        game.levelStartLives = game.lives;
        
        setGameRunning(true);
        gameLoop();
    };
}

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

    // In the applyDifficultySettings function, at the end
    applyRenderingFixes();
    
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
        background-color: rgba(0, 0, 0, 0.8);
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
    tutorialTitle.style.cssText = `
        color: #FFD700;
        margin-bottom: 15px;
        font-size: 24px;
    `;
    
    const tutorialText = document.createElement('p');
    tutorialText.id = 'tutorialText';
    tutorialText.innerHTML = 'You are a plug on a mission to reach the outlet! Use arrow keys to move and space to jump.';
    tutorialText.style.cssText = `
        margin: 15px 0;
        line-height: 1.5;
        font-size: 18px;
    `;
    
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
            // Coin tutorial
            tutorialText.innerHTML = `
                <div style="margin-bottom: 15px;">Collect coins for points!</div>
                <div style="display: inline-block; background-color: #FFD700; width: 50px; height: 50px; border-radius: 50%; text-align: center; line-height: 50px; font-weight: bold; color: #000; font-size: 24px; box-shadow: 0 0 10px #FFD700;">$</div>
            `;
            break;
        case 2:
            // Obstacle tutorial
            tutorialText.innerHTML = `
                <div style="margin-bottom: 15px;">Avoid obstacles or you'll lose a life!</div>
                <div style="display: inline-block; background-color: #FF4136; width: 50px; height: 50px; border-radius: 5px; text-align: center; line-height: 50px; font-weight: bold; color: #FFF; font-size: 30px; box-shadow: 0 0 10px #FF4136;">!</div>
            `;
            break;
        case 3:
            // Power-up tutorial
            tutorialText.innerHTML = `
                <div style="margin-bottom: 15px;">Find power-ups for special abilities!</div>
                <div style="display: inline-block; background-color: #39CCCC; width: 50px; height: 50px; clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); text-align: center; line-height: 50px; font-weight: bold; color: #FFF; font-size: 24px; box-shadow: 0 0 10px #39CCCC;">★</div>
            `;
            break;
        case 4:
            // Outlet tutorial
            tutorialText.innerHTML = `
                <div style="margin-bottom: 15px;">Reach the outlet at the end of each level to progress!</div>
                <div style="position: relative; display: inline-block; background-color: #FFFFFF; width: 60px; height: 60px; border-radius: 5px; box-shadow: 0 0 10px #FFFFFF;">
                    <div style="position: absolute; top: 20px; left: 12px; width: 15px; height: 25px; background-color: #000; border-radius: 2px;"></div>
                    <div style="position: absolute; top: 20px; left: 33px; width: 15px; height: 25px; background-color: #000; border-radius: 2px;"></div>
                </div>
            `;
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
   
    // Replace the level with a dynamically generated one
    if (levelNum <= levels.length) {
        levels[levelNum - 1] = generateDynamicLevel(levelNum);
    } else {
        // Create additional levels beyond the predefined ones
        levels.push(generateDynamicLevel(levelNum));
    }
    
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

    // In the loadLevel function, before starting the game loop
    prepareLevel(levelNum);
    
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

// Improved draw function with proper z-ordering
function draw() {
    // Clear with sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#64B5F6');
    skyGradient.addColorStop(1, '#90CAF9');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Save the context state before applying camera transform
    ctx.save();
    
    // Apply camera transform
    ctx.translate(-Math.floor(camera.x), -Math.floor(camera.y));
    
    // Draw background elements first
    drawBackground();
    
    const currentLevel = levels[game.level - 1];
    
    // GROUP 1: BACK LAYER - Draw the ground and platforms
    // --------------------------------------------------------
    
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
    
    // Draw outlet
    ctx.fillStyle = '#FFFFFF'; // White for the outlet
    const outlet = currentLevel.outlet;
    
    // Draw outlet with socket detail
    ctx.fillRect(outlet.x, outlet.y, outlet.width, outlet.height);
    
    // Draw socket holes
    ctx.fillStyle = '#000000';
    ctx.fillRect(outlet.x + outlet.width/4, outlet.y + outlet.height/3, outlet.width/5, outlet.height/3);
    ctx.fillRect(outlet.x + outlet.width*2/4, outlet.y + outlet.height/3, outlet.width/5, outlet.height/3);
    
    // GROUP 2: MIDDLE LAYER - Draw obstacles and collectibles
    // --------------------------------------------------------
    
    // Draw obstacles
    currentLevel.obstacles.forEach(obstacle => {
        drawObstacle(obstacle);
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
    
    // GROUP 3: FRONT LAYER - Draw player and effects
    // --------------------------------------------------------
    
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

// Add a z-order sorting function for objects before drawing
function sortGameObjectsByZOrder(level) {
    // Create a copy of all objects with z-order information
    let allObjects = [];
    
    // Add platforms (back layer)
    level.platforms.forEach(platform => {
        allObjects.push({
            type: 'platform',
            obj: platform,
            zOrder: 0 // Lowest z-order
        });
    });
    
    // Add outlet (back layer)
    allObjects.push({
        type: 'outlet',
        obj: level.outlet,
        zOrder: 1
    });
    
    // Add obstacles (middle layer)
    level.obstacles.forEach(obstacle => {
        allObjects.push({
            type: 'obstacle',
            obj: obstacle,
            zOrder: 2
        });
    });
    
    // Add coins (middle layer)
    level.coins.forEach(coin => {
        if (!coin.collected) {
            allObjects.push({
                type: 'coin',
                obj: coin,
                zOrder: 3
            });
        }
    });
    
    // Add power-ups (middle layer)
    if (level.powerUps) {
        level.powerUps.forEach(powerUp => {
            if (!powerUp.collected) {
                allObjects.push({
                    type: 'powerUp',
                    obj: powerUp,
                    zOrder: 4
                });
            }
        });
    }
    
    // Add player (front layer)
    allObjects.push({
        type: 'player',
        obj: player,
        zOrder: 5 // Highest z-order
    });
    
    // Sort by z-order
    return allObjects.sort((a, b) => a.zOrder - b.zOrder);
}

// Add a function to handle platform overlap and ensure they don't stack directly on top of each other
function fixPlatformOverlap() {
    levels.forEach(level => {
        // Create a new array for platforms after fixing overlap
        const fixedPlatforms = [];
        
        // Start with the ground platform
        const groundPlatform = level.platforms.find(p => p.y >= 450);
        if (groundPlatform) {
            fixedPlatforms.push(groundPlatform);
        }
        
        // Sort other platforms by y position (top to bottom)
        const otherPlatforms = level.platforms
            .filter(p => p.y < 450)
            .sort((a, b) => a.y - b.y);
        
        // Check each platform against all previously added platforms
        otherPlatforms.forEach(platform => {
            let overlapping = false;
            let shiftX = 0;
            let shiftY = 0;
            
            // Check for overlap with already fixed platforms
            for (let i = 0; i < fixedPlatforms.length; i++) {
                const existingPlatform = fixedPlatforms[i];
                
                // Skip ground platform in overlap check
                if (existingPlatform.y >= 450) continue;
                
                // Check if platforms overlap
                const overlapX = Math.max(0, 
                    Math.min(platform.x + platform.width, existingPlatform.x + existingPlatform.width) - 
                    Math.max(platform.x, existingPlatform.x)
                );
                
                const overlapY = Math.max(0,
                    Math.min(platform.y + platform.height, existingPlatform.y + existingPlatform.height) - 
                    Math.max(platform.y, existingPlatform.y)
                );
                
                // If platforms overlap significantly
                if (overlapX > 10 && overlapY > 0) {
                    overlapping = true;
                    
                    // Calculate shift amounts
                    if (overlapY < 20) {
                        // Small vertical overlap - adjust vertically
                        if (platform.y < existingPlatform.y) {
                            shiftY = Math.min(shiftY, existingPlatform.y - platform.y - platform.height - 5);
                        } else {
                            shiftY = Math.max(shiftY, existingPlatform.y + existingPlatform.height - platform.y + 5);
                        }
                    } else {
                        // Significant overlap - adjust horizontally
                        if (platform.x < existingPlatform.x) {
                            shiftX = Math.min(shiftX, existingPlatform.x - platform.x - platform.width - 5);
                        } else {
                            shiftX = Math.max(shiftX, existingPlatform.x + existingPlatform.width - platform.x + 5);
                        }
                    }
                }
            }
            
            // Apply shifts if overlapping
            if (overlapping) {
                if (Math.abs(shiftY) > 0) {
                    platform.y += shiftY;
                } else if (Math.abs(shiftX) > 0) {
                    platform.x += shiftX;
                }
                
                // Ensure platform is still within screen bounds
                platform.x = Math.max(0, Math.min(800 - platform.width, platform.x));
                platform.y = Math.max(50, Math.min(450 - platform.height, platform.y));
            }
            
            fixedPlatforms.push(platform);
        });
        
        // Replace original platforms with fixed platforms
        level.platforms = fixedPlatforms;
    });
}

// Call this after applying difficulty settings
function applyRenderingFixes() {
    // Fix overlapping platforms
    fixPlatformOverlap();
    
    // Ensure obstacles don't overlap with platforms
    levels.forEach(level => {
        level.obstacles.forEach(obstacle => {
            level.platforms.forEach(platform => {
                // Skip ground platform
                if (platform.y >= 450) return;
                
                // Check if obstacle is inside platform
                if (obstacle.x >= platform.x && 
                    obstacle.x + obstacle.width <= platform.x + platform.width &&
                    obstacle.y >= platform.y && 
                    obstacle.y + obstacle.height <= platform.y + platform.height) {
                    // Move obstacle to top of platform
                    obstacle.y = platform.y - obstacle.height - 2;
                }
            });
        });
    });
}

// Call this function after loading a level
function prepareLevel(levelNum) {
    // Apply z-order sorting and overlap fixes to the current level
    const currentLevel = levels[levelNum-1];
    
    // Fix any objects that might be stacked incorrectly
    sortGameObjectsByZOrder(currentLevel);
    
    // Ensure coins aren't inside platforms
    currentLevel.coins.forEach(coin => {
        let insidePlatform = false;
        
        currentLevel.platforms.forEach(platform => {
            // Skip ground platform
            if (platform.y >= 450) return;
            
            // Check if coin is inside platform
            if (coin.x > platform.x && 
                coin.x + coin.width < platform.x + platform.width &&
                coin.y > platform.y && 
                coin.y + coin.height < platform.y + platform.height) {
                insidePlatform = true;
                
                // Move coin to top of platform
                coin.y = platform.y - coin.height - 2;
            }
        });
    });
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


// Improved level design function to properly space game elements
function designLevel(difficulty) {
    // Set up level dimensions
    const levelWidth = 800;
    const groundY = 450;
    
    // Player jump metrics (these determine platform placement)
    const playerJumpHeight = difficulty === 'easy' ? 120 : (difficulty === 'medium' ? 110 : 100);
    const playerJumpDistance = difficulty === 'easy' ? 180 : (difficulty === 'medium' ? 160 : 140);
    
    // Platform dimensions
    const platformWidth = difficulty === 'easy' ? 100 : (difficulty === 'medium' ? 80 : 60);
    const platformHeight = 20;
    
    // Create level structure
    const level = {
        platforms: [
            { x: 0, y: groundY, width: levelWidth, height: 50 } // Ground platform
        ],
        obstacles: [],
        coins: [],
        powerUps: [],
        outlet: { x: 720, y: 160, width: 40, height: 40 }
    };
    
    // Create a path of platforms the player can follow
    let currentX = 100;
    let currentY = groundY - 80; // Start first platform at a reasonable height
    
    // Number of platforms based on difficulty
    const platformCount = difficulty === 'easy' ? 7 : (difficulty === 'medium' ? 5 : 4);
    
    for (let i = 0; i < platformCount; i++) {
        // Add some variety to platform height
        const heightVariation = Math.random() * 30 - 15;
        currentY = Math.max(150, Math.min(groundY - 80, currentY + heightVariation));
        
        // Add the platform
        level.platforms.push({
            x: currentX,
            y: currentY,
            width: platformWidth + Math.random() * 20,
            height: platformHeight
        });
        
        // Add a coin on some platforms
        if (Math.random() > 0.3) {
            level.coins.push({
                x: currentX + platformWidth/3,
                y: currentY - 30,
                width: 20,
                height: 20,
                collected: false
            });
        }
        
        // Move to next platform position
        const distanceMultiplier = 0.7 + Math.random() * 0.6; // 70% to 130% of standard jump
        currentX += playerJumpDistance * distanceMultiplier;
        
        // Occasionally raise or lower the path
        if (i > 0 && i < platformCount - 1 && Math.random() > 0.5) {
            currentY -= Math.random() * 60;
            currentY = Math.max(120, currentY); // Don't go too high
        }
    }
    
    // Place obstacles intelligently
    const obstacleCount = difficulty === 'easy' ? 3 : (difficulty === 'medium' ? 5 : 7);
    
    // Place obstacles on the ground between platforms
    for (let i = 0; i < obstacleCount; i++) {
        // Find a spot not too close to platforms
        let validSpot = false;
        let obstacleX, obstacleY;
        
        const maxAttempts = 10;
        let attempts = 0;
        
        while (!validSpot && attempts < maxAttempts) {
            obstacleX = 100 + Math.random() * (levelWidth - 200);
            obstacleY = groundY - 20; // Place on the ground
            
            // Check distance from all platforms
            validSpot = true;
            for (let platform of level.platforms) {
                // Skip the ground
                if (platform.y >= groundY) continue;
                
                // If the obstacle is directly under a platform, it's not valid
                if (obstacleX > platform.x - 30 && obstacleX < platform.x + platform.width + 10) {
                    validSpot = false;
                    break;
                }
            }
            
            attempts++;
        }
        
        if (validSpot) {
            level.obstacles.push({
                x: obstacleX,
                y: obstacleY,
                width: 20,
                height: 20
            });
        }
    }
    
    // Add moving obstacles on platforms if difficulty is medium or hard
    if (difficulty !== 'easy') {
        const platformObstacleCount = difficulty === 'medium' ? 2 : 3;
        
        // Select random platforms (excluding first and last) to place obstacles on
        const availablePlatforms = level.platforms.filter(p => 
            p.y < groundY && p.x > 150 && p.x < 650);
        
        for (let i = 0; i < Math.min(platformObstacleCount, availablePlatforms.length); i++) {
            const platform = availablePlatforms[Math.floor(Math.random() * availablePlatforms.length)];
            
            // Remove this platform from available platforms for next iterations
            availablePlatforms.splice(availablePlatforms.indexOf(platform), 1);
            
            // Add an obstacle on this platform
            const obstacle = {
                x: platform.x + platform.width/2 - 10,
                y: platform.y - 20,
                width: 20,
                height: 20,
                speedX: difficulty === 'medium' ? 0.4 : 0.7,
                startX: platform.x + platform.width/2 - 10,
                range: platform.width * 0.7
            };
            
            level.obstacles.push(obstacle);
        }
    }
    
    // Place power-ups
    const powerUpCount = difficulty === 'easy' ? 2 : (difficulty === 'medium' ? 1 : 1);
    const powerUpTypes = ['SPEED_BOOST', 'EXTRA_LIFE', 'INVINCIBILITY'];
    
    // Place power-ups on platforms
    const availablePowerUpPlatforms = level.platforms.filter(p => 
        p.y < groundY && p.x > 200);
    
    for (let i = 0; i < Math.min(powerUpCount, availablePowerUpPlatforms.length); i++) {
        const platform = availablePowerUpPlatforms[Math.floor(Math.random() * availablePowerUpPlatforms.length)];
        
        // Remove this platform from available platforms for next iterations
        availablePowerUpPlatforms.splice(availablePowerUpPlatforms.indexOf(platform), 1);
        
        // Choose a random power-up type
        const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        
        level.powerUps.push({
            x: platform.x + platform.width/2 - 15,
            y: platform.y - 35,
            width: 30,
            height: 30,
            type: randomType,
            collected: false,
            pulseRate: 0.005 + (Math.random() * 0.01),
            pulseTime: 0
        });
    }
    
    // Update outlet position based on the final platform for a better finish
    if (level.platforms.length > 2) {
        const finalPlatform = level.platforms[level.platforms.length - 1];
        level.outlet.x = finalPlatform.x + finalPlatform.width/2 - 20;
        level.outlet.y = finalPlatform.y - 50;
    }
    
    return level;
}

// Function to update the level data with the improved design
function updateLevelData() {
    levels[0] = designLevel('easy');
    levels[1] = designLevel('medium');
    levels[2] = designLevel('hard');
    
    // Update levelWidth based on the rightmost platform or object
    let rightmostX = 0;
    
    for (let level of levels) {
        // Check platforms
        level.platforms.forEach(platform => {
            const platformRight = platform.x + platform.width;
            if (platformRight > rightmostX) rightmostX = platformRight;
        });
        
        // Check outlet
        const outletRight = level.outlet.x + level.outlet.width;
        if (outletRight > rightmostX) rightmostX = outletRight;
    }
    
    // Set level width with some extra space
    levelWidth = Math.max(rightmostX + 200, canvas.width);
}

function generateDynamicLevel(levelNum) {
    console.log("Generating dynamic level:", levelNum, "with difficulty:", game.difficulty);
    const difficulty = game.difficulty;
    
    // Base parameters
    const groundY = 450;
    
    // Adjust parameters based on level number for progressive difficulty
    const platformCount = Math.min(3 + levelNum, 12); // More platforms in higher levels, cap at 12
    
    // Obstacles increase with level
    const groundObstacleCount = Math.min(levelNum + 1, 8); // More obstacles in higher levels, cap at 8
    const movingObstacleCount = difficulty === 'easy' ? 0 : Math.min(Math.floor(levelNum/2), 5);
    
    // Create empty level structure
    const level = {
        platforms: [
            { x: 0, y: groundY, width: 800, height: 50 } // Ground
        ],
        obstacles: [],
        coins: [],
        powerUps: [],
        outlet: { x: 0, y: 0, width: 40, height: 40 }
    };
    
    // Create platform path - we'll use a more careful approach
    let lastX = 80;
    let lastY = groundY - 80;
    
    // Calculate jump distances based on difficulty and player capabilities
    const baseJumpDistance = 
        difficulty === 'easy' ? 140 : 
        (difficulty === 'medium' ? 160 : 180);
    
    const maxJumpHeight =
        difficulty === 'easy' ? 100 :
        (difficulty === 'medium' ? 110 : 120);
    
    for (let i = 0; i < platformCount; i++) {
        // Platform width varies slightly
        const platformWidth = 60 + Math.random() * 40;
        
        // Add platform
        const platform = {
            x: lastX,
            y: lastY,
            width: platformWidth,
            height: 20
        };
        
        level.platforms.push(platform);
        
        // Add coin on most platforms (80% chance)
        if (Math.random() < 0.8) {
            level.coins.push({
                x: lastX + platformWidth/2 - 10,
                y: lastY - 30,
                width: 20,
                height: 20,
                collected: false
            });
        }
        
        // Calculate next position - careful spacing that player can jump to
        // Add some randomness but ensure it's reachable
        const jumpVariation = Math.random() * 30 - 10; // -10 to +20 variation
        const jumpDistance = baseJumpDistance + jumpVariation;
        
        lastX += jumpDistance;
        
        // Height changes - gradually get higher with some variation
        if (i < platformCount - 1) {
            // Mix of up and down, but trending upward for overall challenge
            const heightVariation = Math.random() * 60 - 20; // -20 to +40 variation
            
            // For higher levels, make greater height differences
            const levelBonus = levelNum * 5; // Higher levels have higher platforms
            lastY = Math.max(100, Math.min(groundY - 60, lastY - heightVariation - levelBonus));
            
            // Make sure jumps are possible (not too high)
            const maxJumpableHeight = maxJumpHeight * 0.8; // 80% of max jump for safety
            if (lastY < platform.y - maxJumpableHeight) {
                lastY = platform.y - maxJumpableHeight + 10; // Keep it jumpable
            }
        }
    }
    
    // Add ground obstacles - properly spaced
    for (let i = 0; i < groundObstacleCount; i++) {
        // Space obstacles evenly with some randomness
        const obstacleX = 150 + (i * 600/groundObstacleCount) + (Math.random() * 50 - 25);
        
        // Make sure obstacles don't block jumping to platforms
        let validPosition = true;
        for (let j = 1; j < level.platforms.length; j++) {
            const platform = level.platforms[j];
            // Don't place obstacles directly below platforms or in jump paths
            if (Math.abs(obstacleX - platform.x) < 40) {
                validPosition = false;
                break;
            }
        }
        
        if (validPosition) {
            level.obstacles.push({
                x: obstacleX,
                y: groundY - 20,
                width: 20,
                height: 20
            });
        }
    }
    
    // Add moving obstacles on platforms for medium and hard difficulties
    if (movingObstacleCount > 0) {
        // Get platforms we can put obstacles on (not the first or last platform)
        const availablePlatforms = level.platforms.filter((p, idx) => 
            idx > 1 && idx < level.platforms.length - 1 && p.y < groundY);
        
        // Shuffle platforms to randomize placement
        shuffleArray(availablePlatforms);
        
        for (let i = 0; i < Math.min(movingObstacleCount, availablePlatforms.length); i++) {
            const platform = availablePlatforms[i];
            
            level.obstacles.push({
                x: platform.x + platform.width/2 - 10,
                y: platform.y - 20,
                width: 20,
                height: 20,
                speedX: difficulty === 'medium' ? 0.5 : 0.8,
                startX: platform.x + platform.width/2 - 10,
                range: platform.width * 0.6
            });
        }
    }
    
    // Add power-ups based on difficulty
    const powerUpCount = difficulty === 'easy' ? 2 : (difficulty === 'medium' ? 1 : Math.random() > 0.5 ? 1 : 0);
    const powerUpTypes = ['SPEED_BOOST', 'EXTRA_LIFE', 'INVINCIBILITY'];
    
    if (powerUpCount > 0 && level.platforms.length > 3) {
        // Get platforms to place power-ups on (not first or last)
        const powerUpPlatforms = level.platforms.filter((p, idx) => 
            idx > 0 && idx < level.platforms.length - 1 && p.y < groundY);
        
        shuffleArray(powerUpPlatforms);
        
        for (let i = 0; i < Math.min(powerUpCount, powerUpPlatforms.length); i++) {
            const platform = powerUpPlatforms[i];
            const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            
            level.powerUps.push({
                x: platform.x + platform.width/2 - 15,
                y: platform.y - 35,
                width: 30,
                height: 30,
                type: type,
                collected: false,
                pulseRate: 0.008 + (Math.random() * 0.004),
                pulseTime: 0
            });
        }
    }
    
    // Place outlet on the last platform
    if (level.platforms.length > 1) {
        const lastPlatform = level.platforms[level.platforms.length - 1];
        level.outlet = {
            x: lastPlatform.x + lastPlatform.width/2 - 20,
            y: lastPlatform.y - 50,
            width: 40,
            height: 40
        };
    } else {
        // Fallback if something went wrong
        level.outlet = { x: 700, y: 400, width: 40, height: 40 };
    }
    
    return level;
}

// Helper function to shuffle an array (for randomizing platform selection)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
