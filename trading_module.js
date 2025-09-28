// ===== TRADING SYSTEM MODULE =====
// Dependencies: config.js (adminSettings, userProfile), gameState.js (score, trades, etc.)
// Exposes: Buy/sell functions, XP/coin rewards, scoring calculations

// Core trading functions
function buyMarket(index) {
    if (isPaused) {
        alert('Cannot trade while game is paused!');
        return;
    }
    
    const market = markets[index];
    const oldAbsExposure = Math.abs(market.exposure);
    const wasBreached = Math.abs(market.exposure) >= market.limit;
        
    market.exposure += market.limit * 0.25;
    
    const newAbsExposure = Math.abs(market.exposure);
    const isNowBreached = Math.abs(market.exposure) >= market.limit;
    
    addTradeEffect(index);
    
    if (wasBreached && newAbsExposure < oldAbsExposure) {
        score += adminSettings.breachHedgePoints;
        trades++;
        userProfile.totalTrades++;
        awardXP(5);
        awardCoins(adminSettings.coinRewards.breachHedge);
        
        if (!isNowBreached) {
            const timeBonus = individualBreachTimers[index] ? Math.max(1, Math.floor(individualBreachTimers[index] / 2)) : 0;
            score += adminSettings.breachClearBonus + timeBonus;
            userProfile.breachesFixed++;
            sessionBreachesFixed++;
            awardXP(15);
            awardCoins(adminSettings.coinRewards.breachClear);
        }
    } else if (!wasBreached && isNowBreached) {
        score += adminSettings.causeBreachPenalty;
    } else if (!wasBreached && !isNowBreached && newAbsExposure < oldAbsExposure) {
        score += adminSettings.goodTradeBonus;
        trades++;
        userProfile.totalTrades++;
        awardXP(3);
        awardCoins(adminSettings.coinRewards.goodTrade);
    } else if (!wasBreached) {
        score += adminSettings.badTradePenalty;
    } else {
        score += adminSettings.worseBreachPenalty;
    }
    
    updateScore(); // Defined in UI module
    updateDisplay(); // Defined in markets module
}

// Data validation utilities
function validateNumericInput(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) {
        return { valid: false, error: 'Invalid number' };
    }
    if (num < min) {
        return { valid: false, error: `Value must be at least ${min}` };
    }
    if (num > max) {
        return { valid: false, error: `Value must be at most ${max}` };
    }
    return { valid: true, value: num };
}

function validateUserData(userData) {
    const errors = [];
    
    // Validate level
    const levelValidation = validateNumericInput(userData.level, 1, 1000);
    if (!levelValidation.valid) {
        errors.push(`Level: ${levelValidation.error}`);
    }
    
    // Validate coins
    const coinsValidation = validateNumericInput(userData.coins, 0, 1000000);
    if (!coinsValidation.valid) {
        errors.push(`Coins: ${coinsValidation.error}`);
    }
    
    return errors;
}

// Data integrity check function
function validateAndRepairUserProfile() {
    const errors = validateUserData(userProfile);
    
    if (errors.length > 0) {
        console.warn('User profile validation errors found:', errors);
        
        // Auto-repair common issues
        userProfile.level = Math.max(1, Math.min(1000, Math.floor(userProfile.level) || 1));
        userProfile.currentXP = Math.max(0, Math.min(100000, Math.floor(userProfile.currentXP) || 0));
        userProfile.totalXP = Math.max(0, Math.min(10000000, Math.floor(userProfile.totalXP) || 0));
        userProfile.coins = Math.max(0, Math.min(1000000, Math.floor(userProfile.coins) || 0));
        userProfile.gamesPlayed = Math.max(0, Math.min(100000, Math.floor(userProfile.gamesPlayed) || 0));
        userProfile.bestScore = Math.max(0, Math.min(10000000, Math.floor(userProfile.bestScore) || 0));
        
        // Ensure arrays are valid
        if (!Array.isArray(userProfile.unlockedAssets)) {
            userProfile.unlockedAssets = ['indices', 'forex', 'commodities'];
        }
        
        // Ensure powerUps object is valid
        if (!userProfile.powerUps || typeof userProfile.powerUps !== 'object') {
            userProfile.powerUps = {
                freezeTimer: 0,
                reduceExposures: 0,
                marketFreeze: 0,
                volatilityShield: 0,
                tradingPlaces: 0,
                hotVols: 0,
                noddingBird: 0
            };
        }
        
        console.log('User profile auto-repaired');
    }
    
    return errors.length === 0;
}

