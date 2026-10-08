#!/bin/bash

# Generates a self-signed TLS cert/key for the example servers (e.g. SimulMain) valid for
# https://127.0.0.1, https://localhost and https://[::1]. VUU_CERT_PATH / VUU_KEY_PATH in
# devcontainer.json point at these files. Run from postStartCommand on every container start.
#
# An existing cert is kept (so browser/OS trust added for it survives restarts) unless it is
# missing, expires within 30 days, or doesn't cover 127.0.0.1. Pass --force to always regenerate.

set -euo pipefail

CERT="${VUU_CERT_PATH:-${PWD}/.devcontainer/certs/cert.pem}"
KEY="${VUU_KEY_PATH:-${PWD}/.devcontainer/certs/key.pem}"
DAYS=825              # longest validity macOS/iOS accept for a trusted TLS server cert
RENEW_WITHIN=$((30 * 24 * 60 * 60))

FORCE=false
if [[ "${1:-}" == "--force" ]]; then
    FORCE=true
fi

cert_is_valid() {
    [[ -s "$CERT" && -s "$KEY" ]] \
        && openssl x509 -in "$CERT" -noout -checkend "$RENEW_WITHIN" > /dev/null 2>&1 \
        && openssl x509 -in "$CERT" -noout -ext subjectAltName 2>/dev/null | grep -q 'IP Address:127.0.0.1'
}

if ! $FORCE && cert_is_valid; then
    echo "Dev TLS cert already valid at $CERT"
    exit 0
fi

mkdir -p "$(dirname "$CERT")" "$(dirname "$KEY")"

# Generate into temp files and move into place, so a failure never leaves a mismatched pair.
umask 077
TMP_CERT="$(mktemp "${CERT}.XXXXXX")"
TMP_KEY="$(mktemp "${KEY}.XXXXXX")"
trap 'rm -f "$TMP_CERT" "$TMP_KEY"' EXIT

openssl req -x509 -newkey rsa:2048 -sha256 -nodes -days "$DAYS" \
    -keyout "$TMP_KEY" -out "$TMP_CERT" \
    -subj "/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1" \
    -addext "basicConstraints=critical,CA:FALSE" \
    -addext "keyUsage=critical,digitalSignature,keyEncipherment" \
    -addext "extendedKeyUsage=serverAuth" \
    2> /dev/null

chmod 600 "$TMP_KEY"
chmod 644 "$TMP_CERT"
mv -f "$TMP_KEY" "$KEY"
mv -f "$TMP_CERT" "$CERT"

echo "Generated dev TLS cert $CERT (key $KEY), valid for localhost, 127.0.0.1 and ::1"
