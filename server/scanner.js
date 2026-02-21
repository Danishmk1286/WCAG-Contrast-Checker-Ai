import https from 'https';
import http from 'http';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get base URL from environment or default - use live production site
const BASE_URL = process.env.BASE_URL || 'https://thecolorcontrastchecker.com';
export { BASE_URL };

// Fetch HTML from URL
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'SEO-Scanner/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 10000
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Parse HTML and extract SEO data
function parseSEO(html, url) {
  const issues = [];
  const data = {
    hasTitle: false,
    hasMetaDescription: false,
    hasH1: false,
    h1Count: 0,
    title: '',
    metaDescription: '',
    h1Text: '',
    structuredData: [],
    links: []
  };

  // Extract title - check multiple sources
  // Note: For React SPAs, the title is set client-side via react-helmet
  // The scanner reads static HTML, so it may show the default title from index.html
  // until the production site is rebuilt and deployed with updated titles
  
  // Try to find title in <title> tag
  let titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  
  // Also check for og:title meta tag (often set by react-helmet)
  if (!titleMatch || titleMatch[1].trim() === 'AI Color Contrast Checker | WCAG 2.1 and 2.2 Tool') {
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    if (ogTitleMatch && ogTitleMatch[1].trim() !== 'AI Color Contrast Checker | WCAG 2.1 and 2.2 Tool') {
      // Use og:title if it's different from the default
      data.hasTitle = true;
      data.title = ogTitleMatch[1].trim();
    } else if (titleMatch) {
      // Use the title tag even if it's the default (will be updated after deployment)
      data.hasTitle = true;
      data.title = titleMatch[1].trim();
    } else {
      issues.push({ type: 'missing_title', severity: 'high', message: 'Missing <title> tag' });
    }
  } else {
    data.hasTitle = true;
    data.title = titleMatch[1].trim();
  }

  // Extract meta description
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (metaDescMatch) {
    data.hasMetaDescription = true;
    data.metaDescription = metaDescMatch[1].trim();
    if (data.metaDescription.length < 120 || data.metaDescription.length > 160) {
      issues.push({ 
        type: 'meta_description_length', 
        severity: 'medium', 
        message: `Meta description length is ${data.metaDescription.length} characters (recommended: 120-160)` 
      });
    }
  } else {
    issues.push({ type: 'missing_meta_description', severity: 'high', message: 'Missing meta description' });
  }

  // Count H1 tags
  const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi);
  if (h1Matches) {
    data.h1Count = h1Matches.length;
    const h1TextMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1TextMatch) {
      data.hasH1 = true;
      data.h1Text = h1TextMatch[1].trim();
    }
    if (h1Matches.length > 1) {
      issues.push({ type: 'multiple_h1', severity: 'medium', message: `Found ${h1Matches.length} H1 tags (should be 1)` });
    }
  } else {
    issues.push({ type: 'missing_h1', severity: 'high', message: 'Missing H1 tag' });
  }

  // Extract structured data (JSON-LD)
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatches) {
    jsonLdMatches.forEach(match => {
      const contentMatch = match.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
      if (contentMatch) {
        try {
          const jsonData = JSON.parse(contentMatch[1]);
          data.structuredData.push(jsonData);
        } catch (e) {
          issues.push({ type: 'invalid_structured_data', severity: 'medium', message: 'Invalid JSON-LD syntax' });
        }
      }
    });
  }

  // Extract links
  const linkMatches = html.match(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi);
  if (linkMatches) {
    linkMatches.forEach(match => {
      const hrefMatch = match.match(/href=["']([^"']+)["']/i);
      if (hrefMatch) {
        data.links.push(hrefMatch[1]);
      }
    });
  }

  return { data, issues };
}

