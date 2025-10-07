#!/bin/bash
# Build script for Render that ensures environment variables are available

echo "Building with environment variables..."
echo "VITE_GOOGLE_CLIENT_ID: $VITE_GOOGLE_CLIENT_ID"

# Run the build
npm run build

echo "Build completed"
