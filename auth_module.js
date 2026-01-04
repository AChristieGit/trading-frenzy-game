// ===== AUTHENTICATION SYSTEM MODULE =====
// Dependencies: config.js (userProfile, initializeDefaultProfile)
// Exposes: Authentication functions, user session management

let profileCreationInProgress = false;
let accountCreationCompleted = false;
let processedUserIds = new Set();

// Supabase configuration - REPLACE WITH YOUR ACTUAL VALUES
const SUPABASE_URL = 'https://tgtzzkelnknzhkxxbvtl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRndHp6a2VsbmtuemhreHhidnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTY5MDIsImV4cCI6MjA3MjMzMjkwMn0.J3-Ht9cuqX60p0n8bSErwuR0C0NSNI-JjyyR_1SCpvg';

// Admin user configuration
const ADMIN_USERS = [
    '17dde75c-e9da-48b2-9692-2f570e3f71df', // Replace with your actual Supabase user ID
    // Add more admin user IDs as needed
];

function isAdminUser() {
    return currentUser && ADMIN_USERS.includes(currentUser.id);
}

// Global auth state - use window references to avoid redeclaration with Supabase CDN
let supabaseClient = null;  // Local reference to our initialized client
let currentUser = window.currentUser || null;
let isGuestMode = window.isGuestMode || false;

// Auth operation state management
let authOperationInProgress = false;

function setAuthOperationState(inProgress) {
    authOperationInProgress = inProgress;
}

function isAuthOperationInProgress() {
    return authOperationInProgress;
}

// Initialize Supabase when the page loads
function initializeSupabase() {
    try {
        if (SUPABASE_URL === 'YOUR_SUPABASE_URL_HERE' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY_HERE') {
            console.log('Supabase credentials not configured, starting in guest mode');
            continueAsGuest();
            initializeEverything();
            return;
        }
        
        if (!window.supabase) {
            console.error('Supabase library not loaded');
            continueAsGuest();
            initializeEverything();
            return;
        }
        
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: false, // Disable automatic token refresh during local dev
                persistSession: false    // Don't persist sessions during local dev
            }
        });
        console.log('Supabase initialized successfully');
        checkAuthState();
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        continueAsGuest();
        initializeEverything();
    }
}

// Check if user is already logged in
async function checkAuthState() {
    if (!supabaseClient || isAuthOperationInProgress()) {
        continueAsGuest();
        initializeEverything(); // This function needs to be defined in the main file
        return;
    }
    
    setAuthOperationState(true);
    
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (error) {
            console.error('Auth session error:', error);
            showAuthScreen(); // This function needs to be defined in UI module
            return;
        }
        
        if (session?.user) {
            currentUser = session.user;
            await loadUserProfile();
            showMenu(); // This function needs to be defined in UI module
        } else {
            showAuthScreen(); // This function needs to be defined in UI module
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showAuthScreen(); // This function needs to be defined in UI module
    } finally {
        setAuthOperationState(false);
    }
}

