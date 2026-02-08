// ===== UI MANAGEMENT MODULE =====
// Dependencies: config.js (userProfile, gameEndSettings, adminSettings), gameState.js (score, trades, etc.)
// Exposes: Screen transitions, display updates, modal management, safe DOM updates

// Enhanced DOM safety utilities
function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }
        
        const observer = new MutationObserver((mutations, obs) => {
            const element = document.querySelector(selector);
            if (element) {
                obs.disconnect();
                resolve(element);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }, timeout);
    });
}

function safeElementOperation(selector, operation, fallback = null) {
    try {
        const element = document.querySelector(selector);
        if (element) {
            return operation(element);
        } else {
            console.warn(`Element not found: ${selector}`);
            return fallback;
        }
    } catch (error) {
        console.error(`Error in DOM operation for ${selector}:`, error);
        return fallback;
    }
}

// Screen transition functions
function showAuthScreen() {
    safeElementOperation('#authScreen', el => el.style.display = 'flex');
    safeElementOperation('#menuScreen', el => el.style.display = 'none');
    safeElementOperation('#gameScreen', el => el.style.display = 'none');
}

function showMenu() {
    safeElementOperation('#authScreen', el => el.style.display = 'none');
    safeElementOperation('#menuScreen', el => el.style.display = 'flex');
    safeElementOperation('#gameScreen', el => el.style.display = 'none');
    
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

    // Update admin controls visibility
    updateAdminControls();


}

// Safe DOM update functions
function safeUpdateElement(id, content, property = 'textContent') {
    return safeElementOperation(`#${id}`, el => {
        el[property] = content;
        return true;
    }, false);
}

function safeUpdateStyle(id, property, value) {
    return safeElementOperation(`#${id}`, el => {
        if (el.style) {
            el.style[property] = value;
            return true;
        }
        return false;
    }, false);
}

function safeAddClass(id, className) {
    return safeElementOperation(`#${id}`, el => {
        el.classList.add(className);
        return true;
    }, false);
}

function safeRemoveClass(id, className) {
    return safeElementOperation(`#${id}`, el => {
        el.classList.remove(className);
        return true;
    }, false);
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
    safeUpdateElement('time', gameTime);
    
    // Calculate effective volatility accounting for powerups
    let effectiveVolatility = adminSettings.globalVolatilityMultiplier;
    
    // Volatility Shield reduces volatility by 70%
    if (activePowerups.volatilityShield.active) {
        effectiveVolatility *= 0.3; // 30% of original = 70% reduction
    }
    
    // Display VIX-style volatility with color coding
    const vixValue = (effectiveVolatility * 10).toFixed(1);
    const vixElement = document.getElementById('vixDisplay');
    
    if (vixElement) {
        vixElement.textContent = vixValue;
        
        // Remove all VIX classes first
        vixElement.className = vixElement.className.replace(/vix-\w+/g, '');
        
        // Check if affected by powerups
        const isAffectedByPowerup = activePowerups.hotVols.active || activePowerups.volatilityShield.active;
        
        if (isAffectedByPowerup) {
            vixElement.classList.add('vix-powerup');
        } else {
            // Add color coding based on VIX level
            const vixNum = parseFloat(vixValue);
            if (vixNum < 20) {
                vixElement.classList.add('vix-low');
            } else if (vixNum < 30) {
                vixElement.classList.add('vix-normal');
            } else if (vixNum < 40) {
                vixElement.classList.add('vix-high');
            } else {
                vixElement.classList.add('vix-extreme');
            }
        }
    }
}

