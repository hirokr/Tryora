#!/bin/bash
# Using '.' instead of 'source' for better compatibility
if [ -d ".venv" ]; then
    . .venv/bin/activate
    echo "Python Virtual Environment Activated."
else
    echo "Error: .venv directory not found."
fi
