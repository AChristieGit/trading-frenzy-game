// ===== MARKET LOGIC MODULE =====
// Dependencies: config.js (marketData, adminSettings, activePowerups), gameState.js (game variables)
// Exposes: Market display, exposure updates, breach management, asset class switching

// Market display functions
function createMarketRow(market, index) {
    const isFrozen = activePowerups.marketFreeze.active;
    const frozenClass = isFrozen ? 'market-frozen' : '';
    const shieldedClass = activePowerups.volatilityShield.active ? 'volatility-shielded' : '';
    
    return `
        <div class="market-row ${frozenClass} ${shieldedClass}" id="market-${index}">
            <button class="buy-btn" onclick="buyMarket(${index})">BUY</button>
            <div class="exposure-container">
                <div class="exposure-bar green long" id="bar-${index}"></div>
                <div class="breach-countdown" id="countdown-${index}" style="display: none;">
                    <div class="countdown-circle" id="circle-${index}">
                        <div class="countdown-text" id="timer-${index}">0</div>
                    </div>
                </div>
                <div class="market-info">
                    <div class="market-name">${market.name}</div>
                    <div class="market-limit">Limit: ±${market.limit}</div>
                    <div class="exposure-value" id="exposure-${index}">0</div>
                </div>
            </div>
            <button class="sell-btn" onclick="sellMarket(${index})">SELL</button>
        </div>
    `;
}

function initializeGame() {
    // Safety check - ensure markets array is properly populated
    if (!markets || markets.length === 0) {
        markets = [...marketData[currentAssetClass]];
    }

    clearMarketElementCache();
    
    markets.forEach(market => {
        if (market.exposure === 0 && market.trend === 0) {
            const randomPercent = Math.random() * 0.5;
            const randomDirection = Math.random() < 0.5 ? -1 : 1;
            market.exposure = market.limit * randomPercent * randomDirection;
        }
    });
    
    const marketsContainer = document.getElementById('markets');
    if (marketsContainer) {
        marketsContainer.innerHTML = markets.map(createMarketRow).join('');
        updateDisplay();
    }
}

function getBarColor(exposure, limit) {
    const absExposure = Math.abs(exposure);
    const ratio = absExposure / limit;
    
    if (ratio >= 1.5) return 'white';
    if (ratio >= 1.0) return 'red';
    if (ratio >= 0.75) return 'yellow';
    return 'green';
}

// Cache for DOM elements to avoid repeated queries
let marketElementCache = {};

function updateDisplay() {
    markets.forEach((market, index) => {
        // Use cached elements or query once and cache
        if (!marketElementCache[index]) {
            marketElementCache[index] = {
                bar: document.getElementById(`bar-${index}`),
                exposureDisplay: document.getElementById(`exposure-${index}`),
                marketRow: document.getElementById(`market-${index}`),
                countdown: document.getElementById(`countdown-${index}`),
                timerText: document.getElementById(`timer-${index}`),
                circle: document.getElementById(`circle-${index}`)
            };
        }
        
        const elements = marketElementCache[index];
        if (!elements.bar) return;
        
        const exposurePercent = Math.min(40, Math.abs(market.exposure) / market.limit * 40);
        const isLong = market.exposure >= 0;
        const barColor = getBarColor(market.exposure, market.limit);
        
        elements.bar.className = `exposure-bar ${isLong ? 'long' : 'short'} ${barColor}`;
        elements.bar.style.width = exposurePercent + '%';
        
        elements.exposureDisplay.textContent = Math.round(market.exposure);
        elements.exposureDisplay.style.color = barColor === 'white' ? '#ffffff' : '#ffeb3b';
        
        const isBreached = Math.abs(market.exposure) >= market.limit;
        const isCritical = Math.abs(market.exposure) >= market.limit * 1.5;
        
        elements.marketRow.className = 'market-row';
        if (activePowerups.marketFreeze.active) {
            elements.marketRow.classList.add('market-frozen');
        }
        if (activePowerups.volatilityShield.active) {
            elements.marketRow.classList.add('volatility-shielded');
        }
        if (isCritical) {
            elements.marketRow.classList.add('critical-warning');
        } else if (isBreached) {
            elements.marketRow.classList.add('warning');
        }
        
        if (isBreached && individualBreachTimers[index] > 0 && !activePowerups.freezeTimer.active) {
            elements.countdown.style.display = 'block';
            const timeLeft = individualBreachTimers[index];
            elements.timerText.textContent = Math.max(0, timeLeft);
            
            const progress = (timeLeft / adminSettings.breachTimerSeconds) * 360;
            elements.circle.style.setProperty('--progress', `${progress}deg`);
        } else {
            elements.countdown.style.display = 'none';
        }
    });
    
    updateBreachBadges();
}

