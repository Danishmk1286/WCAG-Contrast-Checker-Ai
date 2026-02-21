#!/usr/bin/env node
/**
 * Sync Blog Posts Script
 * Imports blog posts from blog_export.json into the database
 * Run this on cPanel after deployment to ensure posts are in the database
 * 
 * Usage: node sync-blogs-to-db.js
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📦 Blog Sync Script');
console.log('='.repeat(50));

// Find database - check multiple locations
const possiblePaths = [
  path.resolve(__dirname, '../private/cms.db'),
  path.resolve(__dirname, 'cms.db'),
  path.resolve(__dirname, '../../private/cms.db'),
];

let dbPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    dbPath = p;
    break;
  }
}

if (!dbPath) {
  // Create in private if it exists, otherwise in server folder
  const privateDir = path.resolve(__dirname, '../private');
  if (fs.existsSync(privateDir)) {
    dbPath = path.join(privateDir, 'cms.db');
  } else {
    dbPath = path.join(__dirname, 'cms.db');
  }
  console.log(`📁 Database will be created at: ${dbPath}`);
}

console.log(`📂 Using database: ${dbPath}`);

let db;
try {
  db = new Database(dbPath);

  // Ensure blog_posts table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      excerpt TEXT,
      meta_description TEXT,
      author TEXT NOT NULL,
      author_linkedin TEXT,
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

  // Check for export file
  const importPath = path.join(__dirname, 'blog_export.json');
  if (!fs.existsSync(importPath)) {
    console.error('❌ blog_export.json not found at:', importPath);
    console.log('   Create this file with your blog posts or export from admin panel.');
    process.exit(1);
  }

  const posts = JSON.parse(fs.readFileSync(importPath, 'utf8'));
  console.log(`📄 Found ${posts.length} posts in blog_export.json`);

  // Check existing posts
  const existingPosts = db.prepare('SELECT id, slug FROM blog_posts').all();
  console.log(`📊 Existing posts in database: ${existingPosts.length}`);

  // Insert or update posts
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO blog_posts (
      id, title, slug, excerpt, meta_description, author, author_linkedin,
      date, read_time, tags, featured_image_url, featured_image_alt,
      featured_image_credit, content, published, created_at, updated_at
    ) VALUES (
      @id, @title, @slug, @excerpt, @meta_description, @author, @author_linkedin,
      @date, @read_time, @tags, @featured_image_url, @featured_image_alt,
      @featured_image_credit, @content, @published, @created_at, @updated_at
    )
  `);

  const transaction = db.transaction((posts) => {
    for (const post of posts) {
      insertStmt.run(post);
      console.log(`   ✅ Synced: ${post.title} (published: ${post.published})`);
    }
  });

  transaction(posts);

  // Verify
  const finalPosts = db.prepare('SELECT id, title, published FROM blog_posts').all();
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Sync complete! Total posts in database: ${finalPosts.length}`);
  
  const published = finalPosts.filter(p => p.published === 1).length;
  const drafts = finalPosts.filter(p => p.published !== 1).length;
  console.log(`   📗 Published: ${published}`);
  console.log(`   📝 Drafts: ${drafts}`);

  if (drafts > 0) {
    console.log('\n⚠️  Some posts are not published. Run:');
    console.log('   node publish-all-blogs.js');
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
} finally {
  if (db) db.close();
}
