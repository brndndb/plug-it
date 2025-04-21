// Game variables
let canvas, ctx;
let game = {
    isRunning: false,
    difficulty: 'medium',
    level: 1,
    score: 0,
    lives: 3,
    gravity: 0.5,
    highScores: [],
    activePowerUp: null, // Added for power-up display
    powerUpEndTime: 0   // Added for power-up duration tracking
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
    color: '#0074D9',
    baseSpeed: 5,
    speedBoost: 0,
    invincible: false,
    invincibleTime: 0
};

let levelWidth = 800;

// Camera
let camera = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    smoothFactor: 0.1
};

// Physics
function initializePhysics() {
    player.friction = 0.8;
    player.airFriction = 0.95;
    player.acceleration = 0.5;
    player.deceleration = 0.8;
}

// Sounds
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

// Power-up types
const powerUpTypes = {
    SPEED_BOOST: {
        color: '#39CCCC',
        effect: function() {
            player.speedBoost = 2;
            game.activePowerUp = 'SPEED_BOOST';
            game.powerUpEndTime = Date.now() + 5000;
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
            game.activePowerUp = 'INVINCIBILITY';
            game.powerUpEndTime = Date.now() + 5000;
            createFloatingMessage('Invincibility!', player.x, player.y - 30, '#7FDBFF');
        }
    }
};

// Effects
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

// Tutorial state
let tutorialActive = false;
let tutorialStep = 0;

// Level timer variables
let levelStartTime = 0;
let levelCurrentTime = 0;
let isPaused = false;

// Achievements
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

// Game controls
const keys = {
    ArrowRight: false,
    ArrowLeft: false,
    ArrowUp: false,
    Space: false
};