// Clear cache when markets are reinitialized
function clearMarketElementCache() {
    marketElementCache = {};
}

// Market exposure update engine
function updateExposures() {
    if (isPaused || activePowerups.marketFreeze.active) return;
    
    Object.keys(marketData).forEach(assetClass => {
        // Only update exposures for unlocked asset classes
        if (!userProfile.unlockedAssets.includes(assetClass)) return;
        
        // Skip commodities if Trading Places is active
        if (assetClass === 'commodities' && activePowerups.tradingPlaces.active) return;
        
        const assetMarkets = marketData[assetClass];
        
        assetMarkets.forEach((market, marketIndex) => {
            const volatilityMultiplier = adminSettings.assetVolatilityMultipliers[assetClass] || 1.0;
            let effectiveVolatilityMultiplier = volatilityMultiplier;
            
            if (activePowerups.volatilityShield.active) {
                effectiveVolatilityMultiplier *= 0.3;
            }
            
            const baseVolatility = (gameDifficulty === 3 ? 52 : 45) * effectiveVolatilityMultiplier * adminSettings.globalVolatilityMultiplier;
            const trendInfluence = (gameDifficulty === 3 ? 0.72 : 0.65) * market.trendStrength;
            
            const randomComponent = (Math.random() - 0.5) * baseVolatility;
            const trendComponent = market.trend * trendInfluence;
            const change = randomComponent + trendComponent;
            
            market.exposure += change;
            
            const isBreached = Math.abs(market.exposure) >= market.limit;
            const wasAlreadyBreached = assetClassBreaches[assetClass].has(marketIndex);
            
            // Auto-hedge with Nodding Bird
            if (isBreached && activePowerups.noddingBird.active) {
                // Automatically reduce exposure toward zero
                const hedgeAmount = market.exposure * 0.15; // 15% reduction per cycle
                market.exposure -= hedgeAmount;
                score += 5; // Small bonus for auto-hedge
                
                // Check if breach is resolved after auto-hedge
                const isStillBreached = Math.abs(market.exposure) >= market.limit;
                if (!isStillBreached && wasAlreadyBreached) {
                    userProfile.breachesFixed++;
                    sessionBreachesFixed++;
                    awardXP(10); // Defined in trading module
                    awardCoins(adminSettings.coinRewards.breachClear / 2); // Defined in trading module
                }
            }
            
            if (isBreached && !wasAlreadyBreached) {
                assetClassBreaches[assetClass].add(marketIndex);
                playSound('breach'); 
                // Only create timer if this breach hasn't already expired
                if (!expiredBreaches[assetClass].has(marketIndex)) {
                    assetClassTimers[assetClass][marketIndex] = adminSettings.breachTimerSeconds;
                }
                
                if (assetClass === currentAssetClass) {
                    breachedMarkets.add(marketIndex);
                    if (assetClassTimers[assetClass][marketIndex] > 0) {
                        individualBreachTimers[marketIndex] = assetClassTimers[assetClass][marketIndex];
                    }
                    breaches++;
                    hasActiveBreach = true;
                }
            } else if (!isBreached && wasAlreadyBreached) {
                assetClassBreaches[assetClass].delete(marketIndex);
                delete assetClassTimers[assetClass][marketIndex];
                expiredBreaches[assetClass].delete(marketIndex); // Clear expired status when breach is resolved
                
                if (assetClass === currentAssetClass) {
                    breachedMarkets.delete(marketIndex);
                    delete individualBreachTimers[marketIndex];
                    if (breachedMarkets.size === 0) {
                        hasActiveBreach = false;
                    }
                }
            }
            
            if (Math.random() < 0.1) {
                market.trend = (Math.random() - 0.5) * market.trendStrength * 40;
            }
            
            if (Math.random() < 0.02) {
                market.trend *= -0.5;
            }
            
            market.trend = Math.max(-30, Math.min(30, market.trend));
        });
    });
    
    markets = marketData[currentAssetClass];
    if (currentView === 'markets') {
        updateDisplay();
    }
}

