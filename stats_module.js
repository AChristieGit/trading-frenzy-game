// ===== STATS & LEADERBOARDS MODULE =====
// Dependencies: config.js (userProfile, getCareerTitle), auth.js (supabase, currentUser, isGuestMode)
// Exposes: Statistics display, leaderboards, career progression

// Statistics modal functions
function showStats() {
    document.getElementById('totalGames').textContent = userProfile.gamesPlayed;
    document.getElementById('bestScore').textContent = userProfile.bestScore;
    document.getElementById('totalXP').textContent = userProfile.totalXP;
    document.getElementById('currentLevel').textContent = userProfile.level;
    document.getElementById('totalTrades').textContent = userProfile.totalTrades;
    document.getElementById('breachesFixed').textContent = userProfile.breachesFixed;
    document.getElementById('totalCoins').textContent = Math.floor(userProfile.coins);
    
    const winRate = userProfile.gamesPlayed > 0 ? 
        Math.round((userProfile.wins / userProfile.gamesPlayed) * 100) : 0;
    document.getElementById('winRate').textContent = `${winRate}%`;
    
    document.getElementById('statsModal').style.display = 'flex';
}

function closeStatsModal() {
    document.getElementById('statsModal').style.display = 'none';
}

// Career progression functions
function showCareer() {
    updateCareerDisplay();
    document.getElementById('careerModal').style.display = 'flex';
}

function closeCareer() {
    document.getElementById('careerModal').style.display = 'none';
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

// Leaderboard functions
async function showLeaderboard() {
    document.getElementById('leaderboardModal').style.display = 'flex';
    
    // Reset to first tab
    switchLeaderboardTab('level');
    
    // Show loading state immediately
    document.getElementById('levelLeaderboard').innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">Loading...</div>';
    document.getElementById('scoreLeaderboard').innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">Loading...</div>';
    
    // Load both leaderboards
    await Promise.all([
        loadLevelLeaderboard(),
        loadScoreLeaderboard()
    ]);
}

function switchLeaderboardTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.leaderboard-tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Hide all content
    document.getElementById('levelLeaderboard').style.display = 'none';
    document.getElementById('scoreLeaderboard').style.display = 'none';
    document.getElementById('vixLeaderboard').style.display = 'none';
    
    // Show selected tab
    if (tab === 'level') {
        document.querySelector('.leaderboard-tab-button:first-child').classList.add('active');
        document.getElementById('levelLeaderboard').style.display = 'block';
    } else if (tab === 'score') {
        document.querySelector('.leaderboard-tab-button:nth-child(2)').classList.add('active');
        document.getElementById('scoreLeaderboard').style.display = 'block';
    } else if (tab === 'vix') {
        document.querySelector('.leaderboard-tab-button:nth-child(3)').classList.add('active');
        document.getElementById('vixLeaderboard').style.display = 'block';
        loadVixLeaderboard(); // Load VIX data when tab is opened
    }
}

