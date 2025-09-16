// ===== AUTHENTICATION SYSTEM MODULE =====
// Dependencies: config.js (userProfile, initializeDefaultProfile)
// Exposes: Authentication functions, user session management

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

// Global auth state
let supabase = window.supabase || null;
let currentUser = window.currentUser || null;
let isGuestMode = window.isGuestMode || false;

// Initialize Supabase when the page loads
function initializeSupabase() {
    try {
        if (SUPABASE_URL === 'YOUR_SUPABASE_URL_HERE' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY_HERE') {
            console.log('Supabase credentials not configured, starting in guest mode');
            continueAsGuest();
            initializeEverything(); // This function needs to be defined in the main file
            return;
        }
        
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase initialized successfully');
        checkAuthState();
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        continueAsGuest();
        initializeEverything(); // This function needs to be defined in the main file
    }
}

// Check if user is already logged in
async function checkAuthState() {
    if (!supabase) {
        continueAsGuest();
        initializeEverything(); // This function needs to be defined in the main file
        return;
    }
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
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
    }
}

// Authentication functions
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const button = document.getElementById('loginButton');
    const errorDiv = document.getElementById('loginError');
    
    button.disabled = true;
    button.innerHTML = '<span class="loading-spinner"></span>Signing in...';
    errorDiv.style.display = 'none';
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        await loadUserProfile();
        showMenu(); // This function needs to be defined in UI module
        
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    } finally {
        button.disabled = false;
        button.textContent = 'Sign In';
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const button = document.getElementById('registerButton');
    const errorDiv = document.getElementById('registerError');
    const successDiv = document.getElementById('registerSuccess');
    
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        errorDiv.textContent = 'Username can only contain letters, numbers, underscores, and hyphens';
        errorDiv.style.display = 'block';
        return;
    }
    
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
            const { data: existingProfile } = await supabase
                .from('user_profiles')
                .select('username')
                .eq('username', username)
                .single();
            
            if (existingProfile) {
                // Username taken, need to sign out and show error
                await supabase.auth.signOut();
                throw new Error('Username already taken');
            }
            
            await createUserProfile(username);
            showMenu(); // This function needs to be defined in UI module
        }
        
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    } finally {
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
    }
}

async function createUserProfile(username) {
    if (!currentUser) return;
    
    // Check if there's saved guest progress
    const savedGuestProgress = sessionStorage.getItem('guestProgress');
    let defaultProfile;
    
    if (savedGuestProgress) {
        // Use guest progress as starting point
        const guestData = JSON.parse(savedGuestProgress);
        defaultProfile = {
            user_id: currentUser.id,
            username: username,
            level: guestData.level,
            current_xp: guestData.currentXP,
            total_xp: guestData.totalXP,
            coins: Math.floor(guestData.coins),
            games_played: guestData.gamesPlayed,
            best_score: guestData.bestScore,
            total_trades: guestData.totalTrades,
            breaches_fixed: guestData.breachesFixed,
            wins: guestData.wins,
            unlocked_assets: guestData.unlockedAssets,
            powerups: guestData.powerUps
        };
        // Clear the temporary storage
        sessionStorage.removeItem('guestProgress');
    } else {
        // Use default fresh profile
        defaultProfile = {
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
    
    try {
        const { error } = await supabase
            .from('user_profiles')
            .insert([defaultProfile]);
        
        if (error) throw error;
        
        Object.assign(userProfile, defaultProfile);
        Object.assign(userProfile, defaultProfile);

// Process any level-ups based on transferred XP
if (userProfile.totalXP > 0) {
    while (userProfile.currentXP >= generateLevelRequirement(userProfile.level)) {
        userProfile.currentXP -= generateLevelRequirement(userProfile.level);
        userProfile.level++;
        showLevelUp(); // Show level up notification
        awardCoins(adminSettings.coinRewards.levelUpBonus); // Award level up coins
    }
}

updateMenuDisplay(); // This function needs to be defined in UI module
updateProfileDisplay(); // This function needs to be defined in UI module
        updateMenuDisplay(); // This function needs to be defined in UI module
        updateProfileDisplay(); // This function needs to be defined in UI module
        
        // Sync the menu difficulty with the current game difficulty
        document.querySelectorAll('.menu-difficulty-pill').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`[data-difficulty="${difficulty}"]`).classList.add('active');
        
    } catch (error) {
        console.error('Failed to create user profile:', error);
    }
}

async function loadUserProfile() {
    if (!currentUser) return;
    
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')  // This should get all fields including best_score
            .eq('user_id', currentUser.id)
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                const username = currentUser.user_metadata?.username || currentUser.email.split('@')[0];
                await createUserProfile(username);
            } else {
                throw error;
            }
        } else if (data) {
            // Make sure best_score is being loaded
            Object.assign(userProfile, {
                username: data.username,
                level: data.level,
                currentXP: data.current_xp,
                totalXP: data.total_xp,
                coins: data.coins,
                gamesPlayed: data.games_played,
                bestScore: data.best_score || 0,  // Make sure this line exists
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
            console.log("Loaded profile with best score:", userProfile.bestScore);
            updateMenuDisplay(); // This function needs to be defined in UI module
            updateProfileDisplay(); // This function needs to be defined in UI module
        }
    } catch (error) {
        console.error('Failed to load user profile:', error);
        continueAsGuest();
    }
}

