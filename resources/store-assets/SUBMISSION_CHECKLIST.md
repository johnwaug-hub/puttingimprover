# App Store Submission Checklist

## Pre-Submission Requirements

### ✅ Developer Accounts
- [ ] **Google Play Console** - $25 one-time fee
  - URL: https://play.google.com/console
  - Requires Google account
  - Can publish immediately after setup
  
- [ ] **Apple Developer Program** - $99/year
  - URL: https://developer.apple.com/programs/
  - Requires Apple ID
  - D-U-N-S number needed for business account

---

## 📱 App Icon (Required)

### Google Play
- [ ] **512x512 PNG** - Hi-res icon
- [ ] 32-bit PNG (with alpha)
- [ ] No transparency for main icon

### App Store
- [ ] **1024x1024 PNG** - App Store icon
- [ ] No alpha channel/transparency
- [ ] No rounded corners (Apple adds them)

**Source File:** `resources/store-assets/app-icon-1024.html`
- Open in browser → Screenshot at 1024x1024

---

## 🖼️ Feature Graphic (Google Play Only)

- [ ] **1024x500 PNG or JPEG**
- [ ] No text in top/bottom 50px (safe zone)
- [ ] Represents app clearly

**Source File:** `resources/store-assets/feature-graphic-1024x500.html`
- Open in browser → Screenshot at 1024x500

---

## 📸 Screenshots (Required)

### Google Play (min 2, max 8 per device type)
- [ ] Phone: 16:9 or 9:16 aspect ratio
- [ ] Min 320px, Max 3840px per side
- [ ] Recommended: 1080 x 1920 (portrait)

### App Store (Required sizes)
- [ ] **iPhone 6.7"**: 1290 x 2796 (iPhone 14 Pro Max)
- [ ] **iPhone 6.5"**: 1284 x 2778 (iPhone 12 Pro Max)  
- [ ] **iPhone 5.5"**: 1242 x 2208 (iPhone 8 Plus)
- [ ] **iPad 12.9"**: 2048 x 2732 (optional but recommended)

### Screenshots to Create
1. [ ] Practice View - Main dashboard
2. [ ] Games View - Game selection
3. [ ] Routines View - Practice routines
4. [ ] Achievements - Badge collection
5. [ ] Leaderboard - Rankings
6. [ ] Stats/Charts - Progress visualization

**Template:** `resources/store-assets/screenshot-templates.html`
**Existing screenshots:** `/screenshots/` folder

---

## 🎬 App Preview Video (Optional)

### Specs
- [ ] 15-30 seconds duration
- [ ] H.264 codec, MP4/MOV format
- [ ] Match screenshot dimensions

### Content Ideas
- App launch/splash
- Quick session logging
- Playing a game
- Achievement unlock
- Leaderboard reveal

---

## 📝 Store Listing Text

**Source:** `resources/store-assets/STORE_LISTING.md`

### Google Play
- [ ] App name (50 chars max)
- [ ] Short description (80 chars max)
- [ ] Full description (4000 chars max)
- [ ] Category: Sports

### App Store
- [ ] App name (30 chars max)
- [ ] Subtitle (30 chars max)
- [ ] Keywords (100 chars max)
- [ ] Promotional text (170 chars)
- [ ] Description (4000 chars max)
- [ ] What's New text
- [ ] Category: Sports

---

## 🔒 Legal Documents (Required)

- [ ] **Privacy Policy** - `privacy-policy.html`
  - Must be hosted at accessible URL
  - Required for both stores
  
- [ ] **Terms of Service** - `terms-of-service.html`
  - Recommended for both stores
  - Required if in-app purchases

### Hosting Options
1. Firebase Hosting (already deployed)
2. GitHub Pages
3. Dedicated landing page

**URLs to configure:**
- Privacy: https://puttingimprover.com/privacy-policy.html
- Terms: https://puttingimprover.com/terms-of-service.html
- Support: https://puttingimprover.com/support

