# Deployment Guide

Complete guide for deploying the Putting Improver web and mobile applications.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Web Deployment (Firebase Hosting)](#web-deployment)
3. [iOS Deployment](#ios-deployment)
4. [Android Deployment](#android-deployment)
5. [Continuous Deployment](#continuous-deployment)
6. [Post-Deployment](#post-deployment)

## Prerequisites

### General Requirements
- Firebase project set up and configured
- Firebase CLI installed: `npm install -g firebase-tools`
- Git repository with latest code
- All environment variables configured

### iOS Requirements
- macOS with Xcode 14+
- Apple Developer Program membership ($99/year)
- Valid distribution certificate
- App Store Connect account

### Android Requirements
- Android Studio installed
- Java Development Kit (JDK) 11+
- Google Play Developer account ($25 one-time fee)
- Keystore file for signing

## Web Deployment

### Option 1: Manual Deployment

1. **Build for production**
```bash
cd web
npm run build
```

2. **Login to Firebase**
```bash
firebase login
```

3. **Deploy to Firebase Hosting**
```bash
firebase deploy --only hosting
```

4. **Verify deployment**
   - Visit: `https://YOUR_PROJECT_ID.web.app`
   - Test all features
   - Check Firebase Console → Hosting

### Option 2: Preview Deployment

Test changes before deploying to production:

```bash
firebase hosting:channel:deploy preview
```

This creates a temporary URL like:
`https://YOUR_PROJECT_ID--preview-abc123.web.app`

### Option 3: Automated Deployment

Use GitHub Actions (see [Continuous Deployment](#continuous-deployment))

### Custom Domain Setup

1. **In Firebase Console**
   - Go to Hosting → Advanced
   - Click "Add custom domain"
   - Enter your domain (e.g., `puttingimprover.com`)
   
2. **Configure DNS**
   - Add A records pointing to Firebase IPs
   - Or add CNAME record for subdomain
   
3. **Verify domain**
   - Follow Firebase verification steps
   - Wait for SSL certificate (can take 24-48 hours)

### Rollback Deployment

If something goes wrong:

```bash
# View deployment history
firebase hosting:channel:list

# Rollback to previous version
firebase hosting:rollback
```

## iOS Deployment

### Step 1: Prepare App for Release

1. **Update version and build number**

Edit `mobile/ios/PuttingImprover/Info.plist`:
```xml
<key>CFBundleShortVersionString</key>
<string>2.0.0</string>
<key>CFBundleVersion</key>
<string>1</string>
```

2. **Update app icons**
   - Add icon files to `ios/PuttingImprover/Images.xcassets/AppIcon.appiconset/`
   - Sizes: 20x20, 29x29, 40x40, 60x60, 76x76, 83.5x83.5, 1024x1024 (all @1x, @2x, @3x)

3. **Update launch screen**
   - Edit `ios/PuttingImprover/LaunchScreen.storyboard`

### Step 2: Configure App Store Connect

1. **Create App in App Store Connect**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Click "My Apps" → "+"
   - Fill in app information:
     - Name: "Putting Improver"
     - Primary Language: English
     - Bundle ID: com.lockjaw.puttingimprover
     - SKU: lockjaw-putting-improver

2. **Fill App Information**
   - Description
   - Keywords
   - Screenshots (required sizes for different devices)
   - App icon (1024x1024)
   - Privacy Policy URL
   - Support URL

### Step 3: Create Distribution Certificate

1. **In Xcode**
   - Open `ios/PuttingImprover.xcworkspace`
   - Select project → Signing & Capabilities
   - Team: Select your team
   - Signing: Automatic
   - Or create manually in Apple Developer Portal

### Step 4: Build for Distribution

#### Option A: Xcode

1. **Select device**
   - Product → Destination → Any iOS Device

2. **Archive**
   - Product → Archive
   - Wait for archive to complete

3. **Distribute**
   - Window → Organizer
   - Select archive
   - Click "Distribute App"
   - Choose "App Store Connect"
   - Follow wizard

#### Option B: Command Line (Fastlane)

1. **Install Fastlane**
```bash
sudo gem install fastlane
cd ios
fastlane init
```

2. **Configure Fastlane**

Create `ios/fastlane/Fastfile`:
```ruby
default_platform(:ios)

platform :ios do
  desc "Push to TestFlight"
  lane :beta do
    build_app(scheme: "PuttingImprover")
    upload_to_testflight
  end

  desc "Deploy to App Store"
  lane :release do
    build_app(scheme: "PuttingImprover")
    upload_to_app_store
  end
end
```

3. **Run Fastlane**
```bash
# TestFlight
fastlane beta

# App Store
fastlane release
```

### Step 5: Submit for Review

1. **In App Store Connect**
   - Go to your app
   - Select version
   - Click "Submit for Review"
   - Answer questionnaire
   - Submit

2. **Wait for review** (typically 24-48 hours)

3. **Release**
   - Once approved, manually release or auto-release

## Android Deployment

### Step 1: Prepare App for Release

1. **Update version**

Edit `mobile/android/app/build.gradle`:
```gradle
defaultConfig {
    versionCode 1
    versionName "2.0.0"
}
```

2. **Generate release keystore**

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore putting-improver-release.keystore -alias putting-improver -keyalg RSA -keysize 2048 -validity 10000
```

Save the keystore file and credentials securely!

3. **Configure signing**

Create `android/gradle.properties`:
```properties
MYAPP_RELEASE_STORE_FILE=putting-improver-release.keystore
MYAPP_RELEASE_KEY_ALIAS=putting-improver
MYAPP_RELEASE_STORE_PASSWORD=YOUR_STORE_PASSWORD
MYAPP_RELEASE_KEY_PASSWORD=YOUR_KEY_PASSWORD
```

Update `android/app/build.gradle`:
```gradle
signingConfigs {
    release {
        storeFile file(MYAPP_RELEASE_STORE_FILE)
        storePassword MYAPP_RELEASE_STORE_PASSWORD
        keyAlias MYAPP_RELEASE_KEY_ALIAS
        keyPassword MYAPP_RELEASE_KEY_PASSWORD
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

### Step 2: Build Release APK/AAB

#### Build AAB (Android App Bundle - Recommended)
```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

#### Build APK
```bash
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

### Step 3: Set Up Google Play Console

1. **Create App**
   - Go to [Google Play Console](https://play.google.com/console)
   - Click "Create app"
   - Fill in details:
     - Name: "Putting Improver"
     - Default language: English
     - App or game: App
     - Free or paid: Free

2. **Complete Store Listing**
   - App name
   - Short description (80 chars)
   - Full description (4000 chars)
   - Screenshots (at least 2 per form factor)
   - High-res icon (512x512)
   - Feature graphic (1024x500)
   - Privacy policy URL

3. **Set Content Rating**
   - Complete questionnaire
   - Get rating certificate

4. **Set Target Audience**
   - Age groups
   - Content guidelines

### Step 4: Upload to Play Console

1. **Create Release**
   - Production → Create new release
   - Upload AAB file
   - Set release name (e.g., "2.0.0")
   - Add release notes

2. **Review and Rollout**
   - Review all sections
   - Click "Review release"
   - If everything is complete, "Start rollout to production"

3. **Wait for review** (typically a few hours to a few days)

## Continuous Deployment

### GitHub Actions Setup

The repository includes CI/CD workflows for automated deployment.

#### Web Deployment Workflow

`.github/workflows/deploy-web.yml`:
```yaml
name: Deploy Web to Firebase

on:
  push:
    branches: [main]
    paths:
      - 'web/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd web
          npm ci
          
      - name: Build
        run: |
          cd web
          npm run build
          
      - name: Deploy to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy --only hosting
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
          PROJECT_PATH: ./web
```

#### iOS Deployment Workflow

`.github/workflows/deploy-ios.yml`:
```yaml
name: Deploy iOS to TestFlight

on:
  push:
    branches: [main]
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd mobile
          npm ci
          cd ios
          pod install
          
      - name: Deploy to TestFlight
        run: |
          cd mobile/ios
          fastlane beta
        env:
          FASTLANE_USER: ${{ secrets.FASTLANE_USER }}
          FASTLANE_PASSWORD: ${{ secrets.FASTLANE_PASSWORD }}
```

#### Android Deployment Workflow

`.github/workflows/deploy-android.yml`:
```yaml
name: Deploy Android to Play Store

on:
  push:
    branches: [main]
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          distribution: 'zulu'
          java-version: '11'
          
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd mobile
          npm ci
          
      - name: Build AAB
        run: |
          cd mobile/android
          ./gradlew bundleRelease
          
      - name: Upload to Play Store
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.PLAY_STORE_CREDENTIALS }}
          packageName: com.lockjaw.puttingimprover
          releaseFiles: mobile/android/app/build/outputs/bundle/release/app-release.aab
          track: production
```

### Setup GitHub Secrets

Add these secrets in GitHub repository settings:

1. **FIREBASE_TOKEN**
   ```bash
   firebase login:ci
   ```
   Copy the token and add to GitHub Secrets

2. **FASTLANE_USER** - Your Apple ID
3. **FASTLANE_PASSWORD** - App-specific password
4. **PLAY_STORE_CREDENTIALS** - Service account JSON

## Post-Deployment

### Monitoring

1. **Firebase Console**
   - Monitor hosting analytics
   - Check authentication metrics
   - Review Firestore usage

2. **App Store Connect / Play Console**
   - Monitor downloads and ratings
   - Check crash reports
   - Review user feedback

3. **Set up alerts**
   - Firebase Alerts for quota usage
   - Crash reporting alerts
   - Performance monitoring

### Version Management

1. **Semantic Versioning**
   - MAJOR.MINOR.PATCH (e.g., 2.0.1)
   - MAJOR: Breaking changes
   - MINOR: New features
   - PATCH: Bug fixes

2. **Release Notes**
   - Document changes
   - Include in app stores
   - Update CHANGELOG.md

### Rollback Procedure

#### Web
```bash
firebase hosting:rollback
```

#### Mobile
- iOS: Cannot rollback published version, submit hotfix
- Android: Can reduce rollout percentage in Play Console

## Troubleshooting

### Web Deployment Issues

**Build fails**
- Check Node.js version
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall

**Firebase deployment unauthorized**
- Re-login: `firebase login`
- Check project ID in `.firebaserc`

### iOS Deployment Issues

**Code signing errors**
- Verify certificate is valid
- Check provisioning profile
- Clean build folder in Xcode

**Upload fails**
- Increase version/build number
- Check bundle ID matches
- Verify Apple Developer account status

### Android Deployment Issues

**Build fails**
- Check JDK version
- Clean: `./gradlew clean`
- Invalidate caches in Android Studio

**Upload rejected**
- Increase version code
- Check package name
- Verify keystore signature

## Next Steps

1. **Monitor performance**
2. **Gather user feedback**
3. **Plan next release**
4. **Update documentation**

---

For questions or issues, consult [TROUBLESHOOTING.md](TROUBLESHOOTING.md) or open a GitHub issue.