// Check accessibility
function checkAccessibility(html, url) {
  const errors = [];
  let aaPass = 0;
  let aaFail = 0;
  let aaaPass = 0;
  let aaaFail = 0;

  // Check for missing alt text on images
  const imgMatches = html.match(/<img[^>]*>/gi);
  if (imgMatches) {
    imgMatches.forEach(img => {
      const hasAlt = /alt=["'][^"']*["']/i.test(img);
      const isDecorative = /aria-hidden=["']true["']/i.test(img) || /role=["']presentation["']/i.test(img);
      if (!hasAlt && !isDecorative) {
        errors.push({ type: 'missing_alt', severity: 'high', message: 'Image missing alt text' });
        aaFail++;
        aaaFail++;
      } else if (hasAlt && !isDecorative) {
        aaPass++;
        aaaPass++;
      }
    });
  }

  // Check for missing labels on form inputs
  const inputMatches = html.match(/<input[^>]*>/gi);
  if (inputMatches) {
    inputMatches.forEach(input => {
      const hasLabel = /aria-label=["'][^"']*["']/i.test(input) || /aria-labelledby=["'][^"']*["']/i.test(input);
      const hasId = /id=["']([^"']+)["']/i.test(input);
      if (!hasLabel && hasId) {
        const idMatch = input.match(/id=["']([^"']+)["']/i);
        const labelExists = html.includes(`<label[^>]*for=["']${idMatch[1]}["']`);
        if (!labelExists) {
          errors.push({ type: 'missing_label', severity: 'medium', message: 'Form input missing label' });
        }
      }
    });
  }

  // Check ARIA issues
  const ariaMatches = html.match(/aria-[^=]*=["'][^"']*["']/gi);
  if (ariaMatches) {
    // Check for aria-label without corresponding element
    const ariaLabelMatches = html.match(/aria-label=["']([^"']+)["']/gi);
    // Basic validation - could be enhanced
  }

  // Check heading hierarchy
  const headings = [];
  for (let i = 1; i <= 6; i++) {
    const hMatches = html.match(new RegExp(`<h${i}[^>]*>([^<]+)</h${i}>`, 'gi'));
    if (hMatches) {
      headings.push({ level: i, count: hMatches.length });
    }
  }
  
  // Check for skipped heading levels
  let lastLevel = 0;
  headings.forEach(h => {
    if (h.level > lastLevel + 1 && lastLevel > 0) {
      errors.push({ type: 'heading_hierarchy', severity: 'medium', message: `Heading level skipped from H${lastLevel} to H${h.level}` });
    }
    lastLevel = h.level;
  });

  return {
    errors,
    stats: {
      aaPass,
      aaFail,
      aaaPass,
      aaaFail,
      totalChecks: aaPass + aaFail
    }
  };
}

// Scan a single page
export async function scanPage(url) {
  try {
    const response = await fetchUrl(url);
    if (response.status !== 200) {
      return { error: `HTTP ${response.status}`, url };
    }

    const html = response.body;
    const seo = parseSEO(html, url);
    const accessibility = checkAccessibility(html, url);

    return {
      url,
      status: response.status,
      seo: {
        ...seo.data,
        issues: seo.issues
      },
      accessibility: {
        ...accessibility.stats,
        errors: accessibility.errors
      }
    };
  } catch (error) {
    return { error: error.message, url };
  }
}

// Scan multiple pages from sitemap or list
export async function scanSite(pages = []) {
  const results = [];
  
  // If no pages provided, scan common pages
  if (pages.length === 0) {
    pages = [
      BASE_URL,
      `${BASE_URL}/blog`,
      `${BASE_URL}/about`,
      `${BASE_URL}/resources`
    ];
  }

  for (const page of pages) {
    const result = await scanPage(page);
    results.push(result);
    // Rate limit: wait 500ms between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

// Get sitemap URLs - try local file first, then fetch from live site
export async function getSitemapUrls() {
  try {
    // Try local sitemap first
    const sitemapPath = path.resolve(__dirname, '..', 'dist', 'sitemap.xml');
    if (fs.existsSync(sitemapPath)) {
      const sitemap = fs.readFileSync(sitemapPath, 'utf8');
      const urlMatches = sitemap.match(/<loc>([^<]+)<\/loc>/g);
      if (urlMatches) {
        return urlMatches.map(match => match.replace(/<\/?loc>/g, ''));
      }
    }

    // Fallback: fetch from live site
    try {
      const response = await fetchUrl(`${BASE_URL}/sitemap.xml`);
      if (response.status === 200) {
        const urlMatches = response.body.match(/<loc>([^<]+)<\/loc>/g);
        if (urlMatches) {
          return urlMatches.map(match => match.replace(/<\/?loc>/g, ''));
        }
      }
    } catch (error) {
      console.error('Error fetching sitemap from live site:', error);
    }
  } catch (error) {
    console.error('Error reading sitemap:', error);
  }
  
  // Default pages if sitemap unavailable
  return [
    BASE_URL,
    `${BASE_URL}/blog`,
    `${BASE_URL}/about`,
    `${BASE_URL}/resources`
  ];
}

