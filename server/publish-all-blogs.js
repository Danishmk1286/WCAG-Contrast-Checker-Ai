import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'cms.db'));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('📊 Publishing All Blog Posts\n');
console.log('='.repeat(60));

// Get all draft posts
const draftPosts = db.prepare('SELECT id, title, published FROM blog_posts WHERE published = 0 OR published IS NULL').all();

if (draftPosts.length === 0) {
  console.log('✅ All posts are already published!');
  db.close();
  process.exit(0);
}

console.log(`\nFound ${draftPosts.length} draft post(s):\n`);
draftPosts.forEach(post => {
  console.log(`  - ID ${post.id}: ${post.title}`);
});

console.log('\n⚠️  This will publish ALL draft posts.');
rl.question('Do you want to continue? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    const stmt = db.prepare('UPDATE blog_posts SET published = 1 WHERE published = 0 OR published IS NULL');
    const result = stmt.run();
    
    console.log(`\n✅ Successfully published ${result.changes} post(s)!`);
    console.log('\n💡 Your blog posts should now be visible on the website.');
  } else {
    console.log('\n❌ Operation cancelled.');
  }
  
  db.close();
  rl.close();
  process.exit(0);
});



