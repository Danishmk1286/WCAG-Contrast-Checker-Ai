/**
 * Safely delete all blog posts and related records
 * This script deletes from all child tables first, then deletes posts
 * 
 * Usage: node delete-all-blogs-safe.js
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
console.log('🗑️  SAFE DELETE ALL BLOGS SCRIPT');
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
  console.log('✅ Foreign keys enabled');
} catch (error) {
  console.error(`❌ Failed to open database: ${error.message}`);
  process.exit(1);
}

// All child tables that need to be cleaned up
const childTables = [
  'blog_views',
  'post_tags',
  'post_categories',
  'post_views',
  'post_revisions',
  'revisions',
  'post_files',
  'seo_audit_logs',
  'seo_logs',
  'comments',
  'media',
  'post_media',
  'usage_stats', // Has postId in JSON, needs special handling
  'audit_logs'   // Uses resource_type and resource_id
];

try {
  // Get count of posts before deletion
  const postsCount = db.prepare('SELECT COUNT(*) as count FROM blog_posts').get();
  console.log(`\n📊 Found ${postsCount?.count || 0} blog post(s) in database`);
  
  if (postsCount && postsCount.count === 0) {
    console.log('ℹ️  No blog posts to delete. Database is already empty.');
    db.close();
    process.exit(0);
  }
  
  console.log('\n🗑️  Starting safe deletion process...\n');
  
  const deleteTransaction = db.transaction(() => {
    const deletedCounts = {};
    
    // Step 1: Delete from all child tables
    console.log('📝 Step 1: Deleting from child tables...');
    for (const tableName of childTables) {
      try {
        // Check if table exists
        const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(tableName);
        if (!tableExists) {
          console.log(`   ℹ️  ${tableName}: Table does not exist, skipping`);
          continue;
        }
        
        let deleteQuery;
        let params = [];
        
        if (tableName === 'audit_logs') {
          deleteQuery = "DELETE FROM audit_logs WHERE resource_type = 'blog_post'";
        } else if (tableName === 'usage_stats') {
          deleteQuery = "DELETE FROM usage_stats WHERE event_type = 'blog_view'";
        } else {
          // Check if table has post_id column
          const columns = db.pragma(`table_info(${tableName})`);
          const hasPostId = columns.some(c => c.name === 'post_id');
          
          if (hasPostId) {
            deleteQuery = `DELETE FROM ${tableName} WHERE post_id IN (SELECT id FROM blog_posts)`;
          } else {
            console.log(`   ℹ️  ${tableName}: No post_id column, skipping`);
            continue;
          }
        }
        
        const countBefore = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}${tableName === 'audit_logs' ? " WHERE resource_type = 'blog_post'" : tableName === 'usage_stats' ? " WHERE event_type = 'blog_view'" : ''}`).get();
        const count = countBefore?.count || 0;
        
        if (count > 0) {
          db.exec(deleteQuery);
          console.log(`   ✓ ${tableName}: Deleted ${count} record(s)`);
          deletedCounts[tableName] = count;
        } else {
          console.log(`   ✓ ${tableName}: 0 records (already clean)`);
        }
      } catch (e) {
        console.log(`   ⚠️  ${tableName}: Error - ${e.message}`);
      }
    }
    
    // Step 2: Delete all blog posts
    console.log('\n📝 Step 2: Deleting all blog posts...');
    const postsResult = db.prepare('DELETE FROM blog_posts').run();
    console.log(`   ✓ blog_posts: Deleted ${postsResult.changes} post(s)`);
    deletedCounts['blog_posts'] = postsResult.changes;
    
    return deletedCounts;
  });
  
  const deletedCounts = deleteTransaction();
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ SAFE DELETION COMPLETED');
  console.log('='.repeat(80));
  console.log('📊 Summary:');
  Object.entries(deletedCounts).forEach(([table, count]) => {
    console.log(`   ${table}: ${count} record(s)`);
  });
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