// Levels
const levels = [
    // Level 1 (Easy)
    {
        platforms: [
            { x: 0, y: 450, width: 800, height: 50 },
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
            { x: 0, y: 450, width: 800, height: 50 },
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
            { x: 0, y: 450, width: 800, height: 50 },
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
    canvas.width = 800;  // Explicitly set canvas dimensions
    canvas.height = 500;

    background.mountains = [
        { x: 0, height: 120, width: canvas.width * 1.5 }
    ];

    loadHighScores();
    loadAchievements();

    updateStartScreen();
    updateStartScreenWithSaveLoad();
    updateStartScreenWithAchievements();

    preloadSounds();

    if (!localStorage.getItem('tutorialShown')) {
        setTimeout(showTutorial, 500);
    }

    showStartScreen();

    initializeAchievements();

    player.speedBoost = 0;
    player.invincible = false;
    player.invincibleTime = 0;

    initializePhysics();

    player.jumpBufferTimer = 0;

    setupMobileControls();

    addSoundToggle();

    window.addEventListener('resize', adjustCanvasSize);
    adjustCanvasSize();

    initializeDynamicLevels();

    setupAllGameButtons();
};

function initializeDynamicLevels() {
    const originalLoadLevel = loadLevel;

    loadLevel = function(levelNum) {
        console.log("Loading dynamically generated level:", levelNum);

        player.x = 50;
        player.y = 400;
        player.speedX = 0;
        player.speedY = 0;
        player.isJumping = false;

        let level;
        if (levelNum <= levels.length) {
            levels[levelNum - 1] = generateDynamicLevel(levelNum);
            level = levels[levelNum - 1];
        } else {
            level = generateDynamicLevel(levelNum);
            levels.push(level);
        }

        let rightmostX = 0;
        level.platforms.forEach(platform => {
            const platformRight = platform.x + platform.width;
            if (platformRight > rightmostX) rightmostX = platformRight;
        });

        const outletRight = level.outlet.x + level.outlet.width;
        if (outletRight > rightmostX) rightmostX = outletRight;

        levelWidth = Math.max(rightmostX + 200, canvas.width);

        level.coins.forEach(coin => {
            coin.collected = false;
        });

        if (level.powerUps && level.powerUps.length > 0) {
            level.powerUps.forEach(powerUp => {
                powerUp.collected = false;
            });
        }

        startLevelTimer();

        prepareLevel(levelNum);

        game.levelStartLives = game.lives;

        setGameRunning(true);
    };
}

function adjustCanvasSize() {
    if (window.innerWidth < 850) {
        const containerWidth = document.getElementById('gameContainer').offsetWidth;
        const ratio = canvas.height / canvas.width;
        canvas.style.width = containerWidth + 'px';
        canvas.style.height = (containerWidth * ratio) + 'px';
    } else {
        canvas.style.width = '';
        canvas.style.height = '';
    }
}

function setupMobileControls() {
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

        const rightBtn = document.createElement('button');
        rightBtn.innerHTML = '→';
        rightBtn.style.cssText = leftBtn.style.cssText;

        const jumpBtn = document.createElement('button');
        jumpBtn.innerHTML = '↑';
        jumpBtn.style.cssText = leftBtn.style.cssText;

        const pauseBtn = document.createElement('button');
        pauseBtn.innerHTML = '❚❚';
        pauseBtn.style.cssText = leftBtn.style.cssText;

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

        const moveControls = document.createElement('div');
        moveControls.style.display = 'flex';
        moveControls.style.gap = '10px';
        moveControls.appendChild(leftBtn);
        moveControls.appendChild(rightBtn);

        const actionControls = document.createElement('div');
        actionControls.style.display = 'flex';
        actionControls.style.gap = '10px';
        actionControls.appendChild(jumpBtn);
        actionControls.appendChild(pauseBtn);

        controlsContainer.appendChild(moveControls);
        controlsContainer.appendChild(actionControls);

        document.getElementById('gameContainer').appendChild(controlsContainer);

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
    if (!localStorage.getItem('powerPlugAchievements')) {
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

function saveScore() {
    const playerName = document.getElementById('playerName').value.trim();
    if (playerName === '') {
        alert('Please enter your name');
        return;
    }

    game.highScores.push({
        name: playerName,
        score: game.score,
        difficulty: game.difficulty,
        level: game.level
    });

    game.highScores.sort((a, b) => b.score - a.score);

    if (game.highScores.length > 10) {
        game.highScores = game.highScores.slice(0, 10);
    }

    localStorage.setItem('powerPlugScores', JSON.stringify(game.highScores));

    document.getElementById('gameOver').style.display = 'none';
    showHighScores();
}

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

function applyDifficultySettings() {
    const difficultySettings = {
        easy: {
            lives: 5,
            gravity: 0.4,
            jumpPower: -10,
            playerSpeed: 2.5,
            playerColor: '#2ECC40',
            coinValue: 150
        },
        medium: {
            lives: 3,
            gravity: 0.5,
            jumpPower: -11,
            playerSpeed: 3,
            playerColor: '#0074D9',
            coinValue: 100
        },
        hard: {
            lives: 1,
            gravity: 0.6,
            jumpPower: -12,
            playerSpeed: 3.5,
            playerColor: '#FF4136',
            coinValue: 200
        }
    };

    const settings = difficultySettings[game.difficulty];

    game.lives = settings.lives;
    game.gravity = settings.gravity;
    player.jumpPower = settings.jumpPower;
    player.baseSpeed = settings.playerSpeed;
    player.color = settings.playerColor;
    game.coinValue = settings.coinValue;

    document.getElementById('lives').textContent = game.lives;
    document.getElementById('score').textContent = game.score;
    document.getElementById('level').textContent = game.level;
}

function showTutorial() {
    tutorialActive = true;
    tutorialStep = 0;

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
            tutorialText.innerHTML = `
                <div style="margin-bottom: 15px;">Collect coins for points!</div>
                <div style="display: inline-block; background-color: #FFD700; width: 50px; height: 50px; border-radius: 50%; text-align: center; line-height: 50px; font-weight: bold; color: #000; font-size: 24px; box-shadow: 0 0 10px #FFD700;">$</div>
            `;
            break;
        case 2:
            tutorialText.innerHTML = `
                <div style="margin-bottom: 15px;">Avoid obstacles or you'll lose a life!</div>
                <div style="display: inline-block; background-color: #FF4136; width: 50px; height: 50px; border-radius: 5px; text-align: center; line-height: 50px; font-weight: bold; color: #FFF; font-size: 30px; box-shadow: 0 0 10px #FF4136;">!</div>
            `;
            break;
        case 3:
            tutorialText.innerHTML = `
                <div style="margin-bottom: 15px;">Find power-ups for special abilities!</div>
                <div style="display: inline-block; background-color: #39CCCC; width: 50px; height: 50px; clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); text-align: center; line-height: 50px; font-weight: bold; color: #FFF; font-size: 24px; box-shadow: 0 0 10px #39CCCC;">★</div>
            `;
            break;
        case 4:
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
            document.getElementById('tutorialOverlay').remove();
            tutorialActive = false;

            if (!localStorage.getItem('tutorialShown')) {
                localStorage.setItem('tutorialShown', 'true');
            }
            break;
    }
}

function updateStartScreen() {
    const startScreen = document.getElementById('startScreen');

    const tutorialBtn = document.createElement('button');
    tutorialBtn.id = 'tutorialBtn';
    tutorialBtn.className = 'button';
    tutorialBtn.textContent = 'How to Play';
    tutorialBtn.style.marginTop = '20px';

    tutorialBtn.addEventListener('click', showTutorial);

    const scoresBtn = document.createElement('button');
    scoresBtn.id = 'scoresBtn';
    scoresBtn.className = 'button';
    scoresBtn.textContent = 'High Scores';
    scoresBtn.style.marginTop = '10px';

    scoresBtn.addEventListener('click', function() {
        document.getElementById('startScreen').style.display = 'none';
        showHighScores();
    });

    startScreen.appendChild(tutorialBtn);
    startScreen.appendChild(scoresBtn);
}

function updateStartScreenWithSaveLoad() {
    const startScreen = document.getElementById('startScreen');

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

        startScreen.insertBefore(continueBtn, startScreen.firstChild);
    }
}

function updateStartScreenWithAchievements() {
    const startScreen = document.getElementById('startScreen');

    const achievementsBtn = document.createElement('button');
    achievementsBtn.id = 'achievementsBtn';
    achievementsBtn.className = 'button';
    achievementsBtn.textContent = 'Achievements';
    achievementsBtn.style.marginTop = '10px';

    achievementsBtn.addEventListener('click', function() {
        document.getElementById('startScreen').style.display = 'none';
        showAchievementsScreen();
    });

    startScreen.appendChild(achievementsBtn);
}

function showStartScreen() {
    document.getElementById('startScreen').style.display = 'flex';
    game.isRunning = false;

    resetGameControls();

    const event = new CustomEvent('gameStateChange', {
        detail: { isRunning: false }
    });
    document.dispatchEvent(event);
}

function startGame(difficulty) {
    console.log('Starting game with difficulty:', difficulty);
    game.difficulty = difficulty;
    game.level = 1;
    game.score = 0;
    game.lives = 3;

    applyDifficultySettings();
    document.getElementById('startScreen').style.display = 'none';

    player.x = 50;
    player.y = 400;
    player.speedX = 0;
    player.speedY = 0;
    player.isJumping = false;
    player.speedBoost = 0;
    player.invincible = false;

    document.getElementById('score').textContent = game.score;
    document.getElementById('level').textContent = game.level;
    document.getElementById('lives').textContent = game.lives;

    loadLevel(game.level);
}

function loadLevel(levelNum) {
    player.x = 50;
    player.y = 400;
    player.speedX = 0;
    player.speedY = 0;
    player.isJumping = false;

    if (levelNum <= levels.length) {
        levels[levelNum - 1] = generateDynamicLevel(levelNum);
    } else {
        levels.push(generateDynamicLevel(levelNum));
    }

    let rightmostX = 0;
    const level = levels[levelNum-1];

    level.platforms.forEach(platform => {
        const platformRight = platform.x + platform.width;
        if (platformRight > rightmostX) rightmostX = platformRight;
    });

    const outletRight = level.outlet.x + level.outlet.width;
    if (outletRight > rightmostX) rightmostX = outletRight;

    levelWidth = Math.max(rightmostX + 200, canvas.width);

    level.coins.forEach(coin => {
        coin.collected = false;
    });

    if (level.powerUps && level.powerUps.length > 0) {
        level.powerUps.forEach(powerUp => {
            powerUp.collected = false;
        });
    }

    startLevelTimer();

    prepareLevel(levelNum);

    game.levelStartLives = game.lives;

    setGameRunning(true);
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

let lastTime = 0;
function gameLoop(timestamp) {
    if (!game.isRunning) return;
    if (isPaused) {
        requestAnimationFrame(gameLoop);
        return;
    }

    const delta = timestamp - lastTime;
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    update(delta);
    draw();
    updateLevelTimer();
    updateJumpBuffer();

    if (player.invincible && Date.now() > player.invincibleTime) {
        player.invincible = false;
    }

    requestAnimationFrame(gameLoop);
}

function setGameRunning(isRunning) {
    game.isRunning = isRunning;

    const event = new CustomEvent('gameStateChange', {
        detail: { isRunning: isRunning }
    });
    document.dispatchEvent(event);

    if (isRunning) {
        lastTime = performance.now();
        gameLoop();
    }
}

function collides(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function update(delta) {
    player.speedY += game.gravity;

    let targetSpeedX = 0;
    if (keys.ArrowRight) {
        targetSpeedX = player.baseSpeed + (player.speedBoost || 0);
        player.speedX += player.acceleration;
        if (player.speedX > targetSpeedX) player.speedX = targetSpeedX;
    } else if (keys.ArrowLeft) {
        targetSpeedX = -player.baseSpeed - (player.speedBoost || 0);
        player.speedX -= player.acceleration;
        if (player.speedX < targetSpeedX) player.speedX = targetSpeedX;
    } else {
        player.speedX *= player.isJumping ? player.airFriction : player.deceleration;
        if (Math.abs(player.speedX) < 0.1) {
            player.speedX = 0;
        }
    }

    if (keys.Space && !player.isJumping && !player.jumpBufferTimer) {
        player.speedY = player.jumpPower;
        player.isJumping = true;
        sounds.jump.currentTime = 0;
        sounds.jump.play();
        createJumpParticles(player.x + player.width/2, player.y + player.height);
    }

    const originalX = player.x;
    const originalY = player.y;

    player.x += player.speedX;

    if (player.x < 0) player.x = 0;
    if (player.x + player.width > levelWidth) player.x = levelWidth - player.width;

    const currentLevel = levels[game.level - 1];

    currentLevel.platforms.forEach(platform => {
        if (collides(player, platform)) {
            if (player.speedX > 0 && originalX + player.width <= platform.x + 1) {
                player.x = platform.x - player.width;
            } else if (player.speedX < 0 && originalX >= platform.x + platform.width - 1) {
                player.x = platform.x + platform.width;
            }
        }
    });

    player.y += player.speedY;

    let onGround = false;
    currentLevel.platforms.forEach(platform => {
        if (collides(player, platform)) {
            if (player.speedY > 0 && originalY + player.height <= platform.y + (player.speedY + 1)) {
                player.y = platform.y - player.height;
                player.speedY = 0;
                player.isJumping = false;
                onGround = true;
            } else if (player.speedY < 0 && originalY >= platform.y + platform.height + (player.speedY - 1)) {
                player.y = platform.y + platform.height;
                player.speedY = 0;
            }
        }
    });

    if (!onGround && Math.abs(player.speedY) > 10) {
        const steps = Math.ceil(Math.abs(player.speedY) / 5);
        const stepY = player.speedY / steps;

        for (let i = 1; i < steps; i++) {
            const testY = originalY + stepY * i;
            const testPlayer = {
                x: player.x,
                y: testY,
                width: player.width,
                height: player.height
            };

            for (const platform of currentLevel.platforms) {
                if (collides(testPlayer, platform)) {
                    if (player.speedY > 0) {
                        player.y = platform.y - player.height;
                        player.speedY = 0;
                        player.isJumping = false;
                        onGround = true;
                    } else {
                        player.y = platform.y + platform.height;
                        player.speedY = 0;
                    }
                    break;
                }
            }

            if (onGround) break;
        }
    }

    currentLevel.coins.forEach(coin => {
        if (!coin.collected && collides(player, coin)) {
            coin.collected = true;
            game.score += 100;
            document.getElementById('score').textContent = game.score;

            sounds.coin.currentTime = 0;
            sounds.coin.play();

            if (achievements.COIN_COLLECTOR && !achievements.COIN_COLLECTOR.unlocked) {
                achievements.COIN_COLLECTOR.progress++;
                if (achievements.COIN_COLLECTOR.progress >= achievements.COIN_COLLECTOR.target) {
                    achievements.COIN_COLLECTOR.unlocked = true;
                    showAchievementNotification(achievements.COIN_COLLECTOR);
                }
                saveAchievements();
            }

            createCoinParticles(coin.x + coin.width/2, coin.y + coin.height/2);
        }
    });

    if (!player.invincible) {
        for (let i = 0; i < currentLevel.obstacles.length; i++) {
            const obstacle = currentLevel.obstacles[i];

            if (obstacle.speedX) {
                obstacle.x += obstacle.speedX;
                if (obstacle.x <= obstacle.startX - obstacle.range || obstacle.x >= obstacle.startX + obstacle.range) {
                    obstacle.speedX *= -1;
                }
            }

            if (collides(player, obstacle)) {
                playerHit();
                break;
            }
        }
    }

    if (currentLevel.powerUps) {
        currentLevel.powerUps.forEach(powerUp => {
            if (!powerUp.collected && collides(player, powerUp)) {
                powerUp.collected = true;
                if (powerUpTypes[powerUp.type]) {
                    powerUpTypes[powerUp.type].effect();
                    if (achievements.POWER_UP_MASTER && !achievements.POWER_UP_MASTER.unlocked) {
                        achievements.POWER_UP_MASTER.progress[powerUp.type] = true;
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

    if (collides(player, currentLevel.outlet)) {
        completeLevel();
    }

    if (player.y > canvas.height) {
        playerHit();
        player.x = 50;
        player.y = 400;
    }

    // Update power-up status
    if (game.activePowerUp && Date.now() > game.powerUpEndTime) {
        if (game.activePowerUp === 'SPEED_BOOST') {
            player.speedBoost = 0;
        }
        game.activePowerUp = null;
        game.powerUpEndTime = 0;
    }

    updateParticles();
    updateFloatingMessages();
    updateCamera();
}

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

function updateJumpBuffer() {
    if (typeof player.jumpBufferTimer === 'undefined') {
        player.jumpBufferTimer = 0;
    }

    if (keys.Space && !player.isJumping) {
        player.jumpBufferTimer = 8;
    } else if (player.jumpBufferTimer > 0) {
        player.jumpBufferTimer--;
    }
}

function updateCamera() {
    const targetX = Math.max(0, player.x - canvas.width/2);
    camera.x = Math.min(targetX, Math.max(0, levelWidth - canvas.width));
    camera.y = 0;
}

function playerHit() {
    if (player.invincible) return;

    game.lives--;
    document.getElementById('lives').textContent = game.lives;

    sounds.death.currentTime = 0;
    sounds.death.play();

    createHitParticles(player.x + player.width/2, player.y + player.height/2);

    player.invincible = true;
    player.invincibleTime = Date.now() + 1500;

    if (game.lives <= 0) {
        gameOver();
    }
}

function completeLevel() {
    setGameRunning(false);

    if (sounds.levelComplete.readyState >= 2) {
        sounds.levelComplete.currentTime = 0;
        sounds.levelComplete.play().catch(error => {
            console.error('Error playing level complete sound:', error);
        });
    } else {
        console.log('Level complete sound not ready');
    }

    const timeBonus = Math.max(0, 30000 - levelCurrentTime);
    const timeBonusPoints = Math.floor(timeBonus / 100);
    game.score += timeBonusPoints;

    if (levelCurrentTime < 30000 && !achievements.SPEED_RUNNER.unlocked) {
        achievements.SPEED_RUNNER.unlocked = true;
        showAchievementNotification(achievements.SPEED_RUNNER);
        saveAchievements();
    }

    if (game.lives === game.levelStartLives && !achievements.SURVIVOR.unlocked) {
        achievements.SURVIVOR.unlocked = true;
        showAchievementNotification(achievements.SURVIVOR);
        saveAchievements();
    }

    document.getElementById('levelScore').textContent = `Score: ${game.score} (Time Bonus: ${timeBonusPoints})`;

    game.level++;

    if (game.level > levels.length) {
        document.getElementById('nextLevelBtn').textContent = "Restart Game";
        document.getElementById('nextLevelBtn').onclick = function() {
            document.getElementById('levelComplete').style.display = 'none';
            game.level = 1;
            showStartScreen();
        };
    } else {
        document.getElementById('nextLevelBtn').textContent = "Next Level";
        document.getElementById('nextLevelBtn').onclick = function() {
            document.getElementById('levelComplete').style.display = 'none';
            loadLevel(game.level);
        };
    }

    document.getElementById('levelComplete').style.display = 'flex';
}

function gameOver() {
    setGameRunning(false);

    document.getElementById('finalScore').textContent = `Final Score: ${game.score}`;

    resetGameControls();

    document.getElementById('gameOver').style.display = 'flex';
}

function createCoinParticles(x, y) {
    for (let i = 0; i < 10; i++) {
        effects.particles.push({
            x: x,
            y: y,
            speedX: (Math.random() - 0.5) * 5,
            speedY: (Math.random() - 0.5) * 5,
            size: Math.random() * 5 + 2,
            color: '#FFD700',
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
            color: '#FF4136',
            life: 30
        });
    }
}

function updateParticles() {
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
    for (let i = effects.messages.length - 1; i >= 0; i--) {
        const message = effects.messages[i];
        message.y += message.speedY;
        message.life--;
        if (message.life <= 0) {
            effects.messages.splice(i, 1);
        }
    }
}

function sortGameObjectsByZOrder(level) {
    let allObjects = [];

    level.platforms.forEach(platform => {
        allObjects.push({
            type: 'platform',
            obj: platform,
            zOrder: 0
        });
    });

    allObjects.push({
        type: 'outlet',
        obj: level.outlet,
        zOrder: 1
    });

    level.obstacles.forEach(obstacle => {
        allObjects.push({
            type: 'obstacle',
            obj: obstacle,
            zOrder: 2
        });
    });

    level.coins.forEach(coin => {
        if (!coin.collected) {
            allObjects.push({
                type: 'coin',
                obj: coin,
                zOrder: 3
            });
        }
    });

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

    allObjects.push({
        type: 'player',
        obj: player,
        zOrder: 5
    });

    return allObjects.sort((a, b) => a.zOrder - b.zOrder);
}

function fixPlatformOverlap() {
    levels.forEach(level => {
        const fixedPlatforms = [];
        const groundPlatform = level.platforms.find(p => p.y >= 450);
        if (groundPlatform) {
            fixedPlatforms.push(groundPlatform);
        }

        const otherPlatforms = level.platforms
            .filter(p => p.y < 450)
            .sort((a, b) => a.y - b.y);

        otherPlatforms.forEach(platform => {
            let overlapping = false;
            let shiftX = 0;
            let shiftY = 0;

            for (let i = 0; i < fixedPlatforms.length; i++) {
                const existingPlatform = fixedPlatforms[i];
                if (existingPlatform.y >= 450) continue;

                const overlapX = Math.max(0,
                    Math.min(platform.x + platform.width, existingPlatform.x + existingPlatform.width) -
                    Math.max(platform.x, existingPlatform.x)
                );

                const overlapY = Math.max(0,
                    Math.min(platform.y + platform.height, existingPlatform.y + existingPlatform.height) -
                    Math.max(platform.y, existingPlatform.y)
                );

                if (overlapX > 10 && overlapY > 0) {
                    overlapping = true;
                    if (overlapY < 20) {
                        if (platform.y < existingPlatform.y) {
                            shiftY = Math.min(shiftY, existingPlatform.y - platform.y - platform.height - 5);
                        } else {
                            shiftY = Math.max(shiftY, existingPlatform.y + existingPlatform.height - platform.y + 5);
                        }
                    } else {
                        if (platform.x < existingPlatform.x) {
                            shiftX = Math.min(shiftX, existingPlatform.x - platform.x - platform.width - 5);
                        } else {
                            shiftX = Math.max(shiftX, existingPlatform.x + existingPlatform.width - platform.x + 5);
                        }
                    }
                }
            }

            if (overlapping) {
                if (Math.abs(shiftY) > 0) {
                    platform.y += shiftY;
                } else if (Math.abs(shiftX) > 0) {
                    platform.x += shiftX;
                }

                platform.x = Math.max(0, Math.min(800 - platform.width, platform.x));
                platform.y = Math.max(50, Math.min(450 - platform.height, platform.y));
            }

            fixedPlatforms.push(platform);
        });

        level.platforms = fixedPlatforms;
    });
}

function applyRenderingFixes() {
    fixPlatformOverlap();

    levels.forEach(level => {
        level.obstacles.forEach(obstacle => {
            level.platforms.forEach(platform => {
                if (platform.y >= 450) return;
                if (obstacle.x >= platform.x &&
                    obstacle.x + obstacle.width <= platform.x + platform.width &&
                    obstacle.y >= platform.y &&
                    obstacle.y + obstacle.height <= platform.y + platform.height) {
                    obstacle.y = platform.y - obstacle.height - 2;
                }
            });
        });
    });
}

function prepareLevel(levelNum) {
    const currentLevel = levels[levelNum-1];
    sortGameObjectsByZOrder(currentLevel);

    currentLevel.coins.forEach(coin => {
        let insidePlatform = false;
        currentLevel.platforms.forEach(platform => {
            if (platform.y >= 450) return;
            if (coin.x > platform.x &&
                coin.x + coin.width < platform.x + platform.width &&
                coin.y > platform.y &&
                coin.y + coin.height < platform.y + platform.height) {
                insidePlatform = true;
                coin.y = platform.y - coin.height - 2;
            }
        });
    });
}

function drawObstacle(obstacle) {
    const gradient = ctx.createLinearGradient(obstacle.x, obstacle.y, obstacle.x, obstacle.y + obstacle.height);
    gradient.addColorStop(0, '#FF6B6B');
    gradient.addColorStop(1, '#C62828');

    ctx.fillStyle = gradient;
    roundRect(ctx, obstacle.x, obstacle.y, obstacle.width, obstacle.height, 2);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.moveTo(obstacle.x + obstacle.width/2, obstacle.y + 5);
    ctx.lineTo(obstacle.x + obstacle.width - 5, obstacle.y + obstacle.height - 5);
    ctx.lineTo(obstacle.x + 5, obstacle.y + obstacle.height - 5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2 + 2);
}

function drawPlayer() {
    const gradient = ctx.createLinearGradient(player.x, player.y, player.x + player.width, player.y + player.height);
    gradient.addColorStop(0, player.color);
    gradient.addColorStop(1, darkenColor(player.color, 30));

    ctx.fillStyle = gradient;
    roundRect(ctx, player.x, player.y, player.width, player.height, 5);

    const prongGradient = ctx.createLinearGradient(player.x, player.y - 15, player.x, player.y);
    prongGradient.addColorStop(0, '#E0E0E0');
    prongGradient.addColorStop(1, '#A0A0A0');
    ctx.fillStyle = prongGradient;

    roundRect(ctx, player.x + 5, player.y - 15, 5, 15, 2);
    roundRect(ctx, player.x + player.width - 10, player.y - 15, 5, 15, 2);

    ctx.fillStyle = '#FFFFFF';
    const eyeY = player.isJumping ? player.y + 15 : player.y + 20;

    ctx.fillRect(player.x + 7, eyeY, 6, 5);
    ctx.fillRect(player.x + player.width - 13, eyeY, 6, 5);

    ctx.fillStyle = '#000000';
    const pupilOffset = player.speedX > 0 ? 1 : (player.speedX < 0 ? -1 : 0);
    ctx.fillRect(player.x + 9 + pupilOffset, eyeY + 1, 2, 3);
    ctx.fillRect(player.x + player.width - 11 + pupilOffset, eyeY + 1, 2, 3);

    ctx.beginPath();
    if (player.isJumping) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.moveTo(player.x + 10, player.y + 30);
        ctx.lineTo(player.x + player.width - 10, player.y + 30);
    } else if (player.speedX !== 0) {
        ctx.fillStyle = '#000000';
        ctx.arc(player.x + player.width/2, player.y + 30, 5, 0, Math.PI);
        ctx.fill();
    } else {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.moveTo(player.x + 12, player.y + 32);
        ctx.lineTo(player.x + player.width - 12, player.y + 32);
    }
    ctx.stroke();
    ctx.lineWidth = 1;

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

    if (player.invincible) {
        ctx.strokeStyle = '#7FDBFF';
        ctx.lineWidth = 3;
        roundRect(ctx, player.x - 3, player.y - 3, player.width + 6, player.height + 6, 6, true, false);
        ctx.lineWidth = 1;
    }
}

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

function drawBackground() {
    const mountainParallax = 0.2;

    ctx.fillStyle = '#4B5320';
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

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(mountainX + mountain.width/3, canvas.height - mountain.height);
        ctx.lineTo(mountainX + mountain.width/3 + 20, canvas.height - mountain.height + 15);
        ctx.lineTo(mountainX + mountain.width/2, canvas.height - mountain.height*0.7);
        ctx.lineTo(mountainX + mountain.width*2/3 - 20, canvas.height - mountain.height*0.9 + 10);
        ctx.lineTo(mountainX + mountain.width*2/3, canvas.height - mountain.height*0.9);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#4B5320';
    });

    const cloudParallax = 0.4;
    ctx.fillStyle = '#FFFFFF';
    background.clouds.forEach(cloud => {
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.width < 0) {
            cloud.x = canvas.width;
        }

        const cloudX = cloud.x - camera.x * cloudParallax;

        ctx.beginPath();
        ctx.arc(cloudX, cloud.y, cloud.height/2, 0, Math.PI * 2);
        ctx.arc(cloudX + cloud.width*0.4, cloud.y - cloud.height*0.1, cloud.height*0.6, 0, Math.PI * 2);
        ctx.arc(cloudX + cloud.width*0.7, cloud.y, cloud.height*0.4, 0, Math.PI * 2);
        ctx.fill();
    });

    const treeParallax = 0.8;
    background.trees.forEach(tree => {
        const treeX = tree.x - camera.x * treeParallax;

        ctx.fillStyle = '#8B4513';
        ctx.fillRect(treeX, tree.y, tree.width, tree.height);

        const gradient = ctx.createRadialGradient(
            treeX + tree.width/2, tree.y - tree.height, 0,
            treeX + tree.width/2, tree.y - tree.height, tree.width*2
        );
        gradient.addColorStop(0, '#3E9B4F');
        gradient.addColorStop(1, '#1F7A31');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(treeX - tree.width, tree.y);
        ctx.lineTo(treeX + tree.width*2, tree.y);
        ctx.lineTo(treeX + tree.width/2, tree.y - tree.height*2);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(treeX - tree.width*0.8, tree.y - tree.height*1.5);
        ctx.lineTo(treeX + tree.width*1.8, tree.y - tree.height*1.5);
        ctx.lineTo(treeX + tree.width/2, tree.y - tree.height*3);
        ctx.closePath();
        ctx.fill();
    });
}

function darkenColor(hex, percent) {
    hex = hex.replace('#', '');
    const num = parseInt(hex, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;

    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, r - amt);
    const G = Math.max(0, g - amt);
    const B = Math.max(0, b - amt);

    return `#${Math.round(R).toString(16).padStart(2, '0')}${Math.round(G).toString(16).padStart(2, '0')}${Math.round(B).toString(16).padStart(2, '0')}`;
}

function draw() {
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, levelWidth, canvas.height);

    drawBackground();

    const currentLevel = levels[game.level - 1];
    const gameObjects = sortGameObjectsByZOrder(currentLevel);

    gameObjects.forEach(obj => {
        switch (obj.type) {
            case 'platform':
                const platform = obj.obj;
                const gradient = ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
                gradient.addColorStop(0, '#8D6E63');
                gradient.addColorStop(1, '#6D4C41');
                ctx.fillStyle = gradient;
                roundRect(ctx, platform.x, platform.y, platform.width, platform.height, 2);
                break;

            case 'outlet':
                const outlet = obj.obj;
                ctx.fillStyle = '#FFFFFF';
                roundRect(ctx, outlet.x, outlet.y, outlet.width, outlet.height, 5);
                ctx.fillStyle = '#000000';
                roundRect(ctx, outlet.x + 10, outlet.y + 15, 10, 20, 2);
                roundRect(ctx, outlet.x + outlet.width - 20, outlet.y + 15, 10, 20, 2);
                break;

            case 'obstacle':
                drawObstacle(obj.obj);
                break;

            case 'coin':
                const coin = obj.obj;
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(coin.x + coin.width / 2, coin.y + coin.height / 2, coin.width / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#DAA520';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('$', coin.x + coin.width / 2, coin.y + coin.height / 2 + 2);
                break;

            case 'powerUp':
                const powerUp = obj.obj;
                powerUp.pulseTime += powerUp.pulseRate;
                const scale = 1 + Math.sin(powerUp.pulseTime) * 0.1;
                const scaledWidth = powerUp.width * scale;
                const scaledHeight = powerUp.height * scale;
                const offsetX = (powerUp.width - scaledWidth) / 2;
                const offsetY = (powerUp.height - scaledHeight) / 2;
                ctx.fillStyle = powerUpTypes[powerUp.type].color;
                ctx.beginPath();
                const points = 5;
                const outerRadius = scaledWidth / 2;
                const innerRadius = outerRadius * 0.5;
                const cx = powerUp.x + offsetX + scaledWidth / 2;
                const cy = powerUp.y + offsetY + scaledHeight / 2;
                for (let i = 0; i < points * 2; i++) {
                    const angle = (i * Math.PI / points) - Math.PI / 2;
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const px = cx + radius * Math.cos(angle);
                    const py = cy + radius * Math.sin(angle);
                    if (i === 0) {
                        ctx.moveTo(px, py);
                    } else {
                        ctx.lineTo(px, py);
                    }
                }
                ctx.closePath();
                ctx.fill();
                break;

            case 'player':
                drawPlayer();
                break;
        }
    });

    effects.particles.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    });

    effects.messages.forEach(message => {
        ctx.font = '16px Arial';
        ctx.fillStyle = message.color;
        ctx.textAlign = 'center';
        ctx.fillText(message.text, message.x, message.y);
    });

    ctx.restore();

    drawUI();
}

function drawUI() {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Time: ${formatTime(levelCurrentTime)}`, canvas.width / 2, 25);

    // Display active power-up and remaining time
    if (game.activePowerUp) {
        const remainingTime = Math.max(0, (game.powerUpEndTime - Date.now()) / 1000);
        const text = `Power-Up: ${game.activePowerUp} (${Math.ceil(remainingTime)}s)`;
        ctx.font = '16px Arial';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.textAlign = 'left';
        ctx.fillText(text, 10, 50);
        ctx.strokeText(text, 10, 50);
    }
}

function togglePause() {
    isPaused = !isPaused;
    const pauseOverlay = document.getElementById('pauseOverlay');
    pauseOverlay.style.display = isPaused ? 'flex' : 'none';
    if (!isPaused) {
        lastTime = performance.now();
        gameLoop();
    }
}

function resetGameControls() {
    keys.ArrowRight = false;
    keys.ArrowLeft = false;
    keys.ArrowUp = false;
    keys.Space = false;
}

function saveGameState() {
    const gameState = {
        difficulty: game.difficulty,
        level: game.level,
        score: game.score,
        lives: game.lives,
        player: {
            x: player.x,
            y: player.y,
            speedX: player.speedX,
            speedY: player.speedY,
            isJumping: player.isJumping
        },
        levelData: levels[game.level - 1]
    };
    localStorage.setItem('powerPlugSave', JSON.stringify(gameState));
}

function loadGameState() {
    const savedState = localStorage.getItem('powerPlugSave');
    if (!savedState) return false;

    const gameState = JSON.parse(savedState);
    game.difficulty = gameState.difficulty;
    game.level = gameState.level;
    game.score = gameState.score;
    game.lives = gameState.lives;
    player.x = gameState.player.x;
    player.y = gameState.player.y;
    player.speedX = gameState.player.x;
    player.speedY = gameState.player.y;
    player.isJumping = gameState.player.isJumping;
    levels[game.level - 1] = gameState.levelData;

    applyDifficultySettings();
    document.getElementById('score').textContent = game.score;
    document.getElementById('level').textContent = game.level;
    document.getElementById('lives').textContent = game.lives;

    return true;
}

function showAchievementsScreen() {
    const achievementsList = document.getElementById('achievementsList');
    achievementsList.innerHTML = '';

    let hasUnlocked = false;
    for (const id in achievements) {
        const achievement = achievements[id];
        if (achievement.unlocked) {
            hasUnlocked = true;
            const achievementDiv = document.createElement('div');
            achievementDiv.className = 'achievement';
            achievementDiv.style.cssText = `
                display: flex;
                align-items: center;
                margin: 10px 0;
                padding: 10px;
                background-color: rgba(255, 255, 255, 0.1);
                border-radius: 5px;
            `;
            achievementDiv.innerHTML = `
                <span style="font-size: 24px; margin-right: 10px;">${achievement.icon}</span>
                <div>
                    <div style="font-weight: bold;">${achievement.name}</div>
                    <div>${achievement.description}</div>
                </div>
            `;
            achievementsList.appendChild(achievementDiv);
        }
    }

    if (!hasUnlocked) {
        achievementsList.innerHTML = '<p>No achievements unlocked yet!</p>';
    }

    document.getElementById('achievementsScreen').style.display = 'flex';
}

function showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 15px 30px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        z-index: 200;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    `;
    notification.innerHTML = `
        <span style="font-size: 24px; margin-right: 10px;">${achievement.icon}</span>
        <div>
            <div style="font-weight: bold;">Achievement Unlocked!</div>
            <div>${achievement.name}: ${achievement.description}</div>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transition = 'opacity 0.5s';
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3000);
}

function generateDynamicLevel(levelNum) {
    const difficultySettings = {
        easy: { platforms: 4, obstacles: 2, coins: 4, powerUps: 1, platformGap: 150, obstacleSpeed: 0 },
        medium: { platforms: 5, obstacles: 3, coins: 5, powerUps: 1, platformGap: 120, obstacleSpeed: 0.4 },
        hard: { platforms: 6, obstacles: 4, coins: 6, powerUps: 2, platformGap: 100, obstacleSpeed: 0.7 }
    };
    const settings = difficultySettings[game.difficulty] || difficultySettings.medium;

    const groundY = 450;
    const level = {
        platforms: [{ x: 0, y: groundY, width: 800, height: 50 }],
        obstacles: [],
        coins: [],
        powerUps: [],
        outlet: null
    };

    let lastPlatformX = 100;
    let lastPlatformY = groundY - 80;

    for (let i = 0; i < settings.platforms; i++) {
        const platformWidth = 80 + Math.random() * 35;
        const platformHeight = 20;
        const gap = settings.platformGap + (Math.random() * 50 - 25);
        const x = lastPlatformX + gap;
        const y = lastPlatformY - (Math.random() * 60 - 30);
        const platformY = Math.max(200, Math.min(groundY - 50, y));

        level.platforms.push({
            x: x,
            y: platformY,
            width: platformWidth,
            height: platformHeight
        });

        lastPlatformX = x;
        lastPlatformY = platformY;
    }

    // Fix ground platform width to extend past the last platform
    const lastPlatform = level.platforms[level.platforms.length - 1];
    const groundWidth = Math.max(800, lastPlatform.x + lastPlatform.width + 100);
    level.platforms[0] = { x: 0, y: groundY, width: groundWidth, height: 50 };

    for (let i = 0; i < settings.obstacles; i++) {
        const platformIndex = Math.floor(Math.random() * (level.platforms.length - 1)) + 1;
        const platform = level.platforms[platformIndex];
        const obstacle = {
            x: platform.x + Math.random() * (platform.width - 20),
            y: platform.y - 20,
            width: 20,
            height: 20
        };
        if (settings.obstacleSpeed > 0) {
            obstacle.speedX = settings.obstacleSpeed;
            obstacle.startX = obstacle.x;
            obstacle.range = 50;
        }
        level.obstacles.push(obstacle);
    }

    for (let i = 0; i < settings.coins; i++) {
        const platformIndex = Math.floor(Math.random() * (level.platforms.length - 1)) + 1;
        const platform = level.platforms[platformIndex];
        const coinX = platform.x + Math.random() * (platform.width - 20);
        const coin = {
            x: coinX,
            y: platform.y - 30,
            width: 20,
            height: 20,
            collected: false
        };
        let tooClose = level.coins.some(c => Math.abs(c.x - coinX) < 40) ||
                      level.powerUps.some(p => Math.abs(p.x - coinX) < 40);
        if (!tooClose) {
            level.coins.push(coin);
        }
    }

    const powerUpOptions = ['SPEED_BOOST', 'EXTRA_LIFE', 'INVINCIBILITY'];
    for (let i = 0; i < settings.powerUps; i++) {
        const platformIndex = Math.floor(Math.random() * (level.platforms.length - 1)) + 1;
        const platform = level.platforms[platformIndex];
        const powerUpX = platform.x + Math.random() * (platform.width - 30);
        const powerUp = {
            x: powerUpX,
            y: platform.y - 35,
            width: 30,
            height: 30,
            type: powerUpOptions[Math.floor(Math.random() * powerUpOptions.length)],
            collected: false,
            pulseRate: 0.01,
            pulseTime: 0
        };
        let tooClose = level.coins.some(c => Math.abs(c.x - powerUpX) < 40) ||
                      level.powerUps.some(pu => Math.abs(pu.x - powerUpX) < 40);
        if (!tooClose) {
            level.powerUps.push(powerUp);
        }
    }

    level.outlet = {
        x: lastPlatformX + 50,
        y: lastPlatformY - 50,
        width: 40,
        height: 40
    };

    level.coins = level.coins.filter(coin => {
        const distanceToOutlet = Math.abs(coin.x - level.outlet.x);
        return distanceToOutlet > 50;
    });

    return level;
}

function setupAllGameButtons() {
    document.getElementById('easyBtn').addEventListener('click', () => startGame('easy'));
    document.getElementById('mediumBtn').addEventListener('click', () => startGame('medium'));
    document.getElementById('hardBtn').addEventListener('click', () => startGame('hard'));

    document.getElementById('restartBtn').addEventListener('click', () => {
        document.getElementById('gameOver').style.display = 'none';
        startGame(game.difficulty);
    });

    document.getElementById('saveScoreBtn').addEventListener('click', saveScore);

    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('resumeBtn').addEventListener('click', togglePause);

    document.getElementById('mainMenuBtn').addEventListener('click', () => {
        document.getElementById('pauseOverlay').style.display = 'none';
        showStartScreen();
    });

    document.getElementById('saveGameBtn').addEventListener('click', () => {
        saveGameState();
        alert('Game saved!');
        togglePause();
    });

    document.getElementById('highScoresBackBtn').addEventListener('click', () => {
        document.getElementById('highScores').style.display = 'none';
        showStartScreen();
    });

    document.getElementById('achievementsBackBtn').addEventListener('click', () => {
        document.getElementById('achievementsScreen').style.display = 'none';
        showStartScreen();
    });

    window.addEventListener('keydown', (e) => {
        if (e.code in keys) {
            e.preventDefault();
            keys[e.code] = true;
        }
        if (e.code === 'Escape' && game.isRunning) {
            togglePause();
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code in keys) {
            e.preventDefault();
            keys[e.code] = false;
        }
    });
}