function sellMarket(index) {
    if (isPaused) {
        alert('Cannot trade while game is paused!');
        return;
    }
    
    const market = markets[index];
    const oldAbsExposure = Math.abs(market.exposure);
    const wasBreached = Math.abs(market.exposure) >= market.limit;
        
    market.exposure -= market.limit * 0.25;
    
    const newAbsExposure = Math.abs(market.exposure);
    const isNowBreached = Math.abs(market.exposure) >= market.limit;
    
    addTradeEffect(index);
    
    if (wasBreached && newAbsExposure < oldAbsExposure) {
        score += adminSettings.breachHedgePoints;
        trades++;
        userProfile.totalTrades++;
        awardXP(5);
        awardCoins(adminSettings.coinRewards.breachHedge);
        
        if (!isNowBreached) {
            const timeBonus = individualBreachTimers[index] ? Math.max(1, Math.floor(individualBreachTimers[index] / 2)) : 0;
            score += adminSettings.breachClearBonus + timeBonus;
            userProfile.breachesFixed++;
            sessionBreachesFixed++;
            awardXP(15);
            awardCoins(adminSettings.coinRewards.breachClear);
        }
    } else if (!wasBreached && isNowBreached) {
        score += adminSettings.causeBreachPenalty;
    } else if (!wasBreached && !isNowBreached && newAbsExposure < oldAbsExposure) {
        score += adminSettings.goodTradeBonus;
        trades++;
        userProfile.totalTrades++;
        awardXP(3);
        awardCoins(adminSettings.coinRewards.goodTrade);
    } else if (!wasBreached) {
        score += adminSettings.badTradePenalty;
    } else {
        score += adminSettings.worseBreachPenalty;
    }
    
    updateScore(); // Defined in UI module
    updateDisplay(); // Defined in markets module
}

function addTradeEffect(marketIndex) {
    const row = document.getElementById(`market-${marketIndex}`);
    if (row) {
        row.classList.add('trade-feedback');
        setTimeout(() => {
            row.classList.remove('trade-feedback');
        }, 500);
    }
}