// Authentication functions
async function handleLogin(event) {
    event.preventDefault();
    
    if (isAuthOperationInProgress()) {
        return; // Prevent multiple simultaneous operations
    }
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const button = document.getElementById('loginButton');
    const errorDiv = document.getElementById('loginError');
    
    if (!email || !password) {
        errorDiv.textContent = 'Please fill in all fields';
        errorDiv.style.display = 'block';
        return;
    }
    
    setAuthOperationState(true);
    button.disabled = true;
    button.innerHTML = '<span class="loading-spinner"></span>Signing in...';
    errorDiv.style.display = 'none';
    
    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        await loadUserProfile();
        showMenu(); // This function needs to be defined in UI module
        
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = error.message || 'Login failed. Please try again.';
        errorDiv.style.display = 'block';
    } finally {
        setAuthOperationState(false);
        button.disabled = false;
        button.textContent = 'Sign In';
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    if (isAuthOperationInProgress()) {
        return; // Prevent multiple simultaneous operations
    }
    
    const email = document.getElementById('registerEmail').value;
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const button = document.getElementById('registerButton');
    const errorDiv = document.getElementById('registerError');
    const successDiv = document.getElementById('registerSuccess');
    
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    // Validation
    if (!email || !username || !password || !confirmPassword) {
        errorDiv.textContent = 'Please fill in all fields';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (password.length < 6) {
        errorDiv.textContent = 'Password must be at least 6 characters';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        errorDiv.textContent = 'Username can only contain letters, numbers, underscores, and hyphens';
        errorDiv.style.display = 'block';
        return;
    }
    
    setAuthOperationState(true);
    button.disabled = true;
    button.innerHTML = '<span class="loading-spinner"></span>Creating account...';
    
    try {
        // First, sign up the user
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username
                }
            }
        });
        
        if (error) throw error;
        
        if (data.user && !data.session) {
            // Email confirmation required
            successDiv.textContent = 'Check your email for a confirmation link!';
            successDiv.style.display = 'block';
        } else if (data.session) {
            // User signed up and logged in immediately
            currentUser = data.user;
            
            // Check if username is already taken in profiles table
            const { data: existingProfile, error: profileCheckError } = await supabaseClient
                .from('user_profiles')
                .select('username')
                .eq('username', username)
                .single();
        
            if (profileCheckError && profileCheckError.code !== 'PGRST116') {
                console.error('Profile check error:', profileCheckError);
            }
        
            if (existingProfile) {
                // Username taken, need to sign out and show error
                await supabaseClient.auth.signOut();
                currentUser = null;
                throw new Error(`Username "${username}" is already taken. Please choose a different username.`);
            }
            
            await createUserProfile(username);
            showMenu();
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        errorDiv.textContent = error.message || 'Registration failed. Please try again.';
        errorDiv.style.display = 'block';
    } finally {
        setAuthOperationState(false);
        button.disabled = false;
        button.textContent = 'Create Account';
    }
}

async function handleLogout() {
    try {
        await saveUserProgress();
        await supabase.auth.signOut();
        currentUser = null;
        isGuestMode = false;
        userProfile = initializeDefaultProfile(); // Direct reset only on logout
        showAuthScreen(); // This function needs to be defined in UI module
    } catch (error) {
        console.error('Logout failed:', error);
        // Force logout even if save failed
        currentUser = null;
        isGuestMode = false;
        userProfile = initializeDefaultProfile();
        showAuthScreen();
    }
}

