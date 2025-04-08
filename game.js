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
    color: '#0074D9' // Blue color for the plug
};

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

// Create sound objects
const sounds = {
    jump: new Audio('https://assets.codepen.io/21542/howler-push.mp3'), // Placeholder URL, replace with actual sound
    coin: new Audio('https://assets.codepen.io/21542/howler-sfx-levelup.mp3'), // Placeholder URL, replace with actual sound
    death: new Audio('https://assets.codepen.io/21542/howler-sfx-liquid.mp3'), // Placeholder URL, replace with actual sound
    levelComplete: new Audio('https://assets.codepen.io/21542/howler-sfx-coin3.mp3') // Placeholder URL, replace with actual sound
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
        outlet: { x: 720, y: 410, width: 40, height: 40 }
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
        outlet: { x: 720, y: 410, width: 40, height: 40 }
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
        outlet: { x: 720, y: 160, width: 40, height: 40 }
    }
];

// Game controls
const keys = {
    ArrowRight: false,
    ArrowLeft: false,
    ArrowUp: false,
    Space: false
};

// Refactor window.onload to properly organize initialization
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
    
    // First create all UI elements
    createAllUIElements();
    
    // Then attach all event listeners in one place
    setupAllEventListeners();
    
    // Preload sounds
    preloadSounds();
    
    // Initialize achievements
    initializeAchievements();
    
    // Show tutorial on first play
    if (!localStorage.getItem('tutorialShown')) {
        setTimeout(showTutorial, 500);
    }
    
    // Set player base speed
    player.baseSpeed = 5;
    
    // Show start screen
    showStartScreen();
};

// Function to create all UI elements
function createAllUIElements() {
    // Create start screen elements
    createStartScreenElements();
}

// Function to create start screen UI elements
function createStartScreenElements() {
    const startScreen = document.getElementById('startScreen');
    
    // Add continue button if save exists
    const hasSave = localStorage.getItem('powerPlugSave') !== null;
    
    if (hasSave) {
        const continueBtn = document.createElement('button');
        continueBtn.id = 'continueBtn';
        continueBtn.className = 'button';
        continueBtn.textContent = 'Continue';
        continueBtn.style.marginBottom = '20px';
        
        // Insert as first button
        startScreen.insertBefore(continueBtn, startScreen.firstChild);
    }
    
    // Add tutorial button
    const tutorialBtn = document.createElement('button');
    tutorialBtn.id = 'tutorialBtn';
    tutorialBtn.className = 'button';
    tutorialBtn.textContent = 'How to Play';
    tutorialBtn.style.marginTop = '20px';
    
    // Add high scores button
    const scoresBtn = document.createElement('button');
    scoresBtn.id = 'scoresBtn';
    scoresBtn.className = 'button';
    scoresBtn.textContent = 'High Scores';
    scoresBtn.style.marginTop = '10px';
    
    // Add achievements button
    const achievementsBtn = document.createElement('button');
    achievementsBtn.id = 'achievementsBtn';
    achievementsBtn.className = 'button';
    achievementsBtn.textContent = 'Achievements';
    achievementsBtn.style.marginTop = '10px';
    
    // Append buttons
    startScreen.appendChild(tutorialBtn);
    startScreen.appendChild(scoresBtn);
    startScreen.appendChild(achievementsBtn);
}

// Function to set up all event listeners in one place
function setupAllEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', function(e) {
        if (e.code === 'ArrowRight') keys.ArrowRight = true;
        if (e.code === 'ArrowLeft') keys.ArrowLeft = true;
        if (e.code === 'ArrowUp' || e.code === 'Space') {
            keys.Space = true;
            // Prevent spacebar from scrolling the page
            if (e.code === 'Space') e.preventDefault();
        }
        
        // Pause/resume with Escape key
        if (e.code === 'Escape' && game.isRunning) {
            togglePause();
        }
        
        // Save game with Ctrl+S
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

    // Start screen buttons
    const continueBtn = document.getElementById('continueBtn');
    if (continueBtn) {
        continueBtn.addEventListener('click', function() {
            if (loadGameState()) {
                document.getElementById('startScreen').style.display = 'none';
                loadLevel(game.level);
            }
        });
    }
    
    // Tutorial button
    document.getElementById('tutorialBtn').addEventListener('click', showTutorial);
    
    // High scores button
    document.getElementById('scoresBtn').addEventListener('click', function() {
        document.getElementById('startScreen').style.display = 'none';
        showHighScores();
    });
    
    // Achievements button
    document.getElementById('achievementsBtn').addEventListener('click', function() {
        document.getElementById('startScreen').style.display = 'none';
        showAchievementsScreen();
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
        transitionToLevel(game.level);
    });

    // Game over buttons
    document.getElementById('saveScoreBtn').addEventListener('click', saveScore);
    document.getElementById('restartBtn').addEventListener('click', function() {
        document.getElementById('gameOver').style.display = 'none';
        showStartScreen();
    });

    // High scores back button
    document.getElementById('backBtn').addEventListener('click', function() {
        document.getElementById('highScores').style.display = 'none';
        showStartScreen();
    });
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


