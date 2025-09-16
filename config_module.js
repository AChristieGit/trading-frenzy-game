// ===== CORE CONFIGURATION & DATA MODULE =====
// Dependencies: None (this is the base module)
// Exposes: marketData, adminSettings, gameEndSettings, userProfile management

// Market data definitions
const marketData = window.marketData || {
    indices: [
        { name: 'S&P500', limit: 2100, exposure: 0, trend: 0, trendStrength: 1 },
        { name: 'FTSE', limit: 1998, exposure: 0, trend: 0, trendStrength: 1 },
        { name: 'DAX30', limit: 600, exposure: 0, trend: 0, trendStrength: 1 },
        { name: 'NIKKEI', limit: 1425, exposure: 0, trend: 0, trendStrength: 1 },
        { name: 'NASDAQ', limit: 1900, exposure: 0, trend: 0, trendStrength: 1 },
        { name: 'HANG SENG', limit: 975, exposure: 0, trend: 0, trendStrength: 1 },
        { name: 'CAC40', limit: 470, exposure: 0, trend: 0, trendStrength: 1 }
    ],
    forex: [
       { name: 'EURUSD', limit: 1563, exposure: 0, trend: 0, trendStrength: 1.2 },
       { name: 'GBPUSD', limit: 1225, exposure: 0, trend: 0, trendStrength: 1.2 },
       { name: 'USDJPY', limit: 1375, exposure: 0, trend: 0, trendStrength: 1.1 },
       { name: 'AUDUSD', limit: 1063, exposure: 0, trend: 0, trendStrength: 1.3 },
       { name: 'USDCAD', limit: 1188, exposure: 0, trend: 0, trendStrength: 1.1 },
       { name: 'EURGBP', limit: 938, exposure: 0, trend: 0, trendStrength: 1.0 },
       { name: 'NZDUSD', limit: 813, exposure: 0, trend: 0, trendStrength: 1.4 }
    ],
    shares: [
        { name: 'AAPL', limit: 925, exposure: 0, trend: 0, trendStrength: 1.5 },
        { name: 'MSFT', limit: 840, exposure: 0, trend: 0, trendStrength: 1.3 },
        { name: 'GOOGL', limit: 710, exposure: 0, trend: 0, trendStrength: 1.4 },
        { name: 'TSLA', limit: 1100, exposure: 0, trend: 0, trendStrength: 2.0 },
        { name: 'AMZN', limit: 780, exposure: 0, trend: 0, trendStrength: 1.4 },
        { name: 'NVDA', limit: 1250, exposure: 0, trend: 0, trendStrength: 1.8 },
        { name: 'META', limit: 960, exposure: 0, trend: 0, trendStrength: 1.6 }
    ],
    commodities: [
        { name: 'GOLD', limit: 1075, exposure: 0, trend: 0, trendStrength: 0.8 },
        { name: 'SILVER', limit: 1400, exposure: 0, trend: 0, trendStrength: 1.2 },
        { name: 'OIL WTI', limit: 4250, exposure: 0, trend: 0, trendStrength: 1.5 },
        { name: 'NAT GAS', limit: 6000, exposure: 0, trend: 0, trendStrength: 2.2 },
        { name: 'COPPER', limit: 2100, exposure: 0, trend: 0, trendStrength: 1.1 },
        { name: 'WHEAT', limit: 3400, exposure: 0, trend: 0, trendStrength: 1.4 },
        { name: 'COFFEE', limit: 4750, exposure: 0, trend: 0, trendStrength: 1.6 }
    ],
    crypto: [
        { name: 'BITCOIN', limit: 3400, exposure: 0, trend: 0, trendStrength: 2.5 },
        { name: 'ETHEREUM', limit: 2100, exposure: 0, trend: 0, trendStrength: 2.3 },
        { name: 'BNB', limit: 2900, exposure: 0, trend: 0, trendStrength: 2.1 },
        { name: 'SOLANA', limit: 4250, exposure: 0, trend: 0, trendStrength: 2.8 },
        { name: 'XRP', limit: 7500, exposure: 0, trend: 0, trendStrength: 2.4 },
        { name: 'CARDANO', limit: 9250, exposure: 0, trend: 0, trendStrength: 2.2 },
        { name: 'DOGECOIN', limit: 12500, exposure: 0, trend: 0, trendStrength: 3.0 }
    ]
};

