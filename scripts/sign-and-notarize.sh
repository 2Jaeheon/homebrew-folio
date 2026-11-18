#!/bin/bash
# Signs Folio.app with Developer ID, notarizes it, staples the ticket and writes Folio.zip.
# Usage: scripts/sign-and-notarize.sh <Folio.app> <version>
#
# Env (from repository secrets):
#   DEVELOPER_ID_P12           base64 of the Developer ID Application .p12
#   DEVELOPER_ID_P12_PASSWORD  password of that .p12
#   ASC_KEY_P8                 App Store Connect team API key (.p8 text)
#   ASC_KEY_ID, ASC_ISSUER_ID  that key's id and issuer id
# SIGN_IDENTITY=- signs ad hoc and skips the keychain and notarization (local dry run).
set -euo pipefail
app="${1:?usage: $0 <Folio.app> <version>}"
version="${2:?usage: $0 <Folio.app> <version>}"
bundle_id=io.github.moduggagi.folio
tmp="${RUNNER_TEMP:-$(mktemp -d)}"

plist="$app/Contents/Info.plist"
/usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier $bundle_id" \
    -c "Set :CFBundleShortVersionString $version" \
    -c "Set :CFBundleVersion $version" "$plist"

identity="${SIGN_IDENTITY:-}"
if [[ -z "$identity" ]]; then
    kc="$tmp/signing.keychain-db"
    kc_pw="$(uuidgen)"
    security create-keychain -p "$kc_pw" "$kc"
    security set-keychain-settings -lut 3600 "$kc"
    security unlock-keychain -p "$kc_pw" "$kc"
    printf '%s' "$DEVELOPER_ID_P12" | base64 --decode > "$tmp/cert.p12"
    security import "$tmp/cert.p12" -k "$kc" -P "$DEVELOPER_ID_P12_PASSWORD" -T /usr/bin/codesign >/dev/null
    rm -f "$tmp/cert.p12"
    # codesign needs the intermediate CA to build the chain; a fresh keychain lacks it.
    curl -fsSL https://www.apple.com/certificateauthority/DeveloperIDG2CA.cer -o "$tmp/DeveloperIDG2CA.cer"
    security import "$tmp/DeveloperIDG2CA.cer" -k "$kc" >/dev/null
    security set-key-partition-list -S apple-tool:,apple: -s -k "$kc_pw" "$kc" >/dev/null
    # codesign looks up identities through the search list, so add ours in front.
    security list-keychains -d user -s "$kc" $(security list-keychains -d user | tr -d '"')
    identity="$(security find-identity -v -p codesigning "$kc" | awk '/Developer ID Application/ { print $2; exit }')"
    [[ -n "$identity" ]] || { echo "No Developer ID Application identity in the .p12" >&2; exit 1; }
fi

# Nested executables first, the app last. Signing never runs the code it signs.
for bin in "$app"/Contents/MacOS/*; do
    [[ "$(basename "$bin")" == Folio ]] && continue
    codesign --force --options runtime --timestamp --sign "$identity" "$bin"
done
codesign --force --options runtime --timestamp --sign "$identity" "$app"
codesign --verify --strict --deep --verbose=2 "$app"

zip=Folio.zip
rm -f "$zip"
ditto -c -k --keepParent "$app" "$zip"

if [[ "$identity" != - ]]; then
    printf '%s' "$ASC_KEY_P8" > "$tmp/AuthKey.p8"
    auth=(--key "$tmp/AuthKey.p8" --key-id "$ASC_KEY_ID" --issuer "$ASC_ISSUER_ID")
    result="$(xcrun notarytool submit "$zip" "${auth[@]}" --wait --timeout 30m --output-format json)"
    echo "$result"
    if [[ "$(jq -r .status <<<"$result")" != Accepted ]]; then
        xcrun notarytool log "$(jq -r .id <<<"$result")" "${auth[@]}" || true
        rm -f "$tmp/AuthKey.p8"
        exit 1
    fi
    rm -f "$tmp/AuthKey.p8"
    xcrun stapler staple "$app"
    spctl --assess --type execute --verbose=2 "$app"
    # Re-zip so the download carries the stapled ticket.
    rm -f "$zip"
    ditto -c -k --keepParent "$app" "$zip"
fi
echo "Wrote $zip"
