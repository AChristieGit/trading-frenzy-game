// ===== GAME STATE MANAGEMENT MODULE =====
// Dependencies: config.js (marketData, adminSettings, gameEndSettings, activePowerups, baseGlobalVolatility)
// Exposes: Game state variables, initialization, reset functions, game flow control

// Core game state variables
let currentAssetClass = window.currentAssetClass || 'indices';
let currentView = window.currentView || 'markets';
let markets = window.markets || [];

// Game session variables
let score = window.score || 0;
let trades = window.trades || 0;
let breaches = window.breaches || 0;
let gameTime = window.gameTime || 0;
let missedTimers = window.missedTimers || 0;
let escalationTimer = window.escalationTimer || 0;
let sessionBreachesFixed = window.sessionBreachesFixed || 0;

// Game control variables
let isPaused = window.isPaused || false;
let gameSpeed = window.gameSpeed || 700;
let gameDifficulty = window.gameDifficulty || 2;

// Breach tracking per asset class
let assetClassBreaches = window.assetClassBreaches || {
    indices: new Set(),
    forex: new Set(),
    shares: new Set(),
    commodities: new Set(),
    crypto: new Set()
};

let expiredBreaches = window.expiredBreaches || {
    indices: new Set(),
    forex: new Set(),
    shares: new Set(),
    commodities: new Set(),
    crypto: new Set()
};

let assetClassTimers = window.assetClassTimers || {
    indices: {},
    forex: {},
    shares: {},
    commodities: {},
    crypto: {}
};

// Current view breach tracking
let breachedMarkets = window.breachedMarkets || new Set();
let individualBreachTimers = window.individualBreachTimers || {};
let hasActiveBreach = window.hasActiveBreach || false;

// Game loop intervals
let gameInterval = window.gameInterval;
let timerInterval = window.timerInterval;
let powerupInterval = window.powerupInterval;

// Centralized interval management
function clearAllIntervals() {
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    }
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (powerupInterval) {
        clearInterval(powerupInterval);
        powerupInterval = null;
    }
}

// Admin panel state
let showAdminPanel = window.showAdminPanel || false;

// Game initialization functions
function initializeAllAssetClasses() {
    Object.keys(marketData).forEach(assetClass => {
        // Only initialize exposures for unlocked asset classes
        if (userProfile.unlockedAssets.includes(assetClass)) {
            marketData[assetClass].forEach(market => {
                const randomPercent = Math.random() * 0.5;
                const randomDirection = Math.random() < 0.5 ? -1 : 1;
                market.exposure = market.limit * randomPercent * randomDirection;
                market.trend = 0; // Reset trends as well
            });
        } else {
            // For locked asset classes, set exposures to 0
            marketData[assetClass].forEach(market => {
                market.exposure = 0;
                market.trend = 0;
            });
        }
    });
}

function initializeEverything() {
    // Ensure markets is properly initialized
    if (!markets || markets.length === 0) {
        markets = marketData[currentAssetClass];
    }
    

    initializeAllAssetClasses();
    updateMenuDisplay(); // Defined in UI module
    updateUnlockedAssets(); // Defined in UI module
    loadAdminPanelValues(); // Defined in UI module
    
    
    safeUpdateElement('levelEditor', userProfile.level, 'value'); // Defined in UI module
    safeUpdateElement('coinsEditor', userProfile.coins, 'value'); // Defined in UI module
}

function resetToDefaults() {
    if (isGuestMode || !currentUser) {
        userProfile = initializeDefaultProfile();
        updateMenuDisplay(); // Defined in UI module
        updateProfileDisplay(); // Defined in UI module
    }
    // If user is logged in, don't reset their data
}

// Game state reset functions
function resetGameState() {
    // Reset all game variables without awarding XP/coins again
    Object.keys(activePowerups).forEach(powerupType => {
        activePowerups[powerupType] = { active: false, timeLeft: 0, cooldown: 0 };
    });

    // Ensure markets is properly initialized
markets = marketData[currentAssetClass];
    
    score = 0;
    trades = 0;
    breaches = 0;
    gameTime = 0;
    missedTimers = 0;
    escalationTimer = 0;
    sessionBreachesFixed = 0;
    adminSettings.globalVolatilityMultiplier = baseGlobalVolatility;
    updateGlobalVolatilityDisplay(); // Defined in UI module
    breachedMarkets.clear();
    individualBreachTimers = {};
    hasActiveBreach = false;

    Object.keys(assetClassBreaches).forEach(assetClass => {
        assetClassBreaches[assetClass].clear();
        assetClassTimers[assetClass] = {};
    });

    Object.keys(expiredBreaches).forEach(assetClass => {
        expiredBreaches[assetClass].clear();
    });

    updateScore(); // Defined in UI module
    updateDisplay(); // Defined in markets module
    updateProfileDisplay(); // Defined in UI module
    updateUnlockedAssets(); // Defined in UI module
    updatePowerupsDisplay(); // Defined in powerups module
    updateStrikesDisplay(); // Defined in UI module
}

