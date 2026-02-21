#!/usr/bin/env node
/**
 * Generate Static Blog Cache
 * 
 * This script generates static JSON files for all published blog posts.
 * These files are served from /static-blog/ and provide offline access
 * when the backend server is unavailable.
 * 
 * Usage: node scripts/generate-static-blog-cache.js
 * 
 * Generates:
 *   - public/static-blog/posts.json (list of all posts)
 *   - public/static-blog/post-{slug}.json (individual post with full content)
 *   - public/static-blog/meta.json (cache metadata)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Directories to write cache files
const CACHE_DIRS = [
  path.join(projectRoot, 'public', 'static-blog'),
  path.join(projectRoot, 'docs', 'static-blog')
];

// Source of blog data
const BLOG_EXPORT_PATH = path.join(projectRoot, 'server', 'blog_export.json');

console.log('📦 Static Blog Cache Generator');
console.log('='.repeat(50));

// Ensure cache directories exist
function ensureCacheDirs() {
  CACHE_DIRS.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created: ${dir}`);
    }
  });
}

// Load blog posts from export file
function loadBlogPosts() {
  if (!fs.existsSync(BLOG_EXPORT_PATH)) {
    console.error(`❌ Blog export file not found: ${BLOG_EXPORT_PATH}`);
    console.log('   Run "node server/export-blogs.js" to export posts from database.');
    process.exit(1);
  }
  
  const data = fs.readFileSync(BLOG_EXPORT_PATH, 'utf8');
  const posts = JSON.parse(data);
  console.log(`📄 Loaded ${posts.length} posts from blog_export.json`);
  return posts;
}

// Generate static cache files
function generateCache(posts) {
  // Filter to published posts only
  const publishedPosts = posts.filter(p => p.published === 1);
  console.log(`📗 Published posts: ${publishedPosts.length}`);
  
  if (publishedPosts.length === 0) {
    console.warn('⚠️ No published posts found. All posts may be drafts.');
  }
  
  // Generate posts list (without full content for smaller file size)
  const postsList = publishedPosts.map(post => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || '',
    author: post.author,
    date: post.date,
    readTime: post.read_time || '',
    tags: post.tags ? post.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  }));

  // Generate metadata
  const meta = {
    generatedAt: new Date().toISOString(),
    count: publishedPosts.length,
    version: '1.0'
  };

  // Write to all cache directories
  CACHE_DIRS.forEach(dir => {
    // Write posts list
    const postsListPath = path.join(dir, 'posts.json');
    fs.writeFileSync(postsListPath, JSON.stringify(postsList, null, 2));
    console.log(`   ✅ ${postsListPath}`);
    
    // Write metadata
    const metaPath = path.join(dir, 'meta.json');
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    
    // Write individual post files with full content
    publishedPosts.forEach(post => {
      const postData = {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || '',
        metaDescription: post.meta_description || '',
        author: post.author,
        authorLinkedin: post.author_linkedin || '',
        date: post.date,
        readTime: post.read_time || '',
        tags: post.tags ? post.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        featuredImage: {
          url: post.featured_image_url || '',
          alt: post.featured_image_alt || '',
          credit: post.featured_image_credit || ''
        },
        content: post.content || '',
        published: true,
        cachedAt: new Date().toISOString()
      };
      
      const postPath = path.join(dir, `post-${post.slug}.json`);
      fs.writeFileSync(postPath, JSON.stringify(postData, null, 2));
      console.log(`   ✅ post-${post.slug}.json`);
    });
  });

  return publishedPosts.length;
}

// Main
try {
  ensureCacheDirs();
  const posts = loadBlogPosts();
  const count = generateCache(posts);
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Static cache generated successfully!`);
  console.log(`   ${count} posts cached in ${CACHE_DIRS.length} directories`);
  console.log('\nCache files are now available at:');
  console.log('   /static-blog/posts.json (post list)');
  console.log('   /static-blog/post-{slug}.json (individual posts)');
  console.log('\nThese files will be served when the backend is offline.');
} catch (error) {
  console.error('❌ Error generating cache:', error.message);
  console.error(error.stack);
  process.exit(1);
}