async function createUserProfile(username) {
    if (!currentUser) {
        console.error('No current user for profile creation');
        return;
    }

        // Check if profile already exists for this user
        try {
            const { data, error } = await supabaseClient
                .from('user_profiles')
                .select('username')
                .eq('user_id', currentUser.id)
                .single();
            
            if (existingProfile) {
                console.log('Profile already exists for user, skipping creation');
                return;
            }
        } catch (error) {
            // If error is "no rows found", continue with creation
            if (error.code !== 'PGRST116') {
                console.error('Error checking existing profile:', error);
            }
        }
    
    if (profileCreationInProgress || accountCreationCompleted) {
        console.log('Profile creation already completed or in progress, skipping...');
        return;
    }
    
    profileCreationInProgress = true;
    
    try {
        // Check if there's saved guest progress
        const savedGuestProgress = sessionStorage.getItem('guestProgress');
        let defaultProfile;
        
        if (savedGuestProgress) {
            try {
                // Use guest progress as starting point
                const guestData = JSON.parse(savedGuestProgress);
              
                defaultProfile = {
                    user_id: currentUser.id,
                    username: username,
                    level: guestData.level || 1,
                    current_xp: guestData.currentXP || 0,
                    total_xp: guestData.totalXP || 0,
                    coins: Math.floor(guestData.coins || 0),
                    games_played: guestData.gamesPlayed || 0,
                    best_score: guestData.bestScore || 0,
                    total_trades: guestData.totalTrades || 0,
                    breaches_fixed: guestData.breachesFixed || 0,
                    wins: guestData.wins || 0,
                    max_vix_survived: guestData.maxVixSurvived || 10.0,
                    unlocked_assets: guestData.unlockedAssets || ['indices', 'forex', 'commodities'],
                    powerups: guestData.powerUps || {
                        freezeTimer: 0,
                        reduceExposures: 0,
                        marketFreeze: 0,
                        volatilityShield: 0,
                        tradingPlaces: 0,
                        hotVols: 0,
                        noddingBird: 0
                    }
                };
                
                // Clear the temporary storage
                sessionStorage.removeItem('guestProgress');
            } catch (parseError) {
                console.error('Error parsing guest progress:', parseError);
                sessionStorage.removeItem('guestProgress');
                defaultProfile = createDefaultProfileObject(username);
            }
        } else {
            // Use default fresh profile
            defaultProfile = createDefaultProfileObject(username);
        }
        
        const { error } = await supabase
            .from('user_profiles')
            .insert([defaultProfile]);
        
        if (error) {
            console.error('Profile insertion error:', error);
            if (error.code === '23505') {
                throw new Error(`Username "${username}" is already taken. Please choose a different username.`);
            }
            throw error;
        }
        
// If guest had VIX > 10, create a session record for leaderboard
if (savedGuestProgress && guestData.maxVixSurvived && guestData.maxVixSurvived > 10.0) {
    try {
        await supabase.from('game_sessions').insert([{
            user_id: currentUser.id,
            score: guestData.bestScore || 0,
            duration: 60,
            trades: guestData.totalTrades || 0,
            breaches: 0,
            difficulty: 2, // Default to Normal
            max_vix_survived: guestData.maxVixSurvived,
            created_at: new Date().toISOString()
        }]);
        console.log('Guest VIX record transferred to sessions table');
    } catch (error) {
        console.error('Failed to transfer VIX to sessions:', error);
    }
}

        // Update local userProfile
        Object.assign(userProfile, {
            username: defaultProfile.username,
            level: defaultProfile.level,
            currentXP: defaultProfile.current_xp,
            totalXP: defaultProfile.total_xp,
            coins: defaultProfile.coins,
            gamesPlayed: defaultProfile.games_played,
            bestScore: defaultProfile.best_score,
            maxVixSurvived: defaultProfile.max_vix_survived,
            totalTrades: defaultProfile.total_trades,
            breachesFixed: defaultProfile.breaches_fixed,
            wins: defaultProfile.wins,
            unlockedAssets: defaultProfile.unlocked_assets,
            powerUps: defaultProfile.powerups
        });

        // Process any level-ups based on transferred XP
        if (userProfile.totalXP > 0) {
            while (userProfile.currentXP >= generateLevelRequirement(userProfile.level)) {
                userProfile.currentXP -= generateLevelRequirement(userProfile.level);
                userProfile.level++;
                showLevelUp();
                awardCoins(adminSettings.coinRewards.levelUpBonus);
            }
        }

        updateMenuDisplay();
        updateProfileDisplay();
        
        // Mark as completed at the end
        accountCreationCompleted = true;
        
    } catch (error) {
        console.error('Failed to create user profile:', error);
        throw error;
    } finally {
        profileCreationInProgress = false;
    }
}