// XP and coin reward system
function awardXP(amount) {
    // Validate input parameters first
    const xpAmount = validateNumericInput(amount, 0, 10000);
    if (!xpAmount.valid) {
        console.error('Invalid XP amount:', amount, xpAmount.error);
        return false; // Don't award invalid XP
    }
    
    try {
        // Ensure user profile is valid before modifying it
        const profileValid = validateAndRepairUserProfile();
        if (!profileValid) {
            console.error('User profile validation failed in awardXP');
            return false;
        }
        
        // Safely add XP
        userProfile.currentXP = Math.max(0, userProfile.currentXP + xpAmount.value);
        userProfile.totalXP = Math.max(0, userProfile.totalXP + xpAmount.value);
        
        // Prevent infinite loops by limiting level-ups per call
        let levelUpsThisCall = 0;
        const maxLevelUpsPerCall = 10;
        
        while (userProfile.currentXP >= generateLevelRequirement(userProfile.level) && 
        levelUpsThisCall < maxLevelUpsPerCall) {
     
     const levelReq = generateLevelRequirement(userProfile.level);
     userProfile.currentXP -= levelReq;
     userProfile.level++;
     levelUpsThisCall++;
     
     try {
         showLevelUp();
         awardCoins(adminSettings.coinRewards.levelUpBonus);
         
         // Auto-unlock asset classes at specific levels
// Auto-unlock asset classes at specific levels
if (userProfile.level === 3 && !userProfile.unlockedAssets.includes('shares')) {
    userProfile.unlockedAssets.push('shares');
    showAssetUnlockNotification('shares', 'Shares Markets');
    updateUnlockedAssets(); // Update UI to hide L3 badge
}

if (userProfile.level === 5 && !userProfile.unlockedAssets.includes('crypto')) {
    userProfile.unlockedAssets.push('crypto');
    showAssetUnlockNotification('crypto', 'Crypto Markets');  
    updateUnlockedAssets(); // Update UI to hide L5 badge
}
         
     } catch (uiError) {
         console.error('Error showing level up:', uiError);
         // Continue anyway - don't let UI errors stop progression
     }
 }
        
        // Update displays safely
        try {
            updateCareerDisplay();
            updateProfileDisplay();
            updateMenuDisplay();
        } catch (displayError) {
            console.error('Error updating displays after XP award:', displayError);
            // Don't throw - the XP was awarded successfully
        }
        
        return true; // Success
        
    } catch (error) {
        console.error('Critical error in awardXP:', error);
        return false;
    }
}

function awardCoins(amount) {
    userProfile.coins += amount;
    // Don't floor the actual stored value, only floor when displaying
    updateProfileDisplay(); // Defined in UI module
    updateMenuDisplay(); // Defined in UI module
}

// Shop system functions
function buyShopItem(item) {
    const availableCoins = Math.floor(userProfile.coins);
    
    if (item === 'freezeTimer') {
        if (availableCoins >= 25) {
            userProfile.coins -= 25;
            userProfile.powerUps.freezeTimer++;
            updateShopAvailability(); // Defined in UI module
            updateMenuDisplay(); // Defined in UI module
            updateProfileDisplay(); // Defined in UI module
            showShop(); // Defined in UI module
        }
    } else if (item === 'reduceExposures') {
        if (availableCoins >= 50) {
            userProfile.coins -= 50;
            userProfile.powerUps.reduceExposures++;
            updateShopAvailability(); // Defined in UI module
            updateMenuDisplay(); // Defined in UI module
            updateProfileDisplay(); // Defined in UI module
            showShop(); // Defined in UI module
        }
    } else if (item === 'marketFreeze') {
        if (availableCoins >= 75) {
            userProfile.coins -= 75;
            userProfile.powerUps.marketFreeze++;
            updateShopAvailability(); // Defined in UI module
            updateMenuDisplay(); // Defined in UI module
            updateProfileDisplay(); // Defined in UI module
            showShop(); // Defined in UI module
        }
    } else if (item === 'volatilityShield') {
        if (availableCoins >= 60) {
            userProfile.coins -= 60;
            userProfile.powerUps.volatilityShield++;
            updateShopAvailability(); // Defined in UI module
            updateMenuDisplay(); // Defined in UI module
            updateProfileDisplay(); // Defined in UI module
            showShop(); // Defined in UI module
        }
    } else if (item === 'tradingPlaces') {
        if (availableCoins >= 100) {
            userProfile.coins -= 100;
            userProfile.powerUps.tradingPlaces++;
            updateShopAvailability(); // Defined in UI module
            updateMenuDisplay(); // Defined in UI module
            updateProfileDisplay(); // Defined in UI module
            showShop(); // Defined in UI module
        }
    } else if (item === 'hotVols') {
        if (availableCoins >= 80) {
            userProfile.coins -= 80;
            userProfile.powerUps.hotVols++;
            updateShopAvailability(); // Defined in UI module
            updateMenuDisplay(); // Defined in UI module
            updateProfileDisplay(); // Defined in UI module
            showShop(); // Defined in UI module
        }
    } else if (item === 'noddingBird') {
        if (availableCoins >= 120) {
            userProfile.coins -= 120;
            userProfile.powerUps.noddingBird++;
            updateShopAvailability(); // Defined in UI module
            updateMenuDisplay(); // Defined in UI module
            updateProfileDisplay(); // Defined in UI module
            showShop(); // Defined in UI module
        }
    }
}