function showStartScreen() {
    document.getElementById('startScreen').style.display = 'flex';
    game.isRunning = false;
}

// Update startGame to use difficulty settings
function startGame(difficulty) {
    game.difficulty = difficulty;
    game.level = 1;
    game.score = 0;
    
    // Apply difficulty settings
    applyDifficultySettings();
    
    // Hide start screen
    document.getElementById('startScreen').style.display = 'none';
    
    loadLevel(game.level);
}


function loadLevel(levelNum) {
    // Reset player position
    player.x = 50;
    player.y = 400;
    player.speedX = 0;
    player.speedY = 0;
    player.isJumping = false;
    
    // Initialize powerUps array if it doesn't exist
    if (!levels[levelNum-1].powerUps) {
        levels[levelNum-1].powerUps = [];
    }
    
    // Reset level coins
    levels[levelNum-1].coins.forEach(coin => {
        coin.collected = false;
    });
    
    // Reset power-ups if they exist
    if (levels[levelNum-1].powerUps && levels[levelNum-1].powerUps.length > 0) {
        levels[levelNum-1].powerUps.forEach(powerUp => {
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


function gameLoop() {
    if (!game.isRunning || isPaused) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    update();
    draw();
    
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

// Update levelComplete to check achievements
function levelComplete() {
    setGameRunning(false);
    sounds.levelComplete.play();
    
    // Check for achievements
    
    // Speed runner achievement
    if (levelCurrentTime < 30000 && !achievements.SPEED_RUNNER.unlocked) {
        awardAchievement('SPEED_RUNNER');
    }
    
    // Survivor achievement
    if (game.lives === game.levelStartLives && !achievements.SURVIVOR.unlocked) {
        awardAchievement('SURVIVOR');
    }
    
    // Add score bonus
    game.score += 500;
    document.getElementById('score').textContent = game.score;
    
    if (game.level < levels.length) {
        document.getElementById('levelScore').textContent = "Score: " + game.score;
        document.getElementById('levelComplete').style.display = 'flex';
        game.level++;
        document.getElementById('level').textContent = game.level;
    } else {
        // Game completed
        document.getElementById('finalScore').textContent = "Final Score: " + game.score + " - You Win!";
        document.getElementById('gameOver').style.display = 'flex';
        
        // Add bonus achievement for completing game
        const GAME_MASTER = {
            id: 'GAME_MASTER',
            name: 'Game Master',
            description: 'Complete all levels of the game',
            icon: '🏆',
            unlocked: true
        };
        
        achievements.GAME_MASTER = GAME_MASTER;
        awardAchievement('GAME_MASTER');
        saveAchievements();
    }
}

function update() {
    // Apply gravity
    player.speedY += game.gravity;
    
    // Handle controls (keyboard only)
    if (keys.ArrowRight) {
        player.speedX = player.baseSpeed + (player.speedBoost || 0);
    } else if (keys.ArrowLeft) {
        player.speedX = -player.baseSpeed - (player.speedBoost || 0);
    } else {
        player.speedX = 0;
    }
    
    // Handle jumping
    if (keys.Space && !player.isJumping) {
        player.speedY = player.jumpPower;
        player.isJumping = true;
        sounds.jump.currentTime = 0;
        sounds.jump.play();
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
    
    // Update obstacles
    currentLevel.obstacles.forEach(obstacle => {
        if (obstacle.speedX) {
            obstacle.x += obstacle.speedX;
            
            // Reverse direction at range limits
            if (obstacle.x > obstacle.startX + obstacle.range || 
                obstacle.x < obstacle.startX - obstacle.range) {
                obstacle.speedX *= -1;
            }
        }
    });
    
    // Check coin collisions
    currentLevel.coins.forEach(coin => {
        if (!coin.collected && collides(player, coin)) {
            coin.collected = true;
            game.score += 100;
            document.getElementById('score').textContent = game.score;
            
            // Create coin collection effects
            createParticles(coin.x + coin.width/2, coin.y + coin.height/2, 10, '#FFDC00', 3, 20);
            createFloatingMessage('+100', coin.x, coin.y - 20, '#FFDC00');
            
            sounds.coin.currentTime = 0;
            sounds.coin.play();
        }
    });
    
    // Check power-up collisions
    if (currentLevel.powerUps) {
        currentLevel.powerUps.forEach(powerUp => {
            if (!powerUp.collected && collides(player, powerUp)) {
                collectPowerUp(powerUp);
            }
        });
    }
    
    // Check obstacle collisions (if not invincible)
    if (!player.invincible) {
        currentLevel.obstacles.forEach(obstacle => {
            if (collides(player, obstacle)) {
                player.x = 50;
                player.y = 400;
                player.speedX = 0;
                player.speedY = 0;
                game.lives--;
                document.getElementById('lives').textContent = game.lives;
                
                createParticles(player.x + player.width/2, player.y + player.height/2, 30, 'red', 5, 40);
                
                if (game.lives <= 0) {
                    gameOver();
                }
            }
        });
    }
    
    // Check outlet (goal) collision
    if (collides(player, currentLevel.outlet)) {
        levelComplete();
    }
    
    // Check if player fell off the screen
    if (player.y > canvas.height) {
        player.x = 50;
        player.y = 400;
        player.speedX = 0;
        player.speedY = 0;
        game.lives--;
        document.getElementById('lives').textContent = game.lives;
        
        if (game.lives <= 0) {
            gameOver();
        }
    }

    // Update clouds
    background.clouds.forEach(cloud => {
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.width < 0) {
            cloud.x = canvas.width;
        }
    });

    // Check invincibility timer
    if (player.invincible && Date.now() > player.invincibleTime) {
        player.invincible = false;
        createFloatingMessage('Invincibility ended!', player.x, player.y - 30, '#FFFFFF');
    }


    // Update effects and timer
    updateEffects();
    updateLevelTimer();
    updateAchievements();
}


function gameOver() {
    setGameRunning(false);
    sounds.death.play();
    document.getElementById('finalScore').textContent = "Final Score: " + game.score;
    document.getElementById('gameOver').style.display = 'flex';
}

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
// Add these functions to your game.js file

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

function drawParallaxBackground() {
    // Draw sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#E0F7FF');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw distant mountains
    const mountainGradient = ctx.createLinearGradient(0, canvas.height - background.mountains[0].height, 0, canvas.height);
    mountainGradient.addColorStop(0, '#6B8E23');
    mountainGradient.addColorStop(1, '#556B2F');
    ctx.fillStyle = mountainGradient;
    
    background.mountains.forEach(mountain => {
        // Draw mountain shape
        ctx.beginPath();
        ctx.moveTo(mountain.x - player.x * 0.1, canvas.height);
        
        // Create jagged mountain peaks
        for (let i = 0; i <= mountain.width; i += 40) {
            const peakHeight = Math.sin(i * 0.01) * 30 + Math.random() * 10;
            ctx.lineTo(mountain.x + i - player.x * 0.1, 
                       canvas.height - mountain.height - peakHeight);
        }
        
        ctx.lineTo(mountain.x + mountain.width - player.x * 0.1, canvas.height);
        ctx.closePath();
        ctx.fill();
    });
    
    // Draw clouds with parallax
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    background.clouds.forEach(cloud => {
        // Calculate parallax position based on player position
        const parallaxX = cloud.x - player.x * cloud.speed * 0.2;
        
        // Draw cloud
        ctx.beginPath();
        ctx.arc(parallaxX, cloud.y, cloud.height/2, 0, Math.PI * 2);
        ctx.arc(parallaxX + cloud.width/3, cloud.y - cloud.height/4, cloud.height/2, 0, Math.PI * 2);
        ctx.arc(parallaxX + cloud.width/1.5, cloud.y, cloud.height/2, 0, Math.PI * 2);
        ctx.arc(parallaxX + cloud.width/3, cloud.y + cloud.height/4, cloud.height/2, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw background trees
    background.trees.forEach(tree => {
        // Calculate parallax position based on player position
        const parallaxX = tree.x - player.x * 0.3;
        
        // Draw tree trunk
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(parallaxX - tree.width/6, tree.y, tree.width/3, tree.height);
        
        // Draw tree leaves
        ctx.fillStyle = '#2E8B57';
        ctx.beginPath();
        ctx.ellipse(parallaxX, tree.y - tree.height/2, tree.width/2, tree.height, 0, 0, Math.PI * 2);
        ctx.fill();
    });
}




function draw() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background with parallax effect
    drawParallaxBackground();
    
    const currentLevel = levels[game.level - 1];
    
    // Draw platforms with texture
    currentLevel.platforms.forEach(platform => {
        // Platform base
        ctx.fillStyle = '#8B4513'; // Brown color
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Platform top edge
        ctx.fillStyle = '#A0522D'; // Lighter brown
        ctx.fillRect(platform.x, platform.y, platform.width, 5);
    });
    
    // Draw obstacles with texture
    currentLevel.obstacles.forEach(obstacle => {
        // Spike shape
        ctx.fillStyle = '#FF4136'; // Red color
        ctx.beginPath();
        ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
        ctx.lineTo(obstacle.x + obstacle.width/2, obstacle.y);
        ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
        ctx.closePath();
        ctx.fill();
    });
    
    // Draw coins with animation
    const coinPulse = Math.sin(Date.now() * 0.01) * 0.1 + 0.9;
    ctx.fillStyle = '#FFDC00'; // Yellow color
    currentLevel.coins.forEach(coin => {
        if (!coin.collected) {
            ctx.beginPath();
            ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, 
                   (coin.width/2) * coinPulse, 0, Math.PI * 2);
            ctx.fill();
            
            // Coin shine effect
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(coin.x + coin.width/2 - 3, coin.y + coin.height/2 - 3, 
                   3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFDC00';
        }
    });
    
    // Draw power-ups if they exist
    if (currentLevel.powerUps) {
        currentLevel.powerUps.forEach(powerUp => {
            if (!powerUp.collected) {
                const pulse = Math.sin(Date.now() * (powerUp.pulseRate || 0.01)) * 0.2 + 0.8;
                
                // Draw power-up glow
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = powerUpTypes[powerUp.type].color;
                ctx.beginPath();
                ctx.arc(
                    powerUp.x + powerUp.width/2, 
                    powerUp.y + powerUp.height/2,
                    (powerUp.width/1.5) * pulse,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
                
                // Draw power-up icon
                ctx.globalAlpha = 1;
                ctx.fillStyle = powerUpTypes[powerUp.type].color;
                ctx.beginPath();
                ctx.arc(
                    powerUp.x + powerUp.width/2, 
                    powerUp.y + powerUp.height/2,
                    (powerUp.width/3) * pulse,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
                
                // Draw icon symbol based on type
                ctx.fillStyle = 'white';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                let symbol = '';
                switch(powerUp.type) {
                    case 'SPEED_BOOST': symbol = '→'; break;
                    case 'EXTRA_LIFE': symbol = '♥'; break;
                    case 'INVINCIBILITY': symbol = '★'; break;
                }
                
                ctx.fillText(
                    symbol,
                    powerUp.x + powerUp.width/2,
                    powerUp.y + powerUp.height/2
                );
            }
        });
    }
    
    // Draw outlet (goal) with socket details
    ctx.fillStyle = '#2ECC40'; // Green color
    ctx.fillRect(currentLevel.outlet.x, currentLevel.outlet.y, 
                currentLevel.outlet.width, currentLevel.outlet.height);
    
    // Outlet socket holes
    ctx.fillStyle = '#111';
    ctx.fillRect(currentLevel.outlet.x + 10, currentLevel.outlet.y + 10, 
                8, 20);
    ctx.fillRect(currentLevel.outlet.x + currentLevel.outlet.width - 18, 
                currentLevel.outlet.y + 10, 8, 20);
    
    // Draw player (plug)
    ctx.save();
    if (player.invincible) {
        ctx.globalAlpha = 0.7 + Math.sin(Date.now() * 0.01) * 0.3;
        ctx.shadowColor = '#7FDBFF';
        ctx.shadowBlur = 15;
    }
    
    // Plug body
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Plug prongs
    ctx.fillStyle = '#B0B0B0'; // Silver color
    ctx.fillRect(player.x + player.width/4, player.y - 10, player.width/6, 10);
    ctx.fillRect(player.x + player.width*3/5, player.y - 10, player.width/6, 10);
    
    // Plug face (when moving right)
    if (player.speedX >= 0) {
        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(player.x + player.width*0.7, player.y + player.height*0.3, 
               player.width*0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(player.x + player.width*0.72, player.y + player.height*0.3, 
               player.width*0.05, 0, Math.PI * 2);
        ctx.fill();
        
        // Smile
        ctx.beginPath();
        ctx.arc(player.x + player.width*0.6, player.y + player.height*0.5, 
               player.width*0.2, 0, Math.PI);
        ctx.stroke();
    } else { // Face when moving left
        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(player.x + player.width*0.3, player.y + player.height*0.3, 
               player.width*0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(player.x + player.width*0.28, player.y + player.height*0.3, 
               player.width*0.05, 0, Math.PI * 2);
        ctx.fill();
        
        // Smile
        ctx.beginPath();
        ctx.arc(player.x + player.width*0.4, player.y + player.height*0.5, 
               player.width*0.2, 0, Math.PI);
        ctx.stroke();
    }
    ctx.restore();
    
    // Draw UI
    drawUI();
    
    // Draw effects
    drawEffects();
    
    // Draw mini-map if not on easy mode
    if (game.difficulty !== 'easy') {
        drawMiniMap();
    }
    
    // Draw level timer
    drawLevelTimer();
}

// Add level timer
let levelStartTime = 0;
let levelCurrentTime = 0;

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

// Draw timer in UI
function drawLevelTimer() {
    // Timer container
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(canvas.width / 2 - 50, 10, 100, 30);
    
    // Timer text
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(formatTime(levelCurrentTime), canvas.width / 2, 30);
}


function drawUI() {
    // Draw score display
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 10, 150, 30);
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${game.score}`, 20, 30);
    
    // Draw lives display with heart icons
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(canvas.width - 110, 10, 100, 30);
    
    for (let i = 0; i < game.lives; i++) {
        ctx.fillStyle = '#FF4136';
        ctx.beginPath();
        const heartX = canvas.width - 100 + (i * 20);
        const heartY = 25;
        
        // Draw heart shape
        ctx.moveTo(heartX, heartY);
        ctx.bezierCurveTo(heartX - 9, heartY - 8, heartX - 5, heartY - 15, heartX, heartY - 7);
        ctx.bezierCurveTo(heartX + 5, heartY - 15, heartX + 9, heartY - 8, heartX, heartY);
        ctx.fill();
    }
}

// Add these variables to your game
const effects = {
    particles: [],
    messages: []
};

// Add this function to create particle effects
function createParticles(x, y, count, color, size, lifespan) {
    for (let i = 0; i < count; i++) {
        effects.particles.push({
            x: x,
            y: y,
            speedX: (Math.random() - 0.5) * 4,
            speedY: (Math.random() - 0.5) * 4 - 2,
            size: size || Math.random() * 5 + 2,
            color: color || '#FFDC00',
            life: lifespan || 30,
            maxLife: lifespan || 30
        });
    }
}

// Add this function to create floating text messages
function createFloatingMessage(text, x, y, color) {
    effects.messages.push({
        text: text,
        x: x,
        y: y,
        color: color || '#FFFFFF',
        life: 40,
        speedY: -1
    });
}

// Add this to your update function
function updateEffects() {
    // Update particles
    for (let i = effects.particles.length - 1; i >= 0; i--) {
        const p = effects.particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.life--;
        
        // Remove dead particles
        if (p.life <= 0) {
            effects.particles.splice(i, 1);
        }
    }
    
    // Update floating messages
    for (let i = effects.messages.length - 1; i >= 0; i--) {
        const m = effects.messages[i];
        m.y += m.speedY;
        m.life--;
        
        // Remove dead messages
        if (m.life <= 0) {
            effects.messages.splice(i, 1);
        }
    }
}


// Add this to your draw function
function drawEffects() {
    // Draw particles
    effects.particles.forEach(p => {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw floating messages
    ctx.globalAlpha = 1;
    effects.messages.forEach(m => {
        ctx.globalAlpha = m.life / 40;
        ctx.fillStyle = m.color;
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(m.text, m.x, m.y);
    });
    
    ctx.globalAlpha = 1;
}

// Add a flag to prevent multiple transitions
let isTransitioning = false;

// Level transition effect
function transitionToLevel(levelNum) {
    if (isTransitioning) return;
    isTransitioning = true;
    
    
    // Create a transition overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: black;
        opacity: 0;
        transition: opacity 1s ease;
        z-index: 200;
    `;
    
    document.getElementById('gameContainer').appendChild(overlay);
    
    // Fade in
    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 50);
    
    // Load new level
    setTimeout(() => {
        loadLevel(levelNum);
        
        // Fade out
        setTimeout(() => {
            overlay.style.opacity = '0';
            
            // Remove overlay
            setTimeout(() => {
                overlay.remove();
            }, 1000);
        }, 500);
        
    }, 1000);

    setTimeout(() => {
        isTransitioning = false;
    }, 2500);
}


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

// Add power-ups to levels
levels.forEach(level => {
    level.powerUps = [];
    
    // Add 1-3 random power-ups per level
    const powerUpCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < powerUpCount; i++) {
        // Random position on a platform
        const platform = level.platforms[Math.floor(Math.random() * (level.platforms.length - 1)) + 1]; // Skip ground platform
        
        const types = Object.keys(powerUpTypes);
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        level.powerUps.push({
            x: platform.x + platform.width/2 - 15,
            y: platform.y - 30,
            width: 30,
            height: 30,
            type: randomType,
            collected: false,
            pulseRate: 0.005 + (Math.random() * 0.01)
        });
    }
});

// Update player object
player.speedBoost = 0;
player.invincible = false;
player.invincibleTime = 0;


// Adjust difficulty settings
function startGame(difficulty) {
    game.difficulty = difficulty;
    game.level = 1;
    game.score = 0;
    
    // Set parameters based on difficulty
    switch(difficulty) {
        case 'easy':
            game.lives = 5;
            game.gravity = 0.4;
            player.jumpPower = -11;
            break;
        case 'medium':
            game.lives = 3;
            game.gravity = 0.5;
            player.jumpPower = -12;
            break;
        case 'hard':
            game.lives = 1;
            game.gravity = 0.6;
            player.jumpPower = -13;
            
            // Add extra obstacles in hard mode
            levels.forEach(level => {
                // Add 2-3 more obstacles
                for (let i = 0; i < Math.floor(Math.random() * 2) + 2; i++) {
                    level.obstacles.push({
                        x: 100 + Math.random() * 600,
                        y: 430,
                        width: 20,
                        height: 20
                    });
                }
            });
            break;
    }
    
    // Update UI
    document.getElementById('lives').textContent = game.lives;
    document.getElementById('score').textContent = game.score;
    document.getElementById('level').textContent = game.level;
    
    // Hide start screen
    document.getElementById('startScreen').style.display = 'none';
    
    loadLevel(game.level);
}

// Add a pause/resume feature
let isPaused = false;

document.addEventListener('keydown', function(e) {
    if (e.code === 'Escape' && game.isRunning) {
        togglePause();
    }
});

function togglePause() {
    isPaused = !isPaused;
    
    if (isPaused) {
        // Create pause menu
        const pauseMenu = document.createElement('div');
        pauseMenu.id = 'pauseMenu';
        pauseMenu.className = 'menu-screen';
        pauseMenu.innerHTML = `
            <h1>Game Paused</h1>
            <button id="resumeBtn" class="button">Resume</button>
            <button id="saveBtn" class="button">Save Game</button>
            <button id="quitBtn" class="button">Quit to Menu</button>
        `;
        
        document.getElementById('gameContainer').appendChild(pauseMenu);
        
        document.getElementById('resumeBtn').addEventListener('click', togglePause);
        document.getElementById('saveBtn').addEventListener('click', function() {
            saveGameState();
        });
        document.getElementById('quitBtn').addEventListener('click', function() {
            isPaused = false;
            setGameRunning(false);
            document.getElementById('pauseMenu').remove();
            showStartScreen();
        });

    } else {
        // Remove pause menu
        const pauseMenu = document.getElementById('pauseMenu');
        if (pauseMenu) pauseMenu.remove();
        
        // Resume game loop
        gameLoop();
    }
}


// Update game loop to respect pause state
function gameLoop() {
    if (!game.isRunning) return;
    if (isPaused) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    update();
    draw();
    
    // Continue the game loop
    requestAnimationFrame(gameLoop);
}

// Game save/load functions
function saveGameState() {
    const gameState = {
        level: game.level,
        score: game.score,
        lives: game.lives,
        difficulty: game.difficulty,
        timestamp: Date.now()
    };
    
    localStorage.setItem('powerPlugSave', JSON.stringify(gameState));
    
    // Show save notification
    createFloatingMessage('Game Saved!', canvas.width/2, canvas.height/2, '#FFFFFF');
}

function loadGameState() {
    const savedState = localStorage.getItem('powerPlugSave');
    
    if (savedState) {
        const gameState = JSON.parse(savedState);
        
        // Check if save is from current session (less than 1 day old)
        if (Date.now() - gameState.timestamp < 24 * 60 * 60 * 1000) {
            game.level = gameState.level;
            game.score = gameState.score;
            game.lives = gameState.lives;
            game.difficulty = gameState.difficulty;
            
            // Update UI
            document.getElementById('lives').textContent = game.lives;
            document.getElementById('score').textContent = game.score;
            document.getElementById('level').textContent = game.level;
            
            return true;
        }
    }
    
    return false;
}


// Add save keyboard shortcut
document.addEventListener('keydown', function(e) {
    if (e.code === 'KeyS' && e.ctrlKey && game.isRunning) {
        e.preventDefault();
        saveGameState();
    }
});


// Add mini-map
function drawMiniMap() {
    const mapWidth = 150;
    const mapHeight = 80;
    const mapX = canvas.width - mapWidth - 10;
    const mapY = 10;
    
    // Map background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(mapX, mapY, mapWidth, mapHeight);
    
    const currentLevel = levels[game.level - 1];
    const mapScale = mapWidth / canvas.width;
    
    // Draw platforms on mini-map
    ctx.fillStyle = 'rgba(139, 69, 19, 0.7)';
    currentLevel.platforms.forEach(platform => {
        ctx.fillRect(
            mapX + platform.x * mapScale, 
            mapY + platform.y * mapScale, 
            platform.width * mapScale, 
            platform.height * mapScale
        );
    });
    
    // Draw obstacles on mini-map
    ctx.fillStyle = 'rgba(255, 65, 54, 0.7)';
    currentLevel.obstacles.forEach(obstacle => {
        ctx.fillRect(
            mapX + obstacle.x * mapScale, 
            mapY + obstacle.y * mapScale, 
            obstacle.width * mapScale, 
            obstacle.height * mapScale
        );
    });
    
    // Draw coins on mini-map
    ctx.fillStyle = 'rgba(255, 220, 0, 0.7)';
    currentLevel.coins.forEach(coin => {
        if (!coin.collected) {
            ctx.beginPath();
            ctx.arc(
                mapX + coin.x * mapScale + (coin.width/2) * mapScale, 
                mapY + coin.y * mapScale + (coin.height/2) * mapScale, 
                2, 
                0, 
                Math.PI * 2
            );
            ctx.fill();
        }
    });
    
    // Draw outlet on mini-map
    ctx.fillStyle = 'rgba(46, 204, 64, 0.7)';
    ctx.fillRect(
        mapX + currentLevel.outlet.x * mapScale, 
        mapY + currentLevel.outlet.y * mapScale, 
        currentLevel.outlet.width * mapScale, 
        currentLevel.outlet.height * mapScale
    );
    
    // Draw player on mini-map
    ctx.fillStyle = 'rgba(0, 116, 217, 1)';
    ctx.fillRect(
        mapX + player.x * mapScale, 
        mapY + player.y * mapScale, 
        player.width * mapScale, 
        player.height * mapScale
    );
    
    // Map border
    ctx.strokeStyle = 'white';
    ctx.strokeRect(mapX, mapY, mapWidth, mapHeight);
}


// Load achievements from local storage
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

// Save achievements to local storage
function saveAchievements() {
    localStorage.setItem('powerPlugAchievements', JSON.stringify(achievements));
}

// Award an achievement
function awardAchievement(id) {
    if (achievements[id] && !achievements[id].unlocked) {
        achievements[id].unlocked = true;
        saveAchievements();
        
        // Show achievement notification
        const achievement = achievements[id];
        
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.style.cssText = `
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 300;
            animation: slide-in 0.5s ease, fade-out 0.5s ease 3.5s forwards;
        `;
        
        notification.innerHTML = `
            <div class="achievement-icon" style="font-size: 24px;">${achievement.icon}</div>
            <div class="achievement-info">
                <h3 style="margin: 0; color: gold;">Achievement Unlocked!</h3>
                <p style="margin: 5px 0 0 0;">${achievement.name} - ${achievement.description}</p>
            </div>
        `;
        
        document.getElementById('gameContainer').appendChild(notification);
        
        // Remove notification after 4 seconds
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
}

// Update achievement progress
function updateAchievements() {
    // Coin collector achievement
    let coinCount = 0;
    levels.forEach(level => {
        level.coins.forEach(coin => {
            if (coin.collected) coinCount++;
        });
    });
    
    achievements.COIN_COLLECTOR.progress = coinCount;
    if (coinCount >= achievements.COIN_COLLECTOR.target && !achievements.COIN_COLLECTOR.unlocked) {
        awardAchievement('COIN_COLLECTOR');
    }
    
    // Power-up master achievement
    if (achievements.POWER_UP_MASTER.progress.SPEED_BOOST &&
        achievements.POWER_UP_MASTER.progress.EXTRA_LIFE &&
        achievements.POWER_UP_MASTER.progress.INVINCIBILITY &&
        !achievements.POWER_UP_MASTER.unlocked) {
        awardAchievement('POWER_UP_MASTER');
    }
}


// Add achievements display screen
function showAchievementsScreen() {
    // Create achievements screen
    const achievementsOverlay = document.createElement('div');
    achievementsOverlay.id = 'achievementsScreen';
    achievementsOverlay.className = 'menu-screen';
    achievementsOverlay.innerHTML = `
        <h1>Achievements</h1>
        <div id="achievementsList"></div>
        <button id="achievementsBackBtn" class="button">Back</button>
    `;
    
    document.getElementById('gameContainer').appendChild(achievementsOverlay);
    
    // Populate achievements list
    const achievementsList = document.getElementById('achievementsList');
    for (const id in achievements) {
        const achievement = achievements[id];
        
        const achievementItem = document.createElement('div');
        achievementItem.className = 'achievement-item';
        achievementItem.style.cssText = `
            display: flex;
            align-items: center;
            gap: 15px;
            background-color: ${achievement.unlocked ? 'rgba(46, 204, 64, 0.3)' : 'rgba(255, 65, 54, 0.3)'};
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            width: 80%;
            margin-left: auto;
            margin-right: auto;
        `;
        
        // Progress display
        let progressHtml = '';
        if (achievement.target) {
            const percent = Math.min(100, (achievement.progress / achievement.target) * 100);
            progressHtml = `
                <div style="width: 100%; background-color: #444; height: 5px; border-radius: 3px; margin-top: 5px;">
                    <div style="width: ${percent}%; background-color: gold; height: 100%; border-radius: 3px;"></div>
                </div>
                <div style="font-size: 12px; text-align: right; margin-top: 2px;">${achievement.progress}/${achievement.target}</div>
            `;
        }
        
        achievementItem.innerHTML = `
            <div style="font-size: 32px; min-width: 40px; text-align: center;">${achievement.icon}</div>
            <div style="flex-grow: 1;">
                <h3 style="margin: 0; color: ${achievement.unlocked ? 'gold' : 'white'};">${achievement.name}</h3>
                <p style="margin: 5px 0 0 0; font-size: 14px;">${achievement.description}</p>
                ${progressHtml}
            </div>
            <div style="font-size: 24px;">${achievement.unlocked ? '✅' : '🔒'}</div>
        `;
        
        achievementsList.appendChild(achievementItem);
    }
    
    // Back button handler
    document.getElementById('achievementsBackBtn').addEventListener('click', function() {
        document.getElementById('achievementsScreen').remove();
        showStartScreen();
    });
}


// Update power-up collection to track achievements
function collectPowerUp(powerUp) {
    if (!powerUp.collected) {
        powerUp.collected = true;
        
        // Apply power-up effect
        powerUpTypes[powerUp.type].effect();
        
        // Create particles
        createParticles(
            powerUp.x + powerUp.width/2, 
            powerUp.y + powerUp.height/2, 
            20, 
            powerUpTypes[powerUp.type].color,
            4,
            40
        );
        
        // Track for achievement
        achievements.POWER_UP_MASTER.progress[powerUp.type] = true;
        saveAchievements();
    }
}

// Add CSS animations
const styleElement = document.createElement('style');
styleElement.textContent = `
    @keyframes slide-in {
        from { transform: translateX(-50%) translateY(-50px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    
    @keyframes fade-out {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
    
    .button:hover {
        animation: pulse 0.5s infinite;
    }
`;
document.head.appendChild(styleElement);

// Add final difficulty adjustments
function applyDifficultySettings() {
    const difficultySettings = {
        easy: {
            lives: 5,
            gravity: 0.4,
            jumpPower: -11,
            playerSpeed: 4,
            obstacleSpeed: 0,
            powerUpFrequency: 2.5
        },
        medium: {
            lives: 3,
            gravity: 0.5,
            jumpPower: -12,
            playerSpeed: 5,
            obstacleSpeed: 0.5,
            powerUpFrequency: 1.5
        },
        hard: {
            lives: 1,
            gravity: 0.6,
            jumpPower: -13,
            playerSpeed: 6,
            obstacleSpeed: 1,
            powerUpFrequency: 1
        }
    };
    
    const settings = difficultySettings[game.difficulty];
    
    game.lives = settings.lives;
    game.gravity = settings.gravity;
    player.jumpPower = settings.jumpPower;
    player.baseSpeed = settings.playerSpeed;
    
    // Add moving obstacles for medium and hard
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
    
    // Adjust power-up frequency
    levels.forEach(level => {
        // Clear existing power-ups
        level.powerUps = [];
        
        // Add power-ups based on difficulty
        for (let i = 0; i < settings.powerUpFrequency; i++) {
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
                pulseRate: 0.005 + (Math.random() * 0.01)
            });
        }
    });
    
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
}
