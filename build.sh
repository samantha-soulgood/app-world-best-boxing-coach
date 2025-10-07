#!/bin/bash
# Build script for Render that ensures environment variables are available

echo "Building with environment variables..."
echo "VITE_GOOGLE_CLIENT_ID: $VITE_GOOGLE_CLIENT_ID"
echo "GOOGLE_CLIENT_ID: $GOOGLE_CLIENT_ID"

# Set the environment variable for the build process
if [ -n "$GOOGLE_CLIENT_ID" ]; then
    export VITE_GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
    echo "Set VITE_GOOGLE_CLIENT_ID to: $VITE_GOOGLE_CLIENT_ID"
else
    echo "ERROR: GOOGLE_CLIENT_ID environment variable is not set!"
    exit 1
fi

# Run the build with the environment variable
VITE_GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID npm run build

echo "Build completed"
