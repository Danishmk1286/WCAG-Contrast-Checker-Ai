console.log('✅ database.js loaded, using new blogPosts.delete handler');

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Secure database path - use private directory if available, fallback to server directory
const privateDir = path.resolve(__dirname, '../../private');
const dbPath = fs.existsSync(privateDir) 
  ? path.join(privateDir, 'cms.db')
  : path.join(__dirname, 'cms.db');

// PRODUCTION-SAFE: Attempt to set secure permissions after database creation
// This is best-effort and should not fail the application
const setSecurePermissions = () => {
  if (process.platform === 'win32') {
    // Windows uses ACL, skip permission setting
    return;
  }
  
  try {
    // Set permissions to 0600 (read/write for owner only) if we have write access
    // This is a best-effort attempt and may fail on shared hosting
    fs.chmodSync(dbPath, 0o600);
    console.log('✅ Database file permissions set to 0600 (owner read/write only)');
  } catch (chmodError) {
    // Permission setting failed - this is okay on shared hosting where permissions
    // might be managed by the hosting provider or directory restrictions
    console.warn('⚠️  Could not set database file permissions (this is usually fine on shared hosting):', chmodError.message);
  }
};

// PRODUCTION-SAFE: Check file permissions if database exists
// On shared hosting, file permissions might be set by the server, so we warn but don't fail
if (fs.existsSync(dbPath)) {
  try {
    const stat = fs.statSync(dbPath);
    // Check if file is world-readable or world-writable (mode & 0o077)
    // Skip strict check on Windows (uses ACL instead of Unix mode bits)
    // On shared hosting (Linux/cPanel), file permissions might be set by the hosting provider
    if (stat.mode & 0o077 && process.platform !== 'win32') {
      const message =
        'Database file has insecure permissions. File should not be world-readable/writable. ' +
        'On shared hosting, this may be acceptable if the server restricts directory access.';

      // In strict mode we still throw, otherwise just log a warning so shared hosting doesn't break
      if (process.env.ENFORCE_STRICT_DB_PERMS === 'true') {
        throw new Error(message);
      } else {
        console.warn('⚠️  ' + message);
        console.warn('   File permissions:', (stat.mode & 0o777).toString(8));
        console.warn('   This warning can be ignored on shared hosting if directory access is restricted.');
      }
    }
  } catch (error) {
    // Security check error - log but don't fail in production (shared hosting compatibility)
    console.error('❌ Security check failed:', error.message);
    if (process.env.ENFORCE_STRICT_DB_PERMS === 'true') {
      throw error;
    } else {
      console.warn('   Continuing anyway - shared hosting may have different permission models');
    }
  }
}

// Open database with timeout to prevent locking issues
let db;
try {
  db = new Database(dbPath, {
    timeout: 5000, // 5 second timeout
    verbose: null // Disable verbose logging
  });
  
  // Enable foreign key constraints (required for CASCADE deletes)
  db.pragma('foreign_keys = ON');
  console.log('✅ Foreign key constraints enabled');
  
  // Attempt to set secure file permissions (best-effort, non-blocking)
  setSecurePermissions();
} catch (error) {
  // If database is locked, try cleaning up stale WAL/SHM files
  if (error.message && error.message.includes('locked')) {
    console.warn('⚠️  Database appears locked, attempting to clean up stale files...');
    const walFile = dbPath + '-wal';
    const shmFile = dbPath + '-shm';
    try {
      if (fs.existsSync(walFile)) {
        fs.unlinkSync(walFile);
        console.log('🧹 Removed stale WAL file');
      }
      if (fs.existsSync(shmFile)) {
        fs.unlinkSync(shmFile);
        console.log('🧹 Removed stale SHM file');
      }
      // Retry opening database after cleanup
      db = new Database(dbPath, {
        timeout: 5000,
        verbose: null
      });
      // Enable foreign key constraints
      db.pragma('foreign_keys = ON');
      console.log('✅ Database opened successfully after cleanup');
      console.log('✅ Foreign key constraints enabled');
      
      // Attempt to set secure file permissions (best-effort, non-blocking)
      setSecurePermissions();
    } catch (cleanupError) {
      console.error('❌ Could not clean up or reopen database:', cleanupError.message);
      throw error; // Re-throw original error
    }
  } else {
    throw error; // Re-throw if it's not a locking issue
  }
}