// Strikes display (lives remaining)
function updateStrikesDisplay() {
    const strikesLeft = gameEndSettings.maxMissedTimers - missedTimers;
    
    for (let i = 1; i <= 3; i++) {
        safeElementOperation(`#strike${i}`, strikeIcon => {
            if (i <= strikesLeft) {
                strikeIcon.className = 'strike-icon active';
                if (strikesLeft === 1) {
                    strikeIcon.classList.add('warning');
                }
            } else {
                strikeIcon.className = 'strike-icon lost';
            }
        });
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
    
    const cleanup = () => {
        try {
            if (notification && notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        } catch (e) {
            // Silently handle case where element was already removed
        }
    };
    
    const timeoutId = setTimeout(cleanup, 2000);
    
    // Store for potential cleanup
    if (!window.gameNotificationCleanups) {
        window.gameNotificationCleanups = [];
    }
    window.gameNotificationCleanups.push({
        cleanup: cleanup,
        timeoutId: timeoutId
    });
}

// Pause menu functions
function showPauseMenu() {
    isPaused = true;
    
    // Update pause menu with current stats
    safeUpdateElement('pauseScore', score);
    safeUpdateElement('pauseTime', `${gameTime}s`);
    
    // Update pause button state
    safeElementOperation('#pauseBtn', btn => {
        btn.textContent = 'Resume';
        btn.className = 'control-btn paused';
    });
    
    // Update sound UI to show current settings
    if (typeof updateSoundUI === 'function') {
        updateSoundUI();
    }
    
    // Show pause menu
    safeUpdateStyle('pauseMenuModal', 'display', 'flex');
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
        safeUpdateElement(id, elements[id]);
    });
    
    // Show level up indicator if applicable
    safeUpdateStyle('levelUpIndicator', 'display', leveledUp ? 'flex' : 'none');
    
    // Show new best score indicator if applicable
    safeUpdateStyle('newBestScore', 'display', newBest ? 'flex' : 'none');
    
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
    safeUpdateStyle('gameOverModal', 'display', 'none');
    returnToMenu(); // Defined in gameState module
}

function playAgain() {
    safeUpdateStyle('gameOverModal', 'display', 'none');
    resetGameState(); // Defined in gameState module
    startGame(); // Defined in gameState module
}

// Instructions modal
function showInstructions() {
    safeUpdateStyle('instructionsModal', 'display', 'flex');
}

function closeInstructions() {
    safeUpdateStyle('instructionsModal', 'display', 'none');
}

// Shop modal and functions
function showShop() {
    safeUpdateElement('shopCoins', Math.floor(userProfile.coins));
    safeUpdateElement('freezeTimerShopCount', userProfile.powerUps.freezeTimer);
    safeUpdateElement('reduceExposuresShopCount', userProfile.powerUps.reduceExposures);
    safeUpdateElement('marketFreezeShopCount', userProfile.powerUps.marketFreeze);
    safeUpdateElement('volatilityShieldShopCount', userProfile.powerUps.volatilityShield);
    safeUpdateElement('tradingPlacesShopCount', userProfile.powerUps.tradingPlaces);
    safeUpdateElement('hotVolsShopCount', userProfile.powerUps.hotVols);
    safeUpdateElement('noddingBirdShopCount', userProfile.powerUps.noddingBird);
    updateShopAvailability();
    safeUpdateStyle('shopModal', 'display', 'flex');
}

function closeShop() {
    safeUpdateStyle('shopModal', 'display', 'none');
}

function updateShopAvailability() {
    const availableCoins = Math.floor(userProfile.coins);
}

// Admin panel display functions
function updateGlobalVolatilityDisplay() {
    safeElementOperation('#currentGlobalVolatility', element => {
        element.textContent = adminSettings.globalVolatilityMultiplier.toFixed(1);
        
        // Color coding based on volatility level
        if (adminSettings.globalVolatilityMultiplier <= 1.0) {
            element.style.color = '#00ff00'; // Green for normal
        } else if (adminSettings.globalVolatilityMultiplier <= 2.0) {
            element.style.color = '#ffff00'; // Yellow for elevated
        } else {
            element.style.color = '#ff0000'; // Red for high
        }
    });
}

