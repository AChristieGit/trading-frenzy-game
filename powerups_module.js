// ===== POWER-UPS SYSTEM MODULE =====
// Dependencies: config.js (activePowerups, adminSettings, marketData, userProfile), gameState.js (currentView, isPaused)
// Exposes: Power-up activation, timer management, display updates

// Power-up activation function
function usePowerup(powerupType) {
    if (isPaused) {
        alert('Cannot use power-ups while game is paused!');
        return;
    }
    
    const powerup = activePowerups[powerupType];
        
    if (userProfile.powerUps[powerupType] <= 0) {
        alert('You don\'t have any of this power-up! Visit the shop to buy more.');
        return;
    }
    
    if (powerup.cooldown > 0) {
        alert(`Power-up is on cooldown for ${powerup.cooldown} more seconds!`);
        return;
    }
    
    userProfile.powerUps[powerupType]--;
    
    switch(powerupType) {
        case 'marketFreeze':
            powerup.active = true;
            powerup.timeLeft = 10;
            powerup.cooldown = 20;
            break;
            
        case 'volatilityShield':
            powerup.active = true;
            powerup.timeLeft = 15;
            powerup.cooldown = 25;
            break;
            
        case 'freezeTimer':
            powerup.active = true;
            powerup.timeLeft = 5;
            powerup.cooldown = 15;
            break;
            
        case 'reduceExposures':
            Object.keys(marketData).forEach(assetClass => {
                marketData[assetClass].forEach(market => {
                    market.exposure *= 0.75;
                });
            });
            markets = marketData[currentAssetClass];
            powerup.cooldown = 30;
            awardXP(10); // Defined in trading module
            break;
            
        case 'tradingPlaces':
            powerup.active = true;
            powerup.timeLeft = 60;
            powerup.cooldown = 90;
            break;
            
        case 'hotVols':
            powerup.active = true;
            powerup.timeLeft = 30;
            powerup.cooldown = 45;
            // Store original volatility to restore later
            if (!window.originalGlobalVolatility) {
                window.originalGlobalVolatility = adminSettings.globalVolatilityMultiplier;
            }
            adminSettings.globalVolatilityMultiplier *= 2;
            updateGlobalVolatilityDisplay(); // Defined in UI module
            break;
            
        case 'noddingBird':
            powerup.active = true;
            powerup.timeLeft = 30;
            powerup.cooldown = 60;
            awardXP(5); // Defined in trading module
            break;    
    }
    
    updatePowerupsDisplay();
    updateDisplay(); // Defined in markets module
    updateProfileDisplay(); // Defined in UI module
}

// Power-up timer management
function updatePowerupTimers() {
    if (isPaused) return;
    
    Object.keys(activePowerups).forEach(powerupType => {
        const powerup = activePowerups[powerupType];
        
        // Handle Hot Vols expiration
        if (powerupType === 'hotVols' && powerup.active && powerup.timeLeft === 1) {
            // Restore original volatility when Hot Vols expires
            if (window.originalGlobalVolatility) {
                adminSettings.globalVolatilityMultiplier = window.originalGlobalVolatility;
                updateGlobalVolatilityDisplay(); // Defined in UI module
                delete window.originalGlobalVolatility;
            }
        }
        
        if (powerup.timeLeft > 0) {
            powerup.timeLeft--;
            if (powerup.timeLeft <= 0) {
                powerup.active = false;
            }
        }
        
        if (powerup.cooldown > 0) {
            powerup.cooldown--;
        }
    });
    
    if (currentView === 'powerups') {
        updatePowerupsDisplay();
    }
    updateGlobalEffectsBar();
    populateQuickPowerupBar(); // Refresh the quick access bar to update cooldown timers
}

// Power-up display functions
function switchToPowerups() {
    currentView = 'powerups';
    
    document.querySelectorAll('.tab-button').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector('.tab-button.powerups').classList.add('active');
    
    document.getElementById('marketsContainer').style.display = 'none';
    document.getElementById('powerupsContainer').style.display = 'block';
    
    updatePowerupsDisplay();
}