// Asset class switching
function switchAssetClass(assetClass) {
    if (!userProfile.unlockedAssets.includes(assetClass)) {
        let unlockLevel = '';
        if (assetClass === 'shares') unlockLevel = 'Level 3';
        if (assetClass === 'crypto') unlockLevel = 'Level 5';
        
        if (unlockLevel) {
            alert(`${assetClass.charAt(0).toUpperCase() + assetClass.slice(1)} markets unlock automatically at ${unlockLevel}!`);
        } else {
            alert(`${assetClass.charAt(0).toUpperCase() + assetClass.slice(1)} markets are locked!`);
        }
        return;
    }
    
    currentView = 'markets';
    
    marketData[currentAssetClass] = markets;
    assetClassTimers[currentAssetClass] = {...individualBreachTimers};
    
    currentAssetClass = assetClass;
    if (marketData[assetClass] && Array.isArray(marketData[assetClass])) {
        markets = [...marketData[assetClass]];
    } else {
        console.error('Invalid market data for asset class:', assetClass);
        return;
    }
    
    individualBreachTimers = {...assetClassTimers[assetClass]};
    
    breachedMarkets.clear();
    markets.forEach((market, index) => {
        if (Math.abs(market.exposure) >= market.limit) {
            breachedMarkets.add(index);
        }
    });
    
    hasActiveBreach = Object.keys(individualBreachTimers).length > 0;
    
    document.querySelectorAll('.tab-button').forEach(tab => {
        tab.classList.remove('active');
    });
    // Find the tab button for this asset class and make it active
    const targetTab = document.querySelector(`.tab-button[onclick*="'${assetClass}'"]`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    document.getElementById('powerupsContainer').style.display = 'none';
    document.getElementById('marketsContainer').style.display = 'block';
    
    const marketsContainer = document.getElementById('markets');
    marketsContainer.innerHTML = markets.map(createMarketRow).join('');
    clearMarketElementCache(); // Clear cache after regenerating HTML
    updateDisplay();
}

// Breach timer management
function updateBreachTimers() {
    if (isPaused || activePowerups.freezeTimer.active) return;
    
    Object.keys(assetClassTimers).forEach(assetClass => {
        const timers = assetClassTimers[assetClass];
        Object.keys(timers).forEach(marketIndex => {
            if (timers[marketIndex] > 0) {
                timers[marketIndex]--;
                if (timers[marketIndex] <= 0) {
                    score += adminSettings.timeoutPenalty;
                    missedTimers++;
                    playSound('lifeLost');
                    updateStrikesDisplay(); // Defined in UI module
                    
                    // Mark as expired and delete timer
                    expiredBreaches[assetClass].add(parseInt(marketIndex));
                    delete timers[marketIndex];
                }
            }
        });
    });
    
    individualBreachTimers = assetClassTimers[currentAssetClass];
    hasActiveBreach = Object.keys(individualBreachTimers).length > 0;
    updateBreachBadges();
    
    // Check game end conditions and stop processing if game ends
    if (checkGameEndConditions()) { // Defined in gameState module
        return;
    }
}

// Breach badge display management
function updateBreachBadges() {
    Object.keys(marketData).forEach(assetClass => {
        // Only show breach badges for unlocked asset classes
        if (!userProfile.unlockedAssets.includes(assetClass)) {
            const badge = document.getElementById(`badge-${assetClass}`);
            if (badge) {
                badge.style.display = 'none';
            }
            return;
        }
        
        const markets = marketData[assetClass];
        let breachCount = 0;
        
        if (markets && Array.isArray(markets)) {
            markets.forEach(market => {
                if (Math.abs(market.exposure) >= market.limit) {
                    breachCount++;
                }
            });
        }
        
        const badge = document.getElementById(`badge-${assetClass}`);
        if (badge) {
            if (breachCount > 0) {
                badge.textContent = breachCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    });
}


// Export to global scope
window.createMarketRow = createMarketRow;
window.initializeGame = initializeGame;
window.getBarColor = getBarColor;
window.updateDisplay = updateDisplay;
window.updateExposures = updateExposures;
window.switchAssetClass = switchAssetClass;
window.updateBreachTimers = updateBreachTimers;
window.updateBreachBadges = updateBreachBadges;
window.clearMarketElementCache = clearMarketElementCache;