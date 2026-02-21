/**
 * Quick verification script to check if the new accessibility blog posts exist
 */

import { initDatabase, blogPosts } from './database.js';

initDatabase();

const slugs = [
  'digital-accessibility-wcag-color-contrast-guide',
  'wcag-color-contrast-real-world-examples-case-studies'
];

console.log('🔍 Checking for new accessibility blog posts...\n');

slugs.forEach(slug => {
  const post = blogPosts.getBySlug(slug);
  if (post) {
    console.log(`✅ Found: "${post.title}"`);
    console.log(`   Slug: ${post.slug}`);
    console.log(`   Published: ${post.published === 1 ? 'Yes' : 'No'}`);
    console.log(`   Date: ${post.date || 'N/A'}\n`);
  } else {
    console.log(`❌ Not found: ${slug}\n`);
  }
});

console.log('💡 To create the posts, run: node create-accessibility-blog-posts.js');