function updatePowerupsDisplay() {
    safeUpdateElement('freezeCount', userProfile.powerUps.marketFreeze); // Defined in UI module
    safeUpdateElement('shieldCount', userProfile.powerUps.volatilityShield); // Defined in UI module
    safeUpdateElement('oldFreezeCount', userProfile.powerUps.freezeTimer); // Defined in UI module
    safeUpdateElement('reduceAllCount', userProfile.powerUps.reduceExposures); // Defined in UI module
    safeUpdateElement('tradingPlacesCount', userProfile.powerUps.tradingPlaces); // Defined in UI module
    safeUpdateElement('hotVolsCount', userProfile.powerUps.hotVols); // Defined in UI module
    safeUpdateElement('noddingBirdCount', userProfile.powerUps.noddingBird); // Defined in UI module
        
    Object.keys(activePowerups).forEach(powerupType => {
        const powerup = activePowerups[powerupType];
        const button = document.getElementById(getButtonId(powerupType));
        const cooldownDiv = document.getElementById(getCooldownId(powerupType));
        const statusDiv = document.getElementById(getStatusId(powerupType));
        const card = document.getElementById(getCardId(powerupType));
        
        if (button) {
            button.disabled = userProfile.powerUps[powerupType] <= 0 || powerup.cooldown > 0;
            
            if (powerup.active && powerup.timeLeft > 0) {
                button.textContent = `ACTIVE (${powerup.timeLeft}s)`;
                card.classList.add('active');
            } else {
                button.textContent = getButtonText(powerupType);
                card.classList.remove('active');
            }
        }
        
        if (cooldownDiv) {
            if (powerup.cooldown > 0) {
                cooldownDiv.style.display = 'block';
                document.getElementById(getTimerId(powerupType)).textContent = powerup.cooldown;
            } else {
                cooldownDiv.style.display = 'none';
            }
        }
        
        if (statusDiv) {
            if (powerup.active && powerup.timeLeft > 0) {
                statusDiv.textContent = `Active for ${powerup.timeLeft} seconds`;
                statusDiv.style.color = '#4CAF50';
            } else if (powerup.cooldown > 0) {
                statusDiv.textContent = `Cooldown: ${powerup.cooldown}s`;
                statusDiv.style.color = '#ff9800';
            } else if (userProfile.powerUps[powerupType] <= 0) {
                statusDiv.textContent = 'Out of stock - buy more in shop';
                statusDiv.style.color = '#f44336';
            } else {
                statusDiv.textContent = 'Ready to use';
                statusDiv.style.color = '#888';
            }
        }
    });
    
    updateGlobalEffectsBar();
}

function updateGlobalEffectsBar() {
    const effectsDiv = document.getElementById('activeEffects');
    const activeEffectsList = [];
    
    Object.keys(activePowerups).forEach(powerupType => {
        const powerup = activePowerups[powerupType];
        if (powerup.active && powerup.timeLeft > 0) {
            const iconMap = {
                marketFreeze: '❄️',
                volatilityShield: '🛡️', 
                freezeTimer: '⏸️',
                reduceExposures: '📉',
                tradingPlaces: '🎭',
                hotVols: '🔥',
                noddingBird: '🦆'
            };
            
            activeEffectsList.push(`
                <div class="active-effect">
                    <span class="effect-icon">${iconMap[powerupType]}</span>
                    <span class="effect-timer">${powerup.timeLeft}s</span>
                </div>
            `);
        }
    });
    
    if (effectsDiv) {
        effectsDiv.innerHTML = activeEffectsList.join('');
    }
    
    updatePowerupScrollButtons();
}

// Admin function for giving all powerups
function giveAllPowerups() {
    userProfile.powerUps.freezeTimer += 5;
    userProfile.powerUps.reduceExposures += 5;
    userProfile.powerUps.marketFreeze += 5;
    userProfile.powerUps.volatilityShield += 5;
    userProfile.powerUps.tradingPlaces += 5;
    userProfile.powerUps.hotVols += 5;
    userProfile.powerUps.noddingBird += 5;
    updatePowerupsDisplay();
    updateMenuDisplay(); // Defined in UI module
    alert('All power-ups granted! (5 each)');
}

// Power-up ID mapping functions
function getButtonId(powerupType) {
    const mapping = {
        marketFreeze: 'freezeButton',
        volatilityShield: 'shieldButton',
        freezeTimer: 'oldFreezeButton',
        reduceExposures: 'reduceButton',
        tradingPlaces: 'tradingPlacesButton',
        hotVols: 'hotVolsButton',
        noddingBird: 'noddingBirdButton'
    };
    return mapping[powerupType];
}

function getCooldownId(powerupType) {
    const mapping = {
        marketFreeze: 'freezeCooldown',
        volatilityShield: 'shieldCooldown',
        freezeTimer: 'oldFreezeCooldown',
        reduceExposures: 'reduceCooldown',
        tradingPlaces: 'tradingPlacesCooldown',
        hotVols: 'hotVolsCooldown',
        noddingBird: 'noddingBirdCooldown'
    };
    return mapping[powerupType];
}

function getStatusId(powerupType) {
    const mapping = {
        marketFreeze: 'freezeStatus',
        volatilityShield: 'shieldStatus',
        freezeTimer: 'oldFreezeStatus',
        reduceExposures: 'reduceStatus',
        tradingPlaces: 'tradingPlacesStatus',
        hotVols: 'hotVolsStatus',
        noddingBird: 'noddingBirdStatus'
    };
    return mapping[powerupType];
}

