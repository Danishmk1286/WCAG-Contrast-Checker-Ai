/**
 * Blog Synchronization Module
 * 
 * Handles:
 * 1. Importing blogs from blog_export.json into the database (one-time migration)
 * 
 * NOTE: No static file generation. All blog data comes from database via API.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { blogPosts } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File paths
const BLOG_EXPORT_PATH = path.join(__dirname, 'blog_export.json');

/**
 * Import blogs from blog_export.json into the database
 * This ensures all pre-existing content is available in the admin panel
 */
export function importBlogsFromExport() {
  console.log('📥 Checking for blog export file...');
  
  if (!fs.existsSync(BLOG_EXPORT_PATH)) {
    console.log('   No blog_export.json found, skipping import');
    return { imported: 0, updated: 0, skipped: 0 };
  }
  
  try {
    const rawData = fs.readFileSync(BLOG_EXPORT_PATH, 'utf8');
    const posts = JSON.parse(rawData);
    
    if (!Array.isArray(posts) || posts.length === 0) {
      console.log('   blog_export.json is empty or invalid');
      return { imported: 0, updated: 0, skipped: 0 };
    }
    
    console.log(`   Found ${posts.length} posts in export file`);
    
    const results = { imported: 0, updated: 0, skipped: 0, errors: [] };
    
    for (const post of posts) {
      try {
        // Validate required fields
        if (!post.title || !post.slug || !post.content) {
          console.log(`   ⏭️ Skipping invalid post: ${post.title || 'no title'}`);
          results.skipped++;
          continue;
        }
        
        // Use upsert to either insert or update
        const result = blogPosts.upsert({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt || '',
          meta_description: post.meta_description || post.metaDescription || '',
          author: post.author || 'Admin',
          author_linkedin: post.author_linkedin || post.authorLinkedin || '',
          date: post.date || new Date().toISOString().split('T')[0],
          read_time: post.read_time || post.readTime || '5 min read',
          tags: post.tags || '',
          featured_image_url: post.featured_image_url || '',
          featured_image_alt: post.featured_image_alt || '',
          featured_image_credit: post.featured_image_credit || '',
          content: post.content,
          published: post.published === 1 || post.published === true ? 1 : 0
        });
        
        if (result.action === 'created') {
          console.log(`   ✅ Imported: ${post.title}`);
          results.imported++;
        } else {
          console.log(`   🔄 Updated: ${post.title}`);
          results.updated++;
        }
      } catch (error) {
        console.error(`   ❌ Failed to import "${post.title}": ${error.message}`);
        results.errors.push({ title: post.title, error: error.message });
      }
    }
    
    console.log(`📊 Import complete: ${results.imported} new, ${results.updated} updated, ${results.skipped} skipped`);
    return results;
  } catch (error) {
    console.error('❌ Failed to read/parse blog_export.json:', error.message);
    return { imported: 0, updated: 0, skipped: 0, error: error.message };
  }
}

/**
 * Export blogs - REMOVED (zero file output policy)
 * Use database backup tools instead for backups
 */
export function exportBlogsToFile() {
  console.log('⚠️  Blog export removed - zero file output policy');
  console.log('   Use database backup tools for backups');
  return { exported: 0, message: 'Export removed - use database backups' };
}

/**
 * Regenerate all static content - REMOVED (using API only)
 */
export function regenerateAllStaticContent() {
  console.log('🔄 Static generation removed - using API only');
  const allPosts = blogPosts.getAll();
  const publishedPosts = allPosts.filter(p => p.published === 1);
  return { success: true, total: allPosts.length, published: publishedPosts.length, message: 'Using API only - no static files generated' };
}

/**
 * Sync static files with database - REMOVED (using API only)
 */
export function syncStaticWithDatabase() {
  console.log('🔄 Static file sync removed - using API only');
  const dbPosts = blogPosts.getAll();
  return {
    postsInDb: dbPosts.length,
    publishedPosts: dbPosts.filter(p => p.published === 1).length,
    message: 'Using API only - no static files to sync'
  };
}

/**
 * Full startup synchronization
 * Call this when the server starts to ensure everything is in sync
 * Now only imports from blog_export.json - no static file generation
 */
export function performStartupSync() {
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('📚 BLOG SYSTEM STARTUP SYNC');
  console.log('═══════════════════════════════════════════════');
  
  // Step 1: Import any blogs from export file
  const importResult = importBlogsFromExport();
  
  // Step 2: Sync static files with database (no-op, using API only)
  const syncResult = syncStaticWithDatabase();
  
  // Step 3: Regenerate all static content (no-op, using API only)
  const regenResult = regenerateAllStaticContent();
  
  // Final summary
  const dbPosts = blogPosts.getAll();
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('📊 BLOG SYSTEM STATUS');
  console.log('═══════════════════════════════════════════════');
  console.log(`   Total posts in database: ${dbPosts.length}`);
  console.log(`   Published posts: ${dbPosts.filter(p => p.published === 1).length}`);
  console.log(`   Draft posts: ${dbPosts.filter(p => p.published !== 1).length}`);
  console.log('   Mode: API-driven (no static files)');
  console.log('═══════════════════════════════════════════════');
  console.log('');
  
  return {
    import: importResult,
    sync: syncResult,
    regenerate: regenResult,
    totalPosts: dbPosts.length,
    publishedPosts: dbPosts.filter(p => p.published === 1).length
  };
}

export default {
  importBlogsFromExport,
  exportBlogsToFile, // Returns no-op (removed file writes)
  regenerateAllStaticContent, // Returns no-op (removed static generation)
  syncStaticWithDatabase, // Returns no-op (removed static sync)
  performStartupSync
};

