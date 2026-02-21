/**
 * Script to create and publish WCAG Color Contrast blog articles
 * Run with: node create-wcag-blog-posts.js
 */

import { initDatabase, blogPosts } from './database.js';

// Initialize database
initDatabase();

// Article 1: The WCAG Color Contrast Imperative
const article1 = {
  title: "The WCAG Color Contrast Imperative: Designing for Inclusive Readability",
  slug: "wcag-color-contrast-inclusive-readability",
  excerpt: "Poor color contrast isn't just a design flaw – it's the web's most common accessibility issue. This article explains the global Web Content Accessibility Guidelines (WCAG) on color contrast and why adhering to these standards is critical.",
  metaDescription: "Learn why WCAG color contrast standards matter for accessibility. Discover how high-contrast design makes content readable, compliant, and inclusive for everyone, including users with low vision and color blindness.",
  author: "Danish Khan",
  authorLinkedin: "https://www.linkedin.com/in/danishmk1286/",
  date: new Date().toISOString().split('T')[0],
  readTime: "8 min read",
  tags: ["WCAG", "Accessibility", "Color Contrast", "Web Design", "Inclusive Design", "ADA Compliance"],
  featuredImage: {
    url: "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "People working together in a modern office building",
    credit: "Photo by Fauxels from Pexels"
  },
  content: `<h2>Introduction: The Contrast Problem Hiding in Plain Sight</h2>

<p>Take a close look at your website or app – are the text and background colors easy to tell apart? If not, you're not alone. In a <a href="https://webaim.org/projects/million/" target="_blank" rel="noopener noreferrer">2025 analysis of one million website homepages</a>, low color contrast text was found on <strong>79.1% of pages</strong>, making it the single most common accessibility failure on the web.</p>

<figure style="margin: 2rem 0; text-align: center;">
  <img src="https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800" alt="People working together in a modern office building" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
  <figcaption style="margin-top: 0.5rem; font-size: 0.875rem; color: #666; font-style: italic;">Photo by Fauxels from Pexels</figcaption>
</figure>

<p>Low-contrast text (e.g. gray text on a light background) might appear stylish, but for many users it's illegible. This design choice especially hurts people with visual impairments – and ultimately frustrates everyone. Most of us prefer good contrast because it makes content easier to read. In this article, we'll discuss what global standards like WCAG require for color contrast, why following these guidelines matters, and how ignoring them can exclude millions of users. High contrast isn't about design aesthetics alone; it's about making sure your content can be seen and understood by all.</p>

<h2>What Are WCAG Color Contrast Standards?</h2>

<p>WCAG (Web Content Accessibility Guidelines) are the internationally recognized standards for accessible digital design. Established by the W3C, WCAG serves as the <a href="https://www.accessibility.works/blog/wcag-compliance-guide" target="_blank" rel="noopener noreferrer">global benchmark for web accessibility</a>. These guidelines define specific contrast ratio requirements to ensure text and important visuals are distinguishable for people with vision impairments.</p>

<figure style="margin: 2rem 0; text-align: center;">
  <img src="https://images.pexels.com/photos/5905708/pexels-photo-5905708.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Color contrast examples showing accessible and inaccessible text" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
  <figcaption style="margin-top: 0.5rem; font-size: 0.875rem; color: #666; font-style: italic;">Understanding color contrast ratios is essential for accessible design</figcaption>
</figure>

<p>For normal body text, WCAG Level AA requires a minimum contrast ratio of <strong>4.5:1</strong> between text and its background (larger text can meet a slightly looser 3:1 ratio). In practice, this means light gray text on a white background, for example, would likely fail – the colors aren't sufficiently different in brightness. WCAG mandates sufficient color contrast so that content can be "read by people with moderately low vision", including folks who may not use assistive technology.</p>

<p>The guidelines also emphasize not relying on color alone to convey meaning. For instance, don't use color as the only way to indicate errors or highlights, because a color-blind user might miss it. By following these standards – which apply to web, mobile, and software UIs – designers and developers can ensure text, icons, and interactive elements remain perceivable to the broadest audience.</p>

<h2>Global Adoption and Legal Requirements</h2>

<p>Global adoption of WCAG makes these contrast rules even more important. Nearly every country that has digital accessibility regulations uses WCAG as the basis. In the U.S., the ADA and Section 508 require WCAG compliance; in the EU, the European Accessibility Act and related directives mandate WCAG conformance; many other nations from Canada to Australia do the same.</p>

<figure style="margin: 2rem 0; text-align: center;">
  <img src="https://images.pexels.com/photos/5905708/pexels-photo-5905708.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Global accessibility standards map" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
  <figcaption style="margin-top: 0.5rem; font-size: 0.875rem; color: #666; font-style: italic;">WCAG standards are adopted globally as the foundation for accessibility regulations</figcaption>
</figure>

<p>In short, meeting the WCAG contrast criteria isn't just a nice-to-have – it's effectively a global legal standard. Designers might be tempted to use trendy low-contrast aesthetics, but if it fails WCAG's test, it fails an international benchmark that governments and industries have agreed upon.</p>

<h2>Why Low Contrast Hurts Users with Visual Impairments</h2>

<p>The push for high contrast isn't arbitrary – it's driven by user needs. Millions of people have some form of visual impairment that makes low-contrast content difficult or impossible to read. Consider low vision: this term covers a range of conditions where a person's eyesight is significantly reduced (even with glasses), but not outright blindness.</p>

<figure style="margin: 2rem 0; text-align: center;">
  <img src="https://images.pexels.com/photos/5905708/pexels-photo-5905708.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Person with visual impairment using assistive technology" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
  <figcaption style="margin-top: 0.5rem; font-size: 0.875rem; color: #666; font-style: italic;">High contrast design helps users with visual impairments access digital content</figcaption>
</figure>

<p>Someone with low vision may see text as faint or blurred unless it's presented with strong contrast. For such individuals, trying to read low-contrast text is like reading in bad lighting – a frustrating challenge. As one accessibility guide puts it, <a href="https://accessibility.colostate.edu/color-contrast/" target="_blank" rel="noopener noreferrer">poor contrast especially impacts people with low vision and color blindness</a>. These users might crank up screen brightness or use assistive software to invert colors, but if your design already provides good contrast, it makes their life much easier.</p>

<h3>Color Blindness: A Common Challenge</h3>

<p>Color blindness (more accurately, color vision deficiency) is another common issue. Globally, about <a href="https://www.colourblindawareness.org/colour-blindness/" target="_blank" rel="noopener noreferrer">300 million people have some form of color blindness</a>, most often difficulty distinguishing reds and greens. If your interface uses similarly hued colors for foreground and background (e.g. red text on a green button), a color-blind user may literally not see the text against the button.</p>

<p>Even certain color combinations like blue-on-yellow can be problematic for those with particular cone deficiencies. But high contrast isn't just about specific color pairs; it's about luminance difference. A person with red-green blindness might actually read red text on green if one of them is much darker in tone (high contrast), but struggle with light gray text on light blue (low contrast) even if they can technically tell gray from blue.</p>

<h2>The Impact of Non-Compliance: Exclusion and Legal Risk</h2>

<p>What happens if we ignore color contrast standards? First and foremost, people get excluded. Users with low vision might give up on your site, unable to read important information. People with color blindness might misinterpret content (imagine a line chart where the legend relies only on color – if contrast is poor, sections of your audience won't be able to follow it).</p>

<figure style="margin: 2rem 0; text-align: center;">
  <img src="https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Legal documents and accessibility compliance" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
  <figcaption style="margin-top: 0.5rem; font-size: 0.875rem; color: #666; font-style: italic;">Non-compliance with accessibility standards can lead to legal issues</figcaption>
</figure>

<p>There's also a very tangible legal and business risk to neglecting contrast. Around the world, accessibility lawsuits and regulations are increasingly enforcing standards like WCAG. In the United States, for example, the ADA has been interpreted to apply to websites, and advocacy groups and individuals have filed thousands of lawsuits over inaccessible web content in recent years. Notably, "insufficient color contrast" is frequently cited among the common reasons for ADA web lawsuit claims.</p>

<h2>High Contrast Design as a Win-Win</h2>

<p>Designers sometimes worry that strict contrast requirements will limit their creativity or brand palette. In reality, it's quite possible to create a visually compelling design that also meets contrast standards – and doing so yields benefits far beyond checkboxes and legal safety.</p>

<figure style="margin: 2rem 0; text-align: center;">
  <img src="https://images.pexels.com/photos/5905708/pexels-photo-5905708.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Beautiful accessible design examples" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
  <figcaption style="margin-top: 0.5rem; font-size: 0.875rem; color: #666; font-style: italic;">Accessible design can be both beautiful and functional</figcaption>
</figure>

<p>When you design with adequate contrast, you improve the overall user experience for everyone. Content becomes easier to consume in all environments (from dark mode to bright daylight). Users are less likely to mis-read or overlook things. Your text, buttons, and icons simply pop better, which can also reinforce your visual hierarchy.</p>

<h2>Conclusion: Embrace the Contrast (It Benefits Everyone)</h2>

<p>Ensuring sufficient color contrast is a small effort with a huge payoff. It aligns your project with proven global standards and opens your content to audiences who might otherwise struggle. And it's one of the most straightforward accessibility fixes to implement – especially compared to more complex issues – so there's little excuse for overlooking it.</p>

<p>The data shows the vast majority of sites still get it wrong, which means you have an opportunity to stand out by getting it right. By treating WCAG's color contrast guidelines as a hard requirement, developers and designers create products that are easier to read, more accessible to people with low vision, color blindness, cataracts, and other conditions, and less likely to run afoul of legal mandates.</p>

<p><strong>High contrast design is truly a win-win:</strong> your content becomes universally perceivable and user-friendly, and you foster an inclusive digital environment that reflects well on your values. In the end, accessible design is just good design. So turn up that contrast and let your content shine – for everyone.</p>

<h2>References</h2>

<ul>
  <li><a href="https://webaim.org/projects/million/" target="_blank" rel="noopener noreferrer">WebAIM Million - 2025 Analysis</a></li>
  <li><a href="https://www.accessibility.works/blog/wcag-compliance-guide" target="_blank" rel="noopener noreferrer">WCAG Compliance Guide - Accessibility Works</a></li>
  <li><a href="https://accessibility.colostate.edu/color-contrast/" target="_blank" rel="noopener noreferrer">Color Contrast Guidelines - Colorado State University</a></li>
  <li><a href="https://www.colourblindawareness.org/colour-blindness/" target="_blank" rel="noopener noreferrer">Color Blind Awareness Organization</a></li>
  <li><a href="https://www.who.int/news-room/fact-sheets/detail/blindness-and-visual-impairment" target="_blank" rel="noopener noreferrer">WHO - Blindness and Visual Impairment</a></li>
</ul>`,
  published: true
};

