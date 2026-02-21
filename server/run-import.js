import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const log = [];
const logMsg = (msg) => {
  log.push(msg);
  console.log(msg);
};

// Use private directory if available, otherwise current directory
const privateDir = path.resolve(__dirname, '../private');
const dbPath = fs.existsSync(privateDir)
    ? path.join(privateDir, 'cms.db')
    : path.join(__dirname, 'cms.db');

logMsg(`Using database at: ${dbPath}`);
logMsg(`Database exists: ${fs.existsSync(dbPath)}`);

let db;
try {
    db = new Database(dbPath);
    const importPath = path.join(__dirname, 'blog_export.json');

    if (!fs.existsSync(importPath)) {
        logMsg('❌ blog_export.json not found!');
        process.exit(1);
    }

    const posts = JSON.parse(fs.readFileSync(importPath, 'utf8'));
    logMsg(`📦 Found ${posts.length} posts to import...`);

    // First check existing posts
    const existingPosts = db.prepare('SELECT id, title FROM blog_posts').all();
    logMsg(`Existing posts in DB: ${existingPosts.length}`);

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
            logMsg(`   ✅ Imported: ${post.title}`);
        }
    });

    transaction(posts);
    
    // Verify
    const afterPosts = db.prepare('SELECT id, title, published FROM blog_posts').all();
    logMsg(`\n✅ Import completed! Posts in DB: ${afterPosts.length}`);
    afterPosts.forEach(p => logMsg(`   - ${p.title} (published: ${p.published})`));

} catch (error) {
    logMsg(`❌ Error: ${error.message}`);
    logMsg(error.stack);
} finally {
    if (db) db.close();
}

// Write log to file
fs.writeFileSync(path.join(__dirname, 'import-log.txt'), log.join('\n'));
