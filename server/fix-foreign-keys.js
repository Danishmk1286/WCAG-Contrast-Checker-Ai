/**
 * Standalone script to fix foreign key constraints in production database
 * Run this on production server to ensure foreign keys are properly configured
 * Usage: node fix-foreign-keys.js
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use the same database path logic as database.js
const privateDir = path.resolve(__dirname, '../../private');
const dbPath = fs.existsSync(privateDir) 
  ? path.join(privateDir, 'cms.db')
  : path.join(__dirname, 'cms.db');

console.log('\n' + '='.repeat(80));
console.log('🔧 FOREIGN KEY FIX SCRIPT');
console.log('='.repeat(80));
console.log(`📂 Database path: ${dbPath}`);

if (!fs.existsSync(dbPath)) {
  console.error(`❌ Database not found at: ${dbPath}`);
  process.exit(1);
}

let db;
try {
  db = new Database(dbPath, {
    timeout: 5000,
    verbose: null
  });
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  const fkStatus = db.pragma('foreign_keys');
  console.log(`✅ Foreign keys enabled: ${fkStatus === 1 || fkStatus === '1' || (Array.isArray(fkStatus) && fkStatus[0]?.foreign_keys === 1)}`);
} catch (error) {
  console.error(`❌ Failed to open database: ${error.message}`);
  process.exit(1);
}

try {
  // Check current blog_views table schema
  console.log('\n📋 Checking blog_views table...');
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='blog_views'").get();
  
  if (!tableExists) {
    console.log('ℹ️  blog_views table does not exist - will be created with proper constraints');
  } else {
    const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='blog_views'").get();
    
    if (schema && schema.sql) {
      console.log('📄 Current schema:');
      console.log(`   ${schema.sql.substring(0, 100)}...`);
      
      if (schema.sql.includes('ON DELETE CASCADE')) {
        console.log('✅ blog_views already has ON DELETE CASCADE');
      } else {
        console.log('🔄 Migrating blog_views table...');
        
        // Get column info
        const columns = db.pragma('table_info(blog_views)');
        const columnNames = columns.map(c => c.name).join(', ');
        
        // Backup data
        db.exec(`CREATE TABLE IF NOT EXISTS blog_views_backup AS SELECT * FROM blog_views;`);
        const backupCount = db.prepare('SELECT COUNT(*) as count FROM blog_views_backup').get();
        console.log(`   Backed up ${backupCount?.count || 0} records`);
        
        // Drop and recreate
        db.exec('DROP TABLE blog_views;');
        db.exec(`
          CREATE TABLE blog_views (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            post_slug TEXT NOT NULL,
            session_id TEXT,
            ip_address TEXT,
            referrer TEXT,
            viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            read_duration_seconds INTEGER DEFAULT 0,
            scroll_depth REAL DEFAULT 0,
            FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE
          );
        `);
        
        // Restore data
        if (backupCount && backupCount.count > 0) {
          db.exec(`INSERT INTO blog_views (${columnNames}) SELECT ${columnNames} FROM blog_views_backup;`);
          const restoredCount = db.prepare('SELECT COUNT(*) as count FROM blog_views').get();
          console.log(`   Restored ${restoredCount?.count || 0} records`);
        }
        
        db.exec('DROP TABLE blog_views_backup;');
        console.log('✅ Migration complete');
      }
    }
  }
  
  // Verify foreign keys are working
  console.log('\n🔍 Verifying foreign key constraints...');
  const fkCheck = db.pragma('foreign_keys');
  console.log(`   Foreign keys enabled: ${fkCheck === 1 || fkCheck === '1' || (Array.isArray(fkCheck) && fkCheck[0]?.foreign_keys === 1)}`);
  
  // Check for any orphaned blog_views
  const orphanedViews = db.prepare(`
    SELECT COUNT(*) as count 
    FROM blog_views bv 
    LEFT JOIN blog_posts bp ON bv.post_id = bp.id 
    WHERE bp.id IS NULL
  `).get();
  
  if (orphanedViews && orphanedViews.count > 0) {
    console.log(`⚠️  Found ${orphanedViews.count} orphaned blog_views records`);
    console.log('   Cleaning up orphaned records...');
    db.exec(`
      DELETE FROM blog_views 
      WHERE post_id NOT IN (SELECT id FROM blog_posts)
    `);
    console.log('   ✅ Cleaned up orphaned records');
  } else {
    console.log('   ✅ No orphaned records found');
  }
  
  console.log('\n✅ Foreign key fix completed successfully!');
  console.log('='.repeat(80) + '\n');
  
  db.close();
  process.exit(0);
} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error('   Stack:', error.stack);
  console.error('='.repeat(80) + '\n');
  db.close();
  process.exit(1);
}

