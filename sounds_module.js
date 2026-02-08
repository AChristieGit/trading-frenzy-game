// ===== SOUND EFFECTS MODULE =====
// Dependencies: None
// Exposes: Sound playback and volume control

// Sound enabled state (default ON)
let soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
let masterVolume = parseFloat(localStorage.getItem('masterVolume') || '0.3');

// Sound effect library
const soundEffects = {
    breach: new Audio('sounds/Breach.wav'),
    lifeLost: new Audio('sounds/Lifeloss.wav'),
    gameOver: new Audio('sounds/GameLose.wav'),
    success: new Audio('sounds/ClearBreach.wav'),
    powerup: new Audio('sounds/Powerup.wav')
};

// Preload all sounds and set initial volume
function initializeSounds() {
    Object.values(soundEffects).forEach(sound => {
        sound.preload = 'auto';
        sound.volume = soundEnabled ? masterVolume : 0;
    });
    console.log('Sound system initialized. Enabled:', soundEnabled, 'Volume:', masterVolume);
}

// Play a sound effect
function playSound(soundName) {
    if (!soundEnabled) return;
    
    try {
        const sound = soundEffects[soundName];
        if (sound) {
            sound.currentTime = 0; // Reset to start
            sound.volume = masterVolume;
            sound.play().catch(e => {
                // Silent fail - browser may block autoplay
                console.log('Sound play failed:', e.message);
            });
        } else {
            console.warn('Sound not found:', soundName);
        }
    } catch (error) {
        console.error('Sound error:', error);
    }
}

// Toggle sound on/off
// Toggle sound on/off
function toggleSound() {
    soundEnabled = !soundEnabled;
    window.soundEnabled = soundEnabled; // Update global reference
    localStorage.setItem('soundEnabled', soundEnabled);
    
    // Update all sound volumes
    Object.values(soundEffects).forEach(sound => {
        sound.volume = soundEnabled ? masterVolume : 0;
    });
    
    // Update UI immediately
    updateSoundUI();
    
    // Play a test sound when enabling
    if (soundEnabled) {
        setTimeout(() => playSound('success'), 100);
    }
    
    console.log('Sound', soundEnabled ? 'enabled' : 'disabled');
    return soundEnabled; // Return new state
}

// Set master volume (0.0 to 1.0)
// Set master volume (0.0 to 1.0)
function setVolume(volume) {
    masterVolume = Math.max(0, Math.min(1, parseFloat(volume)));
    window.masterVolume = masterVolume; // Update global reference
    localStorage.setItem('masterVolume', masterVolume);
    
    if (soundEnabled) {
        Object.values(soundEffects).forEach(sound => {
            sound.volume = masterVolume;
        });
    }
    
    updateSoundUI();
    console.log('Volume set to:', (masterVolume * 100).toFixed(0) + '%');
    
    // Play a brief test sound when adjusting volume
    if (soundEnabled && masterVolume > 0) {
        playSound('success');
    }
}

// Update sound UI elements
// Update sound UI elements
function updateSoundUI() {
    // Update toggle button text
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
        soundToggle.textContent = soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
        soundToggle.style.background = soundEnabled ? 
            'linear-gradient(135deg, #4CAF50, #45a049)' : 
            'linear-gradient(135deg, #666, #555)';
    }
    
    // Update volume slider value
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        volumeSlider.value = masterVolume;
        volumeSlider.disabled = !soundEnabled;
        volumeSlider.style.opacity = soundEnabled ? '1' : '0.4';
    }
    
    // Update volume percentage display
    const volumePercent = document.getElementById('volumePercent');
    if (volumePercent) {
        volumePercent.textContent = `${Math.round(masterVolume * 100)}%`;
        volumePercent.style.opacity = soundEnabled ? '1' : '0.4';
    }
    
    console.log('UI updated - Sound:', soundEnabled, 'Volume:', Math.round(masterVolume * 100) + '%');
}

// Initialize sounds when module loads
initializeSounds();

// Export to global scope
window.soundEffects = soundEffects;
window.soundEnabled = soundEnabled;
window.masterVolume = masterVolume;
window.playSound = playSound;
window.toggleSound = toggleSound;
window.setVolume = setVolume;
window.updateSoundUI = updateSoundUI;
window.initializeSounds = initializeSounds;