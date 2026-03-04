#!/bin/bash

# . ./local.sh {start|stop} [all|<service-or-container>]
ACTION="${1:-}"
TARGET="${2:-all}"

usage() {
    echo "Usage: $0 {start|stop} [all|<service-or-container>]"
    echo
    echo "Examples:"
    echo "  $0 start all"
    echo "  $0 stop all"
    echo "  $0 start web"
    echo "  $0 stop server"
    echo "  $0 start my-postgres"
}

if [[ "$ACTION" != "start" && "$ACTION" != "stop" ]]; then
    usage
    return 1 2>/dev/null || exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
    echo "Error: docker is not installed or not available in PATH."
    return 1 2>/dev/null || exit 1
fi

if [[ "$TARGET" == "all" ]]; then
    if [[ "$ACTION" == "start" ]]; then
        echo "Starting all Docker Compose services..."
        docker compose up -d --build
    else
        echo "Stopping all Docker Compose services..."
        docker compose stop
    fi
    return 0 2>/dev/null || exit 0
fi

if docker compose config --services 2>/dev/null | grep -Fxq "$TARGET"; then
    if [[ "$ACTION" == "start" ]]; then
        echo "Starting compose service: $TARGET"
        docker compose up -d "$TARGET"
    else
        echo "Stopping compose service: $TARGET"
        docker compose stop "$TARGET"
    fi
    return 0 2>/dev/null || exit 0
fi

if [[ "$ACTION" == "start" ]]; then
    echo "Starting container: $TARGET"
    docker start "$TARGET"
else
    echo "Stopping container: $TARGET"
    docker stop "$TARGET"
fi