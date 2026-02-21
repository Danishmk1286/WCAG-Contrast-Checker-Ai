import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../private/cms.db');
const exportPath = path.join(__dirname, 'blog_export.json');

console.log('Database path:', dbPath);
console.log('Export path:', exportPath);
console.log('DB exists:', fs.existsSync(dbPath));
console.log('Export exists:', fs.existsSync(exportPath));

const db = new Database(dbPath);

// Check current posts
const existing = db.prepare('SELECT id, title, published FROM blog_posts').all();
console.log('\nExisting posts:', existing.length);
existing.forEach(p => console.log(`  - [${p.id}] ${p.title} (published: ${p.published})`));

// Import from export file
const posts = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
console.log('\nPosts in export file:', posts.length);

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
    console.log(`  Imported: ${post.title}`);
  }
});

transaction(posts);

// Verify
const after = db.prepare('SELECT id, title, published FROM blog_posts').all();
console.log('\nAfter import:', after.length, 'posts');
after.forEach(p => console.log(`  - [${p.id}] ${p.title} (published: ${p.published})`));

db.close();
console.log('\n✅ Done!');
