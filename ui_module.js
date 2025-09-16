// ===== UI MANAGEMENT MODULE =====
// Dependencies: config.js (userProfile, gameEndSettings, adminSettings), gameState.js (score, trades, etc.)
// Exposes: Screen transitions, display updates, modal management, safe DOM updates

// Screen transition functions
function showAuthScreen() {
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('menuScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'none';
}

function showMenu() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('menuScreen').style.display = 'flex';
    document.getElementById('gameScreen').style.display = 'none';
    
    const logoutBtn = document.getElementById('logoutBtn');
    const createAccountBtn = document.getElementById('createAccountBtn');
    
    if (logoutBtn) {
        logoutBtn.style.display = currentUser && !isGuestMode ? 'flex' : 'none';
    }
    
    if (createAccountBtn) {
        createAccountBtn.style.display = isGuestMode ? 'flex' : 'none';
    }
    
    // Initialize game systems if not already done
    initializeEverything(); // Defined in gameState module
    updateMenuDisplay();

    // Ensure default difficulty shows
    ensureDefaultDifficulty(); // Defined in gameState module
}

// Safe DOM update functions
function safeUpdateElement(id, content, property = 'textContent') {
    const element = document.getElementById(id);
    if (element) {
        element[property] = content;
    }
}

function safeUpdateStyle(id, property, value) {
    const element = document.getElementById(id);
    if (element && element.style) {
        element.style[property] = value;
    }
}

// Profile display functions
function updateProfileDisplay() {
    safeUpdateElement('usernameDisplay', userProfile.username);
    safeUpdateElement('levelBadge', `Level ${userProfile.level}`);
    safeUpdateElement('coinsDisplay', `${Math.floor(userProfile.coins)} 🪙`);
    populateQuickPowerupBar(); // Update quick access powerup bar
    
    const currentLevelReq = generateLevelRequirement(userProfile.level); // Defined in config module
    const xpPercent = (userProfile.currentXP / currentLevelReq) * 100;
    
    safeUpdateStyle('xpBar', 'width', `${xpPercent}%`);
    safeUpdateElement('xpText', `${userProfile.currentXP} / ${currentLevelReq} XP`);
}

function updateMenuDisplay() {
    safeUpdateElement('menuUsername', userProfile.username);
    safeUpdateElement('menuLevelCircle', `L${userProfile.level}`);
    safeUpdateElement('menuCoins', Math.floor(userProfile.coins));
    safeUpdateElement('menuAssets', userProfile.unlockedAssets.length);
    populateQuickPowerupBar(); // Update quick access powerup bar
    
    const currentLevelReq = generateLevelRequirement(userProfile.level); // Defined in config module
    const xpPercent = (userProfile.currentXP / currentLevelReq) * 100;
    
    safeUpdateStyle('menuXpBar', 'width', `${xpPercent}%`);
    safeUpdateElement('menuXpText', `${userProfile.currentXP} / ${currentLevelReq} XP`);
    safeUpdateElement('menuGamesPlayed', userProfile.gamesPlayed);
    safeUpdateElement('menuBestScore', userProfile.bestScore);
}

// Game score display
function updateScore() {
    safeUpdateElement('score', score);
    safeUpdateElement('trades', trades);
    safeUpdateElement('breaches', breaches);
    safeUpdateElement('time', gameTime);
    safeUpdateElement('difficulty', ['Easy', 'Normal', 'Hard'][gameDifficulty - 1]);
}

// Strikes display (lives remaining)
function updateStrikesDisplay() {
    const strikesLeft = gameEndSettings.maxMissedTimers - missedTimers;
    
    for (let i = 1; i <= 3; i++) {
        const strikeIcon = document.getElementById(`strike${i}`);
        if (strikeIcon) {
            if (i <= strikesLeft) {
                strikeIcon.className = 'strike-icon active';
                if (strikesLeft === 1) {
                    strikeIcon.classList.add('warning');
                }
            } else {
                strikeIcon.className = 'strike-icon lost';
            }
        }
    }
}

