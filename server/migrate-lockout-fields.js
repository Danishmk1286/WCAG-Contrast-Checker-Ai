import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use same path logic as database.js
const privateDir = path.resolve(__dirname, '../../private');
const dbPath = fs.existsSync(privateDir) 
  ? path.join(privateDir, 'cms.db')
  : path.join(__dirname, 'cms.db');

const db = new Database(dbPath);

console.log('🔄 Migrating database to add account lockout fields...');

try {
  // Add login_attempts column if it doesn't exist
  try {
    db.exec('ALTER TABLE users ADD COLUMN login_attempts INTEGER DEFAULT 0');
    console.log('✅ Added login_attempts column');
  } catch (e) {
    if (e.message.includes('duplicate column')) {
      console.log('ℹ️  login_attempts column already exists');
    } else {
      throw e;
    }
  }

  // Add locked_until column if it doesn't exist
  try {
    db.exec('ALTER TABLE users ADD COLUMN locked_until INTEGER DEFAULT 0');
    console.log('✅ Added locked_until column');
  } catch (e) {
    if (e.message.includes('duplicate column')) {
      console.log('ℹ️  locked_until column already exists');
    } else {
      throw e;
    }
  }

  console.log('✅ Migration completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}