async function loadVixLeaderboard() {
    const vixDataDiv = document.getElementById('vixLeaderboardData');
    const difficultyFilter = document.getElementById('vixDifficultyFilter').value;
    
    if (!supabase) {
        vixDataDiv.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">Leaderboards not available in guest mode</div>';
        return;
    }
    
    try {
        console.log('Fetching VIX leaderboard...');
        
        // First get the top VIX records
        let sessionQuery = supabase
            .from('game_sessions')
            .select('user_id, max_vix_survived, difficulty')
            .gt('max_vix_survived', 10.0)
            .order('max_vix_survived', { ascending: false })
            .limit(10);
        
        if (difficultyFilter !== 'all') {
            sessionQuery = sessionQuery.eq('difficulty', parseInt(difficultyFilter));
        }
        
        const { data: sessions, error: sessionError } = await sessionQuery;
        
        if (sessionError) throw sessionError;
        
        if (!sessions || sessions.length === 0) {
            vixDataDiv.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">No VIX records found</div>';
            return;
        }
        
        // Get user details for these sessions
        const userIds = [...new Set(sessions.map(s => s.user_id))];
        const { data: users, error: userError } = await supabase
            .from('user_profiles')
            .select('user_id, username')
            .in('user_id', userIds);
        
        if (userError) throw userError;
        
        // Create a lookup map for usernames
        const userMap = {};
        users.forEach(user => {
            userMap[user.user_id] = user.username;
        });
        
        // Build the leaderboard display
        vixDataDiv.innerHTML = sessions.map((session, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
            const isCurrentUser = currentUser && session.user_id === currentUser.id;
            const highlightStyle = isCurrentUser ? 'background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.3);' : '';
            const difficultyName = ['Easy', 'Normal', 'Hard'][session.difficulty - 1];
            const username = userMap[session.user_id] || 'Unknown User';
            
            return `
                <div style="margin-bottom: 10px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; ${highlightStyle}">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: #ffffff; font-size: 14px;">
                                ${medal} ${username}
                                ${isCurrentUser ? ' (You)' : ''}
                            </strong><br>
                            <small style="color: #888;">${difficultyName} Difficulty</small>
                        </div>
                        <div style="text-align: right;">
                            <span style="color: #ff9800; font-weight: bold; font-size: 16px;">VIX ${session.max_vix_survived.toFixed(1)}</span><br>
                            <small style="color: #888;">survived</small>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Failed to load VIX leaderboard:', error);
        vixDataDiv.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">Failed to load leaderboard</div>';
    }
}

async function loadLevelLeaderboard() {
    const levelDiv = document.getElementById('levelLeaderboard');
    
    if (!supabase) {
        levelDiv.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">Leaderboards not available in guest mode</div>';
        return;
    }
    
    try {
        console.log('Fetching level leaderboard...');
        
        const { data, error } = await supabase
            .from('user_profiles')
            .select('username, level, total_xp')
            .order('level', { ascending: false })
            .order('total_xp', { ascending: false })
            .limit(10);
        
        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }
        
        console.log('Level leaderboard data:', data);
        
        if (data && data.length > 0) {
            levelDiv.innerHTML = data.map((player, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                const isCurrentUser = currentUser && player.username === userProfile.username;
                const highlightStyle = isCurrentUser ? 'background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.3);' : '';
                
                return `
                    <div style="margin-bottom: 10px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; ${highlightStyle}">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong style="color: #ffffff; font-size: 14px;">
                                    ${medal} ${player.username}
                                    ${isCurrentUser ? ' (You)' : ''}
                                </strong>
                            </div>
                            <div style="text-align: right;">
                                <span style="color: #ffd700; font-weight: bold;">Level ${player.level}</span><br>
                                <small style="color: #888;">${player.total_xp.toLocaleString()} XP</small>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            // If no data, show just the current player as a fallback
            if (currentUser && !isGuestMode) {
                levelDiv.innerHTML = `
                    <div style="margin-bottom: 10px; padding: 12px; background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.3); border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong style="color: #ffffff; font-size: 14px;">
                                    🥇 ${userProfile.username} (You)
                                </strong>
                            </div>
                            <div style="text-align: right;">
                                <span style="color: #ffd700; font-weight: bold;">Level ${userProfile.level}</span><br>
                                <small style="color: #888;">${userProfile.totalXP} XP</small>
                            </div>
                        </div>
                    </div>
                    <div style="color: #888; text-align: center; padding: 10px;">Be the first to climb the ranks!</div>
                `;
            } else {
                levelDiv.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">No players yet</div>';
            }
        }
    } catch (error) {
        console.error('Failed to load level leaderboard:', error);
        
        // Show current player as fallback
        if (currentUser && !isGuestMode) {
            levelDiv.innerHTML = `
                <div style="margin-bottom: 10px; padding: 12px; background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.3); border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: #ffffff; font-size: 14px;">
                                ${userProfile.username} (You)
                            </strong>
                        </div>
                        <div style="text-align: right;">
                            <span style="color: #ffd700; font-weight: bold;">Level ${userProfile.level}</span><br>
                            <small style="color: #888;">${userProfile.totalXP} XP</small>
                        </div>
                    </div>
                </div>
                <div style="color: #888; text-align: center; padding: 10px; font-size: 12px;">Unable to load full leaderboard</div>
            `;
        } else {
            levelDiv.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">Failed to load leaderboard</div>';
        }
    }
}

async function loadScoreLeaderboard() {
    const scoreDiv = document.getElementById('scoreLeaderboard');
    
    if (!supabase) {
        scoreDiv.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">Leaderboards not available in guest mode</div>';
        return;
    }
    
    try {
        console.log('Fetching score leaderboard...');
        
        // Get profiles with best scores > 0, ordered by best score
        const { data: profiles, error: profileError } = await supabase
            .from('user_profiles')
            .select('username, best_score, user_id')
            .gt('best_score', 0)
            .order('best_score', { ascending: false })
            .limit(10);
        
        if (profileError) {
            console.error('Profile error:', profileError);
            throw profileError;
        }
        
        console.log('Score leaderboard data:', profiles);
        
        if (profiles && profiles.length > 0) {
            scoreDiv.innerHTML = profiles.map((profile, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                const isCurrentUser = currentUser && profile.user_id === currentUser.id;
                const highlightStyle = isCurrentUser ? 'background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.3);' : '';
                
                return `
                    <div style="margin-bottom: 10px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; ${highlightStyle}">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong style="color: #ffffff; font-size: 14px;">
                                    ${medal} ${profile.username}
                                    ${isCurrentUser ? ' (You)' : ''}
                                </strong><br>
                                <small style="color: #888;">Personal Best</small>
                            </div>
                            <div style="text-align: right;">
                                <span style="color: #00ff88; font-weight: bold; font-size: 16px;">${profile.best_score.toLocaleString()}</span><br>
                                <small style="color: #888;">points</small>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            scoreDiv.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">No high scores yet - be the first!</div>';
        }
    } catch (error) {
        console.error('Failed to load score leaderboard:', error);
        scoreDiv.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">Failed to load leaderboard</div>';
    }
}

function closeLeaderboard() {
    document.getElementById('leaderboardModal').style.display = 'none';
}


// Export to global scope
window.showStats = showStats;
window.closeStatsModal = closeStatsModal;
window.showCareer = showCareer;
window.closeCareer = closeCareer;
window.updateCareerDisplay = updateCareerDisplay;
window.showLeaderboard = showLeaderboard;
window.switchLeaderboardTab = switchLeaderboardTab;
window.loadLevelLeaderboard = loadLevelLeaderboard;
window.loadScoreLeaderboard = loadScoreLeaderboard;
window.closeLeaderboard = closeLeaderboard;
window.loadVixLeaderboard = loadVixLeaderboard;
window.maxVixSurvived = maxVixSurvived;