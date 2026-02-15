#!/bin/bash

FILE_NAME="requirements.txt"

pip list --format=freeze > "$FILE_NAME"
echo "Done! Saved to $FILE_NAME"
