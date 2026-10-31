#!/bin/bash
set -e

# Build configuration
# - CONFIG=debug|release  (default: debug)
# - UNIVERSAL=1           build a fat arm64+x86_64 binary (default: host arch only)
CONFIG="${CONFIG:-debug}"
UNIVERSAL="${UNIVERSAL:-0}"

for arg in "$@"; do
    case "$arg" in
        --universal) UNIVERSAL=1 ;;
        --release)   CONFIG="release" ;;
        --debug)     CONFIG="debug" ;;
    esac
done

# Paths
APP_NAME="Picshoo.app"
APP_DIR="build/$APP_NAME"
CONTENTS="$APP_DIR/Contents"
MACOS="$CONTENTS/MacOS"
RESOURCES="$CONTENTS/Resources"
PLUGINS="$CONTENTS/PlugIns"
EXTENSION_PRODUCT_NAME="CapcapShareExtension"
EXTENSION_NAME="$EXTENSION_PRODUCT_NAME.appex"
EXTENSION_DIR="$PLUGINS/$EXTENSION_NAME"
EXTENSION_CONTENTS="$EXTENSION_DIR/Contents"
EXTENSION_MACOS="$EXTENSION_CONTENTS/MacOS"
EXTENSION_RESOURCES="$EXTENSION_CONTENTS/Resources"

# Build binary
if [ "$UNIVERSAL" = "1" ]; then
    echo "Building capcap ($CONFIG, universal: arm64 + x86_64)..."
    swift build -c "$CONFIG" --arch arm64 --arch x86_64
    # SwiftPM emits the merged universal binary under .build/apple/Products/<Config>/
    # Ask SwiftPM where it put them: .build/apple/Products/<Config>/ in older
    # toolchains, .build/out/Products/<Config>/ in newer ones.
    UNIVERSAL_BIN_DIR="$(swift build -c "$CONFIG" --arch arm64 --arch x86_64 --show-bin-path)"
    BUILD_BIN="$UNIVERSAL_BIN_DIR/capcap"
    EXTENSION_BUILD_BIN="$UNIVERSAL_BIN_DIR/$EXTENSION_PRODUCT_NAME"
    if [ ! -f "$BUILD_BIN" ] || [ ! -f "$EXTENSION_BUILD_BIN" ]; then
        # Fallback: merge per-arch binaries with lipo
        ARM_BIN=".build/arm64-apple-macosx/$CONFIG/capcap"
        X86_BIN=".build/x86_64-apple-macosx/$CONFIG/capcap"
        EXTENSION_ARM_BIN=".build/arm64-apple-macosx/$CONFIG/$EXTENSION_PRODUCT_NAME"
        EXTENSION_X86_BIN=".build/x86_64-apple-macosx/$CONFIG/$EXTENSION_PRODUCT_NAME"
        if [ -f "$ARM_BIN" ] && [ -f "$X86_BIN" ]; then
            BUILD_BIN=".build/$CONFIG/capcap-universal"
            lipo -create -output "$BUILD_BIN" "$ARM_BIN" "$X86_BIN"
        else
            echo "error: universal binary not found at $BUILD_BIN and per-arch fallbacks missing" >&2
            exit 1
        fi
        if [ -f "$EXTENSION_ARM_BIN" ] && [ -f "$EXTENSION_X86_BIN" ]; then
            EXTENSION_BUILD_BIN=".build/$CONFIG/$EXTENSION_PRODUCT_NAME-universal"
            lipo -create -output "$EXTENSION_BUILD_BIN" "$EXTENSION_ARM_BIN" "$EXTENSION_X86_BIN"
        else
            echo "error: universal extension binary not found at $EXTENSION_BUILD_BIN and per-arch fallbacks missing" >&2
            exit 1
        fi
    fi
else
    echo "Building capcap ($CONFIG, host arch only)..."
    swift build -c "$CONFIG"
    BUILD_BIN=".build/$CONFIG/capcap"
    EXTENSION_BUILD_BIN=".build/$CONFIG/$EXTENSION_PRODUCT_NAME"
fi

if [ ! -f "$BUILD_BIN" ]; then
    echo "error: app binary not found at $BUILD_BIN" >&2
    exit 1
fi

if [ ! -f "$EXTENSION_BUILD_BIN" ]; then
    echo "error: share extension binary not found at $EXTENSION_BUILD_BIN" >&2
    exit 1
fi

# Clean previous bundle
rm -rf "$APP_DIR"

# Create .app bundle structure
mkdir -p "$MACOS"
mkdir -p "$RESOURCES"
mkdir -p "$EXTENSION_MACOS"
mkdir -p "$EXTENSION_RESOURCES"

# Copy binary
cp "$BUILD_BIN" "$MACOS/Picshoo"

# Copy share extension bundle
cp "$EXTENSION_BUILD_BIN" "$EXTENSION_MACOS/$EXTENSION_PRODUCT_NAME"
cp "capcap-share-extension/Info.plist" "$EXTENSION_CONTENTS/Info.plist"
cp "Resources/AppIcon.icns" "$EXTENSION_RESOURCES/AppIcon.icns"

# Copy Info.plist
cp "capcap/App/Info.plist" "$CONTENTS/Info.plist"
bash scripts/inject-build-metadata.sh "$CONTENTS/Info.plist"
APP_SHORT_VERSION="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$CONTENTS/Info.plist")"
APP_BUNDLE_VERSION="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleVersion' "$CONTENTS/Info.plist")"
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $APP_SHORT_VERSION" "$EXTENSION_CONTENTS/Info.plist"
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $APP_BUNDLE_VERSION" "$EXTENSION_CONTENTS/Info.plist"