function getCardId(powerupType) {
    const mapping = {
        marketFreeze: 'freezeCard',
        volatilityShield: 'shieldCard',
        freezeTimer: 'oldFreezeCard',
        reduceExposures: 'reduceCard',
        tradingPlaces: 'tradingPlacesCard',
        hotVols: 'hotVolsCard',
        noddingBird: 'noddingBirdCard'
    };
    return mapping[powerupType];
}

function getTimerId(powerupType) {
    const mapping = {
        marketFreeze: 'freezeTimer',
        volatilityShield: 'shieldTimer',
        freezeTimer: 'oldFreezeTimer',
        reduceExposures: 'reduceTimer',
        tradingPlaces: 'tradingPlacesTimer',
        hotVols: 'hotVolsTimer',
        noddingBird: 'noddingBirdTimer'
    };
    return mapping[powerupType];
}

function getButtonText(powerupType) {
    const mapping = {
        marketFreeze: 'ACTIVATE FREEZE',
        volatilityShield: 'ACTIVATE SHIELD',
        freezeTimer: 'STOP TIMERS',
        reduceExposures: 'REDUCE EXPOSURES',
        tradingPlaces: 'TURN THOSE MACHINES BACK ON!',
        hotVols: 'ACTIVATE HOT VOLS',
        noddingBird: 'ACTIVATE NODDING BIRD'
    };
    return mapping[powerupType];
}

// Quick access powerup bar management
let powerupScrollOffset = 0;
let maxPowerupScrollOffset = 0;

function populateQuickPowerupBar() {
    const container = document.getElementById('powerupIcons');
    if (!container) return;
    
    // Sort powerups: owned first, then unowned
    const powerupList = [
        { type: 'marketFreeze', icon: '❄️', name: 'Market Freeze' },
        { type: 'volatilityShield', icon: '🛡️', name: 'Volatility Shield' },
        { type: 'freezeTimer', icon: '⏸️', name: 'Freeze Timer' },
        { type: 'reduceExposures', icon: '📉', name: 'Reduce All' },
        { type: 'tradingPlaces', icon: '🎭', name: 'Trading Places' },
        { type: 'hotVols', icon: '🔥', name: 'Hot Vols' },
        { type: 'noddingBird', icon: '🦆', name: 'Nodding Bird' }
    ];
    
    const owned = powerupList.filter(p => userProfile.powerUps[p.type] > 0);
    const unowned = powerupList.filter(p => userProfile.powerUps[p.type] === 0);
    const sortedPowerups = [...owned, ...unowned];
    
    container.innerHTML = sortedPowerups.map(powerup => {
        const count = userProfile.powerUps[powerup.type];
        const isDisabled = count === 0;
        const cooldown = activePowerups[powerup.type].cooldown;
        const cooldownBadge = cooldown > 0 ? `<span class="powerup-cooldown-indicator">${cooldown}</span>` : '';
        
        return `
            <div class="powerup-icon-quick ${isDisabled ? 'disabled' : ''}" 
                 onclick="${isDisabled || cooldown > 0 ? '' : `usePowerup('${powerup.type}')`}"
                 title="${powerup.name}">
                ${powerup.icon}
                <span class="powerup-count-quick">${count}</span>
                ${cooldownBadge}
            </div>
        `;
    }).join('');
    
    updatePowerupScrollButtons();
}

function updatePowerupScrollButtons() {
    const effectsSection = document.getElementById('effectsSection');
    
    // Check if any effects are active
    const hasActiveEffects = Object.keys(activePowerups).some(type => activePowerups[type].active);
    
    if (hasActiveEffects) {
        effectsSection.classList.remove('hidden');
    } else {
        effectsSection.classList.add('hidden');
    }
    
    // Don't call populateQuickPowerupBar() here to avoid infinite loop
}

// Export new functions
window.populateQuickPowerupBar = populateQuickPowerupBar;
window.updatePowerupScrollButtons = updatePowerupScrollButtons;


// Export to global scope
window.usePowerup = usePowerup;
window.updatePowerupTimers = updatePowerupTimers;
window.switchToPowerups = switchToPowerups;
window.updatePowerupsDisplay = updatePowerupsDisplay;
window.updateGlobalEffectsBar = updateGlobalEffectsBar;
window.giveAllPowerups = giveAllPowerups;
window.getButtonId = getButtonId;
window.getCooldownId = getCooldownId;
window.getStatusId = getStatusId;
window.getCardId = getCardId;
window.getTimerId = getTimerId;
window.getButtonText = getButtonText;