#!/usr/bin/env node
/**
 * Quick script to unlock admin account
 * Run with: node unlock-account.js
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use the same database path as the server
const dbPath = path.join(__dirname, 'cms.db');
const db = new Database(dbPath);

const username = 'admin';

try {
  const user = db.prepare('SELECT id, username, locked_until, login_attempts FROM users WHERE username = ?').get(username);
  
  if (!user) {
    console.log(`❌ User '${username}' not found`);
    process.exit(1);
  }
  
  const now = Date.now();
  const wasLocked = user.locked_until && now < user.locked_until;
  
  // Unlock the account
  db.prepare('UPDATE users SET login_attempts = 0, locked_until = 0 WHERE username = ?').run(username);
  
  if (wasLocked) {
    const minutesRemaining = Math.ceil((user.locked_until - now) / (60 * 1000));
    console.log(`✅ Account unlocked successfully!`);
    console.log(`   Was locked for ${minutesRemaining} more minute(s)`);
  } else {
    console.log(`✅ Account unlock processed (was not locked)`);
  }
  
  console.log(`   Login attempts reset to 0`);
  console.log(`   You can now login with your credentials\n`);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
} finally {
  db.close();
}
