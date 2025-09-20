// ===== ADVERTISEMENT SYSTEM MODULE =====
// Dependencies: None (isolated module for ad management)
// Exposes: Ad initialization, loading functions

// MonetAg configuration
const MONETAG_PUSH_ZONE = '9905327';
const MONETAG_DOMAIN = 'yohle.com';

// Ad loading state
let adsEnabled = false;
let adsLoaded = false;

// Check if we should load ads (only on live domain)
function shouldLoadAds() {
    return window.location.hostname === 'tradingfrenzy.co.uk';
}

// Initialize ad system
function initializeAds() {
    if (!shouldLoadAds()) {
        console.log('Running locally - MonetAg ads disabled to prevent crashes');
        return;
    }
    
    adsEnabled = true;
    loadMonetAgCode();
    loadPushNotificationScript();
}

// Load MonetAg push notification script
function loadPushNotificationScript() {
    const script = document.createElement('script');
    script.src = `//${MONETAG_DOMAIN}/ntfc.php?p=${MONETAG_PUSH_ZONE}`;
    script.setAttribute('data-cfasync', 'false');
    script.async = true;
    script.onerror = function() { 
        console.log('MonetAg script failed to load'); 
    };
    script.onload = function() {
        console.log('MonetAg push notifications loaded successfully');
        adsLoaded = true;
    };
    document.head.appendChild(script);
}

// Load the main MonetAg code
function loadMonetAgCode() {
   
    // *** INSERT MONETAG MAIN CODE HERE ***
    // Replace this comment with the complete MonetAg code that starts with:
    // (()=>{var K='ChmaorrCfozdgenziMratt...
    // and ends with the closing })();
    
    console.log('MonetAg main code loaded');
}

// Utility functions for ad management
function isAdsEnabled() {
    return adsEnabled;
}

function isAdsLoaded() {
    return adsLoaded;
}

// Future ad placement functions
function createBannerAd(containerId, size = '320x50') {
    if (!adsEnabled) return;
    
    // Placeholder for future banner ad implementation
    console.log(`Creating ${size} banner ad in ${containerId}`);
}

function showInterstitialAd() {
    if (!adsEnabled) return;
    
    // Placeholder for future interstitial ad implementation
    console.log('Showing interstitial ad');
}

// Export to global scope
window.initializeAds = initializeAds;
window.shouldLoadAds = shouldLoadAds;
window.isAdsEnabled = isAdsEnabled;
window.isAdsLoaded = isAdsLoaded;
window.createBannerAd = createBannerAd;
window.showInterstitialAd = showInterstitialAd;