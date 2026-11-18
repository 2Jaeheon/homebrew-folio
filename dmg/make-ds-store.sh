#!/bin/bash
# Remakes dmg/DS_Store, the file that gives the disk image window its size, icon positions and background.
# Finder writes it, so this needs a Mac with a logged-in desktop; the release workflow only copies the result.
# Run it after changing the layout below, and commit the new DS_Store.
# Usage: dmg/make-ds-store.sh
set -euo pipefail
cd "$(dirname "$0")"
tmp="$(mktemp -d)"
stage="$tmp/stage"
mkdir -p "$stage/Folio.app" "$stage/.background"
ln -s /Applications "$stage/Applications"
cp background.tiff "$stage/.background/background.tiff"
# The DS_Store finds the background by volume name, so it must match scripts/make-dmg.sh.
hdiutil create -quiet -volname Folio -srcfolder "$stage" -fs HFS+ -format UDRW "$tmp/layout.dmg"
mount="$tmp/mount"
mkdir "$mount"
hdiutil attach -quiet -mountpoint "$mount" "$tmp/layout.dmg"

# The window is 660x440 plus Finder's 28pt title bar; icon positions are the icons' centers.
osascript - "$mount" <<'APPLESCRIPT'
on run argv
    tell application "Finder"
        set d to disk of (item "Folio.app" of folder ((POSIX file (item 1 of argv)) as alias))
        open d
        set w to container window of d
        set current view of w to icon view
        set toolbar visible of w to false
        set statusbar visible of w to false
        set pathbar visible of w to false
        set bounds of w to {200, 120, 860, 588}
        set o to icon view options of w
        set arrangement of o to not arranged
        set icon size of o to 128
        set text size of o to 13
        set background picture of o to file ".background:background.tiff" of d
        set position of item "Folio.app" of d to {180, 190}
        set position of item "Applications" of d to {480, 190}
        update d without registering applications
        delay 2
        close w
    end tell
end run
APPLESCRIPT

# Finder flushes the DS_Store when the volume goes away.
sync
hdiutil detach -quiet "$mount"
hdiutil attach -quiet -readonly -nobrowse -mountpoint "$mount" "$tmp/layout.dmg"
cp "$mount/.DS_Store" DS_Store
hdiutil detach -quiet "$mount"
rm -rf "$tmp"
echo "Wrote $(pwd)/DS_Store"