// Game flow control
function startGame() {
    // Clear any existing intervals first
    clearAllIntervals();
 
    initializeAllAssetClasses();
    
    const menuScreen = document.getElementById('menuScreen');
    menuScreen.style.display = 'none';
    menuScreen.style.visibility = 'hidden';
    menuScreen.style.position = 'absolute';
    menuScreen.style.top = '-9999px';
    document.getElementById('gameScreen').style.display = 'block';
    currentView = 'markets';
    document.getElementById('powerupsContainer').style.display = 'none';
    document.getElementById('marketsContainer').style.display = 'block';
    
    document.querySelectorAll('.tab-button').forEach(tab => {
        tab.classList.remove('active');
    });
    // Highlight the tab for the current asset class instead of always highlighting the first one
    const targetTab = document.querySelector(`.tab-button[onclick*="'${currentAssetClass}'"]`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // Reset game state
    score = 0;
    trades = 0;
    breaches = 0;
    gameTime = 0;
    missedTimers = 0;
    escalationTimer = 0;
    sessionBreachesFixed = 0;
    isPaused = false; // Reset pause state
    adminSettings.globalVolatilityMultiplier = baseGlobalVolatility;
    updateGlobalVolatilityDisplay(); // Defined in UI module
    
    // Reset pause button state
    const btn = document.getElementById('pauseBtn');
    btn.textContent = 'Pause';
    btn.className = 'control-btn';
    
    // Clear all breach tracking
    Object.keys(assetClassBreaches).forEach(assetClass => {
        assetClassBreaches[assetClass].clear();
        assetClassTimers[assetClass] = {};
    });
    breachedMarkets.clear();
    individualBreachTimers = {};
    hasActiveBreach = false;

    Object.keys(expiredBreaches).forEach(assetClass => {
        expiredBreaches[assetClass].clear();
    });

    // Reset powerups
    Object.keys(activePowerups).forEach(powerupType => {
        activePowerups[powerupType] = { active: false, timeLeft: 0, cooldown: 0 };
    });
    
    clearAllIntervals();

    // Ensure markets is properly initialized for the current asset class
markets = [...marketData[currentAssetClass]];
    

    gameInterval = setInterval(updateExposures, gameSpeed); // updateExposures defined in markets module
    timerInterval = setInterval(() => {
        if (!isPaused) {
            gameTime++;
            updateBreachTimers(); // Defined in markets module
            handleEscalatingDifficulty();
        }
        updateScore(); // Defined in UI module - always update to show current state
    }, 1000);
    powerupInterval = setInterval(updatePowerupTimers, 1000); // Defined in powerups module
    
    updateStrikesDisplay(); // Defined in UI module
    updateScore(); // Defined in UI module
    const difficultyDisplay = document.getElementById('difficultyDisplay');
    if (difficultyDisplay) {
        difficultyDisplay.textContent = ['Easy', 'Normal', 'Hard'][gameDifficulty - 1];
    }
    initializeGame(); // Defined in markets module
    populateQuickPowerupBar(); // Initialize quick access powerup bar
}

function endGame(message) {
    
    clearAllIntervals();
    
    const gameXP = Math.max(0, Math.floor(score / 10));
    const gameCoins = Math.max(0, Math.floor(score / adminSettings.coinRewards.endGameMultiplier));
    const oldLevel = userProfile.level;
    const wasNewBest = score > userProfile.bestScore;
    
      awardXP(gameXP); // Defined in trading module
    awardCoins(gameCoins); // Defined in trading module
    
    userProfile.gamesPlayed++;
    if (score > userProfile.bestScore) {
        userProfile.bestScore = score;
    }
    if (score > 0) {
        userProfile.wins++;
    }
    
// Save game session data with error handling
if (currentUser && !isGuestMode) {
    try {
        validateAndRepairUserProfile(); // Ensure data integrity before saving
        saveGameSession({
            score: Math.max(0, score),
            duration: Math.max(0, gameTime),
            trades: Math.max(0, trades),
            breaches: Math.max(0, breaches),
            difficulty: Math.max(1, Math.min(3, gameDifficulty))
        });
        saveUserProgress();
    } catch (error) {
        console.error('Failed to save game data:', error);
        // Continue with game over display even if save fails
    }
}
    
       setTimeout(() => {
        showGameOverModal(message, gameXP, gameCoins, oldLevel !== userProfile.level, wasNewBest); // Defined in UI module
    }, 100);
}

// Pause/resume functionality
function togglePause() {
    if (isPaused) {
        resumeGame();
    } else {
        showPauseMenu(); // Defined in UI module
    }
}

function resumeGame() {
    isPaused = false;
    
    // Update pause button state
    const btn = document.getElementById('pauseBtn');
    btn.textContent = 'Pause';
    btn.className = 'control-btn';
    
    // Hide pause menu
    document.getElementById('pauseMenuModal').style.display = 'none';
    
    // Ensure game screen is visible and menu screen is hidden
    document.getElementById('gameScreen').style.display = 'block';
    document.getElementById('menuScreen').style.display = 'none';
    document.getElementById('authScreen').style.display = 'none';
}

function endGameFromPause() {
    // Hide pause menu first
    document.getElementById('pauseMenuModal').style.display = 'none';
    
    // End the game normally - this will show the game over screen
    endGame(`Game ended manually. Final score: ${score}`).catch(console.error);
}

function returnToMenu() {
    clearAllIntervals(); // Ensure all intervals are stopped
    
    document.getElementById('gameScreen').style.display = 'none';
    const menuScreen = document.getElementById('menuScreen');
    menuScreen.style.display = 'flex';
    menuScreen.style.visibility = 'visible';
    menuScreen.style.position = 'fixed';
    menuScreen.style.top = '0';
    updateMenuDisplay(); // Defined in UI module
    
    // Auto-save progress when returning to menu
    if (currentUser && !isGuestMode) {
        saveUserProgress();
    }
}

// Difficulty management
function selectMenuDifficulty(difficultyLevel) {
    gameDifficulty = difficultyLevel;
    gameSpeed = gameDifficulty === 1 ? 700 : gameDifficulty === 2 ? 400 : 350;
    
    document.querySelectorAll('.menu-difficulty-pill').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelector(`[data-difficulty="${difficultyLevel}"]`).classList.add('active');
    
    // Update trend strengths for all markets based on new difficulty
    Object.keys(marketData).forEach(assetClass => {
        marketData[assetClass].forEach(market => {
            market.trendStrength = Math.max(market.trendStrength, gameDifficulty === 3 ? 1.75 : 1.5);
        });
    });
}

function ensureDefaultDifficulty() {
    // Only set if no difficulty is currently selected
    const currentlyActive = document.querySelector('.menu-difficulty-pill.active');
    if (!currentlyActive) {
        selectMenuDifficulty(gameDifficulty);
    }
}


function changeDifficulty() {
    gameDifficulty = gameDifficulty >= 3 ? 1 : gameDifficulty + 1;
    gameSpeed = gameDifficulty === 1 ? 700 : gameDifficulty === 2 ? 400 : 350;
        
    Object.keys(marketData).forEach(assetClass => {
        marketData[assetClass].forEach(market => {
            market.trendStrength = Math.max(market.trendStrength, gameDifficulty === 3 ? 1.75 : 1.5);
        });
    });
    
    document.getElementById('difficultyDisplay').textContent = ['Easy', 'Normal', 'Hard'][gameDifficulty - 1];
    
    clearAllIntervals();
    
    gameInterval = setInterval(() => {
        updateExposures(); // Defined in markets module
    }, gameSpeed);
    
    timerInterval = setInterval(() => {
        if (!isPaused) {
            gameTime++;
            updateBreachTimers(); // Defined in markets module
            handleEscalatingDifficulty();
        }
        updateScore(); // Defined in UI module
    }, 1000);
    powerupInterval = setInterval(updatePowerupTimers, 1000); // Defined in powerups module
}

// Escalating difficulty system
function handleEscalatingDifficulty() {
    if (isPaused || !gameEndSettings.enableEscalatingDifficulty) return;
    
    escalationTimer++;
    if (escalationTimer >= gameEndSettings.escalationInterval) {
        // Use difficulty-based escalation amount
        const escalationAmount = gameDifficulty === 1 ? 0.25 : gameDifficulty === 2 ? 0.5 : 0.75;
        adminSettings.globalVolatilityMultiplier += escalationAmount;
        escalationTimer = 0;
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ff5722, #d84315);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 1500;
            border: 1px solid rgba(255,255,255,0.3);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        notification.textContent = `Market volatility increased! (${adminSettings.globalVolatilityMultiplier.toFixed(1)}x)`;
        document.body.appendChild(notification);
        
        const cleanupNotification = () => {
            try {
                if (notification && notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            } catch (e) {
                // Silently handle case where element was already removed
            }
            notification = null; // Ensure garbage collection
        };
        
        setTimeout(cleanupNotification, 3000);
        
        // Also cleanup on page unload to prevent memory leaks
        window.addEventListener('beforeunload', cleanupNotification, { once: true });
        
        updateGlobalVolatilityDisplay(); // Defined in UI module
    }
}

// Game end condition checking
function checkGameEndConditions() {
  
    if (gameEndSettings.enableTimeLimit && gameTime >= gameEndSettings.timeLimitMinutes * 60) {
        endGame(`Time's up! Final score: ${score}`).catch(console.error);
        return true;
    }
    
    if (gameEndSettings.enableMissedTimerLimit && missedTimers >= gameEndSettings.maxMissedTimers) {
        endGame(`Game Over! You missed ${gameEndSettings.maxMissedTimers} breach timers. Final score: ${score}`).catch(console.error);
        return true;
    }
    
    return false;
}

// Reset game functionality (for the "Reset" button in-game)
function resetGame() {
    Object.keys(expiredBreaches).forEach(assetClass => {
        expiredBreaches[assetClass].clear();
    });
    
    const gameXP = Math.max(0, Math.floor(score / 10));
    const gameCoins = Math.max(0, Math.floor(score / adminSettings.coinRewards.endGameMultiplier));
    awardXP(gameXP); // Defined in trading module
    awardCoins(gameCoins); // Defined in trading module
    
    if (breaches === 0 && gameTime > 30) {
        awardCoins(adminSettings.coinRewards.perfectGameBonus); // Defined in trading module
        awardXP(25); // Defined in trading module
    }
    
    Object.keys(activePowerups).forEach(powerupType => {
        activePowerups[powerupType] = { active: false, timeLeft: 0, cooldown: 0 };
    });
    
    initializeAllAssetClasses();
    markets = marketData[currentAssetClass];
    
    score = 0;
    trades = 0;
    breaches = 0;
    gameTime = 0;
    missedTimers = 0;
    escalationTimer = 0;
    sessionBreachesFixed = 0;
    adminSettings.globalVolatilityMultiplier = baseGlobalVolatility;
    updateGlobalVolatilityDisplay(); // Defined in UI module
    breachedMarkets.clear();
    individualBreachTimers = {};
    hasActiveBreach = false;
    
    Object.keys(assetClassBreaches).forEach(assetClass => {
        assetClassBreaches[assetClass].clear();
        assetClassTimers[assetClass] = {};
    });
    
    updateScore(); // Defined in UI module
    updateDisplay(); // Defined in markets module
    updateProfileDisplay(); // Defined in UI module
    updateUnlockedAssets(); // Defined in UI module
    updatePowerupsDisplay(); // Defined in powerups module
    updateStrikesDisplay(); // Defined in UI module
}

// Admin panel functions
function toggleAdminPanel() {
    showAdminPanel = !showAdminPanel;
    const panel = document.getElementById('adminPanel');
    panel.style.display = showAdminPanel ? 'block' : 'none';
    if (showAdminPanel) {
        updateGlobalVolatilityDisplay(); // Defined in UI module
        loadAdminPanelValues(); // Defined in UI module
    }
}

function updateAdminSetting(setting, value) {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
        adminSettings[setting] = numValue;
        
        if (setting === 'globalVolatilityMultiplier') {
            updateGlobalVolatilityDisplay(); // Defined in UI module
        }
    }
}


function updateAssetSetting(category, assetClass, value) {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
        adminSettings[category][assetClass] = numValue;
    }
}

