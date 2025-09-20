# Trading Frenzy - Game Documentation

## Overview

Trading Frenzy is a browser-based financial trading simulation game where players act as market makers managing exposure limits across various financial instruments. The objective is to keep market exposures within safe limits while scoring points through strategic trading decisions.

## Game Mechanics

### Core Gameplay
- **Objective**: Manage financial market exposures by keeping them within predetermined limits
- **Controls**: Buy/Sell buttons to adjust market positions
- **Scoring**: Points awarded for successful trades, breach management, and risk reduction
- **Lives System**: Players lose lives when breach countdown timers expire
- **Game End**: Game ends when all lives are lost or time limits are reached

### Market Categories
- **Indices**: S&P500, FTSE, DAX30, NIKKEI, NASDAQ, HANG SENG, CAC40
- **Forex**: EURUSD, GBPUSD, USDJPY, AUDUSD, USDCAD, EURGBP, NZDUSD  
- **Shares**: AAPL, MSFT, GOOGL, TSLA, AMZN, NVDA, META (unlocked at Level 3)
- **Commodities**: GOLD, SILVER, OIL WTI, NAT GAS, COPPER, WHEAT, COFFEE
- **Crypto**: BITCOIN, ETHEREUM, BNB, SOLANA, XRP, CARDANO, DOGECOIN (unlocked at Level 5)

### Exposure System
- **Green (0-74%)**: Safe exposure levels
- **Yellow (75-99%)**: Warning levels  
- **Red (100-149%)**: Breach levels - countdown timer activates
- **White (150%+)**: Critical breach levels

### Power-ups System
- **Market Freeze**: Stop all market movements (10 seconds)
- **Volatility Shield**: Reduce market volatility by 70% (15 seconds)
- **Freeze Timer**: Stop breach countdown timers (5 seconds)
- **Reduce All**: Cut all exposures by 25% (instant)
- **Trading Places**: Freeze commodity markets (60 seconds)
- **Hot Vols**: Double global volatility (30 seconds)
- **Nodding Bird**: Auto-hedge breaches (30 seconds)

### Progression System
- **XP & Levels**: Experience points earned through successful trading
- **Career Progression**: 20 levels from Intern I to Market Master
- **Coins**: In-game currency for purchasing power-ups and unlocking markets
- **Asset Unlocks**: New market categories available at higher levels

## Technical Architecture

### Modular JavaScript Structure
The game is built using a modular architecture for maintainability and development efficiency:

```
config_module.js      # Core configuration, market data, user profiles
auth_module.js        # Supabase authentication system  
gamestate_module.js   # Game state management, flow control
markets_module.js     # Market logic, exposure calculations
trading_module.js     # Trading mechanics, scoring system
powerups_module.js    # Power-up system and effects
ui_module.js          # User interface management
stats_module.js       # Statistics and leaderboards
```

### Build Process
- **Development**: Individual module files for easy editing
- **Production**: Combined into single HTML file via `build.py` script
- **Output**: `index.html` containing all modules and dependencies

### Database Integration
- **Backend**: Supabase (PostgreSQL) for user data persistence
- **Authentication**: Email/password with guest mode option
- **Data Storage**: User profiles, game sessions, leaderboards
- **Real-time Features**: Live leaderboards, progress tracking

## Web Development Infrastructure

### Domain & Hosting Setup
- **Domain**: tradingfrenzy.co.uk (registered through IONOS)
- **Hosting**: Netlify free tier (static site hosting)
- **SSL**: Automatic Let's Encrypt certificate via Netlify
- **DNS**: IONOS nameservers with A records pointing to Netlify

### Development Workflow
```
Local Development (VS Code)
    ↓
GitHub Repository (Version Control)
    ↓
Netlify (Automatic Deployment)
    ↓
Live Website (tradingfrenzy.co.uk)
```

### Version Control with Git/GitHub
- **Repository**: github.com/AChristieGit/trading-frenzy-game
- **Branch**: main (primary development branch)
- **Workflow**: 
  1. Edit modules in VS Code
  2. Run `python build.py` to generate `index.html`
  3. Commit changes via VS Code Source Control
  4. Push to GitHub
  5. Netlify automatically deploys to live site

