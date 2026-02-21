const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../private/cms.db');
const db = new Database(dbPath);

const posts = db.prepare('SELECT id, title, slug, published FROM blog_posts ORDER BY id').all();

let output = 'Database Check Results\n';
output += '═══════════════════════════════════════\n\n';
output += `Database: ${dbPath}\n`;
output += `Total posts: ${posts.length}\n\n`;

if (posts.length === 0) {
  output += 'No posts found in database!\n';
} else {
  posts.forEach((p, i) => {
    output += `${i+1}. [${p.published ? 'Published' : 'Draft'}] ${p.title}\n`;
    output += `   Slug: ${p.slug}\n\n`;
  });
}

db.close();

fs.writeFileSync(path.join(__dirname, 'db-check-result.txt'), output);
console.log(output);
