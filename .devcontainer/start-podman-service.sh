#!/bin/bash

# Starts Podman's Docker-compatible API socket (if not already running) so tools that speak the
# Docker API - e.g. Testcontainers in plugin/clickhouse-plugin - can use Podman. DOCKER_HOST in
# devcontainer.json points at this socket. Run from postStartCommand on every container start.

SOCKET="${PODMAN_SOCKET:-/home/vscode/.podman/podman.sock}"
LOG="/home/vscode/.podman/podman-service.log"

if curl -sf --unix-socket "$SOCKET" http://d/_ping > /dev/null 2>&1; then
    echo "Podman API already running at $SOCKET"
    exit 0
fi

mkdir -p "$(dirname "$SOCKET")"
rm -f "$SOCKET"

setsid nohup podman system service --time=0 "unix://$SOCKET" > "$LOG" 2>&1 < /dev/null &

for _ in $(seq 1 50); do
    if curl -sf --unix-socket "$SOCKET" http://d/_ping > /dev/null 2>&1; then
        echo "Podman API running at $SOCKET"
        exit 0
    fi
    sleep 0.2
done

echo "Podman API failed to start - see $LOG" >&2
exit 1
