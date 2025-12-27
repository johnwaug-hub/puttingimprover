# Quickstart Guide

Get up and running with Putting Improver in under 10 minutes!

## Prerequisites

- Node.js 18+ installed ([Download](https://nodejs.org/))
- Firebase account ([Sign up free](https://firebase.google.com/))
- Git installed
- Code editor (VS Code recommended)

## 1. Extract and Navigate

```bash
# Extract the ZIP file
unzip putting-improver-complete.zip
cd putting-improver-complete
```

## 2. Web Application (5 minutes)

### Install Firebase CLI
```bash
npm install -g firebase-tools
```

### Setup Web App
```bash
cd web
npm install
```

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Name it "putting-improver"
4. Enable Google Analytics (optional)
5. Click "Create project"

### Add Web App to Firebase

1. In Firebase Console, click the web icon `</>`
2. Register app: "Putting Improver Web"
3. Copy the config object
4. Open `web/js/config/firebase.js`
5. Paste your config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Enable Firebase Services

1. **Authentication**
   - Go to Authentication → Get started
   - Enable Google sign-in
   - Add support email

2. **Firestore**
   - Go to Firestore Database → Create database
   - Start in production mode
   - Choose location (e.g., us-central1)

3. **Copy Security Rules**
   - In Firestore, go to Rules tab
   - Copy content from `web/firestore.rules`
   - Publish

### Initialize and Deploy

```bash
# Login to Firebase
firebase login

# Initialize
firebase init
# Select: Hosting, Firestore
# Use existing project
# Public directory: . (current dir)
# Single-page app: Yes

# Deploy
firebase deploy
```

✅ **Your web app is live!** Visit `https://YOUR_PROJECT.firebaseapp.com`

## 3. Mobile Application (Optional, 10 more minutes)

### iOS Setup (macOS only)

```bash
cd ../mobile
npm install
cd ios
pod install
cd ..
```

### Android Setup

```bash
cd ../mobile
npm install
```

### Add Firebase Config Files

1. **iOS**: 
   - In Firebase Console, add iOS app
   - Download `GoogleService-Info.plist`
   - Copy to `mobile/ios/`

2. **Android**: 
   - In Firebase Console, add Android app
   - Download `google-services.json`
   - Copy to `mobile/android/app/`

### Update Firebase Config

Edit `mobile/src/config/firebase.js` with your Firebase config.

### Run Mobile App

```bash
# iOS
npm run ios

# Android
npm run android
```

✅ **Mobile app is running!**

## 4. Test Your Setup

### Web
1. Visit your Firebase hosting URL
2. Click "Sign In"
3. Sign in with Google
4. Add a practice session
5. Check Firestore Console for data

### Mobile
1. Launch app on simulator/device
2. Sign in
3. Add a practice session
4. Verify sync with web app

## Quick Reference

### Common Commands

**Web Development**
```bash
cd web
npm start          # Local dev server
npm run deploy     # Deploy to Firebase
```

**Mobile Development**
```bash
cd mobile
npm run ios        # Run iOS simulator
npm run android    # Run Android emulator
npm test           # Run tests
```

**Firebase**
```bash
firebase login     # Login to Firebase
firebase deploy    # Deploy everything
firebase serve     # Local testing
```

## Troubleshooting

### "Firebase not initialized"
- Check your config in `firebase.js`
- Verify project ID matches

### "Permission denied"
- Ensure Firestore rules are published
- Check user is authenticated

### Build errors
- Delete `node_modules/`
- Run `npm install` again
- Clear npm cache: `npm cache clean --force`

### Mobile build fails
- **iOS**: Run `pod install` in `mobile/ios/`
- **Android**: Sync Gradle in Android Studio

## Next Steps

1. **Customize branding**
   - Replace logo in `web/logo.jpg` and `mobile/src/assets/`
   - Update colors in CSS/theme files

2. **Configure features**
   - Adjust point calculations in `config/constants.js`
   - Modify achievement requirements

3. **Set up CI/CD**
   - Push to GitHub
   - GitHub Actions will auto-deploy

4. **Read full documentation**
   - [SETUP.md](SETUP.md) - Complete setup guide
   - [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment instructions
   - [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Full project details

## Getting Help

- **Documentation**: Check `docs/` folder
- **Issues**: Known issues in `TROUBLESHOOTING.md`
- **Support**: support@lockjawdiscgolf.com
- **GitHub**: Open an issue

---

🎉 **Congratulations!** You're ready to start using Putting Improver.

**Need help?** Consult the full documentation in the `docs/` directory.
