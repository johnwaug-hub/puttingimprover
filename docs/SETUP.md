# Complete Setup Guide

This guide will walk you through setting up both the web and mobile applications from scratch.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Project Setup](#firebase-project-setup)
3. [Web Application Setup](#web-application-setup)
4. [Mobile Application Setup](#mobile-application-setup)
5. [Configuration](#configuration)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

#### For Web Development
- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** 9.x or higher (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **Firebase CLI**: Install globally
  ```bash
  npm install -g firebase-tools
  ```

#### For Mobile Development
- **React Native CLI**: Install globally
  ```bash
  npm install -g react-native-cli
  ```

- **For iOS Development** (macOS only):
  - Xcode 14+ ([Mac App Store](https://apps.apple.com/app/xcode/id497799835))
  - CocoaPods: `sudo gem install cocoapods`

- **For Android Development**:
  - Android Studio ([Download](https://developer.android.com/studio))
  - Java Development Kit (JDK) 11+
  - Android SDK (API Level 31+)

### Recommended Tools
- **VS Code** with extensions:
  - ESLint
  - Prettier
  - Firebase
  - React Native Tools
- **Postman** for API testing
- **Git GUI client** (GitHub Desktop, SourceTree)

## Firebase Project Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `putting-improver` (or your preferred name)
4. Enable Google Analytics (optional but recommended)
5. Select or create Analytics account
6. Click **"Create project"**

### 2. Add Web App to Firebase

1. In Firebase Console, click the web icon (`</>`)
2. Register app with nickname: `Putting Improver Web`
3. Check **"Also set up Firebase Hosting"**
4. Click **"Register app"**
5. Copy the Firebase configuration object
6. Click **"Continue to console"**

### 3. Add iOS App to Firebase (for Mobile)

1. Click **Add app** → iOS icon
2. Enter iOS bundle ID: `com.lockjaw.puttingimprover`
3. Enter App nickname: `Putting Improver iOS`
4. Download `GoogleService-Info.plist`
5. Save this file - you'll need it later

### 4. Add Android App to Firebase (for Mobile)

1. Click **Add app** → Android icon
2. Enter Android package name: `com.lockjaw.puttingimprover`
3. Enter App nickname: `Putting Improver Android`
4. Download `google-services.json`
5. Save this file - you'll need it later

### 5. Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **"Get started"**
3. Go to **Sign-in method** tab
4. Enable these providers:
   - **Google**: Click, enable, add support email
   - **Apple**: Click, enable (requires Apple Developer account)
   - **Email/Password**: Click, enable
   - **Anonymous**: Click, enable

#### Google Sign-In Setup
1. Click on **Google** provider
2. Add your project support email
3. Save

#### Apple Sign-In Setup (Optional)
1. Requires Apple Developer Program membership
2. Configure in Apple Developer Console
3. Add Service ID and Key ID in Firebase

### 6. Create Firestore Database

1. Go to **Firestore Database**
2. Click **"Create database"**
3. Start in **production mode**
4. Select location: `us-central1` (or closest to your users)
5. Click **"Enable"**

### 7. Configure Firestore Security Rules

1. In Firestore Database, go to **Rules** tab
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check authentication
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      // Anyone can read user profiles
      allow read: if isAuthenticated();
      
      // Users can only write their own profile
      allow write: if isAuthenticated() && isOwner(userId);
      
      // User's private data (subcollection)
      match /private/{document=**} {
        allow read, write: if isAuthenticated() && isOwner(userId);
      }
      
      // User's sessions (subcollection)
      match /sessions/{sessionId} {
        allow read: if isAuthenticated();
        allow write: if isAuthenticated() && isOwner(userId);
      }
    }
    
    // Leaderboard - read-only for all, write restricted
    match /leaderboard/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isOwner(userId);
    }
    
    // Challenges - read for all, admin write only
    match /challenges/{challengeId} {
      allow read: if isAuthenticated();
      allow write: if false; // Only via Cloud Functions
    }
    
    // Achievements - read for all, write restricted
    match /achievements/{achievementId} {
      allow read: if isAuthenticated();
      allow write: if false; // Only via Cloud Functions
    }
    
    // Friends - users can manage their own friendships
    match /friendships/{friendshipId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && 
        (resource.data.userId1 == request.auth.uid || 
         resource.data.userId2 == request.auth.uid);
    }
  }
}
```

3. Click **"Publish"**

### 8. Enable Firebase Hosting

1. Go to **Hosting**
2. Click **"Get started"**
3. Follow the setup wizard (we'll do the actual deployment later)

## Web Application Setup

### 1. Clone or Extract Files

```bash
# If using git
git clone <your-repo-url>
cd putting-improver-complete

# If using the ZIP file, extract it
unzip putting-improver-complete.zip
cd putting-improver-complete
```

### 2. Install Web Dependencies

```bash
cd web
npm install
```

### 3. Configure Firebase for Web

1. Open `web/js/config/firebase.js`
2. Replace the configuration with your Firebase config:

```javascript
// Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID" // Optional
};
```

3. Save the file

### 4. Initialize Firebase CLI

```bash
# Login to Firebase
firebase login

# Initialize Firebase in the web directory
firebase init

# Select:
# - Hosting
# - Firestore
# Use existing project
# Select your project
# Public directory: . (current directory)
# Configure as single-page app: Yes
# Set up automatic builds: No
# Don't overwrite existing files
```

### 5. Start Development Server

```bash
npm start
```

The app should open at `http://localhost:3000`

### 6. Test the Web App

1. Click **"Sign In"**
2. Choose authentication method
3. Complete sign-in flow
4. Add a practice session
5. Verify data appears in Firestore Console

## Mobile Application Setup

### 1. Install Mobile Dependencies

```bash
cd ../mobile
npm install
```

### 2. Install iOS Dependencies (macOS only)

```bash
cd ios
pod install
cd ..
```

### 3. Configure Firebase for Mobile

#### For iOS:
1. Copy `GoogleService-Info.plist` (downloaded earlier) to `mobile/ios/`
2. Open `mobile/ios/PuttingImprover.xcworkspace` in Xcode
3. Right-click on project → Add Files
4. Select `GoogleService-Info.plist`
5. Ensure "Copy items if needed" is checked

#### For Android:
1. Copy `google-services.json` (downloaded earlier) to `mobile/android/app/`

### 4. Update Mobile Firebase Configuration

Edit `mobile/src/config/firebase.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 5. Configure iOS

1. Open `mobile/ios/PuttingImprover.xcworkspace` in Xcode
2. Select project in navigator
3. Update **Bundle Identifier**: `com.lockjaw.puttingimprover`
4. Select your **Team** (requires Apple Developer account)
5. Update **Display Name**: `Putting Improver`

### 6. Configure Android

Edit `mobile/android/app/build.gradle`:

```gradle
defaultConfig {
    applicationId "com.lockjaw.puttingimprover"
    minSdkVersion 23
    targetSdkVersion 33
    versionCode 1
    versionName "1.0.0"
}
```

### 7. Run Mobile App

#### iOS:
```bash
npm run ios
# or
react-native run-ios
```

#### Android:
```bash
npm run android
# or
react-native run-android
```

Make sure you have:
- iOS Simulator running (Xcode → Open Developer Tool → Simulator)
- Android Emulator running (Android Studio → AVD Manager)
- Or a physical device connected via USB

## Configuration

### Environment Variables

Create `.env` files for different environments:

#### Web (.env)
```
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

#### Mobile (.env)
```
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

### App Configuration

Edit `web/js/config/constants.js` and `mobile/src/config/constants.js`:

```javascript
export const APP_CONFIG = {
  APP_NAME: 'Putting Improver',
  ORGANIZATION: 'Lock Jaw Disc Golf',
  LOCATION: 'Tucson, AZ',
  VERSION: '2.0.0',
  
  // Point calculation multipliers
  DISTANCE_MULTIPLIER: 0.1,
  ACCURACY_MULTIPLIER: 0.01,
  BASE_MULTIPLIER: 10,
  
  // Limits
  MAX_DISTANCE: 100, // feet
  MIN_DISTANCE: 5,   // feet
  MAX_ATTEMPTS: 100,
  
  // Streak requirements
  WEEK_WARRIOR_DAYS: 7,
  MONTH_MASTER_DAYS: 30,
};
```

## Deployment

### Web Deployment to Firebase Hosting

```bash
cd web
firebase deploy --only hosting
```

Your app will be live at: `https://YOUR_PROJECT_ID.web.app`

### Mobile Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete mobile deployment instructions.

## Troubleshooting

### Common Issues

#### "Firebase not initialized"
- Verify `firebase.js` configuration is correct
- Check Firebase project ID matches
- Ensure Firebase SDK is installed

#### "Authentication failed"
- Check OAuth providers are enabled in Firebase Console
- Verify redirect URIs are configured
- For iOS: Check bundle ID matches
- For Android: Check package name matches

#### "Permission denied" in Firestore
- Verify security rules are published
- Check user is authenticated
- Verify user ID matches document path

#### iOS Build Fails
- Run `pod install` in ios/ directory
- Clean build folder: Xcode → Product → Clean Build Folder
- Check Xcode version is 14+

#### Android Build Fails
- Sync Gradle files
- Check `google-services.json` is in correct location
- Verify Android SDK is installed

### Getting Help

1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Review [Firebase documentation](https://firebase.google.com/docs)
3. Check [React Native documentation](https://reactnative.dev/docs)
4. Open an issue on GitHub

## Next Steps

1. **Customize branding** - Update colors, logo, app name
2. **Test thoroughly** - Test all features on both platforms
3. **Set up analytics** - Configure Firebase Analytics
4. **Configure CI/CD** - Set up automated deployments
5. **Submit to app stores** - Follow deployment guide

---

**Setup complete!** 🎉 You're ready to start developing.

For questions or issues, consult the documentation or open a GitHub issue.
