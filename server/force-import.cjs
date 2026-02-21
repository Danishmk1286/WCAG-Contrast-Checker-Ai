/**
 * Force Import Blogs (CommonJS version)
 * This script forces import of all blogs from blog_export.json into the database
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../private/cms.db');
const exportPath = path.join(__dirname, 'blog_export.json');

console.log('═══════════════════════════════════════════════════════════');
console.log('📚 FORCE BLOG IMPORT');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('Database:', dbPath);
console.log('Export file:', exportPath);
console.log('');

// Check if files exist
if (!fs.existsSync(dbPath)) {
  console.log('❌ Database not found at:', dbPath);
  process.exit(1);
}

if (!fs.existsSync(exportPath)) {
  console.log('❌ Export file not found at:', exportPath);
  process.exit(1);
}

// Open database
const db = new Database(dbPath);
console.log('✅ Database opened');

// Create blog_posts table if it doesn't exist
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
console.log('✅ Blog posts table ready');

// Check existing posts
const existingPosts = db.prepare('SELECT id, title, published FROM blog_posts').all();
console.log('');
console.log('Current posts in database:', existingPosts.length);
existingPosts.forEach(p => {
  console.log(`  [${p.published ? '✅' : '📝'}] ${p.title}`);
});

// Load export file
const posts = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
console.log('');
console.log('Posts in export file:', posts.length);

// Prepare insert/update statement
const upsertStmt = db.prepare(`
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

// Import each post
console.log('');
console.log('Importing posts...');
const transaction = db.transaction(() => {
  for (const post of posts) {
    upsertStmt.run({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      meta_description: post.meta_description || '',
      author: post.author || 'Admin',
      author_linkedin: post.author_linkedin || '',
      date: post.date,
      read_time: post.read_time || '5 min read',
      tags: post.tags || '',
      featured_image_url: post.featured_image_url || '',
      featured_image_alt: post.featured_image_alt || '',
      featured_image_credit: post.featured_image_credit || '',
      content: post.content,
      published: post.published === 1 || post.published === true ? 1 : 0,
      created_at: post.created_at || new Date().toISOString(),
      updated_at: post.updated_at || new Date().toISOString()
    });
    console.log(`  ✅ ${post.title}`);
  }
});

transaction();

// Verify
console.log('');
console.log('Verifying...');
const afterPosts = db.prepare('SELECT id, title, published FROM blog_posts').all();
console.log('Posts in database now:', afterPosts.length);
afterPosts.forEach(p => {
  console.log(`  [${p.published ? '✅ Published' : '📝 Draft'}] ${p.title}`);
});

db.close();

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('✅ IMPORT COMPLETE');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('Next steps:');
console.log('  1. Start the server: cd server && node server.js');
console.log('  2. Open admin panel at http://localhost:3002/admin');
console.log('  3. All posts should now appear in the Blog Posts section');
console.log('');
