/**
 * Cleanup script to remove JSON fallback files
 * Run this once to remove old JSON cache files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');

const pathsToClean = [
  path.join(projectRoot, 'public/static-blog'),
  path.join(projectRoot, 'docs/static-blog'),
  path.join(projectRoot, 'public/static-blog/posts.json'),
  path.join(projectRoot, 'public/static-blog/post-*.json'),
  path.join(projectRoot, 'docs/static-blog/posts.json'),
  path.join(projectRoot, 'docs/static-blog/post-*.json'),
];

console.log('🧹 Cleaning up JSON fallback files...\n');

let cleaned = 0;

// Remove JSON files in static-blog directories
for (const dir of [path.join(projectRoot, 'public/static-blog'), path.join(projectRoot, 'docs/static-blog')]) {
  if (fs.existsSync(dir)) {
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(dir, file);
          fs.unlinkSync(filePath);
          console.log(`   ✓ Removed: ${filePath}`);
          cleaned++;
        }
      }
      
      // Try to remove directory if empty
      try {
        const remaining = fs.readdirSync(dir);
        if (remaining.length === 0) {
          fs.rmdirSync(dir);
          console.log(`   ✓ Removed empty directory: ${dir}`);
        }
      } catch (e) {
        // Directory not empty or other error
      }
    } catch (e) {
      console.log(`   ⚠️  Could not clean ${dir}: ${e.message}`);
    }
  }
}

console.log(`\n✅ Cleanup complete: ${cleaned} JSON file(s) removed`);