function createDefaultProfileObject(username) {
    return {
        user_id: currentUser.id,
        username: username,
    level: 1,
    current_xp: 0,
    total_xp: 0,
    coins: 0,
    games_played: 0,
    best_score: 0,
    total_trades: 0,
    breaches_fixed: 0,
    wins: 0,
    max_vix_survived: 10.0,
    unlocked_assets: ['indices', 'forex', 'commodities'],
    powerups: {
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

async function loadUserProfile() {
    if (!currentUser) {
        console.error('No current user for profile loading');
        return false; // Return false to indicate failure
    }
    
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                // No profile found, try to create one
                try {
                    const username = currentUser.user_metadata?.username || currentUser.email.split('@')[0];
                    await createUserProfile(username);
                    return true; // Profile created successfully
                } catch (createError) {
                    console.error('Failed to create user profile:', createError);
                    throw createError; // Re-throw to be caught by outer catch
                }
            } else {
                // Some other database error
                console.error('Database error loading profile:', error);
                throw error;
            }
        } else if (data) {
            // Successfully loaded profile data
            try {
                Object.assign(userProfile, {
                    username: data.username,
                    level: data.level,
                    currentXP: data.current_xp,
                    totalXP: data.total_xp,
                    coins: data.coins,
                    gamesPlayed: data.games_played,
                    bestScore: data.best_score || 0,
                    maxVixSurvived: data.max_vix_survived || 10.0,
                    totalTrades: data.total_trades,
                    breachesFixed: data.breaches_fixed,
                    wins: data.wins,
                    unlockedAssets: data.unlocked_assets || ['indices', 'forex', 'commodities'],
                    powerUps: data.powerups || {
                        freezeTimer: 0,
                        reduceExposures: 0,
                        marketFreeze: 0,
                        volatilityShield: 0,
                        tradingPlaces: 0,
                        hotVols: 0,
                        noddingBird: 0
                    }
                });
                updateMenuDisplay();
                updateProfileDisplay();
                return true; // Successfully loaded
            } catch (assignError) {
                console.error('Error processing profile data:', assignError);
                // Even if assignment fails, don't crash - use guest mode
                continueAsGuest();
                return false;
            }
        }
    } catch (error) {
        console.error('Critical error loading user profile:', error);
        // Always fall back to guest mode if anything goes wrong
        continueAsGuest();
        return false;
    }
}

async function saveUserProgress() {
    // Early returns for invalid states
    if (!currentUser || isGuestMode || !supabaseClient) {
        console.log('Cannot save progress: no user session or guest mode');
        return { success: false, reason: 'no_session' };
    }
    
    try {
        // Validate data before attempting to save
        const validationErrors = validateAndRepairUserProfile();
        if (!validationErrors) {
            console.warn('User profile had validation issues, but was repaired');
        }
        
        // Prepare data with additional safety checks
        const dataToSave = {
            username: userProfile.username || 'Unknown User',
            level: Math.max(1, Math.min(1000, parseInt(userProfile.level) || 1)),
            current_xp: Math.max(0, Math.min(100000, parseInt(userProfile.currentXP) || 0)),
            total_xp: Math.max(0, Math.min(10000000, parseInt(userProfile.totalXP) || 0)),
            coins: Math.max(0, Math.min(1000000, Math.floor(userProfile.coins) || 0)),
            games_played: Math.max(0, parseInt(userProfile.gamesPlayed) || 0),
            best_score: Math.max(0, parseInt(userProfile.bestScore) || 0),
            max_vix_survived: Math.max(10.0, parseFloat(userProfile.maxVixSurvived) || 10.0),
            total_trades: Math.max(0, parseInt(userProfile.totalTrades) || 0),
            breaches_fixed: Math.max(0, parseInt(userProfile.breachesFixed) || 0),
            wins: Math.max(0, parseInt(userProfile.wins) || 0),
            unlocked_assets: Array.isArray(userProfile.unlockedAssets) ? 
                userProfile.unlockedAssets : ['indices', 'forex', 'commodities'],
            powerups: (userProfile.powerUps && typeof userProfile.powerUps === 'object') ? 
                userProfile.powerUps : {
                    freezeTimer: 0,
                    reduceExposures: 0,
                    marketFreeze: 0,
                    volatilityShield: 0,
                    tradingPlaces: 0,
                    hotVols: 0,
                    noddingBird: 0
                },
            updated_at: new Date().toISOString()
        };
        
        // Attempt the database save with timeout
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Save operation timed out')), 10000); // 10 second timeout
        });
        
        const savePromise = supabaseClient
            .from('user_profiles')
            .update(dataToSave)
            .eq('user_id', currentUser.id);
        
        const { error } = await Promise.race([savePromise, timeoutPromise]);
        
        if (error) {
            console.error('Database error during save:', error);
            throw error;
        }
        
        console.log('User progress saved successfully');
        return { success: true };
        
    } catch (error) {
        console.error('Failed to save progress:', error);
        
        // Return detailed error information
        let errorType = 'unknown';
        if (error.message.includes('timeout')) {
            errorType = 'timeout';
        } else if (error.message.includes('network')) {
            errorType = 'network';
        } else if (error.code) {
            errorType = 'database';
        }
        
        return { 
            success: false, 
            error: error.message, 
            errorType: errorType 
        };
    }
}

