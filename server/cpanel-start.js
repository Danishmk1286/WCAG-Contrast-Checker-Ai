#!/usr/bin/env node
/**
 * cPanel Startup Script - Cleans lock files and starts the server
 * This prevents "Can't acquire lock for app" errors on cPanel
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lock file patterns to clean
const lockPatterns = ['.lock', 'app.lock', 'node.lock', 'npm.lock', 'package-lock.json.lock'];
const walPatterns = ['-wal', '-shm', '-journal'];

console.log('🔧 cPanel Startup Script');
console.log('========================');

// Clean lock files
function cleanLockFiles() {
  const dirsToCheck = [__dirname, path.resolve(__dirname, '..'), path.resolve(__dirname, '../private')];
  let cleaned = 0;

  dirsToCheck.forEach(dir => {
    if (!fs.existsSync(dir)) return;

    try {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        
        // Check if it's a lock file
        const isLock = lockPatterns.some(p => file === p || file.endsWith(p));
        
        // Check if it's a SQLite WAL/SHM file (stale)
        const isStaleWal = walPatterns.some(p => file.endsWith(p));
        
        if (isLock || isStaleWal) {
          try {
            fs.unlinkSync(filePath);
            console.log(`🧹 Removed: ${filePath}`);
            cleaned++;
          } catch (err) {
            console.warn(`⚠️  Could not remove ${filePath}: ${err.message}`);
          }
        }
      });
    } catch (err) {
      console.warn(`⚠️  Could not read directory ${dir}: ${err.message}`);
    }
  });

  return cleaned;
}

// Kill any orphaned Node processes (only on non-Windows)
function killOrphanProcesses() {
  if (process.platform === 'win32') return;

  try {
    const { execSync } = await import('child_process');
    // Find and kill any zombie node processes for this app
    execSync("pkill -f 'node.*server.js' 2>/dev/null || true", { stdio: 'ignore' });
    console.log('🔪 Cleaned orphan processes');
  } catch (err) {
    // Ignore errors - process may not exist
  }
}

// Main startup
async function main() {
  const cleaned = cleanLockFiles();
  console.log(`✅ Cleaned ${cleaned} lock/stale files`);

  // Wait a moment for file system to settle
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('🚀 Starting server...\n');

  // Start the main server
  const server = spawn('node', ['server.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env }
  });

  server.on('error', (err) => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  });

  server.on('exit', (code) => {
    console.log(`Server exited with code ${code}`);
    process.exit(code || 0);
  });
}

main().catch(err => {
  console.error('❌ Startup failed:', err);
  process.exit(1);
});
