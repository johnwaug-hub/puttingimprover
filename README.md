# Putting Improver - Lock Jaw Disc Golf

A comprehensive disc golf putting practice tracker and competitive community platform.

**Version:** 8.3.28 (Production Release)  
**Last Updated:** January 2026

## Features

### Core Features
- 📊 **Practice Tracking** - Log sessions with distance, makes, attempts, and accuracy
- 🎯 **194 Achievements** - Comprehensive achievement system worth 65,282+ points
- 📋 **9 Built-in Routines** - Structured practice routines for all skill levels
- 🎮 **8 Putting Games** - Around the World, HORSE, Points Poker, and more
- 📈 **Statistics Dashboard** - Detailed stats, charts, and progress tracking

### Social Features
- 👥 **Friends System** - Add friends and view their progress
- 🏆 **Leaderboards** - Points, ELO, and Season rankings
- ⚔️ **H2H Challenges** - Challenge friends to putting competitions
- 👥 **Multiplayer Logging** - Log sessions for multiple players at once
- 🏅 **Teams** - Create and join teams for group competition

### Season System
- 📅 **Quarterly Seasons** - Earn XP and climb season levels
- 🎁 **Rewards Track** - Unlock rewards as you progress
- 🏆 **Season Leaderboard** - Compete for top season rankings

### Technical Features
- 📱 **PWA Support** - Install as native app on any device
- 🔄 **Offline Support** - Practice tracking works offline
- 🌙 **Dark Mode** - Full dark mode support
- 🌡️ **Weather Integration** - Track conditions during practice
- 🔔 **Notifications** - Friend requests, challenges, and more

## Tech Stack

- **Frontend:** Vanilla JavaScript (ES6 Modules)
- **Backend:** Firebase (Authentication, Firestore, Hosting)
- **PWA:** Service Worker with offline support
- **Styling:** CSS3 with CSS Variables for theming

## Deployment

\`\`\`bash
# Deploy to Firebase
firebase deploy --only hosting

# Deploy rules and hosting
firebase deploy --only firestore:rules,hosting

# Full deploy (including functions)
firebase deploy
\`\`\`

## Security

- Firebase Authentication (Google Sign-In, Email/Password)
- Firestore Security Rules with friend-based permissions
- HTTPS enforced
- Security headers configured (X-Frame-Options, X-XSS-Protection, etc.)

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- Mobile browsers (iOS Safari, Chrome for Android)

## License

© 2024 Lock Jaw Disc Golf - Tucson, AZ

---

Made with ❤️ for disc golf enthusiasts