async function saveGameSession(sessionData) {
    if (!currentUser || isGuestMode || !supabaseClient) {
        return;
    }
    
    try {
        console.log("Saving game session with score:", sessionData.score);
        
        // Save the game session
        const { error: sessionError } = await supabaseClient
            .from('game_sessions')
            .insert([{
                user_id: currentUser.id,
                score: sessionData.score,
                duration: sessionData.duration,
                trades: sessionData.trades,
                breaches: sessionData.breaches,
                difficulty: sessionData.difficulty,
                max_vix_survived: maxVixSurvived,  // Add this line
                created_at: new Date().toISOString()
            }]);
        
        if (sessionError) {
            console.error('Session save error:', sessionError);
            throw sessionError;
        }
        
        console.log("Game session saved successfully");
        
        // Get the current best_score from database to ensure we have the latest
        const { data: profileData, error: fetchError } = await supabaseClient
            .from('user_profiles')
            .select('best_score')
            .eq('user_id', currentUser.id)
            .single();
        
        if (fetchError) {
            console.error('Failed to fetch current best score:', fetchError);
            return;
        }
        
        const currentBestScore = profileData.best_score || 0;
        console.log("Current DB best score:", currentBestScore, "New score:", sessionData.score);
        
        // Update best_score if this is a new high score
        if (sessionData.score > currentBestScore) {
            console.log("Updating best score to", sessionData.score, "from", currentBestScore);
            
            const { error: profileError } = await supabaseClient
                .from('user_profiles')
                .update({
                    best_score: sessionData.score
                })
                .eq('user_id', currentUser.id);
            
            if (profileError) {
                console.error('Failed to update best score:', profileError);
            } else {
                // Update local profile as well
                userProfile.bestScore = sessionData.score;
                console.log('Best score updated successfully in database');
                
                // Force update displays
                updateMenuDisplay(); // This function needs to be defined in UI module
                updateProfileDisplay(); // This function needs to be defined in UI module
            }
        }
        
    } catch (error) {
        console.error('Failed to save game session:', error);
    }
}

// Guest mode and utility functions
function continueAsGuest() {
    // Don't start guest mode if we're in the middle of loading a user profile
    if (currentUser) {
        return;
    }
    
    isGuestMode = true;
    currentUser = null;
    resetToDefaults(); // This function needs to be defined in main file
    showMenu(); // This function needs to be defined in UI module
    initializeEverything(); // This function needs to be defined in main file
}

function guestCreateAccount() {
    // Save current progress temporarily
    const maxVixValue = window.maxVixSurvived || 10.0;
    
    const guestProgress = {
        level: userProfile.level,
        currentXP: userProfile.currentXP,
        totalXP: userProfile.totalXP,
        coins: userProfile.coins,
        gamesPlayed: userProfile.gamesPlayed,
        bestScore: userProfile.bestScore,
        totalTrades: userProfile.totalTrades,
        breachesFixed: userProfile.breachesFixed,
        wins: userProfile.wins,
        unlockedAssets: [...userProfile.unlockedAssets],
        powerUps: {...userProfile.powerUps},
        maxVixSurvived: maxVixValue
    };
    
    // Store in sessionStorage temporarily
    try {
        sessionStorage.setItem('guestProgress', JSON.stringify(guestProgress));
    } catch (error) {
        console.error('Failed to save guest progress:', error);
    }
    
    // Reset guest mode and show auth screen
    isGuestMode = false;
    currentUser = null;
    showAuthScreen(); // This function needs to be defined in UI module
    showRegisterForm(); // This function needs to be defined in UI module
}

// UI helper functions for auth forms (these could be moved to UI module later)
function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    clearAuthMessages();
}

function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    clearAuthMessages();
}

function clearAuthMessages() {
    const errorDivs = document.querySelectorAll('.auth-error, .auth-success');
    errorDivs.forEach(div => div.style.display = 'none');
}

