/**
 * Script to delete all blog posts from the database
 * Usage: node delete-all-blogs.js
 */

import { blogPosts } from './database.js';
import { initDatabase } from './database.js';

console.log('\n' + '='.repeat(80));
console.log('🗑️  DELETE ALL BLOGS SCRIPT');
console.log('='.repeat(80));

// Initialize database
initDatabase();

try {
  // Get all posts before deletion
  const allPosts = blogPosts.getAll();
  console.log(`\n📊 Found ${allPosts.length} blog post(s) in database`);
  
  if (allPosts.length === 0) {
    console.log('ℹ️  No blog posts to delete. Database is already empty.');
    process.exit(0);
  }
  
  // List all posts
  console.log('\n📝 Posts to be deleted:');
  allPosts.forEach((post, index) => {
    console.log(`   ${index + 1}. [ID: ${post.id}] ${post.title} (${post.slug})`);
  });
  
  // Delete all posts
  console.log('\n🗑️  Deleting all blog posts...');
  const result = blogPosts.deleteAll();
  
  console.log(`\n✅ Successfully deleted ${result.changes} blog post(s)`);
  
  console.log('\n✅ All blog posts deleted successfully!');
  console.log('   Note: Static file generation removed - using API only');
  console.log('='.repeat(80) + '\n');
  
  process.exit(0);
} catch (error) {
  console.error('\n❌ Error deleting all blog posts:');
  console.error(`   Error: ${error.message}`);
  console.error(`   Stack: ${error.stack}`);
  console.error('='.repeat(80) + '\n');
  process.exit(1);
}