// Article 2: Designing for Low Vision and Color Blindness
const article2 = {
  title: "Designing for Low Vision and Color Blindness: The Case for High Contrast",
  slug: "designing-low-vision-color-blind-high-contrast",
  excerpt: "Over 2.2 billion people worldwide live with vision impairments – from low vision to cataracts to color blindness – and low-contrast design can shut many of them out. This article shows how using accessible color contrast empowers these users.",
  metaDescription: "Discover how accessible color contrast design helps users with low vision, color blindness, and other visual impairments. Learn why high contrast design is essential for inclusive digital experiences.",
  author: "Danish Khan",
  authorLinkedin: "https://www.linkedin.com/in/danishmk1286/",
  date: new Date().toISOString().split('T')[0],
  readTime: "10 min read",
  tags: ["Low Vision", "Color Blindness", "Accessibility", "WCAG", "Inclusive Design", "Visual Impairments"],
  featuredImage: {
    url: "https://images.pexels.com/photos/5905708/pexels-photo-5905708.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "An elderly man working on his laptop",
    credit: "Photo by Kateryna Babaieva from Pexels"
  },
  content: `<h2>Introduction: Why Color Contrast Matters for Vision Impairments</h2>

<p>Imagine trying to read pale gray text on a white screen – you might squint or bring the screen closer, struggling to discern the letters. For millions of people with visual impairments, that's a daily reality when websites don't use adequate color contrast. Accessibility isn't an abstract concept; it's about real humans being able to perceive and use your content.</p>

<figure style="margin: 2rem 0; text-align: center;">
  <img src="https://images.pexels.com/photos/5905708/pexels-photo-5905708.jpeg?auto=compress&cs=tinysrgb&w=800" alt="An elderly man working on his laptop" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
  <figcaption style="margin-top: 0.5rem; font-size: 0.875rem; color: #666; font-style: italic;">Photo by Kateryna Babaieva from Pexels</figcaption>
</figure>

<p>Globally, at least <a href="https://www.who.int/news-room/fact-sheets/detail/blindness-and-visual-impairment" target="_blank" rel="noopener noreferrer">2.2 billion people have some form of vision impairment</a>. This includes those who are color blind, have low vision, live with eye conditions like cataracts, or simply experience age-related visual decline. When designers choose trendy low-contrast color schemes or rely on color alone to convey information, they unknowingly create barriers for all these users.</p>

<p>In this article, we'll "look through the eyes" of people with various visual impairments to understand how low contrast affects them. We'll also highlight the global standards (like WCAG) that exist to guide developers and designers toward more accessible color choices. Ultimately, designing with empathy and sufficient contrast isn't just about meeting guidelines – it's about making sure everyone can literally see what you have to say.</p>

<h2>Low Vision: When "Normal" Contrast Isn't Enough</h2>

<p>"Low vision" refers to significantly reduced eyesight that can't be fully corrected with glasses or contacts. Someone with low vision might have blurry or narrow field vision, or lack sharpness and detail in what they see. For these individuals, contrast is absolutely crucial.</p>

<figure style="margin: 2rem 0; text-align: center;">
  <img src="https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Person with low vision using screen magnification" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
  <figcaption style="margin-top: 0.5rem; font-size: 0.875rem; color: #666; font-style: italic;">High contrast design helps users with low vision read content more easily</figcaption>
</figure>

<p>Think about reading white text on a black background versus light gray on white – the former pops out, the latter might be missed unless magnified. A person with low vision often increases magnification or uses screen zoom, but if the contrast is poor, zooming in just gives a bigger blur. According to guidance from Colorado State University, <a href="https://accessibility.colostate.edu/color-contrast/" target="_blank" rel="noopener noreferrer">poor contrast especially impacts people with low vision</a>.</p>

<p>Many common low-vision conditions (such as those caused by diabetic retinopathy or retinal degeneration) reduce contrast sensitivity – the ability to distinguish an object from its background. Text that a fully sighted person may find "a bit light" can be nearly invisible to someone with low vision. By designing with bold, clear contrast, we ensure that users with limited vision can still read content without undue effort.</p>

<h2>Color Vision Deficiency: Designing Beyond "Red and Green"</h2>

<p>When we talk about color blindness, the classic example is inability to tell red from green. But real-world color vision deficiencies (CVD) come in several forms – the most common being protanomaly and deuteranomaly (reduced sensitivity to red or green light), and less commonly tritanomaly (difficulty with blues) or complete color blindness (very rare).</p>

<figure style="margin: 2rem 0; text-align: center;">
  <img src="https://images.pexels.com/photos/5905708/pexels-photo-5905708.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Color blindness simulation showing how colors appear to color-blind users" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
  <figcaption style="margin-top: 0.5rem; font-size: 0.875rem; color: #666; font-style: italic;">Understanding how color-blind users perceive your design is crucial</figcaption>
</figure>

<p>What they all share is that certain color combinations that look distinct to a typical viewer can appear confusingly similar or indistinguishable to someone with CVD. For instance, a red button on a green background might look brownish or identical in tone to a red-green color-blind user. Approximately <a href="https://www.colourblindawareness.org/colour-blindness/" target="_blank" rel="noopener noreferrer">1 in 12 men and 1 in 200 women have some form of color blindness</a>, which is about 300 million people worldwide.</p>

<h3>Design Principles for Color-Blind Users</h3>

<p>So how do we ensure our designs are friendly to them? The key is twofold: don't rely on color alone, and ensure sufficient contrast.</p>

<p>First, never use color as the only signifier. If an error message is just indicated by red text, a color-blind user might not notice the red – so include an icon or bold text label ("Error: ...") in addition to color. Similarly, in charts or diagrams, use patterns or labels along with color coding. This principle (spelled out in WCAG's guidelines) ensures that even if a user can't distinguish a certain hue, they won't miss the meaning.</p>

<p>Second, consider classic problematic pairings. Accessibility experts advise avoiding certain color combos outright: red with green is the big one, and also blue with yellow. It's not that these cannot be made accessible (contrast and brightness differences can mitigate issues), but they are notoriously tricky for many people.</p>

<h2>Cataracts, Glaucoma, and Aging Eyes: Contrast for Clarity</h2>

<p>It's not just congenital or lifelong conditions that impair vision – many people develop visual impairments as they age or due to other health issues. Cataracts are a prime example: by age 80, more than half of Americans either have a cataract or have had cataract surgery.</p>

<figure style="margin: 2rem 0; text-align: center;">
  <img src="https://images.pexels.com/photos/5905708/pexels-photo-5905708.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Elderly person reading with glasses" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
  <figcaption style="margin-top: 0.5rem; font-size: 0.875rem; color: #666; font-style: italic;">Aging eyes benefit significantly from high contrast design</figcaption>
</figure>

<p>A cataract is a clouding of the eye's lens, and its effect on vision is often compared to looking through a frosty or fogged window. Colors dull and blur together; contrast is greatly reduced. Someone with cataracts might struggle to read light text on any background, or find low-contrast interfaces unusable because everything looks washed-out.</p>

<p>Glaucoma, which affects peripheral vision, and macular degeneration, which affects central detail vision, also both benefit from increased contrast – the remaining sight a person has needs text to be as sharp and bold as possible to be recognized.</p>

<h2>Following Global Standards (WCAG) for Color Contrast</h2>

<p>Many of the improvements we've discussed – like maintaining a contrast ratio of at least 4.5:1 for text, or not using color as the sole means of conveying info – are codified in the Web Content Accessibility Guidelines (WCAG). These guidelines, created by experts around the world, exist precisely to address the needs of users with disabilities.</p>

<figure style="margin: 2rem 0; text-align: center;">
  <img src="https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800" alt="WCAG guidelines documentation" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
  <figcaption style="margin-top: 0.5rem; font-size: 0.875rem; color: #666; font-style: italic;">WCAG provides clear, measurable standards for accessible design</figcaption>
</figure>

<p>The great thing about using WCAG as your north star is that it's a universal language of accessibility. Whether you're in the US, Europe, Asia or elsewhere, <a href="https://www.accessibility.works/blog/wcag-compliance-guide" target="_blank" rel="noopener noreferrer">WCAG-based standards are likely referenced by your country's laws or your organization's policies</a>. By designing to meet WCAG's contrast criteria (often referred to in the guidelines as Success Criterion 1.4.3 for normal text contrast, and 1.4.11 for non-text elements), you ensure your work aligns with what's expected globally.</p>

<h2>Inclusive Design is Good Design (for Everyone)</h2>

<p>After examining all these specific needs – from low vision to color blindness to cataracts – a clear theme emerges: designing for accessibility leads to universally better outcomes. High contrast, well-considered color use doesn't only help those with diagnosed impairments, it helps anyone in less-than-ideal viewing situations.</p>

<figure style="margin: 2rem 0; text-align: center;">
  <img src="https://images.pexels.com/photos/5905708/pexels-photo-5905708.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Diverse group of people using digital devices" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
  <figcaption style="margin-top: 0.5rem; font-size: 0.875rem; color: #666; font-style: italic;">Inclusive design benefits everyone, not just users with disabilities</figcaption>
</figure>

<p>Ever try to read a mobile screen in bright sunlight? It's much easier if the app has bold contrast. What about a slideshow presentation in a conference room with dim projection? The slides that really shine are the ones with crisp text against a solid background.</p>

<p>When you follow accessibility principles for color and contrast, you tend to create layouts that communicate more clearly. There is less guesswork for users, fewer errors (e.g. clicking the wrong chart line because colors were confusing), and generally a more comfortable reading experience. As one expert succinctly put it, <a href="https://accessibility.colostate.edu/color-contrast/" target="_blank" rel="noopener noreferrer">most people prefer good contrast – it's easier for everyone to read</a>.</p>

<h2>Conclusion</h2>

<p>In summary, accessible color contrast is a small tweak with a big impact. It helps those with low vision read a paragraph they otherwise couldn't. It lets a color-blind gamer distinguish team colors correctly. It enables an aging user to continue enjoying a news site without frustration. And it does all this while making the experience nicer for every other user as well.</p>

<p>As you design and develop going forward, think of contrast as a fundamental ingredient – as basic as the content itself. It shouldn't be an afterthought or a checkbox, but an integral part of your design process. By doing so, you'll be following the best of global standards and, more importantly, you'll be doing right by your users – every one of them.</p>

<h2>References</h2>

<ul>
  <li><a href="https://www.who.int/news-room/fact-sheets/detail/blindness-and-visual-impairment" target="_blank" rel="noopener noreferrer">WHO - Blindness and Visual Impairment Fact Sheet</a></li>
  <li><a href="https://accessibility.colostate.edu/color-contrast/" target="_blank" rel="noopener noreferrer">Color Contrast Guidelines - Colorado State University</a></li>
  <li><a href="https://www.colourblindawareness.org/colour-blindness/" target="_blank" rel="noopener noreferrer">Color Blind Awareness Organization</a></li>
  <li><a href="https://www.accessibility.works/blog/wcag-compliance-guide" target="_blank" rel="noopener noreferrer">WCAG Compliance Guide - Accessibility Works</a></li>
  <li><a href="https://www.digital.va.gov/accessibility/" target="_blank" rel="noopener noreferrer">Department of Veterans Affairs - Digital Accessibility</a></li>
</ul>`,
  published: true
};

