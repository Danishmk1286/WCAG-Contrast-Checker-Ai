import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'cms.db'));

// Existing blog posts from the codebase
const existingPosts = [
  {
    title: "Understanding WCAG 2.1 Color Contrast Guidelines: A Complete Guide",
    slug: "understanding-wcag-2-1-color-contrast-guidelines",
    excerpt: "A deep dive into the color contrast requirements of WCAG 2.1, from AA to AAA standards.",
    metaDescription: "Master the WCAG 2.1 Color Contrast standards (AA and AAA) with our complete guide. Essential tips for designers and developers to ensure web accessibility.",
    author: "Danish Khan",
    authorLinkedin: "https://www.linkedin.com/in/danishmk1286/",
    date: "2024-01-15",
    readTime: "8 min read",
    tags: "WCAG,Accessibility,Design,Guidelines",
    featuredImageUrl: "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop",
    featuredImageAlt: "Abstract background with a vibrant blend of blue and purple gradients.",
    featuredImageCredit: "Photo by UX Store on Unsplash",
    content: `<div class="space-y-6 text-base md:text-lg">
          <p>Color contrast is one of the most fundamental aspects of web accessibility, yet it's often overlooked in the design process. Understanding WCAG 2.1 color contrast guidelines is essential for creating inclusive digital experiences.</p>
          
          <h2 class="text-2xl md:text-3xl font-semibold text-foreground !mt-8">What is WCAG?</h2>
          <p>The Web Content Accessibility Guidelines (WCAG) 2.1 are internationally recognized standards developed by the World Wide Web Consortium (W3C). These guidelines ensure that web content is accessible to people with disabilities, including those with visual impairments.</p>
          
          <h2 class="text-2xl md:text-3xl font-semibold text-foreground !mt-8">Understanding Contrast Ratios</h2>
          <p>Contrast ratio is calculated as the difference in luminance between foreground and background colors. It's expressed as a ratio from 1:1 (no contrast) to 21:1 (maximum contrast).</p>
          
          <div class="bg-card p-6 rounded-lg border my-6">
            <h3 class="text-xl font-semibold mb-3">WCAG AA Requirements:</h3>
            <ul class="list-disc list-inside space-y-2">
              <li><strong>Normal text:</strong> Minimum 4.5:1 contrast ratio</li>
              <li><strong>Large text (18pt+ or 14pt+ bold):</strong> Minimum 3:1 contrast ratio</li>
              <li><strong>Non-text elements:</strong> Minimum 3:1 contrast ratio</li>
            </ul>
          </div>
          
          <div class="bg-card p-6 rounded-lg border my-6">
            <h3 class="text-xl font-semibold mb-3">WCAG AAA Requirements:</h3>
            <ul class="list-disc list-inside space-y-2">
              <li><strong>Normal text:</strong> Minimum 7:1 contrast ratio</li>
              <li><strong>Large text:</strong> Minimum 4.5:1 contrast ratio</li>
            </ul>
          </div>
          
          <h2 class="text-2xl md:text-3xl font-semibold text-foreground !mt-8">Practical Implementation</h2>
          <p>When implementing color contrast in your designs, consider these practical tips:</p>
          
          <ol class="list-decimal list-inside space-y-2 pl-4">
            <li>Test early and often during the design process</li>
            <li>Use automated tools for initial screening</li>
            <li>Validate with manual testing</li>
            <li>Consider color blindness and other visual impairments</li>
            <li>Don't rely solely on color to convey information</li>
          </ol>
        </div>`,
    published: 1
  },
  {
    title: "Color Accessibility in Modern Web Design: Best Practices and Tools",
    slug: "color-accessibility-in-modern-web-design-best-practices-and-tools",
    excerpt: "Discover tools and techniques for creating accessible color schemes in your web applications.",
    metaDescription: "Explore the best practices and essential tools for implementing color accessibility in modern web design, improving UX for all users.",
    author: "Danish Khan",
    authorLinkedin: "https://www.linkedin.com/in/danishmk1286/",
    date: "2024-01-08",
    readTime: "12 min read",
    tags: "Tools,Design Systems,Best Practices,UX",
    featuredImageUrl: "https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?q=80&w=2070&auto=format&fit=crop",
    featuredImageAlt: "A diverse team of designers collaborating around a table with laptops and color swatches.",
    featuredImageCredit: "Photo by You X Ventures on Unsplash",
    content: `<div class="space-y-6 text-base md:text-lg">
          <p>In today's digital landscape, creating accessible color schemes is not just a legal requirement—it's a fundamental aspect of inclusive design that benefits all users.</p>
          
          <h2 class="text-2xl md:text-3xl font-semibold text-foreground !mt-8">The Business Case for Color Accessibility</h2>
          <p>According to the World Health Organization, approximately 1.3 billion people worldwide live with some form of visual impairment. This represents a significant portion of your potential audience that could be excluded by poor color choices.</p>
          
          <div class="bg-card p-6 rounded-lg border my-6">
            <h3 class="text-xl font-semibold mb-3">Benefits of Accessible Color Design:</h3>
            <ul class="list-disc list-inside space-y-2">
              <li>Expanded market reach and user base</li>
              <li>Improved user experience for all users</li>
              <li>Legal compliance and risk mitigation</li>
              <li>Better SEO and search engine rankings</li>
              <li>Enhanced brand reputation</li>
            </ul>
          </div>
          
          <h2 class="text-2xl md:text-3xl font-semibold text-foreground !mt-8">Essential Tools for Color Accessibility</h2>
          <p>Modern developers and designers have access to powerful tools that make color accessibility testing seamless, such as browser developer tools, design plugins for Figma or Sketch, and automated testing suites like axe-core.</p>

          <div class="bg-primary/10 p-6 rounded-lg border border-primary/20 my-6">
            <h3 class="text-xl font-semibold mb-3 text-primary">Pro Tip</h3>
            <p>Always test your color schemes under different lighting conditions and on various devices. What looks perfect on your high-end monitor might not be accessible on a smartphone in bright sunlight.</p>
          </div>
        </div>`,
    published: 1
  }
];

try {
  console.log('Starting blog migration...\n');
  
  let migrated = 0;
  let skipped = 0;
  
  for (const post of existingPosts) {
    // Check if post already exists
    const existing = db.prepare('SELECT id FROM blog_posts WHERE slug = ?').get(post.slug);
    
    if (existing) {
      console.log(`⏭️  Skipped: "${post.title}" (already exists)`);
      skipped++;
      continue;
    }
    
    // Insert post
    db.prepare(`
      INSERT INTO blog_posts (
        title, slug, excerpt, meta_description, author, author_linkedin,
        date, read_time, tags, featured_image_url, featured_image_alt,
        featured_image_credit, content, published
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      post.title,
      post.slug,
      post.excerpt,
      post.metaDescription,
      post.author,
      post.authorLinkedin,
      post.date,
      post.readTime,
      post.tags,
      post.featuredImageUrl,
      post.featuredImageAlt,
      post.featuredImageCredit,
      post.content,
      post.published
    );
    
    console.log(`✅ Migrated: "${post.title}"`);
    migrated++;
  }
  
  console.log(`\n✨ Migration complete!`);
  console.log(`   Migrated: ${migrated} posts`);
  console.log(`   Skipped: ${skipped} posts (already exist)\n`);
  
} catch (error) {
  console.error('❌ Migration error:', error);
  process.exit(1);
} finally {
  db.close();
}