function updateCoinSetting(setting, value) {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
        adminSettings.coinRewards[setting] = numValue;
    }
}

function updateGameEndSetting(setting, value) {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
        gameEndSettings[setting] = numValue;
    }
}

function toggleGameEndCondition(condition) {
    gameEndSettings[condition] = !gameEndSettings[condition];
    updateGameEndButtons(); // Defined in UI module
}

function resetAdminSettings() {
    adminSettings = {
        breachHedgePoints: 25,
        breachClearBonus: 50,
        goodTradeBonus: 15,
        badTradePenalty: -50,
        worseBreachPenalty: -75,
        causeBreachPenalty: -100,
        timeoutPenalty: -150,
        globalVolatilityMultiplier: 1.0,
        breachTimerSeconds: 10,
        assetVolatilityMultipliers: {
            indices: 1.0,
            forex: 0.6,
            shares: 1.4,
            commodities: 1.2,
            crypto: 2.0
        },
        coinRewards: {
            goodTrade: 1,
            breachHedge: 2,
            breachClear: 8,
            endGameMultiplier: 20,
            perfectGameBonus: 50,
            levelUpBonus: 25
        }
    };
        
    // Safely update admin panel inputs
    const adminInputs = [
        'breachHedgePoints', 'breachClearBonus', 'goodTradeBonus', 'badTradePenalty',
        'worseBreachPenalty', 'causeBreachPenalty', 'timeoutPenalty', 'globalVolatilityMultiplier',
        'breachTimerSeconds', 'goodTradeCoins', 'breachHedgeCoins', 'breachClearCoins',
        'endGameDivisor', 'perfectGameCoins', 'levelUpCoins'
    ];
    
    adminInputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            if (inputId.includes('Coins') || inputId.includes('Divisor')) {
                element.value = adminSettings.coinRewards[inputId.replace('Coins', '').replace('Divisor', 'Multiplier')] || adminSettings.coinRewards.endGameMultiplier;
            } else {
                element.value = adminSettings[inputId];
            }
        }
    });
    
    Object.keys(adminSettings.assetVolatilityMultipliers).forEach(assetClass => {
        const volInput = document.getElementById(`${assetClass}VolatilityMultiplier`);
        if (volInput) volInput.value = adminSettings.assetVolatilityMultipliers[assetClass];
    });
}