### DNS Configuration
- **Registrar**: IONOS (domain registration and DNS management)
- **Nameservers**: IONOS default nameservers
- **A Record**: @ → 75.2.60.5 (Netlify IP)
- **CNAME Record**: www → tradingfrenzy.netlify.app

## File Structure

### Development Files
```
/project-root/
├── config_module.js          # Market data, settings, user profiles
├── auth_module.js            # Supabase authentication
├── gamestate_module.js       # Game state management  
├── markets_module.js         # Market logic and display
├── trading_module.js         # Trading mechanics
├── powerups_module.js        # Power-up system
├── ui_module.js              # User interface functions
├── stats_module.js           # Statistics and leaderboards
├── template.html             # HTML structure and CSS
├── build.py                  # Build script (Python)
└── index.html                # Generated production file
```

### Deployment Structure
```
/netlify-site/
└── index.html                # Complete game (HTML + CSS + JS)
```

## Key Features

### Authentication System
- **Guest Mode**: Play without account creation
- **User Accounts**: Progress persistence via Supabase
- **Guest-to-User Migration**: Convert guest progress when creating account
- **Auto-save**: Progress saved every 30 seconds during gameplay

### Responsive Design
- **Mobile Optimized**: Touch-friendly interface
- **Desktop Enhanced**: Full feature set with keyboard support
- **Progressive Enhancement**: Works across different screen sizes

### Performance Optimizations
- **Single File Deployment**: Reduces HTTP requests
- **Efficient Animations**: CSS transforms for smooth performance
- **Minimal Dependencies**: Only essential libraries (Supabase)
- **Static Hosting**: Fast global CDN delivery via Netlify

## Development Tools

### Local Development
- **Editor**: Visual Studio Code
- **Build Tool**: Python script for module combination
- **Testing**: Local file testing in browser
- **Version Control**: Git integration via VS Code

### Production Deployment
- **Hosting**: Netlify static site hosting
- **Domain**: IONOS domain registration
- **SSL**: Automatic certificate provisioning
- **Database**: Supabase managed PostgreSQL

### Monitoring & Analytics
- **Error Tracking**: Browser console logging for critical errors
- **User Analytics**: Basic usage tracking via Supabase
- **Performance**: Netlify analytics for site performance

## Cost Structure

### Annual Costs
- **Domain Registration**: ~£15/year (IONOS)
- **Hosting**: Free (Netlify free tier)
- **Database**: Free (Supabase free tier)
- **SSL Certificate**: Free (Let's Encrypt via Netlify)
- **Total**: ~£15/year

### Scalability Limits (Free Tiers)
- **Netlify**: 100GB bandwidth, 300 build minutes/month
- **Supabase**: 500MB database, 2GB bandwidth/month
- **Expected Usage**: Well within free tier limits

## Future Development Considerations

### Planned Features
- **Admin Panel**: Hidden admin controls for game tuning
- **Advertisement Integration**: Monetization via PropellerAds
- **Mobile App**: Potential native app development
- **Multiplayer Features**: Real-time competitive modes

### Technical Debt
- **Supabase Credentials**: Currently hardcoded, should use environment variables
- **Error Handling**: Could be enhanced for better user experience
- **Performance**: Module loading could be optimized further
- **Security**: Admin system needs proper implementation

## Deployment Process

### Making Changes
1. Edit module files in VS Code
2. Test changes locally by opening built HTML file
3. Run `python build.py` to generate production `index.html`
4. Commit changes via VS Code Source Control panel
5. Push to GitHub (automatic deployment to live site)

### Rollback Process
1. Identify problematic commit in GitHub
2. Revert commit via GitHub interface or Git commands
3. Netlify automatically deploys reverted version
4. Live site returns to previous working state

### Emergency Procedures
- **Site Down**: Check Netlify deploy status and GitHub repository
- **Database Issues**: Monitor Supabase dashboard for outages
- **DNS Problems**: Verify IONOS DNS records and Netlify domain settings

## Contact Information

- **Website**: tradingfrenzy.co.uk
- **Email**: contact@tradingfrenzy.co.uk (configured via IONOS)
- **Repository**: github.com/AChristieGit/trading-frenzy-game
- **Hosting**: Netlify dashboard for deployment management