// Format articles for database
const formatArticle = (article) => ({
  title: article.title,
  slug: article.slug,
  excerpt: article.excerpt,
  metaDescription: article.metaDescription,
  author: article.author,
  authorLinkedin: article.authorLinkedin,
  date: article.date,
  readTime: article.readTime,
  tags: article.tags,
  featuredImage: article.featuredImage,
  content: article.content,
  published: article.published
});

// Create both blog posts
try {
  console.log('Creating blog posts...\n');

  // Check if posts already exist
  const existing1 = blogPosts.getBySlug(article1.slug);
  const existing2 = blogPosts.getBySlug(article2.slug);

  if (existing1) {
    console.log(`⚠️  Post "${article1.slug}" already exists. Updating...`);
    blogPosts.update(existing1.id, formatArticle(article1));
    console.log(`✅ Updated: ${article1.title}`);
  } else {
    const result1 = blogPosts.create(formatArticle(article1));
    console.log(`✅ Created: ${article1.title} (ID: ${result1.lastInsertRowid})`);
  }

  if (existing2) {
    console.log(`⚠️  Post "${article2.slug}" already exists. Updating...`);
    blogPosts.update(existing2.id, formatArticle(article2));
    console.log(`✅ Updated: ${article2.title}`);
  } else {
    const result2 = blogPosts.create(formatArticle(article2));
    console.log(`✅ Created: ${article2.title} (ID: ${result2.lastInsertRowid})`);
  }

  console.log('\n✅ Blog posts created/updated successfully!');
  console.log('\n📝 Posts are now published and live on your website.');
  console.log(`   - Article 1: /blog/${article1.slug}`);
  console.log(`   - Article 2: /blog/${article2.slug}`);
} catch (error) {
  console.error('❌ Error creating blog posts:', error);
  process.exit(1);
}