// Auto-save progress periodically when user is playing
setInterval(() => {
    if (currentUser && !isGuestMode) {
        saveUserProgress();
    }
}, 30000); // Save every 30 seconds

// Set up auth state listener
// This should be at the end of auth.js
// Global variable to store the auth listener unsubscribe function
let authStateUnsubscribe = null;

// Set up auth state listener
// Set up auth state listener  
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        // Check if Supabase is properly initialized
        if (window.supabase && supabaseClient && supabaseClient.auth && typeof supabaseClient.auth.onAuthStateChange === 'function') {
            try {
                authStateUnsubscribe = supabaseClient.auth.onAuthStateChange((event, session) => {
                    // Don't interfere with active gameplay unless it's a critical auth event
                    if ((window.gameInterval || window.timerInterval) && event !== 'SIGNED_OUT') {
                        console.log('Game active, deferring auth state change:', event);
                        
                        // For token refresh during gameplay, handle silently
                        if (event === 'TOKEN_REFRESHED') {
                            console.log('Auth token refreshed during gameplay');
                            return;
                        }
                        
                        // For other events during gameplay, wait for game to pause/end
                        setTimeout(() => {
                            if (!window.gameInterval && !window.timerInterval) {
                                processAuthStateChange(event, session);
                            }
                        }, 1000);
                        return;
                    }
                    
                    // Safe to process immediately
                    processAuthStateChange(event, session);
                });
            } catch (error) {
                console.error('Error setting up auth state listener:', error);
            }
        } else {
            console.log('Supabase auth not available, skipping auth state listener setup');
        }
    }, 100);
});

function processAuthStateChange(event, session) {
    try {
        const userId = session?.user?.id;
        
        // For SIGNED_IN events, check if we've already processed this user
        if (event === 'SIGNED_IN' && userId && processedUserIds.has(userId)) {
            console.log('User already processed, skipping:', userId);
            return;
        }
        
        // Add user to processed set for SIGNED_IN events
        if (event === 'SIGNED_IN' && userId) {
            processedUserIds.add(userId);
        }
        
        if (event === 'SIGNED_OUT') {
            currentUser = null;
            isGuestMode = false;
            resetToDefaults();
            showAuthScreen();
        } else if (event === 'SIGNED_IN' && session?.user) {
            currentUser = session.user;
            return loadUserProfile().then(() => {
                showMenu();
            }).catch(error => {
                console.error('Failed to load profile after sign in:', error);
                continueAsGuest();
            });
        } else if (event === 'TOKEN_REFRESHED') {
            console.log('Auth token refreshed successfully');
        }
    } catch (error) {
        console.error('Error processing auth state change:', error);
        // Fall back to guest mode on any auth processing error
        continueAsGuest();
    }
}

// Cleanup function for auth listeners
function cleanupAuthListeners() {
    if (authStateUnsubscribe) {
        try {
            // Supabase auth listener returns a function, not an object with unsubscribe method
            if (typeof authStateUnsubscribe === 'function') {
                authStateUnsubscribe(); // Call the function directly
            } else if (authStateUnsubscribe.unsubscribe) {
                authStateUnsubscribe.unsubscribe(); // Fallback for object-style
            }
        } catch (error) {
            console.error('Error unsubscribing from auth state changes:', error);
        }
        authStateUnsubscribe = null;
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanupAuthListeners);

// Export to global scope
window.supabaseClient = supabaseClient;
window.currentUser = currentUser;
window.isGuestMode = isGuestMode;
window.initializeSupabase = initializeSupabase;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.continueAsGuest = continueAsGuest;
window.guestCreateAccount = guestCreateAccount;
window.showLoginForm = showLoginForm;
window.showRegisterForm = showRegisterForm;
window.saveUserProgress = saveUserProgress;
window.saveGameSession = saveGameSession;
window.checkAuthState = checkAuthState;
window.createUserProfile = createUserProfile;
window.loadUserProfile = loadUserProfile;
window.clearAuthMessages = clearAuthMessages;
window.isAdminUser = isAdminUser;