# Copy app icon
cp "Resources/AppIcon.icns" "$RESOURCES/AppIcon.icns"

# Copy menu bar icon source. The SVG lives in design/ so tweaking it updates the
# app bundle on the next rebuild without touching Swift code.
cp "design/MenuBarIcon.png" "$RESOURCES/MenuBarIcon.png"
cp "design/MenuBarIcon@2x.png" "$RESOURCES/MenuBarIcon@2x.png"

# Woo's typeface and accent colour (see capcap/UI/WooTheme.swift). The accent
# lives in an asset catalog so every standard AppKit control picks it up.
mkdir -p "$RESOURCES/Fonts"
cp Resources/Fonts/*.ttf "$RESOURCES/Fonts/"
ASSETS_TMP="$(mktemp -d)"
xcrun actool Resources/Picshoo.xcassets --compile "$ASSETS_TMP" --platform macosx \
    --minimum-deployment-target 14.0 --accent-color AccentColor \
    --output-partial-info-plist "$ASSETS_TMP/partial.plist" > /dev/null
cp "$ASSETS_TMP/Assets.car" "$RESOURCES/Assets.car"
rm -rf "$ASSETS_TMP"

# Copy localization bundles (.lproj). The app loads these directly for its
# in-app language picker — see Localizer.swift.
for lproj in Resources/*.lproj; do
    [ -d "$lproj" ] || continue
    cp -R "$lproj" "$RESOURCES/"
done

# Copy SwiftPM resource bundles. PermissionFlow uses Bundle.module for its
# floating authorization panel strings; if this bundle is absent, Intel builds
# crash with a Swift assertion the first time the panel is shown.
BUILD_DIR="$(dirname "$BUILD_BIN")"
PERMISSION_FLOW_BUNDLE="$BUILD_DIR/capcap_PermissionFlow.bundle"
if [ ! -d "$PERMISSION_FLOW_BUNDLE" ]; then
    echo "error: missing SwiftPM resource bundle: $PERMISSION_FLOW_BUNDLE" >&2
    exit 1
fi
cp -R "$PERMISSION_FLOW_BUNDLE" "$RESOURCES/"

# Code signing
# -----------------------------------------------------------------------------
# Sign with the SAME self-signed certificate CI uses ("capcap Self-Signed") so
# the app's code-signing identity — and therefore its macOS TCC permission
# grants (Screen Recording / Accessibility) — stay stable between local test
# builds and released builds. Without this, every local rebuild looks like a
# different app to TCC and you must re-authorize.
#
# Import the cert once (it lives in capcap-signing.p12, default password "capcap"):
#   security import ~/Desktop/capcap-signing.p12 \
#     -k ~/Library/Keychains/login.keychain-db -P capcap -T /usr/bin/codesign
#
# Override the identity with the SIGN_IDENTITY env var. If the cert isn't in the
# keychain, fall back to ad-hoc signing (still launchable, but TCC grants won't
# match released builds).
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SIGN_IDENTITY="${SIGN_IDENTITY:-Picshoo Self-Signed}"
sign_bundles() {
    local identity="$1"
    # codesign refuses files carrying Finder info or resource forks, and an
    # iCloud-synced folder such as the Desktop keeps adding them to the bundle.
    # Signing happens on a clean copy outside it, which is then moved back.
    local stage
    stage="$(mktemp -d)"
    ditto --norsrc --noextattr "$APP_DIR" "$stage/$APP_NAME"
    codesign --force --entitlements "$SCRIPT_DIR/capcap-share-extension.entitlements" \
        --sign "$identity" "$stage/$APP_NAME/Contents/PlugIns/$EXTENSION_NAME"
    codesign --force --entitlements "$SCRIPT_DIR/capcap.entitlements" \
        --sign "$identity" "$stage/$APP_NAME"
    rm -rf "$APP_DIR"
    ditto --norsrc --noextattr "$stage/$APP_NAME" "$APP_DIR"
    rm -rf "$stage"
}

# An Apple Development certificate is just as stable for local builds, so it
# is used when the self-signed one has not been imported.
DEV_IDENTITY="$(security find-identity -v -p codesigning 2>/dev/null \
    | awk '/"Apple Development:/ { print $2; exit }')"

if security find-identity -p codesigning 2>/dev/null | grep -qF "$SIGN_IDENTITY"; then
    echo "Signing with: $SIGN_IDENTITY"
    sign_bundles "$SIGN_IDENTITY"
elif [ -n "$DEV_IDENTITY" ]; then
    echo "Signing with Apple Development identity: $DEV_IDENTITY"
    sign_bundles "$DEV_IDENTITY"
else
    echo "warning: '$SIGN_IDENTITY' not found in keychain — falling back to ad-hoc signing." >&2
    echo "warning: TCC permissions won't match released builds until you import capcap-signing.p12." >&2
    sign_bundles -
fi

echo "✅ Built and signed $APP_DIR"
ARCHS=$(lipo -archs "$MACOS/Picshoo" 2>/dev/null || echo "unknown")
echo "   Architectures: $ARCHS"
echo ""
echo "To run:"
echo "  open build/$APP_NAME"
echo ""
echo "To install to /Applications:"
echo "  cp -r build/$APP_NAME /Applications/"
