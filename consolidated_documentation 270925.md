# Trading Frenzy - Complete Technical Documentation

## Project Overview

Trading Frenzy is a browser-based financial trading simulation game where players act as market makers managing exposure limits across various financial instruments. Players must keep market exposures within safe limits while scoring points through strategic trading decisions and power-up usage.

**Live Site**: https://tradingfrenzy.co.uk  
**Repository**: https://github.com/AChristieGit/trading-frenzy-game  
**Tech Stack**: Vanilla JavaScript (Modular), HTML5, CSS3, Supabase (PostgreSQL), Netlify

---

## Game Mechanics

### Core Gameplay Loop
- **Objective**: Manage financial market exposures by keeping them within predetermined limits
- **Controls**: Buy/Sell buttons to adjust market positions in 25% increments
- **Scoring**: Points awarded for successful trades, breach management, and risk reduction
- **Lives System**: Players have 3 lives, lost when breach countdown timers expire
- **VIX System**: Real-time volatility indicator (base value × 10) that increases with escalating difficulty

### Market Categories & Unlock System
- **Indices** (Default): S&P500, FTSE, DAX30, NIKKEI, NASDAQ, HANG SENG, CAC40
- **Forex** (Default): EURUSD, GBPUSD, USDJPY, AUDUSD, USDCAD, EURGBP, NZDUSD  
- **Commodities** (Default): GOLD, SILVER, OIL WTI, NAT GAS, COPPER, WHEAT, COFFEE
- **Shares** (Level 3, 150 coins): AAPL, MSFT, GOOGL, TSLA, AMZN, NVDA, META
- **Crypto** (Level 5, 300 coins): BITCOIN, ETHEREUM, BNB, SOLANA, XRP, CARDANO, DOGECOIN

### Exposure Risk System
- **Green (0-74%)**: Safe exposure levels
- **Yellow (75-99%)**: Warning levels requiring attention
- **Red (100-149%)**: Breach levels - countdown timer activates (7 seconds default)
- **White (150%+)**: Critical breach levels with severe scoring penalties

### Power-ups System
| Power-up | Duration | Cooldown | Cost | Effect |
|----------|----------|----------|------|--------|
| Market Freeze | 10s | 20s | 75 coins | Stops all market movements |
| Volatility Shield | 15s | 25s | 60 coins | Reduces volatility by 70% |
| Freeze Timer | 5s | 15s | 25 coins | Stops breach countdown timers |
| Reduce All | Instant | 30s | 50 coins | Cuts all exposures by 25% |
| Trading Places | 60s | 90s | 100 coins | Freezes commodity markets |
| Hot Vols | 30s | 45s | 80 coins | Doubles global volatility |
| Nodding Bird | 30s | 60s | 120 coins | Auto-hedges breaches (15% reduction per cycle) |

### Progression & Rewards System
- **XP System**: Earned through successful trades and breach management
- **Level Progression**: 20 career levels from "Intern I" to "Market Master"
- **Coin Economy**: In-game currency for purchasing power-ups and assets
- **Difficulty Scaling**: Easy (700ms), Normal (400ms), Hard (350ms) update intervals
- **Escalating Difficulty**: Volatility increases every 60 seconds during gameplay

---

## Technical Architecture

### Modular JavaScript Structure
The game uses a dependency-ordered modular system for maintainability:

```
config_module.js      # Core configuration, market data, user profiles
auth_module.js        # Supabase authentication and session management
gamestate_module.js   # Game state management and flow control
markets_module.js     # Market logic, exposure calculations, display
trading_module.js     # Trading mechanics and scoring system
powerups_module.js    # Power-up system and effects management
ui_module.js          # User interface and display updates
stats_module.js       # Statistics, leaderboards, and career progression
```

### Build & Deployment Process
- **Development**: Individual module files for easy editing and debugging
- **Build Script**: `build.py` (Python) combines modules into single production file
- **Output**: `index.html` containing all modules, dependencies, and assets
- **Deployment**: Automatic via Netlify when pushing to GitHub main branch

### Database Schema (Supabase PostgreSQL)