function loadAdminPanelValues() {
    // Load scoring system values with safe updates
    const adminSettings = window.adminSettings || {};
    
    safeUpdateElement('breachHedgePoints', adminSettings.breachHedgePoints, 'value');
    safeUpdateElement('breachClearBonus', adminSettings.breachClearBonus, 'value');
    safeUpdateElement('goodTradeBonus', adminSettings.goodTradeBonus, 'value');
    safeUpdateElement('badTradePenalty', adminSettings.badTradePenalty, 'value');
    safeUpdateElement('causeBreachPenalty', adminSettings.causeBreachPenalty, 'value');
    safeUpdateElement('worseBreachPenalty', adminSettings.worseBreachPenalty, 'value');
    safeUpdateElement('timeoutPenalty', adminSettings.timeoutPenalty, 'value');
    
    // Load market behavior values
    safeUpdateElement('globalVolatilityMultiplier', adminSettings.globalVolatilityMultiplier, 'value');
    safeUpdateElement('breachTimerSeconds', adminSettings.breachTimerSeconds, 'value');
    
    // Load coin rewards values
    if (adminSettings.coinRewards) {
        safeUpdateElement('goodTradeCoins', adminSettings.coinRewards.goodTrade, 'value');
        safeUpdateElement('breachHedgeCoins', adminSettings.coinRewards.breachHedge, 'value');
        safeUpdateElement('breachClearCoins', adminSettings.coinRewards.breachClear, 'value');
        safeUpdateElement('endGameDivisor', adminSettings.coinRewards.endGameMultiplier, 'value');
        safeUpdateElement('perfectGameCoins', adminSettings.coinRewards.perfectGameBonus, 'value');
        safeUpdateElement('levelUpCoins', adminSettings.coinRewards.levelUpBonus, 'value');
    }
    
    // Load asset volatility multipliers
    if (adminSettings.assetVolatilityMultipliers) {
        Object.keys(adminSettings.assetVolatilityMultipliers).forEach(assetClass => {
            safeUpdateElement(`${assetClass}VolatilityMultiplier`, adminSettings.assetVolatilityMultipliers[assetClass], 'value');
        });
    }
    
    // Load game end settings
    const gameEndSettings = window.gameEndSettings || {};
    safeUpdateElement('maxMissedTimers', gameEndSettings.maxMissedTimers, 'value');
    safeUpdateElement('timeLimitMinutes', gameEndSettings.timeLimitMinutes, 'value');
    safeUpdateElement('escalationAmount', gameEndSettings.escalationAmount, 'value');
    
    updateGameEndButtons();
}

function updateGameEndButtons() {
    const gameEndSettings = window.gameEndSettings || {};
    
    safeElementOperation('#toggleMissedTimer', missedTimerBtn => {
        missedTimerBtn.textContent = `Missed Timer Limit: ${gameEndSettings.enableMissedTimerLimit ? 'ON' : 'OFF'}`;
        missedTimerBtn.style.background = gameEndSettings.enableMissedTimerLimit ? '#4CAF50' : '#666';
    });
    
    safeElementOperation('#toggleTimeLimit', timeLimitBtn => {
        timeLimitBtn.textContent = `Time Limit: ${gameEndSettings.enableTimeLimit ? 'ON' : 'OFF'}`;
        timeLimitBtn.style.background = gameEndSettings.enableTimeLimit ? '#4CAF50' : '#666';
    });
    
    safeElementOperation('#toggleEscalating', escalatingBtn => {
        escalatingBtn.textContent = `Escalating: ${gameEndSettings.enableEscalatingDifficulty ? 'ON' : 'OFF'}`;
        escalatingBtn.style.background = gameEndSettings.enableEscalatingDifficulty ? '#4CAF50' : '#666';
    });
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
    safeUpdateStyle('careerModal', 'display', 'flex');
}

function closeCareer() {
    safeUpdateStyle('careerModal', 'display', 'none');
}

function switchLeaderboardTab(tab) {
    document.querySelectorAll('.leaderboard-tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    safeUpdateStyle('levelLeaderboard', 'display', 'none');
    safeUpdateStyle('scoreLeaderboard', 'display', 'none');
    
    if (tab === 'level') {
        safeElementOperation('.leaderboard-tab-button:first-child', btn => btn.classList.add('active'));
        safeUpdateStyle('levelLeaderboard', 'display', 'block');
    } else {
        safeElementOperation('.leaderboard-tab-button:last-child', btn => btn.classList.add('active'));
        safeUpdateStyle('scoreLeaderboard', 'display', 'block');
    }
}

// Admin UI management
function updateAdminControls() {
    const isAdmin = isAdminUser(); // Defined in auth module
    const adminElements = document.querySelectorAll('.admin-only');
    
    adminElements.forEach(element => {
        if (element) {
            element.style.display = isAdmin ? 'inline-block' : 'none';
        }
    });
}

// Export to global scope
window.showAuthScreen = showAuthScreen;
window.showMenu = showMenu;
window.safeUpdateElement = safeUpdateElement;
window.safeUpdateStyle = safeUpdateStyle;
window.safeAddClass = safeAddClass;
window.safeRemoveClass = safeRemoveClass;
window.safeElementOperation = safeElementOperation;
window.waitForElement = waitForElement;
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
window.updateAdminControls = updateAdminControls;