// Utility function for time formatting
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
}

// Export to global scope to prevent redeclaration conflicts
window.currentAssetClass = currentAssetClass;
window.currentView = currentView;
window.markets = markets;
window.score = score;
window.trades = trades;
window.breaches = breaches;
window.gameTime = gameTime;
window.missedTimers = missedTimers;
window.escalationTimer = escalationTimer;
window.sessionBreachesFixed = sessionBreachesFixed;
window.isPaused = isPaused;
window.gameSpeed = gameSpeed;
window.gameDifficulty = gameDifficulty;
window.assetClassBreaches = assetClassBreaches;
window.expiredBreaches = expiredBreaches;
window.assetClassTimers = assetClassTimers;
window.breachedMarkets = breachedMarkets;
window.individualBreachTimers = individualBreachTimers;
window.hasActiveBreach = hasActiveBreach;
window.gameInterval = gameInterval;
window.timerInterval = timerInterval;
window.powerupInterval = powerupInterval;
window.showAdminPanel = showAdminPanel;
window.initializeAllAssetClasses = initializeAllAssetClasses;
window.initializeEverything = initializeEverything;
window.resetToDefaults = resetToDefaults;
window.resetGameState = resetGameState;
window.startGame = startGame;
window.endGame = endGame;
window.togglePause = togglePause;
window.resumeGame = resumeGame;
window.endGameFromPause = endGameFromPause;
window.returnToMenu = returnToMenu;
window.selectMenuDifficulty = selectMenuDifficulty;
window.changeDifficulty = changeDifficulty;
window.handleEscalatingDifficulty = handleEscalatingDifficulty;
window.checkGameEndConditions = checkGameEndConditions;
window.resetGame = resetGame;
window.toggleAdminPanel = toggleAdminPanel;
window.updateAdminSetting = updateAdminSetting;
window.updateAssetSetting = updateAssetSetting;
window.updateCoinSetting = updateCoinSetting;
window.updateGameEndSetting = updateGameEndSetting;
window.toggleGameEndCondition = toggleGameEndCondition;
window.resetAdminSettings = resetAdminSettings;
window.formatTime = formatTime;
window.ensureDefaultDifficulty = ensureDefaultDifficulty;
window.clearAllIntervals = clearAllIntervals;