#### user_profiles
| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | uuid | Primary Key | Auto-generated profile ID |
| user_id | uuid | Foreign Key (auth.users) | Supabase auth user reference |
| username | text | Unique, Not Null | Player display name |
| level | integer | Default: 1 | Current player level |
| current_xp | integer | Default: 0 | XP toward next level |
| total_xp | integer | Default: 0 | Lifetime XP earned |
| coins | numeric | Default: 0 | Current coin balance |
| games_played | integer | Default: 0 | Total games completed |
| best_score | integer | Default: 0 | Highest score achieved |
| total_trades | integer | Default: 0 | Lifetime trades made |
| breaches_fixed | integer | Default: 0 | Lifetime breaches resolved |
| wins | integer | Default: 0 | Games with positive scores |
| unlocked_assets | json | Default: ['indices','forex','commodities'] | Available market categories |
| powerups | json | Default: {...} | Power-up inventory |
| created_at | timestamp | Auto | Profile creation time |
| updated_at | timestamp | Auto | Last profile update |

#### game_sessions
| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | uuid | Primary Key | Session identifier |
| user_id | uuid | Foreign Key | Player who played session |
| score | integer | Not Null | Final score achieved |
| duration | integer | Not Null | Game duration in seconds |
| trades | integer | Default: 0 | Trades made in session |
| breaches | integer | Default: 0 | Breaches encountered |
| difficulty | integer | 1-3 | Difficulty level played |
| max_vix_survived | numeric | Default: 10.0 | Highest base volatility survived |
| created_at | timestamp | Auto | Session completion time |

---

## Infrastructure & Deployment

### Hosting & Domain Configuration
- **Domain**: tradingfrenzy.co.uk (IONOS registration, ~£15/year)
- **Hosting**: Netlify free tier (100GB bandwidth, 300 build minutes/month)
- **SSL**: Automatic Let's Encrypt certificate via Netlify
- **DNS**: IONOS nameservers with A record pointing to Netlify (75.2.60.5)

### Development Workflow
```
Local Development (VS Code) 
    ↓ (Edit individual module files)
Python Build Script
    ↓ (Combines modules into index.html)
GitHub Repository (Version Control)
    ↓ (Push to main branch)
Netlify Auto-Deploy
    ↓ (Deploy to CDN)
Live Website (tradingfrenzy.co.uk)
```

