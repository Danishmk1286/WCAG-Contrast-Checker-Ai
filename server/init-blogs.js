#!/usr/bin/env node
/**
 * Blog Initialization Script
 * 
 * Run this script to:
 * 1. Import all blogs from blog_export.json into the database (one-time migration)
 * 
 * NOTE: No static file generation. All blog data comes from database via API.
 * 
 * Usage: node init-blogs.js
 */

import { initDatabase, blogPosts } from './database.js';
import { performStartupSync, regenerateAllStaticContent } from './blog-sync.js';

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('🚀 BLOG INITIALIZATION SCRIPT');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

// Initialize database first
console.log('Step 1: Initializing database...');
try {
  initDatabase();
  console.log('   ✅ Database ready\n');
} catch (error) {
  console.error('   ❌ Database initialization failed:', error.message);
  process.exit(1);
}

// Run full sync
console.log('Step 2: Running full blog sync...\n');
try {
  const result = performStartupSync();
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ INITIALIZATION COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   Total posts in database: ${result.totalPosts}`);
  console.log(`   Published posts: ${result.publishedPosts}`);
  console.log('');
  console.log('Next steps:');
  console.log('   1. Start the server: npm run start:server');
  console.log('   2. Open admin panel and verify all posts appear');
  console.log('   3. Blog posts are available via API: /api/blog/posts');
  console.log('');
} catch (error) {
  console.error('❌ Sync failed:', error.message);
  process.exit(1);
}

// List all posts in database
console.log('Posts in database:');
console.log('───────────────────────────────────────────────────────────');
try {
  const posts = blogPosts.getAll();
  if (posts.length === 0) {
    console.log('   (No posts found)');
  } else {
    posts.forEach((post, i) => {
      const status = post.published === 1 ? '✅ Published' : '📝 Draft';
      console.log(`   ${i + 1}. [${status}] ${post.title}`);
      console.log(`      Slug: ${post.slug}`);
    });
  }
} catch (error) {
  console.error('   Error listing posts:', error.message);
}

console.log('');
process.exit(0);

