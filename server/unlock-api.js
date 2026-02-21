/**
 * Account Unlock API - Provides instant unlock functionality for locked user accounts
 * Can be called from the admin panel or via direct API call with master key
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path
const dbPath = path.join(__dirname, 'cms.db');

/**
 * Unlock a user account by username or user ID
 * @param {string|number} identifier - Username or user ID
 * @returns {Object} Result with success status and message
 */
export function unlockAccount(identifier) {
  let db;
  try {
    db = new Database(dbPath, { timeout: 5000 });
    
    let user;
    if (typeof identifier === 'number' || /^\d+$/.test(identifier)) {
      user = db.prepare('SELECT id, username, locked_until, login_attempts FROM users WHERE id = ?').get(Number(identifier));
    } else {
      user = db.prepare('SELECT id, username, locked_until, login_attempts FROM users WHERE username = ?').get(String(identifier).trim().toLowerCase());
    }

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const now = Date.now();
    const wasLocked = user.locked_until && now < user.locked_until;
    const prevAttempts = user.login_attempts || 0;

    // Reset login attempts and clear lock
    db.prepare('UPDATE users SET login_attempts = 0, locked_until = 0 WHERE id = ?').run(user.id);

    return {
      success: true,
      username: user.username,
      wasLocked,
      previousAttempts: prevAttempts,
      message: wasLocked 
        ? `Account unlocked. Was locked with ${prevAttempts} failed attempts.`
        : `Account reset. Had ${prevAttempts} failed attempts (was not locked).`
    };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    if (db) db.close();
  }
}

/**
 * Get account lock status
 * @param {string|number} identifier - Username or user ID
 * @returns {Object} Lock status information
 */
export function getAccountStatus(identifier) {
  let db;
  try {
    db = new Database(dbPath, { timeout: 5000 });
    
    let user;
    if (typeof identifier === 'number' || /^\d+$/.test(identifier)) {
      user = db.prepare('SELECT id, username, locked_until, login_attempts, created_at FROM users WHERE id = ?').get(Number(identifier));
    } else {
      user = db.prepare('SELECT id, username, locked_until, login_attempts, created_at FROM users WHERE username = ?').get(String(identifier).trim().toLowerCase());
    }

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const now = Date.now();
    const isLocked = user.locked_until && now < user.locked_until;
    const lockRemainingMs = isLocked ? user.locked_until - now : 0;
    const lockRemainingMinutes = Math.ceil(lockRemainingMs / 60000);

    return {
      success: true,
      id: user.id,
      username: user.username,
      isLocked,
      loginAttempts: user.login_attempts || 0,
      lockRemainingMinutes: lockRemainingMinutes > 0 ? lockRemainingMinutes : 0,
      lockedUntil: isLocked ? new Date(user.locked_until).toISOString() : null,
      createdAt: user.created_at
    };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    if (db) db.close();
  }
}

/**
 * List all locked accounts
 * @returns {Object} List of locked accounts
 */
export function listLockedAccounts() {
  let db;
  try {
    db = new Database(dbPath, { timeout: 5000 });
    
    const now = Date.now();
    const lockedUsers = db.prepare(`
      SELECT id, username, login_attempts, locked_until, created_at 
      FROM users 
      WHERE locked_until > ?
      ORDER BY locked_until DESC
    `).all(now);

    return {
      success: true,
      count: lockedUsers.length,
      accounts: lockedUsers.map(user => ({
        id: user.id,
        username: user.username,
        loginAttempts: user.login_attempts,
        lockedUntil: new Date(user.locked_until).toISOString(),
        lockRemainingMinutes: Math.ceil((user.locked_until - now) / 60000)
      }))
    };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    if (db) db.close();
  }
}

/**
 * Unlock all locked accounts
 * @returns {Object} Result with count of unlocked accounts
 */
export function unlockAllAccounts() {
  let db;
  try {
    db = new Database(dbPath, { timeout: 5000 });
    
    const result = db.prepare('UPDATE users SET login_attempts = 0, locked_until = 0 WHERE locked_until > 0').run();

    return {
      success: true,
      unlockedCount: result.changes,
      message: `Unlocked ${result.changes} account(s)`
    };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    if (db) db.close();
  }
}

export default {
  unlockAccount,
  getAccountStatus,
  listLockedAccounts,
  unlockAllAccounts
};
