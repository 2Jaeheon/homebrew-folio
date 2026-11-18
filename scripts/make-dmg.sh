#!/bin/bash
# Builds the drag-to-install disk image: Folio.app, an Applications alias, and the window look from dmg/.
# dmg/DS_Store holds the window size, icon positions and background; dmg/make-ds-store.sh remakes it.
# Usage: scripts/make-dmg.sh <Folio.app> <Folio.dmg>
set -euo pipefail
app="${1:?usage: $0 <Folio.app> <Folio.dmg>}"
dmg="${2:?usage: $0 <Folio.app> <Folio.dmg>}"
assets="$(cd "$(dirname "$0")/../dmg" && pwd)"
stage="$(mktemp -d)"

ditto "$app" "$stage/Folio.app"
# The alias only improves the icon; a symlink installs just as well if it cannot be made.
swift "$assets/make-applications-alias.swift" "$stage/Applications" || ln -s /Applications "$stage/Applications"
mkdir "$stage/.background"
cp "$assets/background.tiff" "$stage/.background/background.tiff"
cp "$assets/DS_Store" "$stage/.DS_Store"

rm -f "$dmg"
# The DS_Store finds the background by volume name, so keep the name Folio.
hdiutil create -volname Folio -srcfolder "$stage" -format UDZO -fs HFS+ "$dmg" >/dev/null
rm -rf "$stage"
