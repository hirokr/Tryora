#!/bin/bash

#. ./scripts/reqgen.sh
FILE_NAME="requirements.txt"

pip list --format=freeze > "$FILE_NAME"
sed 's/=.*/=/' .env > .env.example
echo "Done! Saved to $FILE_NAME"