// Admin settings - scoring, timers, and rewards
let adminSettings = window.adminSettings || {
    breachHedgePoints: 25,     
    breachClearBonus: 50,      
    goodTradeBonus: 15,        
    badTradePenalty: -50,      
    worseBreachPenalty: -75,   
    causeBreachPenalty: -100,   
    timeoutPenalty: -150,      
    globalVolatilityMultiplier: 1.0,  
    breachTimerSeconds: 7,    
    assetVolatilityMultipliers: {
        indices: 1.0,
        forex: 0.6,
        shares: 1.4,
        commodities: 1.2,
        crypto: 2.0
    },
    coinRewards: {
        goodTrade: 0.5,
        breachHedge: 1,
        breachClear: 3,
        endGameMultiplier: 20,
        perfectGameBonus: 50,
        levelUpBonus: 25
    }
};

// Game end conditions
let gameEndSettings = window.gameEndSettings || {
    enableTimeLimit: false,
    timeLimitMinutes: 5,
    enableMissedTimerLimit: true,
    maxMissedTimers: 3,
    enableEscalatingDifficulty: true,
    escalationInterval: 60,
    escalationAmount: 0.5
};

// Power-up states
let activePowerups = window.activePowerups || {
    marketFreeze: { active: false, timeLeft: 0, cooldown: 0 },
    volatilityShield: { active: false, timeLeft: 0, cooldown: 0 },
    freezeTimer: { active: false, timeLeft: 0, cooldown: 0 },
    reduceExposures: { active: false, timeLeft: 0, cooldown: 0 },
    tradingPlaces: { active: false, timeLeft: 0, cooldown: 0 },
    hotVols: { active: false, timeLeft: 0, cooldown: 0 },
    noddingBird: { active: false, timeLeft: 0, cooldown: 0 }
};

// Global game constants
const baseGlobalVolatility = 1.0;

// User profile management
let userProfile = window.userProfile || {};

function initializeDefaultProfile() {
    return {
        username: 'Guest Trader',
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
}

// Initialize userProfile with default values
userProfile = initializeDefaultProfile();

// Level progression system
function generateLevelRequirement(level) {
    if (level <= 20) {
        const baseRequirements = [
            300, 600, 1050, 1650, 2400, 3300, 4350, 5550, 6900, 8400,
            10050, 11850, 13800, 15900, 18150, 20550, 23100, 25800, 28650, 31650
        ];
        return baseRequirements[level - 1];
    } else {
        // Continue pattern: each level after 20 requires 3000 more XP than the previous
        return 31650 + (level - 20) * 3000;
    }
}

function getCareerTitle(level) {
    const titles = [
        'Intern I', 'Intern II', 'Intern III',
        'Junior Trader I', 'Junior Trader II', 'Junior Trader III',
        'Trader I', 'Trader II', 'Trader III',
        'Senior Trader I', 'Senior Trader II', 'Senior Trader III',
        'Lead Trader I', 'Lead Trader II', 'Lead Trader III',
        'Principal Trader', 'VP Trading', 'Managing Director',
        'Head of Trading', 'Market Master'
    ];
    
    // After level 20, keep using "Market Master" title
    if (level > 20) {
        return 'Market Master';
    }
    
    return titles[level - 1] || 'Unknown';
}

// Export to global scope to prevent redeclaration conflicts
window.marketData = marketData;
window.adminSettings = adminSettings;
window.gameEndSettings = gameEndSettings;
window.activePowerups = activePowerups;
window.userProfile = userProfile;
window.baseGlobalVolatility = baseGlobalVolatility;
window.initializeDefaultProfile = initializeDefaultProfile;
window.generateLevelRequirement = generateLevelRequirement;
window.getCareerTitle = getCareerTitle;