import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'cms.db'));

console.log('📊 Blog Posts Status Report\n');
console.log('='.repeat(60));

// Get all posts
const allPosts = db.prepare('SELECT id, title, slug, published, date FROM blog_posts ORDER BY date DESC').all();

console.log(`\nTotal Posts: ${allPosts.length}\n`);

if (allPosts.length === 0) {
  console.log('❌ No blog posts found in database!');
  console.log('\n💡 Solution: Create blog posts through the admin panel.');
} else {
  // Count published vs draft
  const published = allPosts.filter(p => p.published === 1).length;
  const drafts = allPosts.filter(p => p.published === 0 || p.published === null).length;

  console.log(`✅ Published: ${published}`);
  console.log(`📝 Drafts: ${drafts}\n`);

  console.log('All Posts:');
  console.log('-'.repeat(60));
  allPosts.forEach(post => {
    const status = post.published === 1 ? '✅ Published' : '📝 Draft';
    const date = post.date || 'No date';
    console.log(`${status} | ID: ${post.id} | ${post.title}`);
    console.log(`         Slug: ${post.slug} | Date: ${date}`);
    console.log('');
  });

  if (drafts > 0) {
    console.log('\n⚠️  ISSUE FOUND: Some posts are not published!');
    console.log('\n💡 Solution:');
    console.log('   1. Log into the admin panel');
    console.log('   2. Edit each draft post');
    console.log('   3. Check the "Published" checkbox');
    console.log('   4. Click "Save Post"');
    console.log('\n   OR run this script to publish all drafts:');
    console.log('   node server/publish-all-blogs.js');
  }
}

console.log('='.repeat(60));
db.close();



