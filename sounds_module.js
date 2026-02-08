// ===== SOUND EFFECTS MODULE =====
// Dependencies: None
// Exposes: Sound playback and volume control

// Sound enabled state (default ON)
let soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
let masterVolume = parseFloat(localStorage.getItem('masterVolume') || '0.3');

// Make globally accessible immediately
window.soundEnabled = soundEnabled;
window.masterVolume = masterVolume;

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
    if (!soundEnabled) {
        console.log('Sound is disabled, not playing:', soundName);
        return;
    }
    
    try {
        const sound = soundEffects[soundName];
        if (sound) {
            sound.currentTime = 0; // Reset to start
            sound.volume = masterVolume;
            console.log('Playing sound:', soundName, 'at volume:', masterVolume);
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
function toggleSound() {
    soundEnabled = !soundEnabled;
    window.soundEnabled = soundEnabled; // Update global reference
    localStorage.setItem('soundEnabled', soundEnabled.toString());
    
    console.log('Toggling sound. New state:', soundEnabled);
    
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
function setVolume(volume) {
    const newVolume = Math.max(0, Math.min(1, parseFloat(volume)));
    console.log('Setting volume from', masterVolume, 'to', newVolume);
    
    masterVolume = newVolume;
    window.masterVolume = masterVolume; // Update global reference
    localStorage.setItem('masterVolume', masterVolume.toString());
    
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
function updateSoundUI() {
    console.log('Updating sound UI. Sound enabled:', soundEnabled, 'Volume:', masterVolume);
    
    // Update toggle button text
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
        soundToggle.textContent = soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
        soundToggle.style.background = soundEnabled ? 
            'linear-gradient(135deg, #4CAF50, #45a049)' : 
            'linear-gradient(135deg, #666, #555)';
        console.log('Updated sound toggle button');
    } else {
        console.warn('Sound toggle button not found');
    }
    
    // Update volume slider value
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        volumeSlider.value = masterVolume;
        volumeSlider.disabled = !soundEnabled;
        volumeSlider.style.opacity = soundEnabled ? '1' : '0.4';
        console.log('Updated volume slider to:', masterVolume);
    } else {
        console.warn('Volume slider not found');
    }
    
    // Update volume percentage display
    const volumePercent = document.getElementById('volumePercent');
    if (volumePercent) {
        const percentText = `${Math.round(masterVolume * 100)}%`;
        volumePercent.textContent = percentText;
        volumePercent.style.opacity = soundEnabled ? '1' : '0.4';
        console.log('Updated volume percent to:', percentText);
    } else {
        console.warn('Volume percent display not found');
    }
}

// Initialize sounds when module loads
initializeSounds();

// Export to global scope
window.soundEffects = soundEffects;
window.playSound = playSound;
window.toggleSound = toggleSound;
window.setVolume = setVolume;
window.updateSoundUI = updateSoundUI;
window.initializeSounds = initializeSounds;

console.log('Sound module loaded. Functions exported to window:', {
    soundEffects: typeof window.soundEffects,
    playSound: typeof window.playSound,
    toggleSound: typeof window.toggleSound,
    setVolume: typeof window.setVolume,
    updateSoundUI: typeof window.updateSoundUI
});