// Asset unlock display
function updateUnlockedAssets() {
    const sharesLock = document.getElementById('sharesLock');
    const cryptoLock = document.getElementById('cryptoLock');
    
    if (sharesLock) {
        sharesLock.style.display = userProfile.unlockedAssets.includes('shares') ? 'none' : 'block';
    }
    if (cryptoLock) {
        cryptoLock.style.display = userProfile.unlockedAssets.includes('crypto') ? 'none' : 'block';
    }
}

// Level up notification
function showLevelUp() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(145deg, #ff9800, #f57c00);
        color: white;
        padding: 20px 30px;
        border-radius: 10px;
        font-weight: bold;
        font-size: 18px;
        z-index: 2000;
        border: 2px solid rgba(255,255,255,0.3);
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    `;
    notification.textContent = `LEVEL UP! You are now Level ${userProfile.level}!`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        try {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        } catch (e) {
            // Silently handle case where element was already removed
        }
    }, 2000);
}

// Pause menu functions
function showPauseMenu() {
    isPaused = true;
    
    // Update pause menu with current stats
    document.getElementById('pauseScore').textContent = score;
    document.getElementById('pauseTime').textContent = `${gameTime}s`;
    
    // Update pause button state
    const btn = document.getElementById('pauseBtn');
    btn.textContent = 'Resume';
    btn.className = 'control-btn paused';
    
    // Show pause menu
    document.getElementById('pauseMenuModal').style.display = 'flex';
}

// Game over modal
function showGameOverModal(message, xpEarned, coinsEarned, leveledUp, newBest) {
    
    const modal = document.getElementById('gameOverModal');
    
    if (!modal) {
        console.error("gameOverModal element not found!");
        alert(message);
        return;
    }
       
    // Safely update modal content with null checks
    const elements = {
        'gameOverMessage': message,
        'finalScore': score,
        'survivalTime': formatTime(gameTime), // Defined in gameState module
        'totalTradesMade': trades,
        'breachesHandled': sessionBreachesFixed,
        'sessionXP': `+${xpEarned} XP`,
        'sessionCoins': `+${coinsEarned}`
    };
    
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = elements[id];
        }
    });
    
    // Show level up indicator if applicable
    const levelUpDiv = document.getElementById('levelUpIndicator');
    if (levelUpDiv) {
        levelUpDiv.style.display = leveledUp ? 'flex' : 'none';
    }
    
    // Show new best score indicator if applicable
    const bestScoreDiv = document.getElementById('newBestScore');
    if (bestScoreDiv) {
        bestScoreDiv.style.display = newBest ? 'flex' : 'none';
    }
    
    
    // Force display the modal
    modal.style.display = 'flex';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.zIndex = '9999';
    
}

function closeGameOver() {
    document.getElementById('gameOverModal').style.display = 'none';
    returnToMenu(); // Defined in gameState module
}

function playAgain() {
    document.getElementById('gameOverModal').style.display = 'none';
    resetGameState(); // Defined in gameState module
    startGame(); // Defined in gameState module
}

// Instructions modal
function showInstructions() {
    document.getElementById('instructionsModal').style.display = 'flex';
}

function closeInstructions() {
    document.getElementById('instructionsModal').style.display = 'none';
}

// Shop modal and functions
function showShop() {
    document.getElementById('shopCoins').textContent = Math.floor(userProfile.coins);
    document.getElementById('freezeTimerShopCount').textContent = userProfile.powerUps.freezeTimer;
    document.getElementById('reduceExposuresShopCount').textContent = userProfile.powerUps.reduceExposures;
    document.getElementById('marketFreezeShopCount').textContent = userProfile.powerUps.marketFreeze;
    document.getElementById('volatilityShieldShopCount').textContent = userProfile.powerUps.volatilityShield;
    document.getElementById('tradingPlacesShopCount').textContent = userProfile.powerUps.tradingPlaces;
    document.getElementById('hotVolsShopCount').textContent = userProfile.powerUps.hotVols;
    document.getElementById('noddingBirdShopCount').textContent = userProfile.powerUps.noddingBird;
    updateShopAvailability();
    document.getElementById('shopModal').style.display = 'flex';
}

function closeShop() {
    document.getElementById('shopModal').style.display = 'none';
}

function updateShopAvailability() {
    const availableCoins = Math.floor(userProfile.coins);
    
    const sharesBtn = document.getElementById('buyShares');
    if (userProfile.unlockedAssets.includes('shares')) {
        sharesBtn.textContent = 'Owned ✓';
        sharesBtn.style.background = '#4CAF50';
        sharesBtn.disabled = true;
    } else if (userProfile.level < 3) {
        sharesBtn.textContent = 'Level 3';
        sharesBtn.style.background = '#666';
        sharesBtn.disabled = true;
    } else if (availableCoins < 150) {
        sharesBtn.textContent = '150 🪙';
        sharesBtn.style.background = '#666';
        sharesBtn.disabled = true;
    } else {
        sharesBtn.textContent = '150 🪙';
        sharesBtn.style.background = '#ffd700';
        sharesBtn.disabled = false;
    }
    
    const cryptoBtn = document.getElementById('buyCrypto');
    if (userProfile.unlockedAssets.includes('crypto')) {
        cryptoBtn.textContent = 'Owned ✓';
        cryptoBtn.style.background = '#4CAF50';
        cryptoBtn.disabled = true;
    } else if (userProfile.level < 5) {
        cryptoBtn.textContent = 'Level 5';
        cryptoBtn.style.background = '#666';
        cryptoBtn.disabled = true;
    } else if (availableCoins < 300) {
        cryptoBtn.textContent = '300 🪙';
        cryptoBtn.style.background = '#666';
        cryptoBtn.disabled = true;
    } else {
        cryptoBtn.textContent = '300 🪙';
        cryptoBtn.style.background = '#ffd700';
        cryptoBtn.disabled = false;
    }
}

// Admin panel display functions
function updateGlobalVolatilityDisplay() {
    const element = document.getElementById('currentGlobalVolatility');
    if (element) {
        element.textContent = adminSettings.globalVolatilityMultiplier.toFixed(1);
        
        // Color coding based on volatility level
        if (adminSettings.globalVolatilityMultiplier <= 1.0) {
            element.style.color = '#00ff00'; // Green for normal
        } else if (adminSettings.globalVolatilityMultiplier <= 2.0) {
            element.style.color = '#ffff00'; // Yellow for elevated
        } else {
            element.style.color = '#ff0000'; // Red for high
        }
    }
}

function loadAdminPanelValues() {
    // Load scoring system values
    document.getElementById('breachHedgePoints').value = adminSettings.breachHedgePoints;
    document.getElementById('breachClearBonus').value = adminSettings.breachClearBonus;
    document.getElementById('goodTradeBonus').value = adminSettings.goodTradeBonus;
    document.getElementById('badTradePenalty').value = adminSettings.badTradePenalty;
    document.getElementById('causeBreachPenalty').value = adminSettings.causeBreachPenalty;
    document.getElementById('worseBreachPenalty').value = adminSettings.worseBreachPenalty;
    document.getElementById('timeoutPenalty').value = adminSettings.timeoutPenalty;
    
    // Load market behavior values
    document.getElementById('globalVolatilityMultiplier').value = adminSettings.globalVolatilityMultiplier;
    document.getElementById('breachTimerSeconds').value = adminSettings.breachTimerSeconds;
    
    // Load coin rewards values
    document.getElementById('goodTradeCoins').value = adminSettings.coinRewards.goodTrade;
    document.getElementById('breachHedgeCoins').value = adminSettings.coinRewards.breachHedge;
    document.getElementById('breachClearCoins').value = adminSettings.coinRewards.breachClear;
    document.getElementById('endGameDivisor').value = adminSettings.coinRewards.endGameMultiplier;
    document.getElementById('perfectGameCoins').value = adminSettings.coinRewards.perfectGameBonus;
    document.getElementById('levelUpCoins').value = adminSettings.coinRewards.levelUpBonus;
    
    // Load asset volatility multipliers
    Object.keys(adminSettings.assetVolatilityMultipliers).forEach(assetClass => {
        const volInput = document.getElementById(`${assetClass}VolatilityMultiplier`);
        if (volInput) volInput.value = adminSettings.assetVolatilityMultipliers[assetClass];
    });
    
    // Load game end settings
    document.getElementById('maxMissedTimers').value = gameEndSettings.maxMissedTimers;
    document.getElementById('timeLimitMinutes').value = gameEndSettings.timeLimitMinutes;
    document.getElementById('escalationAmount').value = gameEndSettings.escalationAmount;
    
    updateGameEndButtons();
}

function updateGameEndButtons() {
    const missedTimerBtn = document.getElementById('toggleMissedTimer');
    const timeLimitBtn = document.getElementById('toggleTimeLimit');
    const escalatingBtn = document.getElementById('toggleEscalating');
    
    if (missedTimerBtn) {
        missedTimerBtn.textContent = `Missed Timer Limit: ${gameEndSettings.enableMissedTimerLimit ? 'ON' : 'OFF'}`;
        missedTimerBtn.style.background = gameEndSettings.enableMissedTimerLimit ? '#4CAF50' : '#666';
    }
    
    if (timeLimitBtn) {
        timeLimitBtn.textContent = `Time Limit: ${gameEndSettings.enableTimeLimit ? 'ON' : 'OFF'}`;
        timeLimitBtn.style.background = gameEndSettings.enableTimeLimit ? '#4CAF50' : '#666';
    }
    
    if (escalatingBtn) {
        escalatingBtn.textContent = `Escalating: ${gameEndSettings.enableEscalatingDifficulty ? 'ON' : 'OFF'}`;
        escalatingBtn.style.background = gameEndSettings.enableEscalatingDifficulty ? '#4CAF50' : '#666';
    }
}

function updateCareerDisplay() {
    const careerLevels = document.querySelectorAll('.career-level');
    careerLevels.forEach((levelDiv, index) => {
        const level = index + 1;
        levelDiv.className = 'career-level';
        
        if (level < userProfile.level) {
            levelDiv.classList.add('unlocked');
        } else if (level === userProfile.level) {
            levelDiv.classList.add('current');
        } else {
            levelDiv.classList.add('locked');
        }
    });
}

function showCareer() {
    updateCareerDisplay();
    document.getElementById('careerModal').style.display = 'flex';
}

function closeCareer() {
    document.getElementById('careerModal').style.display = 'none';
}

function switchLeaderboardTab(tab) {
    document.querySelectorAll('.leaderboard-tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById('levelLeaderboard').style.display = 'none';
    document.getElementById('scoreLeaderboard').style.display = 'none';
    
    if (tab === 'level') {
        document.querySelector('.leaderboard-tab-button:first-child').classList.add('active');
        document.getElementById('levelLeaderboard').style.display = 'block';
    } else {
        document.querySelector('.leaderboard-tab-button:last-child').classList.add('active');
        document.getElementById('scoreLeaderboard').style.display = 'block';
    }
}

// Export to global scope
window.showAuthScreen = showAuthScreen;
window.showMenu = showMenu;
window.safeUpdateElement = safeUpdateElement;
window.safeUpdateStyle = safeUpdateStyle;
window.updateProfileDisplay = updateProfileDisplay;
window.updateMenuDisplay = updateMenuDisplay;
window.updateScore = updateScore;
window.updateStrikesDisplay = updateStrikesDisplay;
window.updateUnlockedAssets = updateUnlockedAssets;
window.showLevelUp = showLevelUp;
window.showPauseMenu = showPauseMenu;
window.showGameOverModal = showGameOverModal;
window.closeGameOver = closeGameOver;
window.playAgain = playAgain;
window.showInstructions = showInstructions;
window.closeInstructions = closeInstructions;
window.showShop = showShop;
window.closeShop = closeShop;
window.updateShopAvailability = updateShopAvailability;
window.updateGlobalVolatilityDisplay = updateGlobalVolatilityDisplay;
window.loadAdminPanelValues = loadAdminPanelValues;
window.updateGameEndButtons = updateGameEndButtons;
window.updateCareerDisplay = updateCareerDisplay;
window.showCareer = showCareer;
window.closeCareer = closeCareer;
window.switchLeaderboardTab = switchLeaderboardTab;