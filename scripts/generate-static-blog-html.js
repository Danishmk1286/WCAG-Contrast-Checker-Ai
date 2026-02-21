#!/usr/bin/env node
/**
 * Generate Static Blog HTML Pages
 * 
 * This script generates static HTML files for all published blog posts.
 * These files provide resilience - blogs are always accessible even if
 * the API server is temporarily unavailable.
 * 
 * Usage: node scripts/generate-static-blog-html.js
 * 
 * Generates:
 *   - docs/blog/index.html (blog listing page)
 *   - docs/blog/{slug}.html (individual blog post pages)
 *   - Updates sitemap.xml with blog URLs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Paths
const BLOG_EXPORT_PATH = path.join(projectRoot, 'server', 'blog_export.json');
const DOCS_BLOG_DIR = path.join(projectRoot, 'docs', 'blog');
const PUBLIC_BLOG_DIR = path.join(projectRoot, 'public', 'blog');
const SITEMAP_PATH = path.join(projectRoot, 'docs', 'sitemap.xml');

// Site config
const SITE_URL = 'https://www.thecolorcontrastchecker.com';
const GA_MEASUREMENT_ID = 'G-M3LKGF8FCZ';

console.log('📄 Static Blog HTML Generator');
console.log('='.repeat(50));

// Ensure directories exist
function ensureDirectories() {
  [DOCS_BLOG_DIR, PUBLIC_BLOG_DIR].forEach(dir => {
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
    process.exit(1);
  }
  
  const data = fs.readFileSync(BLOG_EXPORT_PATH, 'utf8');
  const posts = JSON.parse(data);
  const publishedPosts = posts.filter(p => p.published === 1);
  console.log(`📄 Loaded ${posts.length} posts (${publishedPosts.length} published)`);
  return publishedPosts;
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// Format date for ISO
function formatISODate(dateString) {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

// Escape HTML special characters
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Generate blog post HTML
function generateBlogPostHtml(post) {
  const tags = post.tags ? post.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  const tagsHtml = tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('\n      ');
  
  const featuredImageHtml = post.featured_image_url ? `
    <figure class="featured-image">
      <img src="${escapeHtml(post.featured_image_url)}" alt="${escapeHtml(post.featured_image_alt || post.title)}" loading="lazy">
      ${post.featured_image_credit ? `<figcaption>${escapeHtml(post.featured_image_credit)}</figcaption>` : ''}
    </figure>
  ` : '';

  const authorLinkHtml = post.author_linkedin 
    ? `<a href="${escapeHtml(post.author_linkedin)}" target="_blank" rel="noopener noreferrer">${escapeHtml(post.author)}</a>`
    : escapeHtml(post.author);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}');
  </script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(post.title)} | The Color Contrast Checker</title>
  <meta name="description" content="${escapeHtml(post.meta_description || post.excerpt || '')}">
  <meta name="author" content="${escapeHtml(post.author)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${SITE_URL}/blog/${post.slug}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(post.title)}">
  <meta property="og:description" content="${escapeHtml(post.meta_description || post.excerpt || '')}">
  <meta property="og:url" content="${SITE_URL}/blog/${post.slug}">
  ${post.featured_image_url ? `<meta property="og:image" content="${escapeHtml(post.featured_image_url)}">` : ''}
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(post.title)}">
  <meta name="twitter:description" content="${escapeHtml(post.meta_description || post.excerpt || '')}">
  
  <!-- JSON-LD Schema -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "${escapeHtml(post.title).replace(/"/g, '\\"')}",
    "description": "${escapeHtml(post.meta_description || post.excerpt || '').replace(/"/g, '\\"')}",
    "author": {
      "@type": "Person",
      "name": "${escapeHtml(post.author)}",
      "url": "${post.author_linkedin || ''}"
    },
    "datePublished": "${formatISODate(post.date)}",
    "dateModified": "${post.updated_at ? formatISODate(post.updated_at) : formatISODate(post.date)}",
    "publisher": {
      "@type": "Organization",
      "name": "The Color Contrast Checker"
    }${post.featured_image_url ? `,
    "image": "${post.featured_image_url}"` : ''}
  }
  </script>
  
  <style>
    :root {
      --primary: #0d9488;
      --primary-foreground: #ffffff;
      --background: #ffffff;
      --foreground: #0f172a;
      --muted: #f1f5f9;
      --muted-foreground: #64748b;
      --border: #e2e8f0;
      --radius: 0.5rem;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --background: #0f172a;
        --foreground: #f8fafc;
        --muted: #1e293b;
        --muted-foreground: #94a3b8;
        --border: #334155;
      }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: var(--background);
      color: var(--foreground);
      line-height: 1.7;
      font-size: 16px;
    }
    .container { max-width: 800px; margin: 0 auto; padding: 2rem 1rem; }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--muted-foreground);
      text-decoration: none;
      font-size: 0.875rem;
      margin-bottom: 2rem;
      transition: color 0.2s;
    }
    .back-link:hover { color: var(--primary); }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
      color: var(--muted-foreground);
    }
    .meta-item { display: flex; align-items: center; gap: 0.5rem; }
    .meta a { color: var(--primary); text-decoration: none; }
    .meta a:hover { text-decoration: underline; }
    h1 {
      font-size: clamp(1.75rem, 5vw, 2.5rem);
      font-weight: 700;
      line-height: 1.2;
      margin-bottom: 1.5rem;
    }
    .tags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 2rem; }
    .tag {
      padding: 0.25rem 0.75rem;
      background: var(--muted);
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .featured-image { margin: 2rem 0; }
    .featured-image img {
      width: 100%;
      height: auto;
      border-radius: var(--radius);
    }
    .featured-image figcaption {
      text-align: center;
      font-size: 0.875rem;
      color: var(--muted-foreground);
      margin-top: 0.5rem;
    }
    .content {
      font-size: 1.125rem;
      line-height: 1.8;
    }
    .content h2 { font-size: 1.5rem; margin: 2rem 0 1rem; font-weight: 600; }
    .content h3 { font-size: 1.25rem; margin: 1.5rem 0 0.75rem; font-weight: 600; }
    .content p { margin-bottom: 1.25rem; }
    .content ul, .content ol { margin: 1rem 0 1.25rem 1.5rem; }
    .content li { margin-bottom: 0.5rem; }
    .content a { color: var(--primary); text-decoration: underline; }
    .content img { max-width: 100%; height: auto; border-radius: var(--radius); margin: 1.5rem 0; }
    .content blockquote {
      border-left: 4px solid var(--primary);
      padding-left: 1rem;
      margin: 1.5rem 0;
      font-style: italic;
      color: var(--muted-foreground);
    }
    .content figure { margin: 2rem 0; }
    .content figcaption { text-align: center; font-size: 0.875rem; color: var(--muted-foreground); margin-top: 0.5rem; }
    .footer {
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border);
      text-align: center;
    }
    .footer-links { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .footer-links a { color: var(--primary); text-decoration: none; }
    .footer-links a:hover { text-decoration: underline; }
    .cta-section {
      margin: 2rem 0;
      padding: 1.5rem;
      background: linear-gradient(135deg, var(--primary), #10b981);
      border-radius: 12px;
      text-align: center;
      color: white;
    }
    .cta-section h3 { color: white; margin-bottom: 1rem; }
    .cta-section p { color: rgba(255,255,255,0.9); margin-bottom: 1rem; }
    .cta-section a {
      display: inline-block;
      padding: 12px 24px;
      background: white;
      color: var(--primary);
      font-weight: 600;
      border-radius: 8px;
      text-decoration: none;
    }
    .cta-section a:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="container">
    <a href="/blog" class="back-link">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      Back to Blog
    </a>
    
    <article>
      <header>
        <h1>${escapeHtml(post.title)}</h1>
        <div class="meta">
          <span class="meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            ${authorLinkHtml}
          </span>
          <span class="meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            ${formatDate(post.date)}
          </span>
          ${post.read_time ? `<span class="meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            ${escapeHtml(post.read_time)}
          </span>` : ''}
        </div>
        <div class="tags">
          ${tagsHtml}
        </div>
      </header>
      
      ${featuredImageHtml}
      
      <div class="content">
        ${post.content}
      </div>
    </article>
    
    <footer class="footer">
      <div class="footer-links">
        <a href="/">Color Contrast Checker</a>
        <a href="/blog">Blog</a>
        <a href="/resources">Resources</a>
        <a href="/about">About</a>
      </div>
      <p style="margin-top: 1rem; color: var(--muted-foreground); font-size: 0.875rem;">
        © ${new Date().getFullYear()} The Color Contrast Checker. All rights reserved.
      </p>
    </footer>
  </div>
</body>
</html>`;
}

// Generate blog index HTML
function generateBlogIndexHtml(posts) {
  const postsHtml = posts.map(post => {
    const tags = post.tags ? post.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 3) : [];
    const tagsHtml = tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
    
    return `
    <article class="post-card">
      <div class="post-meta">
        <span>${escapeHtml(post.author)}</span>
        <span>•</span>
        <span>${formatDate(post.date)}</span>
        ${post.read_time ? `<span>•</span><span>${escapeHtml(post.read_time)}</span>` : ''}
      </div>
      <h2><a href="/blog/${post.slug}">${escapeHtml(post.title)}</a></h2>
      <p>${escapeHtml(post.excerpt || '')}</p>
      <div class="post-tags">${tagsHtml}</div>
    </article>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}');
  </script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Blog | The Color Contrast Checker</title>
  <meta name="description" content="Expert insights on web accessibility, WCAG compliance, and color contrast best practices. Learn how to create inclusive digital experiences.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${SITE_URL}/blog">
  
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="Accessibility Blog | The Color Contrast Checker">
  <meta property="og:description" content="Expert insights on web accessibility, WCAG compliance, and color contrast best practices.">
  <meta property="og:url" content="${SITE_URL}/blog">
  
  <!-- JSON-LD Schema -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Accessibility Blog",
    "description": "Expert insights on web accessibility, WCAG compliance, and color contrast best practices.",
    "url": "${SITE_URL}/blog",
    "publisher": {
      "@type": "Organization",
      "name": "The Color Contrast Checker"
    },
    "blogPost": [
      ${posts.map(post => `{
        "@type": "BlogPosting",
        "headline": "${escapeHtml(post.title).replace(/"/g, '\\"')}",
        "url": "${SITE_URL}/blog/${post.slug}",
        "datePublished": "${formatISODate(post.date)}",
        "author": {
          "@type": "Person",
          "name": "${escapeHtml(post.author)}"
        }
      }`).join(',\n      ')}
    ]
  }
  </script>
  
  <style>
    :root { --primary: #0d9488; --bg: #fff; --fg: #0f172a; --muted: #f1f5f9; --muted-fg: #64748b; --border: #e2e8f0; }
    @media (prefers-color-scheme: dark) { :root { --bg: #0f172a; --fg: #f8fafc; --muted: #1e293b; --muted-fg: #94a3b8; --border: #334155; } }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--fg); line-height: 1.6; }
    .container { max-width: 900px; margin: 0 auto; padding: 2rem 1rem; }
    header { text-align: center; margin-bottom: 3rem; }
    h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .subtitle { color: var(--muted-fg); font-size: 1.125rem; }
    .posts { display: flex; flex-direction: column; gap: 1.5rem; }
    .post-card { padding: 1.5rem; border: 1px solid var(--border); border-radius: 0.75rem; transition: all 0.2s; }
    .post-card:hover { border-color: var(--primary); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .post-meta { display: flex; flex-wrap: wrap; gap: 0.5rem; font-size: 0.875rem; color: var(--muted-fg); margin-bottom: 0.75rem; }
    .post-card h2 { font-size: 1.25rem; margin-bottom: 0.5rem; }
    .post-card h2 a { color: inherit; text-decoration: none; }
    .post-card h2 a:hover { color: var(--primary); }
    .post-card p { color: var(--muted-fg); font-size: 0.9375rem; margin-bottom: 0.75rem; }
    .post-tags { display: flex; gap: 0.5rem; }
    .tag { padding: 0.25rem 0.625rem; background: var(--muted); border-radius: 9999px; font-size: 0.75rem; }
    .home-link { display: inline-block; margin-top: 2rem; color: var(--primary); text-decoration: none; }
    .home-link:hover { text-decoration: underline; }
    .cta-section {
      margin-top: 3rem;
      padding: 2rem;
      background: linear-gradient(135deg, var(--primary), #10b981);
      border-radius: 12px;
      text-align: center;
      color: white;
    }
    .cta-section h3 { color: white; margin-bottom: 0.5rem; font-size: 1.5rem; }
    .cta-section p { color: rgba(255,255,255,0.9); margin-bottom: 1rem; }
    .cta-section a {
      display: inline-block;
      padding: 12px 24px;
      background: white;
      color: var(--primary);
      font-weight: 600;
      border-radius: 8px;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Accessibility Blog</h1>
      <p class="subtitle">Expert insights on WCAG compliance and inclusive design</p>
    </header>
    <div class="posts">
      ${postsHtml}
    </div>
    
    <div class="cta-section">
      <h3>Check Your Color Contrast</h3>
      <p>Use our free AI-powered tool to verify your designs meet WCAG standards.</p>
      <a href="/">Launch Contrast Checker →</a>
    </div>
    
    <a href="/" class="home-link">← Back to Color Contrast Checker</a>
  </div>
</body>
</html>`;
}

// Update sitemap with blog URLs
function updateSitemap(posts) {
  const now = new Date().toISOString().split('T')[0];
  
  // Generate blog URL entries
  const blogUrls = posts.map(post => `  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <lastmod>${post.updated_at ? formatISODate(post.updated_at) : formatISODate(post.date)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Core Pages -->
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/blog</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/resources</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/about</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITE_URL}/privacy-policy</loc>
    <lastmod>${now}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${SITE_URL}/terms-of-service</loc>
    <lastmod>${now}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  
  <!-- Blog Posts -->
${blogUrls}
</urlset>`;

  fs.writeFileSync(SITEMAP_PATH, sitemap);
  console.log(`   ✅ Updated sitemap.xml with ${posts.length} blog URLs`);
}

// Main execution
try {
  ensureDirectories();
  const posts = loadBlogPosts();
  
  if (posts.length === 0) {
    console.warn('⚠️ No published posts found. Skipping generation.');
    process.exit(0);
  }
  
  // Generate individual blog post pages
  console.log('\n📝 Generating blog post pages...');
  posts.forEach(post => {
    const html = generateBlogPostHtml(post);
    const filePath = path.join(DOCS_BLOG_DIR, `${post.slug}.html`);
    fs.writeFileSync(filePath, html);
    console.log(`   ✅ ${post.slug}.html`);
  });
  
  // Generate blog index page
  console.log('\n📋 Generating blog index page...');
  const indexHtml = generateBlogIndexHtml(posts);
  fs.writeFileSync(path.join(DOCS_BLOG_DIR, 'index.html'), indexHtml);
  console.log('   ✅ index.html');
  
  // Update sitemap
  console.log('\n🗺️ Updating sitemap...');
  updateSitemap(posts);
  
  // Log completion
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Static blog HTML generated successfully!`);
  console.log(`   ${posts.length} blog posts generated in docs/blog/`);
  console.log(`   Sitemap updated with all blog URLs`);
  console.log('\nBlogs are now accessible even if the API server is offline.');
  
} catch (error) {
  console.error('❌ Error generating static blog HTML:', error.message);
  console.error(error.stack);
  process.exit(1);
}