### Cost Structure (Annual)
- **Domain Registration**: ~£15/year (IONOS)
- **Hosting**: Free (Netlify free tier)
- **Database**: Free (Supabase free tier - 500MB, 2GB bandwidth/month)
- **SSL Certificate**: Free (Let's Encrypt via Netlify)
- **Total Annual Cost**: ~£15

---

## Recent Technical Improvements

### Performance Optimizations (Latest)
- **DOM Caching**: Implemented element caching in market display to reduce DOM queries by ~80%
- **Efficient Powerup Updates**: Optimized powerup bar to update existing elements instead of regenerating HTML
- **Memory Leak Prevention**: Added comprehensive cleanup for intervals, DOM elements, and event listeners
- **Tab Visibility Handling**: Game display refreshes when returning to browser tab

### Error Handling & Reliability
- **Comprehensive Error Boundaries**: All async operations wrapped in try-catch blocks with fallback behavior
- **Data Validation**: Input sanitization and bounds checking with auto-repair for corrupted user data
- **Race Condition Prevention**: Operation queue system prevents conflicts between auth and gameplay
- **Timeout Management**: 10-second timeouts on database operations prevent indefinite hanging

### VIX Volatility System (New Feature)
- **Real-Time Display**: VIX indicator in game info bar (base volatility × 10)
- **Color Coding**: Green (10-20), Yellow (20-30), Orange (30-40), Red (40+), Purple (powerup-affected)
- **Base VIX Tracking**: Excludes powerup modifications for fair leaderboard comparison
- **VIX Leaderboard**: New leaderboard category with difficulty-based filtering
- **Database Integration**: `max_vix_survived` column tracks highest volatility per session

### Authentication & Session Management
- **Enhanced Error Handling**: Comprehensive auth state management with fallback to guest mode
- **Token Refresh**: Improved handling of Supabase token refresh during active gameplay
- **Guest Migration**: Seamless progression transfer when guest users create accounts
- **Auto-Save**: Progress saved every 30 seconds with comprehensive error recovery

---

## Development Tools & Debugging

### Local Development Setup
- **Editor**: Visual Studio Code with Git integration
- **Testing**: Local file testing via `file://` protocol
- **Build Command**: `python build.py` (combines modules)
- **Debug Mode**: Individual modules for easier error tracking

### Common Development Issues & Solutions
- **Module Loading Order**: Dependencies must load in correct sequence (see build.py)
- **DOM Element Timing**: Use `safeElementOperation()` wrapper for DOM access
- **Memory Management**: Always call cleanup functions when switching game states
- **Auth Timing**: Check `isAuthOperationInProgress()` before auth operations

### Performance Monitoring
- **Browser DevTools**: Memory tab for leak detection
- **Console Logging**: Structured logging with module prefixes
- **Error Tracking**: All errors logged with context and stack traces
- **Database Analytics**: Supabase dashboard for query performance

---

## Security & Best Practices

### Current Security Measures
- **Input Validation**: All user inputs sanitized and bounds-checked
- **SQL Injection Prevention**: Supabase ORM prevents direct SQL injection
- **XSS Protection**: User-generated content properly escaped
- **Rate Limiting**: Implicit through Supabase free tier limits

### Known Technical Debt
- **Hardcoded Credentials**: Supabase URL/key should use environment variables
- **Admin System**: Admin controls need proper authentication system
- **Client-Side Validation**: Game logic validation should be server-side verified
- **Error Logging**: Consider implementing centralized error reporting

### Recommended Security Improvements
1. Move Supabase credentials to environment variables
2. Implement server-side score validation
3. Add rate limiting for authentication attempts  
4. Implement proper admin authentication system
5. Add client-side encryption for sensitive data

---

## Monitoring & Analytics

### Current Tracking
- **User Analytics**: Basic usage via Supabase user profiles
- **Game Sessions**: All gameplay sessions logged with detailed metrics
- **Performance**: Netlify analytics for site performance and bandwidth
- **Error Logging**: Browser console with structured error reporting

### Key Metrics Tracked
- **Player Engagement**: Games played, session duration, return frequency
- **Game Balance**: Score distributions, power-up usage, difficulty preferences
- **Technical Performance**: Load times, error rates, API response times
- **Business Metrics**: User registration conversion, session completion rates

---

## Future Development Roadmap

### Planned Features
- **Multiplayer Mode**: Real-time competitive gameplay
- **Mobile App**: React Native version for iOS/Android
- **Advanced Analytics**: Player behavior analysis and game balance optimization
- **Monetization**: Advertisement integration (currently MonetAg configured)
- **Achievement System**: Badges and rewards for specific accomplishments

### Technical Improvements
- **Server-Side Validation**: Move game logic validation to secure backend
- **Real-Time Updates**: WebSocket integration for live multiplayer features
- **Progressive Web App**: Offline gameplay capability
- **Advanced Caching**: Service worker implementation for faster loading
- **API Rate Limiting**: Custom rate limiting for enhanced security

### Scalability Considerations
- **Database Migration**: Plan for PostgreSQL scaling beyond Supabase free tier
- **CDN Optimization**: Asset optimization and geographic distribution
- **Microservices**: Potential backend service separation for different features
- **Load Balancing**: Preparation for high-traffic scenarios

---

## Emergency Procedures & Maintenance

### Rollback Process
1. Identify problematic commit in GitHub repository
2. Use GitHub interface or Git commands to revert commit  
3. Netlify automatically deploys previous working version
4. Verify live site functionality restoration

### Common Issues & Solutions
- **Site Down**: Check Netlify deploy logs and GitHub repository status
- **Database Issues**: Monitor Supabase dashboard for service outages
- **DNS Problems**: Verify IONOS DNS records and Netlify domain configuration
- **Build Failures**: Check build.py script and module dependencies

### Backup & Recovery
- **Database**: Supabase provides automatic backups (free tier: 7 days)
- **Code**: GitHub repository serves as version control backup
- **Static Assets**: Netlify maintains deployment history
- **Domain**: IONOS account backup for DNS configuration

### Contact & Support Information
- **Primary Domain**: tradingfrenzy.co.uk
- **Repository**: github.com/AChristieGit/trading-frenzy-game  
- **Hosting Dashboard**: Netlify admin panel
- **Database**: Supabase project dashboard
- **Domain Management**: IONOS control panel

This documentation provides comprehensive coverage of the Trading Frenzy game's technical implementation, infrastructure, and development processes for future reference and maintenance.