/**
 * Static Blog Posts
 * 
 * These blog posts are stored entirely in the frontend and do not require
 * any backend API calls. They include full content, metadata, and styling.
 */

export interface StaticBlogPostListing {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  tags: string[];
  featuredImage?: {
    url?: string;
    alt?: string;
  };
}

export interface StaticBlogPost extends StaticBlogPostListing {
  metaDescription: string;
  authorLinkedin?: string;
  authorInstagram?: string;
  authorTwitter?: string;
  authorWebsite?: string;
  featuredImage?: {
    url?: string;
    alt?: string;
    credit?: string;
  };
  content: string;
}

/**
 * Static blog posts data
 * Each post includes all necessary information for display
 */
export const STATIC_BLOG_POSTS: StaticBlogPost[] = [
  {
    id: 1,
    title: "Understanding WCAG Color Contrast Requirements: A Complete Guide",
    slug: "understanding-wcag-color-contrast-requirements",
    excerpt: "Learn the fundamentals of WCAG color contrast guidelines and how they impact web accessibility. This comprehensive guide covers everything you need to know about meeting AA and AAA standards.",
    metaDescription: "Complete guide to WCAG color contrast requirements for web accessibility. Learn about AA and AAA standards, contrast ratios, and best practices.",
    author: "Accessibility Team",
    date: "2025-01-15",
    readTime: "6 min read",
    tags: ["WCAG", "Accessibility", "Color Contrast", "Web Standards", "Best Practices"],
    featuredImage: {
      url: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=1200&h=630&fit=crop",
      alt: "Accessibility icon with color contrast checker",
      credit: "Photo from Unsplash"
    },
    content: `
      <h2>Introduction to WCAG Color Contrast</h2>
      
      <p>Color contrast is one of the most fundamental aspects of web accessibility. The Web Content Accessibility Guidelines (WCAG) provide specific requirements to ensure that text is readable for all users, including those with visual impairments.</p>
      
      <p>In this guide, we'll explore the WCAG contrast requirements, how to calculate contrast ratios, and practical tips for implementing accessible color schemes in your web projects.</p>
      
      <h2>What is Color Contrast?</h2>
      
      <p>Color contrast refers to the difference in light between text (foreground) and its background. Higher contrast makes text easier to read, especially for users with:</p>
      
      <ul>
        <li>Low vision</li>
        <li>Color blindness</li>
        <li>Age-related vision changes</li>
        <li>Viewing content in bright sunlight</li>
      </ul>
      
      <h2>WCAG Contrast Standards</h2>
      
      <p>WCAG defines three levels of contrast compliance:</p>
      
      <h3>AA Level (Minimum)</h3>
      <ul>
        <li><strong>Normal text:</strong> 4.5:1 contrast ratio</li>
        <li><strong>Large text:</strong> 3:1 contrast ratio (18pt+ or 14pt+ bold)</li>
      </ul>
      
      <h3>AAA Level (Enhanced)</h3>
      <ul>
        <li><strong>Normal text:</strong> 7:1 contrast ratio</li>
        <li><strong>Large text:</strong> 4.5:1 contrast ratio</li>
      </ul>
      
      <h2>How to Calculate Contrast Ratio</h2>
      
      <p>The contrast ratio is calculated using the relative luminance of colors. The formula is:</p>
      
      <pre style="background: #f5f5f5; padding: 1rem; border-radius: 8px; overflow-x: auto;">
      Contrast Ratio = (L1 + 0.05) / (L2 + 0.05)
      
      Where:
      - L1 = Relative luminance of the lighter color
      - L2 = Relative luminance of the darker color
      </pre>
      
      <h2>Best Practices</h2>
      
      <ol>
        <li><strong>Test early and often:</strong> Check contrast ratios during design, not just at the end.</li>
        <li><strong>Use automated tools:</strong> Tools like our <a href="/">Color Contrast Checker</a> make validation quick and easy.</li>
        <li><strong>Consider context:</strong> Remember that contrast requirements may vary for different UI elements.</li>
        <li><strong>Test with real users:</strong> Automated tools are helpful, but user testing provides valuable insights.</li>
      </ol>
      
      <h2>Common Mistakes to Avoid</h2>
      
      <ul>
        <li>Using light gray text on white backgrounds</li>
        <li>Relying solely on color to convey information</li>
        <li>Forgetting to test against various background colors</li>
        <li>Assuming all users see colors the same way</li>
      </ul>
      
      <h2>Conclusion</h2>
      
      <p>Understanding and implementing WCAG color contrast requirements is essential for creating inclusive web experiences. By following these guidelines and using proper testing tools, you can ensure your content is accessible to everyone.</p>
      
      <p>Ready to test your color combinations? Try our <a href="/">free Color Contrast Checker</a> to validate your designs.</p>
    `
  },
  {
    id: 2,
    title: "The Importance of Accessible Color Choices in Modern Web Design",
    slug: "importance-accessible-color-choices",
    excerpt: "Discover why accessible color choices matter in web design and how they can improve user experience for everyone, not just users with disabilities. Learn practical strategies for implementing accessible color palettes.",
    metaDescription: "Learn why accessible color choices are crucial in modern web design and how they benefit all users. Practical strategies for implementing accessible color palettes.",
    author: "Accessibility Team",
    date: "2025-01-22",
    readTime: "5 min read",
    tags: ["Web Design", "Accessibility", "Color Theory", "UX Design", "Inclusive Design"],
    featuredImage: {
      url: "https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=630&fit=crop",
      alt: "Colorful web design elements showcasing accessibility",
      credit: "Photo from Unsplash"
    },
    content: `
      <h2>Why Accessible Colors Matter</h2>
      
      <p>Accessible color choices in web design aren't just about compliance—they're about creating better experiences for everyone. When you design with accessibility in mind, you improve usability, readability, and user satisfaction across the board.</p>
      
      <h2>The Business Case for Accessibility</h2>
      
      <p>Accessible design makes business sense:</p>
      
      <ul>
        <li><strong>Broader audience:</strong> Over 1 billion people worldwide have some form of disability</li>
        <li><strong>Legal compliance:</strong> Many regions require accessible websites by law</li>
        <li><strong>Better SEO:</strong> Accessible sites often rank better in search results</li>
        <li><strong>Improved usability:</strong> Accessible designs are typically more intuitive for all users</li>
      </ul>
      
      <h2>Color Accessibility Beyond Contrast</h2>
      
      <p>While contrast ratios are crucial, accessible color design involves more:</p>
      
      <h3>1. Don't Rely on Color Alone</h3>
      <p>Use icons, patterns, or text labels in addition to color to convey information. This helps users with color blindness understand your interface.</p>
      
      <h3>2. Consider Color Blindness</h3>
      <p>Approximately 8% of men and 0.5% of women have some form of color blindness. Common types include:</p>
      <ul>
        <li>Protanopia (red-blind)</li>
        <li>Deuteranopia (green-blind)</li>
        <li>Tritanopia (blue-blind)</li>
      </ul>
      
      <h3>3. Test in Different Conditions</h3>
      <p>Colors can appear different in various lighting conditions. Test your designs in bright sunlight, dim lighting, and on different devices.</p>
      
      <h2>Practical Strategies</h2>
      
      <h3>Start with a Base Palette</h3>
      <p>Choose 3-5 primary colors that meet WCAG AA standards at minimum. Build your entire color system from this foundation.</p>
      
      <h3>Use High Contrast for Critical Information</h3>
      <p>Important actions, error messages, and key information should use the highest contrast possible (aim for AAA level when feasible).</p>
      
      <h3>Create a Color System</h3>
      <p>Document your color choices and their intended uses. This ensures consistency across your design and makes it easier to maintain accessibility.</p>
      
      <h2>Tools and Resources</h2>
      
      <p>Use these tools to help create accessible color schemes:</p>
      
      <ul>
        <li><a href="/">Our Color Contrast Checker</a> - Test any color combination instantly</li>
        <li>Browser extensions for real-time contrast checking</li>
        <li>Design tools with built-in accessibility features</li>
        <li>Color blindness simulators</li>
      </ul>
      
      <h2>Common Patterns</h2>
      
      <h3>Success States</h3>
      <p>Use green with sufficient contrast, but also include icons or text to indicate success.</p>
      
      <h3>Error States</h3>
      <p>Red is traditional for errors, but ensure high contrast and include clear text messages.</p>
      
      <h3>Warning States</h3>
      <p>Yellow/orange can be challenging for contrast. Consider darker variants or alternative indicators.</p>
      
      <h2>Testing Your Colors</h2>
      
      <p>Regular testing is essential:</p>
      
      <ol>
        <li>Test all color combinations in your design system</li>
        <li>Use automated tools for initial screening</li>
        <li>Test with real users when possible</li>
        <li>View designs in different lighting conditions</li>
        <li>Test on various devices and screen types</li>
      </ol>
      
      <h2>Moving Forward</h2>
      
      <p>Accessible color choices should be part of your design process from the start, not an afterthought. By prioritizing accessibility, you create better experiences for everyone.</p>
      
      <p>Start testing your color combinations today with our <a href="/">free Color Contrast Checker</a> and make your designs more inclusive.</p>
    `
  }
];

/**
 * Get all blog post listings (for blog index page)
 */
export const getStaticBlogPostListings = (): StaticBlogPostListing[] => {
  return STATIC_BLOG_POSTS.map(({ content, metaDescription, authorLinkedin, authorInstagram, authorTwitter, authorWebsite, featuredImage, ...listing }) => ({
    ...listing,
    featuredImage: featuredImage ? {
      url: featuredImage.url,
      alt: featuredImage.alt
    } : undefined
  }));
};

/**
 * Get a single blog post by slug
 */
export const getStaticBlogPost = (slug: string): StaticBlogPost | null => {
  return STATIC_BLOG_POSTS.find(post => post.slug === slug) || null;
};
