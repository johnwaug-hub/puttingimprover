#!/bin/bash
# build-cap.sh - Copy web files for Capacitor
# Run this before building for Android or iOS

echo "========================================"
echo " Putting Improver - Capacitor Build"
echo "========================================"
echo ""

echo "[1/4] Cleaning www folder..."
rm -rf www
mkdir -p www/js/modules
mkdir -p www/js/components
mkdir -p www/js/config
mkdir -p www/js/utils
mkdir -p www/css
mkdir -p www/icons
mkdir -p www/resources/screenshots
mkdir -p www/widgets
mkdir -p www/shared
mkdir -p www/.well-known

echo "[2/4] Copying files..."

# HTML files
cp index.html www/
cp offline.html www/
cp privacy.html www/ 2>/dev/null || true
cp privacy-policy.html www/ 2>/dev/null || true
cp terms-of-service.html www/ 2>/dev/null || true

# Config files
cp manifest.json www/
cp service-worker.js www/
cp robots.txt www/ 2>/dev/null || true

# Digital Asset Links (for Android App Links)
cp .well-known/assetlinks.json www/.well-known/ 2>/dev/null || true

# Images
cp favicon.ico www/
cp favicon-16.png www/
cp favicon-32.png www/
cp logo.jpg www/
cp background.jpg www/
cp background.webp www/

# JavaScript
cp js/app.js www/js/
cp js/modules/*.js www/js/modules/
cp js/components/*.js www/js/components/
cp js/config/*.js www/js/config/
cp js/utils/*.js www/js/utils/

# CSS
cp css/*.css www/css/

# Icons
cp icons/*.png www/icons/

# Screenshots (resources location)
cp resources/screenshots/*.png www/resources/screenshots/ 2>/dev/null || true

# Widgets
cp widgets/*.json www/widgets/ 2>/dev/null || true

# Shared data
cp shared/*.json www/shared/ 2>/dev/null || true

echo "[3/4] Running cap sync..."
npx cap sync

echo "[4/4] Patching android/app/build.gradle for local.properties signing..."

BUILD_GRADLE="android/app/build.gradle"
if [ -f "$BUILD_GRADLE" ]; then
  # Only patch if not already patched
  if ! grep -q "localProperties\['storeFile'\]" "$BUILD_GRADLE"; then
    python3 - <<'PYEOF'
import re

with open("android/app/build.gradle", "r") as f:
    content = f.read()

# --- 1. Inject local.properties loader at the very top ---
loader_block = '''// Load local.properties for signing config
def localProperties = new Properties()
def localPropertiesFile = rootProject.file('local.properties')
if (localPropertiesFile.exists()) {
    localPropertiesFile.withReader('UTF-8') { reader -> localProperties.load(reader) }
}

'''
if "def localProperties" not in content:
    content = loader_block + content

# --- 2. Inject signingConfigs block before buildTypes ---
signing_block = """
    signingConfigs {
        release {
            def sf = localProperties['storeFile']
            storeFile sf ? file(sf) : null
            storePassword localProperties['storePassword']
            keyAlias localProperties['keyAlias']
            keyPassword localProperties['keyPassword']
        }
    }
"""
if "signingConfigs" not in content:
    content = content.replace("    buildTypes {", signing_block + "    buildTypes {")

# --- 3. Wire signingConfig into release buildType ---
# Replace any existing signingConfig line, or insert after 'release {'
if "signingConfig signingConfigs.release" not in content:
    content = re.sub(
        r'(buildTypes\s*\{[^}]*?release\s*\{)',
        r'\1\n            signingConfig signingConfigs.release',
        content,
        flags=re.DOTALL
    )

with open("android/app/build.gradle", "w") as f:
    f.write(content)

print("  build.gradle patched for local.properties signing ✓")
PYEOF
  else
    echo "  build.gradle already patched — skipping ✓"
  fi
else
  echo "  WARNING: android/app/build.gradle not found — run 'npx cap add android' first"
fi

echo "[5/5] Patching platform icons..."

# ── Android icons (adaptive + legacy) ───────────────────────────────────────
ANDROID_RES="android/app/src/main/res"
if [ -d "$ANDROID_RES" ]; then
  for density in mipmap-mdpi mipmap-hdpi mipmap-xhdpi mipmap-xxhdpi mipmap-xxxhdpi; do
    if [ -d "android-icons/$density" ]; then
      cp "android-icons/$density/ic_launcher.png"            "$ANDROID_RES/$density/ic_launcher.png"            2>/dev/null || true
      cp "android-icons/$density/ic_launcher_round.png"      "$ANDROID_RES/$density/ic_launcher_round.png"      2>/dev/null || true
      cp "android-icons/$density/ic_launcher_foreground.png" "$ANDROID_RES/$density/ic_launcher_foreground.png" 2>/dev/null || true
    fi
  done
  # Adaptive icon XML
  mkdir -p "$ANDROID_RES/mipmap-anydpi-v26"
  cp android-icons/mipmap-anydpi-v26/ic_launcher.xml        "$ANDROID_RES/mipmap-anydpi-v26/ic_launcher.xml"       2>/dev/null || true
  cp android-icons/mipmap-anydpi-v26/ic_launcher_round.xml  "$ANDROID_RES/mipmap-anydpi-v26/ic_launcher_round.xml" 2>/dev/null || true
  # Merge colors.xml
  if [ -f "android-icons/values/colors.xml" ]; then
    if [ ! -f "$ANDROID_RES/values/colors.xml" ]; then
      mkdir -p "$ANDROID_RES/values"
      cp android-icons/values/colors.xml "$ANDROID_RES/values/colors.xml"
    elif ! grep -q "ic_launcher_background" "$ANDROID_RES/values/colors.xml"; then
      sed -i 's|</resources>|    <color name="ic_launcher_background">#FF000000</color>\n</resources>|' "$ANDROID_RES/values/colors.xml"
    fi
  fi
  echo "  Android icons patched (adaptive + legacy) ✓"
else
  echo "  WARNING: Android project not found at $ANDROID_RES — run 'npx cap add android' first"
fi

# ── iOS icons ────────────────────────────────────────────────────────────────
IOS_ICON_DEST="ios/App/App/Assets.xcassets/AppIcon.appiconset"
if [ -d "ios/App" ]; then
  if [ -d "ios-icons/AppIcon.appiconset" ]; then
    mkdir -p "$IOS_ICON_DEST"
    cp ios-icons/AppIcon.appiconset/*.png         "$IOS_ICON_DEST/" 2>/dev/null || true
    cp ios-icons/AppIcon.appiconset/Contents.json "$IOS_ICON_DEST/" 2>/dev/null || true
    echo "  iOS icons patched ✓"
  fi
  if [ -f "ios-icons/App.entitlements" ]; then
    cp "ios-icons/App.entitlements" "ios/App/App/App.entitlements" 2>/dev/null || true
  fi
else
  echo "  iOS project not found — run 'npx cap add ios' on Mac first"
fi

echo ""
echo "========================================"
echo " Build complete!"
echo "========================================"
echo ""
echo "Android:"
echo "  export JAVA_HOME='/c/Program Files/Android/Android Studio/jbr'"
echo "  cd android && ./gradlew bundleRelease"
echo ""
echo "iOS (Mac only):"
echo "  npx cap open ios   # Archive in Xcode"
echo ""
