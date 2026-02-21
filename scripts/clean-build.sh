#!/bin/bash
# Clean build script - removes all build artifacts and caches
# Run this before rebuilding to ensure no stale artifacts

echo "🧹 Cleaning build artifacts..."

# Remove build output
rm -rf docs/
rm -rf dist/
rm -rf node_modules/.vite/

# Remove Vite cache
rm -rf node_modules/.cache/

# Remove lock file (optional - uncomment if you want to reinstall from scratch)
# rm -rf package-lock.json

echo "✅ Clean complete!"
echo ""
echo "Next steps:"
echo "1. npm install (if you removed package-lock.json)"
echo "2. npm run build"




