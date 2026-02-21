/**
 * Migration script to add ON DELETE CASCADE to all child tables of blog_posts
 * This fixes foreign key constraint errors when deleting posts
 * 
 * Usage: node migrate-post-foreign-keys.js
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
console.log('🔄 MIGRATE POST FOREIGN KEYS - Add ON DELETE CASCADE');
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

// List of all child tables that might reference blog_posts
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
  'post_media'
];

function migrateTable(tableName) {
  try {
    // Check if table exists
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(tableName);
    
    if (!tableExists) {
      console.log(`   ℹ️  ${tableName}: Table does not exist, skipping`);
      return { migrated: false, reason: 'table_not_exists' };
    }
    
    // Get current schema
    const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name=?").get(tableName);
    
    if (!schema || !schema.sql) {
      console.log(`   ⚠️  ${tableName}: Could not get schema`);
      return { migrated: false, reason: 'no_schema' };
    }
    
    // Check if it already has ON DELETE CASCADE
    if (schema.sql.includes('ON DELETE CASCADE')) {
      console.log(`   ✅ ${tableName}: Already has ON DELETE CASCADE`);
      return { migrated: false, reason: 'already_has_cascade' };
    }
    
    // Check if it has a foreign key to blog_posts
    if (!schema.sql.includes('blog_posts') && !schema.sql.includes('FOREIGN KEY')) {
      console.log(`   ℹ️  ${tableName}: No foreign key to blog_posts, skipping`);
      return { migrated: false, reason: 'no_fk_to_posts' };
    }
    
    console.log(`   🔄 ${tableName}: Migrating...`);
    
    // Get column info
    const columns = db.pragma(`table_info(${tableName})`);
    const columnNames = columns.map(c => c.name).join(', ');
    
    // Backup data
    const backupTable = `${tableName}_backup_${Date.now()}`;
    db.exec(`CREATE TABLE ${backupTable} AS SELECT * FROM ${tableName};`);
    const backupCount = db.prepare(`SELECT COUNT(*) as count FROM ${backupTable}`).get();
    console.log(`      Backed up ${backupCount?.count || 0} records`);
    
    // Parse and update the schema
    // Replace FOREIGN KEY references to blog_posts with ON DELETE CASCADE
    let newSchema = schema.sql;
    
    // Find and replace foreign key constraints
    // Pattern: FOREIGN KEY (column) REFERENCES blog_posts(id)
    // Replace with: FOREIGN KEY (column) REFERENCES blog_posts(id) ON DELETE CASCADE
    newSchema = newSchema.replace(
      /FOREIGN KEY\s*\(([^)]+)\)\s*REFERENCES\s*blog_posts\s*\(([^)]+)\)/gi,
      'FOREIGN KEY ($1) REFERENCES blog_posts($2) ON DELETE CASCADE'
    );
    
    // Drop old table
    db.exec(`DROP TABLE ${tableName};`);
    console.log(`      Dropped old table`);
    
    // Recreate with ON DELETE CASCADE
    db.exec(newSchema);
    console.log(`      Created new table with ON DELETE CASCADE`);
    
    // Restore data
    if (backupCount && backupCount.count > 0) {
      db.exec(`INSERT INTO ${tableName} (${columnNames}) SELECT ${columnNames} FROM ${backupTable};`);
      const restoredCount = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
      console.log(`      Restored ${restoredCount?.count || 0} records`);
    }
    
    // Drop backup
    db.exec(`DROP TABLE ${backupTable};`);
    console.log(`   ✅ ${tableName}: Migration complete`);
    
    return { migrated: true, records: backupCount?.count || 0 };
  } catch (error) {
    console.error(`   ❌ ${tableName}: Migration failed - ${error.message}`);
    console.error(`      Stack: ${error.stack}`);
    return { migrated: false, reason: error.message };
  }
}

try {
  console.log('\n📋 Checking all child tables...\n');
  
  const results = {
    migrated: [],
    skipped: [],
    failed: []
  };
  
  for (const tableName of childTables) {
    const result = migrateTable(tableName);
    if (result.migrated) {
      results.migrated.push({ table: tableName, records: result.records });
    } else if (result.reason === 'already_has_cascade') {
      results.skipped.push({ table: tableName, reason: 'already_has_cascade' });
    } else if (result.reason && result.reason !== 'table_not_exists' && result.reason !== 'no_fk_to_posts') {
      results.failed.push({ table: tableName, reason: result.reason });
    }
  }
  
  // Also check for any other tables with foreign keys to blog_posts using PRAGMA
  console.log('\n🔍 Checking for other tables with foreign keys to blog_posts...');
  const allTables = db.prepare(`
    SELECT name 
    FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '%_backup_%'
    ORDER BY name
  `).all();
  
  for (const table of allTables) {
    if (childTables.includes(table.name)) {
      continue; // Already processed
    }
    
    try {
      const fkList = db.pragma(`foreign_key_list(${table.name})`);
      if (Array.isArray(fkList) && fkList.length > 0) {
        for (const fk of fkList) {
          if (fk.table === 'blog_posts') {
            console.log(`   ⚠️  Found unexpected FK: ${table.name}.${fk.from} → blog_posts.${fk.to}`);
            console.log(`      Migrating ${table.name}...`);
            const result = migrateTable(table.name);
            if (result.migrated) {
              results.migrated.push({ table: table.name, records: result.records });
            }
          }
        }
      }
    } catch (e) {
      // Table might not exist or might not have foreign keys
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Migrated: ${results.migrated.length} table(s)`);
  if (results.migrated.length > 0) {
    results.migrated.forEach(r => {
      console.log(`   - ${r.table} (${r.records} records)`);
    });
  }
  console.log(`⏭️  Skipped (already has CASCADE): ${results.skipped.length} table(s)`);
  if (results.skipped.length > 0) {
    results.skipped.forEach(r => {
      console.log(`   - ${r.table}`);
    });
  }
  if (results.failed.length > 0) {
    console.log(`❌ Failed: ${results.failed.length} table(s)`);
    results.failed.forEach(r => {
      console.log(`   - ${r.table}: ${r.reason}`);
    });
  }
  console.log('='.repeat(80) + '\n');
  
  db.close();
  process.exit(0);
} catch (error) {
  console.error('\n❌ Migration error:', error.message);
  console.error('   Stack:', error.stack);
  console.error('='.repeat(80) + '\n');
  db.close();
  process.exit(1);
}