// Admin functions for testing
function setPlayerLevel() {
    const newLevel = parseInt(document.getElementById('levelEditor').value);
    if (newLevel >= 1) {
        userProfile.level = newLevel;
        userProfile.currentXP = 0;
        updateProfileDisplay(); // Defined in UI module
        updateMenuDisplay(); // Defined in UI module
        updateUnlockedAssets(); // Defined in UI module
    }
}

function setPlayerCoins() {
    const newCoins = parseInt(document.getElementById('coinsEditor').value);
    if (newCoins >= 0) {
        userProfile.coins = newCoins;
        updateProfileDisplay(); // Defined in UI module
        updateMenuDisplay(); // Defined in UI module
    }
}

function unlockAllAssets() {
    userProfile.unlockedAssets = ['indices', 'forex', 'shares', 'commodities', 'crypto'];
    updateUnlockedAssets(); // Defined in UI module
    updateMenuDisplay(); // Defined in UI module
    alert('All asset classes unlocked!');
}

function resetProgress() {
    userProfile = {
        username: userProfile.username,
        title: 'Novice',
        level: 1,
        currentXP: 0,
        totalXP: 0,
        gamesPlayed: 0,
        bestScore: 0,
        totalTrades: 0,
        breachesFixed: 0,
        wins: 0,
        coins: 0,
        unlockedAssets: ['indices', 'forex', 'commodities'],
        powerUps: {
             freezeTimer: 0,
             reduceExposures: 0,
             marketFreeze: 0,
             volatilityShield: 0,
             tradingPlaces: 0,
             hotVols: 0,
             noddingBird: 0
        }
    };
    updateProfileDisplay(); // Defined in UI module
    updateMenuDisplay(); // Defined in UI module
    updateUnlockedAssets(); // Defined in UI module
    updatePowerupsDisplay(); // Defined in powerups module
    document.getElementById('levelEditor').value = userProfile.level;
    document.getElementById('coinsEditor').value = userProfile.coins;
    alert('Progress reset to default state');
}

// Asset unlock notification
function showAssetUnlockNotification(assetClass, assetName) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(145deg, #4CAF50, #45a049);
        color: white;
        padding: 20px 30px;
        border-radius: 10px;
        font-weight: bold;
        font-size: 18px;
        z-index: 2000;
        border: 2px solid rgba(255,255,255,0.3);
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        text-align: center;
    `;
    notification.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 8px;">🎉</div>
        <div>NEW ASSET CLASS UNLOCKED!</div>
        <div style="font-size: 16px; margin-top: 8px; color: rgba(255,255,255,0.9);">${assetName}</div>
    `;
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
    
    const timeoutId = setTimeout(cleanup, 3000);
    
    // Store for potential cleanup
    if (!window.gameNotificationCleanups) {
        window.gameNotificationCleanups = [];
    }
    window.gameNotificationCleanups.push({
        cleanup: cleanup,
        timeoutId: timeoutId
    });
}

// Export to global scope
window.buyMarket = buyMarket;
window.sellMarket = sellMarket;
window.addTradeEffect = addTradeEffect;
window.awardXP = awardXP;
window.awardCoins = awardCoins;
window.buyShopItem = buyShopItem;
window.setPlayerLevel = setPlayerLevel;
window.setPlayerCoins = setPlayerCoins;
window.unlockAllAssets = unlockAllAssets;
window.resetProgress = resetProgress;
window.validateUserData = validateUserData;
window.validateNumericInput = validateNumericInput;
window.validateAndRepairUserProfile = validateAndRepairUserProfile;
window.showAssetUnlockNotification = showAssetUnlockNotification;