---

## ⚙️ App Configuration

### Google Play
- [ ] Application ID: `com.lockjawdiscgolf.puttingimprover`
- [ ] Minimum SDK: 24 (Android 7.0)
- [ ] Target SDK: 34 (Android 14)
- [ ] App signing: Let Google manage

### App Store
- [ ] Bundle ID: `com.lockjawdiscgolf.puttingimprover`
- [ ] Deployment target: iOS 14.0+
- [ ] Capabilities: Sign in with Apple (if using)

---

## 🔥 Firebase Configuration

### Android
- [ ] Download `google-services.json` from Firebase Console
- [ ] Place in `android/app/` directory
- [ ] Add SHA-1 fingerprint to Firebase

```bash
# Get SHA-1
cd android && ./gradlew signingReport
```

### iOS
- [ ] Download `GoogleService-Info.plist` from Firebase Console
- [ ] Add to Xcode project

---

## 📋 Content Rating

### Google Play
- [ ] Complete content rating questionnaire
- [ ] Expected rating: Everyone (E)

### App Store
- [ ] Complete App Store age rating
- [ ] Expected rating: 4+
- [ ] No objectionable content

---

## 💰 Pricing & In-App Purchases

### If Free Only
- [ ] Set pricing to Free
- [ ] No IAP configuration needed

### If Premium Features
- [ ] Configure IAP products:
  - `premium_monthly` - $4.99
  - `premium_yearly` - $49.99
  - `premium_lifetime` - $149.99
- [ ] Test purchases in sandbox
- [ ] Configure subscription groups (App Store)

---

## 🧪 Pre-Launch Testing

### Internal Testing
- [ ] Test on physical Android device
- [ ] Test on physical iOS device
- [ ] Verify all features work
- [ ] Check offline functionality
- [ ] Verify Firebase authentication
- [ ] Test on multiple screen sizes

### Beta Testing
- [ ] Google Play Internal Testing track
- [ ] TestFlight for iOS
- [ ] Gather feedback from 5-10 users
- [ ] Fix critical bugs

---

## 🚀 Submission Process

### Google Play
1. [ ] Create app in Play Console
2. [ ] Complete store listing
3. [ ] Upload screenshots and graphics
4. [ ] Set content rating
5. [ ] Set pricing & distribution
6. [ ] Upload signed AAB file
7. [ ] Submit for review

**Review time:** Usually 1-3 days

### App Store
1. [ ] Create app in App Store Connect
2. [ ] Complete app information
3. [ ] Upload screenshots
4. [ ] Set pricing and availability
5. [ ] Archive build in Xcode
6. [ ] Upload to App Store Connect
7. [ ] Submit for review

**Review time:** Usually 24-48 hours

---

## 📊 Post-Launch

- [ ] Monitor crash reports
- [ ] Respond to user reviews
- [ ] Track install analytics
- [ ] Plan first update
- [ ] Create marketing materials

---

## 📁 Files Checklist

```
resources/store-assets/
├── app-icon-1024.html          ✓ Created
├── feature-graphic-1024x500.html ✓ Created  
├── splash-screen-2732.html     ✓ Created
├── screenshot-templates.html   ✓ Created
├── STORE_LISTING.md            ✓ Created
└── (generated images go here)

Root files:
├── privacy-policy.html         ✓ Created
├── terms-of-service.html       ✓ Created
├── capacitor.config.json       ✓ Created
├── CAPACITOR_DEPLOYMENT.md     ✓ Created
└── package.json                ✓ Updated
```

---

## Need Help?

- **Capacitor Docs:** https://capacitorjs.com/docs
- **Google Play Help:** https://support.google.com/googleplay/android-developer
- **App Store Guidelines:** https://developer.apple.com/app-store/review/guidelines/
- **Firebase Setup:** https://firebase.google.com/docs/android/setup