async function saveUserProgress() {
    if (!currentUser || isGuestMode) return;
    
    try {
        const { error } = await supabase
            .from('user_profiles')
            .update({
                username: userProfile.username,
                level: userProfile.level,
                current_xp: userProfile.currentXP,
                total_xp: userProfile.totalXP,
                coins: Math.floor(userProfile.coins),
                games_played: userProfile.gamesPlayed,
                best_score: userProfile.bestScore,  // Make sure this is included
                total_trades: userProfile.totalTrades,
                breaches_fixed: userProfile.breachesFixed,
                wins: userProfile.wins,
                unlocked_assets: userProfile.unlockedAssets,
                powerups: userProfile.powerUps,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', currentUser.id);
        
        if (error) throw error;
        
    } catch (error) {
        console.error('Failed to save progress:', error);
    }
}

async function saveGameSession(sessionData) {
    if (!currentUser || isGuestMode) return;
    
    try {
        console.log("Saving game session with score:", sessionData.score);
        
        // Save the game session
        const { error: sessionError } = await supabase
            .from('game_sessions')
            .insert([{
                user_id: currentUser.id,
                score: sessionData.score,
                duration: sessionData.duration,
                trades: sessionData.trades,
                breaches: sessionData.breaches,
                difficulty: sessionData.difficulty,
                created_at: new Date().toISOString()
            }]);
        
        if (sessionError) {
            console.error('Session save error:', sessionError);
            throw sessionError;
        }
        
        console.log("Game session saved successfully");
        
        // Get the current best_score from database to ensure we have the latest
        const { data: profileData, error: fetchError } = await supabase
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
        if (sessionData.score > (currentBestScore || 0)) {
            console.log("Updating best score to", sessionData.score, "from", currentBestScore);
            
            const { error: profileError } = await supabase
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
        powerUps: {...userProfile.powerUps}
    };
    
    // Store in sessionStorage temporarily
    sessionStorage.setItem('guestProgress', JSON.stringify(guestProgress));
    
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
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.supabase && supabase) {
            supabase.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_OUT') {
                    currentUser = null;
                    isGuestMode = false;
                    resetToDefaults();
                    showAuthScreen();
                } else if (event === 'SIGNED_IN' && session?.user) {
                    currentUser = session.user;
                    loadUserProfile().then(() => showMenu());
                }
            });
        }
    }, 100);
});

// Export to global scope
window.supabase = supabase;
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