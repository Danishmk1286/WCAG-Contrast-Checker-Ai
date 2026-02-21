/**
 * Google Analytics Configuration
 * 
 * This file contains the Google Analytics tag configuration.
 * The tag is automatically included in all pages via the SEOHead component.
 * 
 * For blog posts: The Google tag is automatically inserted when posts are rendered
 * via the BlogPost component, which uses SEOHead. No manual steps are required.
 */

export const GOOGLE_ANALYTICS_ID = 'G-M3LKGF8FCZ';

/**
 * Google Analytics tag HTML
 * This is used in static HTML files and can be referenced for consistency
 */
export const GOOGLE_ANALYTICS_TAG = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${GOOGLE_ANALYTICS_ID}');
</script>`;



