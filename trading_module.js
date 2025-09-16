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
    userProfile.currentXP += amount;
    userProfile.totalXP += amount;
    
    // Allow infinite leveling
    while (userProfile.currentXP >= generateLevelRequirement(userProfile.level)) {
        userProfile.currentXP -= generateLevelRequirement(userProfile.level);
        userProfile.level++;
        showLevelUp(); // Defined in UI module
        awardCoins(adminSettings.coinRewards.levelUpBonus);
        updateCareerDisplay(); // Defined in UI module
    }
    
    updateProfileDisplay(); // Defined in UI module
    updateMenuDisplay(); // Defined in UI module
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
    
    if (item === 'shares') {
        if (userProfile.level >= 3 && availableCoins >= 150 && !userProfile.unlockedAssets.includes('shares')) {
            userProfile.coins -= 150;
            userProfile.unlockedAssets.push('shares');
            updateUnlockedAssets(); // Defined in UI module
            updateShopAvailability(); // Defined in UI module
            updateMenuDisplay(); // Defined in UI module
            updateProfileDisplay(); // Defined in UI module
            alert('Shares markets unlocked!');
        }
    } else if (item === 'crypto') {
        if (userProfile.level >= 5 && availableCoins >= 300 && !userProfile.unlockedAssets.includes('crypto')) {
            userProfile.coins -= 300;
            userProfile.unlockedAssets.push('crypto');
            updateUnlockedAssets(); // Defined in UI module
            updateShopAvailability(); // Defined in UI module
            updateMenuDisplay(); // Defined in UI module
            updateProfileDisplay(); // Defined in UI module
            alert('Crypto markets unlocked!');
        }
    } else if (item === 'freezeTimer') {
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