// Initialize database tables
export function initDatabase() {
  // Users table for admin authentication
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      login_attempts INTEGER DEFAULT 0,
      locked_until INTEGER DEFAULT 0,
      verification_code TEXT,
      verification_expires INTEGER,
      reset_token TEXT,
      reset_token_expires INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Add lockout columns to existing tables if they don't exist
  try {
    db.exec(`
      ALTER TABLE users ADD COLUMN login_attempts INTEGER DEFAULT 0;
    `);
  } catch (e) {
    // Column already exists, ignore
  }
  
  try {
    db.exec(`
      ALTER TABLE users ADD COLUMN locked_until INTEGER DEFAULT 0;
    `);
  } catch (e) {
    // Column already exists, ignore
  }

  // Add optional security columns if they don't exist
  try {
    db.exec(`
      ALTER TABLE users ADD COLUMN email TEXT;
    `);
  } catch (e) {
    // Column already exists, ignore
  }

  try {
    db.exec(`
      ALTER TABLE users ADD COLUMN verification_code TEXT;
    `);
  } catch (e) {
    // Column already exists, ignore
  }

  try {
    db.exec(`
      ALTER TABLE users ADD COLUMN verification_expires INTEGER;
    `);
  } catch (e) {
    // Column already exists, ignore
  }

  try {
    db.exec(`
      ALTER TABLE users ADD COLUMN reset_token TEXT;
    `);
  } catch (e) {
    // Column already exists, ignore
  }

  try {
    db.exec(`
      ALTER TABLE users ADD COLUMN reset_token_expires INTEGER;
    `);
  } catch (e) {
    // Column already exists, ignore
  }

  // Blog posts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      excerpt TEXT,
      meta_description TEXT,
      author TEXT NOT NULL,
      author_linkedin TEXT,
      author_instagram TEXT,
      author_twitter TEXT,
      author_website TEXT,
      date TEXT NOT NULL,
      read_time TEXT,
      tags TEXT,
      featured_image_url TEXT,
      featured_image_alt TEXT,
      featured_image_credit TEXT,
      content TEXT NOT NULL,
      published BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add author social columns to existing blog_posts table (migration)
  try {
    db.exec(`ALTER TABLE blog_posts ADD COLUMN author_instagram TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }

  try {
    db.exec(`ALTER TABLE blog_posts ADD COLUMN author_twitter TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }

  try {
    db.exec(`ALTER TABLE blog_posts ADD COLUMN author_website TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Email logs table for tracking all email attempts
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL,
      status TEXT NOT NULL,
      error_message TEXT,
      message_id TEXT,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      smtp_configured INTEGER DEFAULT 0
    )
  `);

  // Analytics: User sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT UNIQUE NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      referrer TEXT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME,
      duration_seconds INTEGER
    )
  `);

  // Analytics: Usage statistics table
  db.exec(`
    CREATE TABLE IF NOT EXISTS usage_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      event_type TEXT NOT NULL,
      event_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE
    )
  `);

  // Analytics: Blog post views table
  db.exec(`
    CREATE TABLE IF NOT EXISTS blog_views (
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
    )
  `);

  // Migration: Add ON DELETE CASCADE to blog_views foreign key
  // This requires recreating the table since SQLite doesn't support ALTER for foreign keys
  try {
    // Check if the table exists and needs migration
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='blog_views'").get();
    
    if (tableExists) {
      const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='blog_views'").get();
      
      if (schema && schema.sql && !schema.sql.includes('ON DELETE CASCADE')) {
        console.log('🔄 Migrating blog_views table to add ON DELETE CASCADE...');
        
        // Get column info to preserve structure
        const columns = db.pragma('table_info(blog_views)');
        const columnNames = columns.map(c => c.name).join(', ');
        
        // Create backup table with all data
        db.exec(`CREATE TABLE IF NOT EXISTS blog_views_backup AS SELECT * FROM blog_views;`);
        const backupCount = db.prepare('SELECT COUNT(*) as count FROM blog_views_backup').get();
        console.log(`   Backed up ${backupCount?.count || 0} records`);
        
        // Drop old table
        db.exec('DROP TABLE blog_views;');
        console.log('   Dropped old blog_views table');
        
        // Recreate with ON DELETE CASCADE
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
        console.log('   Created new blog_views table with ON DELETE CASCADE');
        
        // Restore data if backup has records
        if (backupCount && backupCount.count > 0) {
          db.exec(`INSERT INTO blog_views (${columnNames}) SELECT ${columnNames} FROM blog_views_backup;`);
          const restoredCount = db.prepare('SELECT COUNT(*) as count FROM blog_views').get();
          console.log(`   Restored ${restoredCount?.count || 0} records`);
        }
        
        // Drop backup
        db.exec('DROP TABLE blog_views_backup;');
        console.log('✅ blog_views table migrated successfully');
      } else if (schema && schema.sql && schema.sql.includes('ON DELETE CASCADE')) {
        console.log('✅ blog_views table already has ON DELETE CASCADE');
      }
    } else {
      console.log('ℹ️  blog_views table does not exist yet (will be created with CASCADE)');
    }
  } catch (migrationError) {
    console.error('❌ Migration error:', migrationError.message);
    console.error('   Stack:', migrationError.stack);
    // If migration fails, the manual delete in the transaction will still work
  }

  // Add role and display_name columns to users table
  try {
    db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'admin'`);
  } catch (e) {
    // Column already exists, ignore
  }
  
  try {
    db.exec(`ALTER TABLE users ADD COLUMN display_name TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Password history table for preventing password reuse
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Audit logs table for tracking admin actions
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id INTEGER,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Contrast check results table for analytics
  db.exec(`
    CREATE TABLE IF NOT EXISTS contrast_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      foreground_color TEXT NOT NULL,
      background_color TEXT NOT NULL,
      contrast_ratio REAL NOT NULL,
      aa_normal_pass INTEGER DEFAULT 0,
      aa_large_pass INTEGER DEFAULT 0,
      aaa_normal_pass INTEGER DEFAULT 0,
      aaa_large_pass INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better query performance
  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON user_sessions(started_at)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_usage_stats_created_at ON usage_stats(created_at)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_usage_stats_event_type ON usage_stats(event_type)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_blog_views_post_id ON blog_views(post_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_blog_views_viewed_at ON blog_views(viewed_at)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_blog_views_slug ON blog_views(post_slug)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_contrast_checks_created_at ON contrast_checks(created_at)`);
  } catch (e) {
    // Indexes might already exist, ignore
  }

  // Create default admin user if it doesn't exist
  try {
    const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
    if (!adminExists) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      const result = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run('admin', hashedPassword);
      console.log('✅ Default admin user created: username=admin, password=admin123');
      console.log('⚠️  Please change the default password after first login!');
    } else {
      console.log('✅ Admin user already exists in database');
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}

// Blog post operations
export const blogPosts = {
  getAll: () => {
    return db.prepare('SELECT * FROM blog_posts ORDER BY date DESC').all();
  },

  getPublished: () => {
    // Only return posts explicitly marked as published (published = 1)
    // Exclude content field for better performance on listing page
    return db.prepare(`
      SELECT id, title, slug, excerpt, meta_description, author, author_linkedin,
             author_instagram, author_twitter, author_website,
             date, read_time, tags, featured_image_url, featured_image_alt,
             featured_image_credit, published
      FROM blog_posts 
      WHERE published = 1 
      ORDER BY date DESC
    `).all();
  },

  getBySlug: (slug) => {
    return db.prepare('SELECT * FROM blog_posts WHERE slug = ?').get(slug);
  },

  getById: (id) => {
    return db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(id);
  },

  create: (post) => {
    const stmt = db.prepare(`
      INSERT INTO blog_posts (
        title, slug, excerpt, meta_description, author, author_linkedin,
        author_instagram, author_twitter, author_website,
        date, read_time, tags, featured_image_url, featured_image_alt,
        featured_image_credit, content, published
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const tags = Array.isArray(post.tags) ? post.tags.join(',') : post.tags || '';
    
    return stmt.run(
      post.title,
      post.slug,
      post.excerpt || '',
      post.metaDescription || '',
      post.author,
      post.authorLinkedin || '',
      post.authorInstagram || '',
      post.authorTwitter || '',
      post.authorWebsite || '',
      post.date,
      post.readTime || '',
      tags,
      post.featuredImage?.url || '',
      post.featuredImage?.alt || '',
      post.featuredImage?.credit || '',
      post.content,
      post.published ? 1 : 0
    );
  },

  update: (id, post) => {
    const stmt = db.prepare(`
      UPDATE blog_posts SET
        title = ?, slug = ?, excerpt = ?, meta_description = ?,
        author = ?, author_linkedin = ?, author_instagram = ?,
        author_twitter = ?, author_website = ?, date = ?, read_time = ?,
        tags = ?, featured_image_url = ?, featured_image_alt = ?,
        featured_image_credit = ?, content = ?, published = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const tags = Array.isArray(post.tags) ? post.tags.join(',') : post.tags || '';
    
    return stmt.run(
      post.title,
      post.slug,
      post.excerpt || '',
      post.metaDescription || '',
      post.author,
      post.authorLinkedin || '',
      post.authorInstagram || '',
      post.authorTwitter || '',
      post.authorWebsite || '',
      post.date,
      post.readTime || '',
      tags,
      post.featuredImage?.url || '',
      post.featuredImage?.alt || '',
      post.featuredImage?.credit || '',
      post.content,
      post.published ? 1 : 0,
      id
    );
  },

  delete: (id) => {
    console.log('\n' + '='.repeat(80));
    console.log(`🗑️  [DATABASE] Starting delete operation for blog post ID: ${id}`);
    console.log('='.repeat(80));
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    
    // Check if post exists
    const post = db.prepare('SELECT id, slug, title FROM blog_posts WHERE id = ?').get(id);
    if (!post) {
      console.log(`❌ [DATABASE] Post with ID ${id} not found`);
      throw new Error(`Post with ID ${id} not found`);
    }
    console.log(`📄 [DATABASE] Post found: "${post.title}" (slug: ${post.slug})`);
    
    // Ensure foreign keys are enabled
    db.pragma('foreign_keys = ON');
    const fkStatus = db.pragma('foreign_keys');
    const fkEnabled = fkStatus === 1 || fkStatus === '1' || (Array.isArray(fkStatus) && fkStatus[0]?.foreign_keys === 1);
    console.log(`🔑 [DATABASE] Foreign keys enabled: ${fkEnabled}`);
    
    // Get all table schemas to understand the database structure
    console.log('\n📋 [DATABASE] Analyzing database schema...');
    const allTables = db.prepare(`
      SELECT name, sql 
      FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all();
    console.log(`   Found ${allTables.length} tables in database`);
    
    // Find all foreign keys pointing to blog_posts using PRAGMA
    console.log('\n🔍 [DATABASE] Finding all foreign keys pointing to blog_posts...');
    const foreignKeyRelations = [];
    
    for (const table of allTables) {
      try {
        const fkList = db.pragma(`foreign_key_list(${table.name})`);
        if (Array.isArray(fkList) && fkList.length > 0) {
          for (const fk of fkList) {
            if (fk.table === 'blog_posts') {
              foreignKeyRelations.push({
                table: table.name,
                from: fk.from,
                to: fk.to,
                on_delete: fk.on_delete || 'NO ACTION',
                on_update: fk.on_update || 'NO ACTION'
              });
              console.log(`   ✓ Found FK: ${table.name}.${fk.from} → blog_posts.${fk.to} (ON DELETE: ${fk.on_delete || 'NO ACTION'})`);
            }
          }
        }
      } catch (e) {
        // Table might not exist or might not have foreign keys
      }
    }
    
    if (foreignKeyRelations.length === 0) {
      console.log('   ⚠️  No foreign keys found using PRAGMA - checking manually...');
    }
    
    // Also check for tables that might reference blog_posts by convention
    // These are all the child tables that could block deletion
    const potentialRelatedTables = [
      { name: 'blog_views', column: 'post_id', query: 'SELECT COUNT(*) as count FROM blog_views WHERE post_id = ?', deleteQuery: 'DELETE FROM blog_views WHERE post_id = ?' },
      { name: 'post_tags', column: 'post_id', query: 'SELECT COUNT(*) as count FROM post_tags WHERE post_id = ?', deleteQuery: 'DELETE FROM post_tags WHERE post_id = ?' },
      { name: 'post_categories', column: 'post_id', query: 'SELECT COUNT(*) as count FROM post_categories WHERE post_id = ?', deleteQuery: 'DELETE FROM post_categories WHERE post_id = ?' },
      { name: 'post_views', column: 'post_id', query: 'SELECT COUNT(*) as count FROM post_views WHERE post_id = ?', deleteQuery: 'DELETE FROM post_views WHERE post_id = ?' },
      { name: 'post_revisions', column: 'post_id', query: 'SELECT COUNT(*) as count FROM post_revisions WHERE post_id = ?', deleteQuery: 'DELETE FROM post_revisions WHERE post_id = ?' },
      { name: 'revisions', column: 'post_id', query: 'SELECT COUNT(*) as count FROM revisions WHERE post_id = ?', deleteQuery: 'DELETE FROM revisions WHERE post_id = ?' },
      { name: 'post_files', column: 'post_id', query: 'SELECT COUNT(*) as count FROM post_files WHERE post_id = ?', deleteQuery: 'DELETE FROM post_files WHERE post_id = ?' },
      { name: 'seo_audit_logs', column: 'post_id', query: 'SELECT COUNT(*) as count FROM seo_audit_logs WHERE post_id = ?', deleteQuery: 'DELETE FROM seo_audit_logs WHERE post_id = ?' },
      { name: 'seo_logs', column: 'post_id', query: 'SELECT COUNT(*) as count FROM seo_logs WHERE post_id = ?', deleteQuery: 'DELETE FROM seo_logs WHERE post_id = ?' },
      { name: 'comments', column: 'post_id', query: 'SELECT COUNT(*) as count FROM comments WHERE post_id = ?', deleteQuery: 'DELETE FROM comments WHERE post_id = ?' },
      { name: 'media', column: 'post_id', query: 'SELECT COUNT(*) as count FROM media WHERE post_id = ?', deleteQuery: 'DELETE FROM media WHERE post_id = ?' },
      { name: 'post_media', column: 'post_id', query: 'SELECT COUNT(*) as count FROM post_media WHERE post_id = ?', deleteQuery: 'DELETE FROM post_media WHERE post_id = ?' },
    ];
    
    // Check audit_logs (uses resource_type and resource_id)
    potentialRelatedTables.push({
      name: 'audit_logs',
      column: 'resource_id',
      query: "SELECT COUNT(*) as count FROM audit_logs WHERE resource_type = 'blog_post' AND resource_id = ?",
      deleteQuery: "DELETE FROM audit_logs WHERE resource_type = 'blog_post' AND resource_id = ?",
      params: [String(id)]
    });
    
    // Check usage_stats (has postId in JSON event_data)
    potentialRelatedTables.push({
      name: 'usage_stats',
      column: 'event_data',
      query: 'SELECT COUNT(*) as count FROM usage_stats WHERE event_type = ? AND event_data LIKE ?',
      deleteQuery: 'DELETE FROM usage_stats WHERE event_type = ? AND event_data LIKE ?',
      params: ['blog_view', `%"postId":${id}%`]
    });
    
    console.log('\n🔍 [DATABASE] Checking for related records in all potential tables...');
    const relatedRecords = [];
    
    for (const tableInfo of potentialRelatedTables) {
      try {
        let count;
        if (tableInfo.params) {
          count = db.prepare(tableInfo.query).get(...tableInfo.params);
        } else {
          count = db.prepare(tableInfo.query).get(id);
        }
        const recordCount = count?.count || 0;
        if (recordCount > 0) {
          relatedRecords.push({
            table: tableInfo.name,
            column: tableInfo.column,
            count: recordCount,
            deleteQuery: tableInfo.deleteQuery,
            params: tableInfo.params
          });
          console.log(`   ⚠️  ${tableInfo.name}: ${recordCount} record(s) found`);
        } else {
          console.log(`   ✓ ${tableInfo.name}: 0 records`);
        }
      } catch (e) {
        // Table doesn't exist - that's fine
        console.log(`   ℹ️  ${tableInfo.name}: Table does not exist (${e.message})`);
      }
    }
    
    if (relatedRecords.length > 0) {
      console.log(`\n⚠️  [DATABASE] Found ${relatedRecords.length} table(s) with related records that need cleanup`);
    } else {
      console.log(`\n✅ [DATABASE] No related records found in child tables`);
    }
    
    // Use a transaction to delete related records and the post atomically
    const deleteTransaction = db.transaction((postId) => {
      console.log(`\n🔄 [DATABASE] Starting transaction for post ${postId}`);
      
      let stepNumber = 1;
      const deletedCounts = {};
      
      // Delete from all tables with foreign keys first
      for (const fkRel of foreignKeyRelations) {
        try {
          console.log(`\n📝 [DATABASE] Step ${stepNumber}: Deleting from ${fkRel.table}...`);
          const countBefore = db.prepare(`SELECT COUNT(*) as count FROM ${fkRel.table} WHERE ${fkRel.from} = ?`).get(postId);
          const count = countBefore?.count || 0;
          console.log(`   Query: SELECT COUNT(*) FROM ${fkRel.table} WHERE ${fkRel.from} = ${postId}`);
          console.log(`   Result: ${count} record(s) found`);
          
          if (count > 0) {
            const deleteStmt = db.prepare(`DELETE FROM ${fkRel.table} WHERE ${fkRel.from} = ?`);
            const result = deleteStmt.run(postId);
            console.log(`   SQL: DELETE FROM ${fkRel.table} WHERE ${fkRel.from} = ${postId}`);
            console.log(`   ✓ Deleted ${result.changes} record(s) from ${fkRel.table}`);
            deletedCounts[fkRel.table] = result.changes;
            
            if (result.changes !== count) {
              console.log(`   ⚠️  Warning: Expected ${count} but deleted ${result.changes}`);
            }
          } else {
            console.log(`   ℹ️  No records to delete from ${fkRel.table}`);
          }
          stepNumber++;
        } catch (e) {
          console.log(`   ❌ Error deleting from ${fkRel.table}: ${e.message}`);
          console.log(`   Stack: ${e.stack}`);
          // Continue with other tables
        }
      }
      
      // Delete from potential related tables (even if no FK constraint)
      for (const relRecord of relatedRecords) {
        try {
          console.log(`\n📝 [DATABASE] Step ${stepNumber}: Deleting from ${relRecord.table}...`);
          
          if (!relRecord.deleteQuery) {
            console.log(`   ⚠️  No delete query defined for ${relRecord.table}, skipping`);
            stepNumber++;
            continue;
          }
          
          let params;
          if (relRecord.params) {
            // Use the params from relRecord but replace the id in strings
            params = relRecord.params.map(p => {
              if (typeof p === 'string' && p.includes('postId')) {
                return p.replace(/\d+/, postId);
              }
              return p;
            });
          } else {
            params = [postId];
          }
          
          const countBefore = relRecord.count;
          console.log(`   Query: SELECT COUNT(*) FROM ${relRecord.table} WHERE ...`);
          console.log(`   Result: ${countBefore} record(s) found`);
          
          const deleteStmt = db.prepare(relRecord.deleteQuery);
          const result = deleteStmt.run(...params);
          console.log(`   SQL: ${relRecord.deleteQuery}`);
          console.log(`   Parameters: ${JSON.stringify(params)}`);
          console.log(`   ✓ Deleted ${result.changes} record(s) from ${relRecord.table}`);
          deletedCounts[relRecord.table] = result.changes;
          
          if (result.changes !== countBefore) {
            console.log(`   ⚠️  Warning: Expected ${countBefore} but deleted ${result.changes}`);
          }
          stepNumber++;
        } catch (e) {
          console.log(`   ❌ Error deleting from ${relRecord.table}: ${e.message}`);
          console.log(`   Stack: ${e.stack}`);
          // Continue with other tables
        }
      }
      
      // Also delete from all potential tables that exist (even if count was 0)
      // This ensures we clean up any tables that might have been missed
      for (const tableInfo of potentialRelatedTables) {
        // Skip if already processed
        if (relatedRecords.find(r => r.table === tableInfo.name)) {
          continue;
        }
        
        // Check if table exists and try to delete anyway (might have records we didn't catch)
        try {
          const tableExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(tableInfo.name);
          if (tableExists && tableInfo.deleteQuery) {
            console.log(`\n📝 [DATABASE] Step ${stepNumber}: Cleaning ${tableInfo.name} (preventive)...`);
            let params;
            if (tableInfo.params) {
              params = tableInfo.params.map(p => {
                if (typeof p === 'string' && p.includes('postId')) {
                  return p.replace(/\d+/, postId);
                }
                return p;
              });
            } else {
              params = [postId];
            }
            
            const deleteStmt = db.prepare(tableInfo.deleteQuery);
            const result = deleteStmt.run(...params);
            if (result.changes > 0) {
              console.log(`   ✓ Deleted ${result.changes} record(s) from ${tableInfo.name} (preventive cleanup)`);
              deletedCounts[tableInfo.name] = result.changes;
            }
            stepNumber++;
          }
        } catch (e) {
          // Table doesn't exist or error - that's fine
        }
      }
      
      // Final step: Delete the blog post itself
      console.log(`\n📝 [DATABASE] Step ${stepNumber}: Deleting blog post...`);
      try {
        // Double-check no related records remain
        let remainingRecords = 0;
        for (const fkRel of foreignKeyRelations) {
          try {
            const check = db.prepare(`SELECT COUNT(*) as count FROM ${fkRel.table} WHERE ${fkRel.from} = ?`).get(postId);
            if (check && check.count > 0) {
              remainingRecords += check.count;
              console.log(`   ⚠️  Warning: ${check.count} records still exist in ${fkRel.table}`);
            }
          } catch (e) {
            // Ignore
          }
        }
        
        if (remainingRecords > 0) {
          console.log(`   ⚠️  Warning: ${remainingRecords} related records still exist. Attempting to delete post anyway...`);
        }
        
        const postStmt = db.prepare('DELETE FROM blog_posts WHERE id = ?');
        console.log(`   SQL: DELETE FROM blog_posts WHERE id = ${postId}`);
        const result = postStmt.run(postId);
        console.log(`   ✓ Deleted blog post ${postId} (${result.changes} row(s) affected)`);
        
        if (result.changes === 0) {
          throw new Error(`No rows were deleted. Post ${postId} may not exist.`);
        }
        
        console.log(`\n✅ [DATABASE] Transaction completed successfully`);
        console.log(`   Post ID ${postId} deleted`);
        console.log(`   Related records deleted:`, deletedCounts);
        
        return result;
      } catch (e) {
        console.log(`   ❌ Error deleting post: ${e.message}`);
        console.log(`   Code: ${e.code || 'N/A'}`);
        console.log(`   Stack: ${e.stack}`);
        
        // If it's a foreign key error, provide detailed information
        if (e.message && e.message.includes('FOREIGN KEY')) {
          console.log(`   🔍 FOREIGN KEY CONSTRAINT FAILED`);
          console.log(`   This means there are still related records in child tables.`);
          console.log(`   Check the logs above to see which tables still have records.`);
          
          // Try to identify which table is causing the issue
          for (const fkRel of foreignKeyRelations) {
            try {
              const check = db.prepare(`SELECT COUNT(*) as count FROM ${fkRel.table} WHERE ${fkRel.from} = ?`).get(postId);
              if (check && check.count > 0) {
                console.log(`   ⚠️  ${fkRel.table} still has ${check.count} record(s) - this is likely the culprit!`);
              }
            } catch (e2) {
              // Ignore
            }
          }
        }
        
        throw e;
      }
    });
    
    try {
      console.log(`\n🚀 [DATABASE] Executing delete transaction...`);
      const result = deleteTransaction(id);
      console.log(`\n✅ [DATABASE] DELETE OPERATION COMPLETED SUCCESSFULLY`);
      console.log(`   Post ID: ${id}`);
      console.log(`   Post Title: "${post.title}"`);
      console.log(`   Post Slug: ${post.slug}`);
      console.log(`   Rows affected: ${result.changes}`);
      console.log(`   Timestamp: ${new Date().toISOString()}`);
      console.log('='.repeat(80) + '\n');
      return result;
    } catch (error) {
      console.error('\n❌ [DATABASE] Delete transaction failed');
      console.error(`   Post ID: ${id}`);
      console.error(`   Error: ${error.message}`);
      console.error(`   Code: ${error.code || 'N/A'}`);
      console.error(`   Stack: ${error.stack}`);
      console.error('='.repeat(80) + '\n');
      throw new Error(`Failed to delete post: ${error.message}`);
    }
  },

  // Delete all blog posts (for fresh start)
  deleteAll: () => {
    console.log('\n' + '='.repeat(80));
    console.log(`🗑️  [DATABASE] Starting delete all operation`);
    console.log('='.repeat(80));
    
    // Get count before deletion
    const countBefore = db.prepare('SELECT COUNT(*) as count FROM blog_posts').get();
    console.log(`📊 [DATABASE] Current blog posts count: ${countBefore?.count || 0}`);
    
    // Check foreign key status
    const fkStatus = db.pragma('foreign_keys');
    console.log(`🔑 [DATABASE] Foreign keys enabled: ${fkStatus === 1 || fkStatus === '1' || fkStatus?.[0]?.foreign_keys === 1}`);
    
    const deleteAllTransaction = db.transaction(() => {
      console.log(`\n🔄 [DATABASE] Starting delete all transaction...`);
      
      // Step 1: Delete all blog_views (will cascade if foreign keys are enabled)
      console.log(`\n📝 [DATABASE] Step 1: Deleting all blog_views...`);
      try {
        const viewsResult = db.prepare('DELETE FROM blog_views').run();
        console.log(`   SQL: DELETE FROM blog_views`);
        console.log(`   ✓ Deleted ${viewsResult.changes} blog_views records`);
      } catch (e) {
        console.log(`   ⚠️  Note: ${e.message}`);
      }
      
      // Step 2: Delete audit_logs related to blog posts
      console.log(`\n📝 [DATABASE] Step 2: Deleting blog_post audit_logs...`);
      try {
        const auditResult = db.prepare('DELETE FROM audit_logs WHERE resource_type = ?').run('blog_post');
        console.log(`   SQL: DELETE FROM audit_logs WHERE resource_type = 'blog_post'`);
        console.log(`   ✓ Deleted ${auditResult.changes} audit_logs records`);
      } catch (e) {
        console.log(`   ⚠️  Note: ${e.message}`);
      }
      
      // Step 3: Delete usage_stats related to blog views
      console.log(`\n📝 [DATABASE] Step 3: Deleting blog_view usage_stats...`);
      try {
        const usageResult = db.prepare('DELETE FROM usage_stats WHERE event_type = ?').run('blog_view');
        console.log(`   SQL: DELETE FROM usage_stats WHERE event_type = 'blog_view'`);
        console.log(`   ✓ Deleted ${usageResult.changes} usage_stats records`);
      } catch (e) {
        console.log(`   ⚠️  Note: ${e.message}`);
      }
      
      // Step 4: Delete all blog posts
      console.log(`\n📝 [DATABASE] Step 4: Deleting all blog_posts...`);
      const result = db.prepare('DELETE FROM blog_posts').run();
      console.log(`   SQL: DELETE FROM blog_posts`);
      console.log(`   ✓ Deleted ${result.changes} blog_posts records`);
      
      return result;
    });
    
    try {
      const result = deleteAllTransaction();
      console.log(`\n✅ [DATABASE] Delete all completed successfully`);
      console.log(`   Total posts deleted: ${result.changes}`);
      console.log('='.repeat(80) + '\n');
      return result;
    } catch (error) {
      console.error('\n❌ [DATABASE] Delete all failed');
      console.error(`   Error: ${error.message}`);
      console.error(`   Code: ${error.code || 'N/A'}`);
      console.error(`   Stack: ${error.stack}`);
      console.error('='.repeat(80) + '\n');
      throw new Error(`Failed to delete all posts: ${error.message}`);
    }
  },

  // Get all posts including unpublished ones (for admin)
  getAllForAdmin: () => {
    return db.prepare('SELECT * FROM blog_posts ORDER BY date DESC, id DESC').all();
  },

  // Upsert a post (for sync from static HTML)
  upsert: (post) => {
    const existing = db.prepare('SELECT id FROM blog_posts WHERE slug = ?').get(post.slug);
    
    if (existing) {
      // Update existing post
      const stmt = db.prepare(`
        UPDATE blog_posts SET
          title = ?, excerpt = ?, meta_description = ?,
          author = ?, author_linkedin = ?, author_instagram = ?,
          author_twitter = ?, author_website = ?, date = ?, read_time = ?,
          tags = ?, featured_image_url = ?, featured_image_alt = ?,
          featured_image_credit = ?, content = ?, published = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE slug = ?
      `);
      
      const tags = Array.isArray(post.tags) ? post.tags.join(',') : post.tags || '';
      
      stmt.run(
        post.title,
        post.excerpt || '',
        post.meta_description || post.metaDescription || '',
        post.author,
        post.author_linkedin || post.authorLinkedin || '',
        post.author_instagram || post.authorInstagram || '',
        post.author_twitter || post.authorTwitter || '',
        post.author_website || post.authorWebsite || '',
        post.date,
        post.read_time || post.readTime || '',
        tags,
        post.featured_image_url || post.featuredImage?.url || '',
        post.featured_image_alt || post.featuredImage?.alt || '',
        post.featured_image_credit || post.featuredImage?.credit || '',
        post.content,
        post.published ? 1 : 0,
        post.slug
      );
      
      return { id: existing.id, changes: 1, action: 'updated' };
    } else {
      // Insert new post
      const stmt = db.prepare(`
        INSERT INTO blog_posts (
          title, slug, excerpt, meta_description, author, author_linkedin,
          author_instagram, author_twitter, author_website,
          date, read_time, tags, featured_image_url, featured_image_alt,
          featured_image_credit, content, published
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const tags = Array.isArray(post.tags) ? post.tags.join(',') : post.tags || '';
      
      const result = stmt.run(
        post.title,
        post.slug,
        post.excerpt || '',
        post.meta_description || post.metaDescription || '',
        post.author,
        post.author_linkedin || post.authorLinkedin || '',
        post.author_instagram || post.authorInstagram || '',
        post.author_twitter || post.authorTwitter || '',
        post.author_website || post.authorWebsite || '',
        post.date,
        post.read_time || post.readTime || '',
        tags,
        post.featured_image_url || post.featuredImage?.url || '',
        post.featured_image_alt || post.featuredImage?.alt || '',
        post.featured_image_credit || post.featuredImage?.credit || '',
        post.content,
        post.published ? 1 : 0
      );
      
      return { id: result.lastInsertRowid, changes: 1, action: 'created' };
    }
  }
};

// Helper for updating security-related fields on users
export const securityUsers = {
  setVerificationCode: (userId, code, expiresAt) => {
    return db
      .prepare(
        'UPDATE users SET verification_code = ?, verification_expires = ? WHERE id = ?'
      )
      .run(code, expiresAt, userId);
  },

  clearVerificationCode: (userId) => {
    return db
      .prepare(
        'UPDATE users SET verification_code = NULL, verification_expires = NULL WHERE id = ?'
      )
      .run(userId);
  },

  setResetToken: (userId, token, expiresAt) => {
    return db
      .prepare(
        'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?'
      )
      .run(token, expiresAt, userId);
  },

  clearResetToken: (userId) => {
    return db
      .prepare(
        'UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = ?'
      )
      .run(userId);
  },

  updatePassword: (userId, newPasswordHash) => {
    return db
      .prepare('UPDATE users SET password = ? WHERE id = ?')
      .run(newPasswordHash, userId);
  },
};

// User operations
export const users = {
  findByUsername: (username) => {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  },

  verifyPassword: (password, hash) => {
    return bcrypt.compareSync(password, hash);
  },
  
  incrementLoginAttempts: (userId, lockUntil) => {
    // Only lock if lockUntil is provided and > 0
    if (lockUntil && lockUntil > 0) {
      return db.prepare('UPDATE users SET login_attempts = login_attempts + 1, locked_until = ? WHERE id = ?')
        .run(lockUntil, userId);
    } else {
      // Just increment attempts without locking
      return db.prepare('UPDATE users SET login_attempts = login_attempts + 1 WHERE id = ?')
        .run(userId);
    }
  },
  
  resetLoginAttempts: (userId) => {
    return db.prepare('UPDATE users SET login_attempts = 0, locked_until = 0 WHERE id = ?')
      .run(userId);
  },
  
  updateUsername: (userId, newUsername) => {
    return db.prepare('UPDATE users SET username = ? WHERE id = ?')
      .run(newUsername, userId);
  },
  
  updateEmail: (userId, newEmail) => {
    return db.prepare('UPDATE users SET email = ? WHERE id = ?')
      .run(newEmail, userId);
  },

  updateDisplayName: (userId, displayName) => {
    return db.prepare('UPDATE users SET display_name = ? WHERE id = ?')
      .run(displayName, userId);
  },

  findById: (userId) => {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  },

  getAll: () => {
    return db.prepare('SELECT id, username, email, display_name, role, created_at FROM users ORDER BY created_at DESC').all();
  },

  create: (username, passwordHash, email = null, role = 'admin') => {
    const sanitizedUsername = username.trim().toLowerCase();
    return db.prepare('INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)')
      .run(sanitizedUsername, passwordHash, email, role);
  },

  updateRole: (userId, role) => {
    return db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
  },

  delete: (userId) => {
    return db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  }
};

// Email logging operations
export const emailLogs = {
  logEmail: (recipient, subject, status, errorMessage = null, messageId = null, smtpConfigured = false) => {
    try {
      const stmt = db.prepare(`
        INSERT INTO email_logs (recipient, subject, status, error_message, message_id, smtp_configured)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      return stmt.run(recipient, subject, status, errorMessage, messageId, smtpConfigured ? 1 : 0);
    } catch (error) {
      console.error('❌ Error logging email to database:', error);
      // Don't throw - email logging failure shouldn't break email sending
      return null;
    }
  },

  getAll: (limit = 100) => {
    try {
      return db.prepare('SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT ?').all(limit);
    } catch (error) {
      console.error('❌ Error retrieving email logs:', error);
      return [];
    }
  },

  getByRecipient: (recipient, limit = 50) => {
    try {
      return db.prepare('SELECT * FROM email_logs WHERE recipient = ? ORDER BY sent_at DESC LIMIT ?').all(recipient, limit);
    } catch (error) {
      console.error('❌ Error retrieving email logs by recipient:', error);
      return [];
    }
  },

  getFailed: (limit = 50) => {
    try {
      return db.prepare("SELECT * FROM email_logs WHERE status = 'failed' ORDER BY sent_at DESC LIMIT ?").all(limit);
    } catch (error) {
      console.error('❌ Error retrieving failed email logs:', error);
      return [];
    }
  }
};

// Analytics operations
export const analytics = {
  // Session tracking
  createSession: (sessionId, ipAddress, userAgent, referrer) => {
    try {
      const stmt = db.prepare(`
        INSERT INTO user_sessions (session_id, ip_address, user_agent, referrer)
        VALUES (?, ?, ?, ?)
      `);
      return stmt.run(sessionId, ipAddress, userAgent, referrer);
    } catch (error) {
      console.error('❌ Error creating session:', error);
      return null;
    }
  },

  updateSessionActivity: (sessionId) => {
    try {
      const stmt = db.prepare(`
        UPDATE user_sessions 
        SET last_activity = CURRENT_TIMESTAMP 
        WHERE session_id = ?
      `);
      return stmt.run(sessionId);
    } catch (error) {
      console.error('❌ Error updating session activity:', error);
      return null;
    }
  },

  endSession: (sessionId, durationSeconds) => {
    try {
      const stmt = db.prepare(`
        UPDATE user_sessions 
        SET ended_at = CURRENT_TIMESTAMP, duration_seconds = ?
        WHERE session_id = ?
      `);
      return stmt.run(durationSeconds, sessionId);
    } catch (error) {
      console.error('❌ Error ending session:', error);
      return null;
    }
  },

  getActiveSessions: (minutes = 5) => {
    try {
      const stmt = db.prepare(`
        SELECT COUNT(*) as count 
        FROM user_sessions 
        WHERE last_activity >= datetime('now', '-' || ? || ' minutes')
        AND (ended_at IS NULL OR ended_at = '')
      `);
      return stmt.get(minutes);
    } catch (error) {
      console.error('❌ Error getting active sessions:', error);
      return { count: 0 };
    }
  },

  // Usage statistics
  logUsageEvent: (sessionId, eventType, eventData = null) => {
    // PRODUCTION-SAFE: This function must NEVER throw or block requests
    // All errors are logged but do not propagate
    try {
      // Validate inputs
      if (!eventType) {
        console.warn('⚠️  logUsageEvent: eventType is required');
        return null;
      }

      // Ensure session exists before logging (foreign key constraint requirement)
      // Use a transaction to avoid race conditions
      if (sessionId) {
        try {
          // Use INSERT OR IGNORE to handle race conditions gracefully
          // This ensures session exists without throwing on duplicate
          db.prepare(`
            INSERT OR IGNORE INTO user_sessions (session_id, started_at, last_activity)
            VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `).run(sessionId);
          
          // Verify session exists (might have been created by another request)
          const sessionCheck = db.prepare(`
            SELECT session_id FROM user_sessions WHERE session_id = ?
          `).get(sessionId);
          
          // If session still doesn't exist after insert, something is wrong
          // But don't throw - just log with NULL session_id
          if (!sessionCheck) {
            console.warn('⚠️  Session creation failed or was deleted immediately:', {
              sessionId,
              eventType,
              note: 'Logging with NULL session_id'
            });
            sessionId = null; // Use NULL for the insert
          }
        } catch (sessionError) {
          // Session creation/verification failed - log with NULL session_id
          console.warn('⚠️  Could not ensure session exists for usage event:', {
            sessionId,
            eventType,
            error: sessionError.message,
            code: sessionError.code,
            note: 'Logging with NULL session_id'
          });
          sessionId = null; // Use NULL for the insert
        }
      }
      
      // Insert usage event (with sessionId or NULL)
      try {
        const stmt = db.prepare(`
          INSERT INTO usage_stats (session_id, event_type, event_data)
          VALUES (?, ?, ?)
        `);
        const result = stmt.run(
          sessionId || null, 
          eventType, 
          eventData ? JSON.stringify(eventData) : null
        );
        
        // Log successful insert for debugging (only in development or with verbose flag)
        if (process.env.VERBOSE_LOGGING === 'true') {
          console.log('✅ Usage event logged:', {
            sessionId: sessionId || 'NULL',
            eventType,
            insertId: result.lastInsertRowid
          });
        }
        
        return result;
      } catch (insertError) {
        // Foreign key constraint failure or other insert error
        if (insertError.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
          // Session was deleted between check and insert - try with NULL
          if (sessionId) {
            console.warn('⚠️  Foreign key constraint failed (session deleted?), retrying with NULL:', {
              originalSessionId: sessionId,
              eventType,
              error: insertError.message
            });
            
            try {
              const stmt = db.prepare(`
                INSERT INTO usage_stats (session_id, event_type, event_data)
                VALUES (NULL, ?, ?)
              `);
              return stmt.run(eventType, eventData ? JSON.stringify(eventData) : null);
            } catch (fallbackError) {
              // Even NULL failed - schema might not allow NULL, or other constraint issue
              console.error('❌ Error logging usage event (NULL session_id also failed):', {
                eventType,
                error: fallbackError.message,
                code: fallbackError.code,
                note: 'Usage event not logged - this is non-blocking'
              });
              return null;
            }
          } else {
            // Already trying with NULL and it failed - this shouldn't happen
            console.error('❌ Foreign key constraint failed with NULL session_id:', {
              eventType,
              error: insertError.message,
              code: insertError.code,
              note: 'Check usage_stats table schema - session_id might be required'
            });
            return null;
          }
        } else {
          // Other database error (not foreign key constraint)
          console.error('❌ Error inserting usage event:', {
            sessionId: sessionId || 'NULL',
            eventType,
            error: insertError.message,
            code: insertError.code,
            note: 'Usage event not logged - this is non-blocking'
          });
          return null;
        }
      }
    } catch (error) {
      // Catch-all for any unexpected errors
      console.error('❌ Unexpected error in logUsageEvent:', {
        sessionId,
        eventType,
        error: error.message,
        code: error.code,
        stack: error.stack,
        note: 'Usage event not logged - this is non-blocking'
      });
      return null; // Always return null on error, never throw
    }
  },

  getUsageStats: (startDate, endDate) => {
    try {
      const stmt = db.prepare(`
        SELECT 
          DATE(created_at) as date,
          event_type,
          COUNT(*) as count
        FROM usage_stats
        WHERE created_at >= ? AND created_at <= ?
        GROUP BY DATE(created_at), event_type
        ORDER BY date ASC
      `);
      return stmt.all(startDate, endDate);
    } catch (error) {
      console.error('❌ Error getting usage stats:', error);
      return [];
    }
  },

  getUsageSummary: (startDate, endDate) => {
    try {
      const contrastChecks = db.prepare(`
        SELECT COUNT(*) as count 
        FROM usage_stats 
        WHERE event_type = 'contrast_check' 
        AND created_at >= ? AND created_at <= ?
      `).get(startDate, endDate);

      const aiSuggestions = db.prepare(`
        SELECT COUNT(*) as count 
        FROM usage_stats 
        WHERE event_type = 'ai_suggestion' 
        AND created_at >= ? AND created_at <= ?
      `).get(startDate, endDate);

      const totalSessions = db.prepare(`
        SELECT COUNT(DISTINCT session_id) as count 
        FROM user_sessions 
        WHERE started_at >= ? AND started_at <= ?
      `).get(startDate, endDate);

      return {
        contrastChecks: contrastChecks?.count || 0,
        aiSuggestions: aiSuggestions?.count || 0,
        totalSessions: totalSessions?.count || 0
      };
    } catch (error) {
      console.error('❌ Error getting usage summary:', error);
      return { contrastChecks: 0, aiSuggestions: 0, totalSessions: 0 };
    }
  },

  // Blog analytics
  logBlogView: (postId, postSlug, sessionId, ipAddress, referrer) => {
    try {
      const stmt = db.prepare(`
        INSERT INTO blog_views (post_id, post_slug, session_id, ip_address, referrer)
        VALUES (?, ?, ?, ?, ?)
      `);
      return stmt.run(postId, postSlug, sessionId, ipAddress, referrer);
    } catch (error) {
      console.error('❌ Error logging blog view:', error);
      return null;
    }
  },

  updateBlogReadTime: (viewId, readDurationSeconds, scrollDepth) => {
    try {
      const stmt = db.prepare(`
        UPDATE blog_views 
        SET read_duration_seconds = ?, scroll_depth = ?
        WHERE id = ?
      `);
      return stmt.run(readDurationSeconds, scrollDepth, viewId);
    } catch (error) {
      console.error('❌ Error updating blog read time:', error);
      return null;
    }
  },

  getBlogPerformance: (startDate, endDate, sortBy = 'views') => {
    try {
      let orderBy = 'total_views DESC';
      if (sortBy === 'read_time') {
        orderBy = 'avg_read_time DESC';
      } else if (sortBy === 'recent') {
        orderBy = 'last_viewed DESC';
      }

      const stmt = db.prepare(`
        SELECT 
          bv.post_id,
          bv.post_slug,
          bp.title,
          COUNT(*) as total_views,
          COUNT(DISTINCT bv.session_id) as unique_views,
          AVG(bv.read_duration_seconds) as avg_read_time,
          AVG(bv.scroll_depth) as avg_scroll_depth,
          MAX(bv.viewed_at) as last_viewed,
          COUNT(CASE WHEN bv.referrer LIKE '%/blog%' OR bv.referrer LIKE '%/blog/%' THEN 1 END) as internal_clicks
        FROM blog_views bv
        LEFT JOIN blog_posts bp ON bv.post_id = bp.id
        WHERE bv.viewed_at >= ? AND bv.viewed_at <= ?
        GROUP BY bv.post_id, bv.post_slug, bp.title
        ORDER BY ${orderBy}
      `);
      return stmt.all(startDate, endDate);
    } catch (error) {
      console.error('❌ Error getting blog performance:', error);
      return [];
    }
  },

  getBlogViewsByDateRange: (postId, startDate, endDate) => {
    try {
      const stmt = db.prepare(`
        SELECT 
          DATE(viewed_at) as date,
          COUNT(*) as views
        FROM blog_views
        WHERE post_id = ? AND viewed_at >= ? AND viewed_at <= ?
        GROUP BY DATE(viewed_at)
        ORDER BY date ASC
      `);
      return stmt.all(postId, startDate, endDate);
    } catch (error) {
      console.error('❌ Error getting blog views by date range:', error);
      return [];
    }
  },

  getSessionsByDateRange: (startDate, endDate) => {
    try {
      const stmt = db.prepare(`
        SELECT 
          DATE(started_at) as date,
          COUNT(DISTINCT session_id) as unique_sessions
        FROM user_sessions
        WHERE started_at >= ? AND started_at <= ?
        GROUP BY DATE(started_at)
        ORDER BY date ASC
      `);
      return stmt.all(startDate, endDate);
    } catch (error) {
      console.error('❌ Error getting sessions by date range:', error);
      return [];
    }
  }
};

// Password history operations
export const passwordHistory = {
  add: (userId, passwordHash) => {
    try {
      const stmt = db.prepare(`
        INSERT INTO password_history (user_id, password_hash)
        VALUES (?, ?)
      `);
      return stmt.run(userId, passwordHash);
    } catch (error) {
      console.error('❌ Error adding password to history:', error);
      return null;
    }
  },

  getRecent: (userId, limit = 5) => {
    try {
      const stmt = db.prepare(`
        SELECT password_hash 
        FROM password_history 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `);
      return stmt.all(userId, limit);
    } catch (error) {
      console.error('❌ Error getting password history:', error);
      return [];
    }
  }
};

// Audit log operations
export const auditLogs = {
  log: (userId, username, action, resourceType = null, resourceId = null, details = null, ipAddress = null, userAgent = null) => {
    try {
      const stmt = db.prepare(`
        INSERT INTO audit_logs (user_id, username, action, resource_type, resource_id, details, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      return stmt.run(userId, username, action, resourceType, resourceId, details, ipAddress, userAgent);
    } catch (error) {
      console.error('❌ Error logging audit event:', error);
      return null;
    }
  },

  get: (filters = {}) => {
    try {
      let query = 'SELECT * FROM audit_logs WHERE 1=1';
      const params = [];

      if (filters.userId) {
        query += ' AND user_id = ?';
        params.push(filters.userId);
      }

      if (filters.username) {
        query += ' AND username = ?';
        params.push(filters.username);
      }

      if (filters.action) {
        query += ' AND action = ?';
        params.push(filters.action);
      }

      if (filters.startDate) {
        query += ' AND created_at >= ?';
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ' AND created_at <= ?';
        params.push(filters.endDate);
      }

      query += ' ORDER BY created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      } else {
        query += ' LIMIT 100';
      }

      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }

      const stmt = db.prepare(query);
      return stmt.all(...params);
    } catch (error) {
      console.error('❌ Error getting audit logs:', error);
      return [];
    }
  }
};

// Contrast checks operations
export const contrastChecks = {
  log: (sessionId, foregroundColor, backgroundColor, contrastRatio, aaNormalPass, aaLargePass, aaaNormalPass, aaaLargePass) => {
    try {
      const stmt = db.prepare(`
        INSERT INTO contrast_checks (session_id, foreground_color, background_color, contrast_ratio, aa_normal_pass, aa_large_pass, aaa_normal_pass, aaa_large_pass)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      return stmt.run(sessionId, foregroundColor, backgroundColor, contrastRatio, aaNormalPass, aaLargePass, aaaNormalPass, aaaLargePass);
    } catch (error) {
      console.error('❌ Error logging contrast check:', error);
      return null;
    }
  },

  getStats: (startDate, endDate) => {
    try {
      const total = db.prepare(`
        SELECT COUNT(*) as count 
        FROM contrast_checks 
        WHERE created_at >= ? AND created_at <= ?
      `).get(startDate, endDate);

      const avgRatio = db.prepare(`
        SELECT AVG(contrast_ratio) as avg 
        FROM contrast_checks 
        WHERE created_at >= ? AND created_at <= ?
      `).get(startDate, endDate);

      const passFail = db.prepare(`
        SELECT 
          SUM(CASE WHEN aa_normal_pass = 1 THEN 1 ELSE 0 END) as aa_pass,
          SUM(CASE WHEN aa_normal_pass = 0 THEN 1 ELSE 0 END) as aa_fail,
          SUM(CASE WHEN aaa_normal_pass = 1 THEN 1 ELSE 0 END) as aaa_pass,
          SUM(CASE WHEN aaa_normal_pass = 0 THEN 1 ELSE 0 END) as aaa_fail
        FROM contrast_checks 
        WHERE created_at >= ? AND created_at <= ?
      `).get(startDate, endDate);

      const topPairs = db.prepare(`
        SELECT 
          foreground_color || ' / ' || background_color as color_pair,
          COUNT(*) as count
        FROM contrast_checks 
        WHERE created_at >= ? AND created_at <= ?
        GROUP BY foreground_color, background_color
        ORDER BY count DESC
        LIMIT 10
      `).all(startDate, endDate);

      return {
        total: total?.count || 0,
        avgContrastRatio: avgRatio?.avg || 0,
        passFail: passFail || { aa_pass: 0, aa_fail: 0, aaa_pass: 0, aaa_fail: 0 },
        topPairs: topPairs || []
      };
    } catch (error) {
      console.error('❌ Error getting contrast check stats:', error);
      return { total: 0, avgContrastRatio: 0, passFail: { aa_pass: 0, aa_fail: 0, aaa_pass: 0, aaa_fail: 0 }, topPairs: [] };
    }
  }
};

// Export function to close database gracefully
export function closeDatabase() {
  try {
    if (db && typeof db.close === 'function') {
      db.close();
      console.log('✅ Database connection closed');
      return true;
    }
  } catch (error) {
    console.error('❌ Error closing database:', error.message);
    return false;
  }
  return false;
}

export default db;

