import React, { ReactNode } from "react";
import { Helmet } from "react-helmet";
// Google Analytics is handled by GDPRNotice component, not here

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  structuredData?: object;
  metaRobots?: string; // Controls 'index, follow' on specific pages (like 404)
  children?: ReactNode; // Allows passing dynamic Schema from child components
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = "Smart Color Contrast Assistant | AI-Powered WCAG & ADA Checker",
  description = "Outperform WebAIM with the Smart Color Contrast Assistant. Get instant AI color suggestions to meet WCAG 2.1 AA/AAA standards without losing your brand identity.",
  canonicalUrl = "https://www.thecolorcontrastchecker.com/",
  ogImage = "https://www.thecolorcontrastchecker.com/assets/link-preview.jpg",
  structuredData,
  metaRobots = "index, follow", // Default to indexing
  children,
}) => {
  // Enhanced Structured Data for SoftwareApplication with Organization
  const defaultStructuredData = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Smart Color Contrast Assistant",
      alternateName: "AI Color Contrast Checker for WCAG 2.1 and 2.2",
      description:
        "The world's first AI-powered WCAG contrast assistant. Stop checking, start fixing—get instant AI color suggestions to meet WCAG 2.1 AA/AAA and ADA compliance standards without losing your brand identity.",
      url: canonicalUrl,
      applicationCategory: "DesignApplication",
      applicationSubCategory: "Accessibility Tool",
      operatingSystem: "Web Browser",
      browserRequirements: "HTML5, CSS3, JavaScript, ES6+",
      softwareVersion: "2.0",
      screenshot: {
        "@type": "ImageObject",
        url: "https://www.thecolorcontrastchecker.com/assets/link-preview.jpg",
        caption: "Smart Color Contrast Assistant - AI-Powered WCAG Checker Interface",
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        reviewCount: "127",
        bestRating: "5",
        worstRating: "1",
      },
      creator: {
        "@type": "Person",
        name: "Danish Khan",
        sameAs: "https://www.linkedin.com/in/danishmk1286/",
      },
      publisher: {
        "@type": "Organization",
        name: "The Color Contrast Checker",
        url: "https://www.thecolorcontrastchecker.com",
        logo: {
          "@type": "ImageObject",
          url: "https://www.thecolorcontrastchecker.com/assets/logo.png",
        },
      },
      featureList: [
        "Instant AI-powered color fix suggestions using TensorFlow.js",
        "Delta E (CIEDE2000) color distance sorting for brand-safe alternatives",
        "WCAG 2.1 and 2.2 AA/AAA compliance testing",
        "ADA and Section 508 accessibility validation",
        "Real-time contrast ratio calculator",
        "Color blindness simulation (Protanopia, Deuteranopia, Tritanopia)",
        "APCA (WCAG 3.0) readiness scoring",
        "Machine learning trained on 5,000+ accessible color combinations",
      ],
      keywords: "WCAG 2.1 Contrast Checker, AI-Powered Color Accessibility, ADA Compliance Tool, webaim contrast checker alternative, contrast ai, ada compliant checker, color contrast checker, WCAG color contrast checker, contrast ratio checker, WCAG AA, WCAG AAA, accessible color generator, fix low color contrast, AI accessibility tool for UI design",
      inLanguage: "en-US",
      isAccessibleForFree: true,
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "The Color Contrast Checker",
      url: "https://www.thecolorcontrastchecker.com",
      logo: "https://www.thecolorcontrastchecker.com/assets/logo.png",
      description: "Free professional WCAG color contrast checker and accessibility tool",
      founder: {
        "@type": "Person",
        name: "Danish Khan",
        sameAs: "https://www.linkedin.com/in/danishmk1286/",
      },
      sameAs: [
        "https://www.linkedin.com/in/danishmk1286/",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "Customer Service",
        email: "security@thecolorcontrastchecker.com",
      },
    },
  ];

  const finalStructuredData = structuredData || defaultStructuredData;

  return (
    <Helmet>
      {/* Google Analytics is loaded dynamically after user consent via GDPRNotice component */}
      {/* Do not include GA script here to avoid CommonJS module errors and duplicate loading */}
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="robots" content={metaRobots} />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content="Danish Khan" />

      {/* Favicon Fix: Pointing to the file in the PUBLIC directory */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/apple-touch-icon.png"
      />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Smart Color Contrast Assistant" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />

      {/* Additional SEO Tags */}
      <meta name="theme-color" content="hsl(165, 72%, 28%)" />
      <meta name="msapplication-TileColor" content="hsl(165, 72%, 28%)" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="geo.region" content="US" />
      <meta name="geo.placename" content="United States" />
      <meta name="keywords" content="WCAG 2.1 Contrast Checker, AI-Powered Color Accessibility, ADA Compliance Tool, webaim contrast checker alternative, contrast ai, ada compliant checker, wcag accessibility checker, color contrast checker, WCAG color contrast checker, contrast ratio checker, WCAG 2.1, WCAG 2.2, AI color contrast checker, WCAG AA, WCAG AAA, accessible color generator, fix low color contrast, check WCAG 2.2 color contrast, generate accessible color palettes, AI accessibility tool for UI design" />
      <meta name="classification" content="Web Application, Accessibility Tool" />
      <meta name="coverage" content="Worldwide" />
      <meta name="distribution" content="Global" />
      <meta name="rating" content="General" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      
      {/* Additional Open Graph Tags */}
      <meta property="og:locale" content="en_US" />
      <meta property="og:locale:alternate" content="en_GB" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      
      {/* Additional Twitter Tags */}
      <meta name="twitter:creator" content="@colorcontrast" />
      <meta name="twitter:site" content="@colorcontrast" />
      
      {/* Preconnect for Performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      
      {/* LCP Optimization: CSS is automatically injected by Vite during build */}
      {/* Do NOT preload /src/index.css - it doesn't exist in production builds */}
      {/* Vite automatically handles CSS injection with correct hashed paths */}
      
      {/* Structured Data (Default WebApplication + Organization) */}
      {Array.isArray(finalStructuredData) ? (
        finalStructuredData.map((data, index) => (
          <script key={index} type="application/ld+json">
            {`\n${JSON.stringify(data, null, 2)}\n`}
          </script>
        ))
      ) : (
        <script type="application/ld+json">
          {`\n${JSON.stringify(finalStructuredData, null, 2)}\n`}
        </script>
      )}

      {/* RENDER CHILDREN: For passing custom Schema (e.g., Article Schema) */}
      {children}
    </Helmet>
  );
};

export default SEOHead;
