import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use private directory if available, otherwise current directory
const privateDir = path.resolve(__dirname, '../private');
const dbPath = fs.existsSync(privateDir)
    ? path.join(privateDir, 'cms.db')
    : path.join(__dirname, 'cms.db');

console.log(`Using database at: ${dbPath}`);
const db = new Database(dbPath);

try {
    const importPath = path.join(__dirname, 'blog_export.json');

    if (!fs.existsSync(importPath)) {
        console.error('❌ blog_export.json not found!');
        process.exit(1);
    }

    const posts = JSON.parse(fs.readFileSync(importPath, 'utf8'));
    console.log(`📦 Found ${posts.length} posts to import...`);

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
            console.log(`   Imported: ${post.title}`);
        }
    });

    transaction(posts);
    console.log('✅ Import completed successfully!');

} catch (error) {
    console.error('❌ Error importing database:', error);
} finally {
    db.close();
}
