#!/usr/bin/env node
// Clean build script - removes all build artifacts and caches
// Cross-platform Node.js version

const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning build artifacts...');

const dirsToRemove = [
  'docs',
  'dist',
  path.join('node_modules', '.vite'),
  path.join('node_modules', '.cache'),
];

dirsToRemove.forEach(dir => {
  const fullPath = path.resolve(__dirname, '..', dir);
  if (fs.existsSync(fullPath)) {
    console.log(`  Removing: ${dir}`);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
});

console.log('✅ Clean complete!');
console.log('');
console.log('Next steps:');
console.log('1. npm install (to ensure dependencies are up to date)');
console.log('2. npm run build');




