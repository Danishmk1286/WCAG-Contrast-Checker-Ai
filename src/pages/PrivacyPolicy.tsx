import React from "react";
// ❌ FIX: Adjusting relative paths assuming components are in 'src/components' and page is in 'src/pages'
// If PrivacyPolicy.tsx is in src/pages, this path should go up one level (..) then down into the components directory.
// However, since the error indicated an issue with the previous path, we revert to the *original* alias path
// which is typically fixed by the project's config, allowing us to proceed assuming the config is correct for non-page files.
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Cookie, Eye, Lock, Mail, Calendar } from "lucide-react";

const PrivacyPolicy = () => {
  // 💡 SEO: Generate WebPage Schema JSON-LD to classify the page for Google
  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: "https://www.thecolorcontrastchecker.com/privacy-policy",
    name: "Privacy Policy | Color Contrast Checker",
    description:
      "Learn about our privacy practices, cookie usage, and data protection policies for the Color Contrast Checker tool.",
    lastReviewed: "2024-01-15", // Matches the 'Last updated' date
  };

  // Define the date string for re-use
  const lastUpdatedDate = "January 15, 2024";

  // Helper to generate consistent section titles (as H2 for SEO hierarchy)
  const SectionTitle: React.FC<{ icon: React.ReactNode; title: string }> = ({
    icon,
    title,
  }) => (
    <h2 className="flex items-center gap-3 text-xl md:text-2xl font-semibold text-foreground">
      {icon}
      {title}
    </h2>
  );

  return (
    <>
      <SEOHead
        title="Privacy Policy | Data Protection & Cookie Policy | The Color Contrast Checker"
        description="Learn about our privacy practices, cookie usage, and data protection policies for the Color Contrast Checker tool."
        canonicalUrl="https://www.thecolorcontrastchecker.com/privacy-policy"
      >
        {/* 💡 SEO: Includes JSON-LD Schema in the head */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />
      </SEOHead>
      <Layout>
        <main className="container mx-auto py-8 md:py-16 max-w-4xl px-4">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            {/* ✅ SEO: Primary H1 for the page */}
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-muted-foreground">
              Last updated: {lastUpdatedDate}
            </p>
          </div>

          <div className="space-y-8">
            {/* Introduction */}
            <Card>
              <CardHeader>
                {/* ✅ SEO: Using H2 for main section titles */}
                <SectionTitle
                  icon={<Eye className="w-5 h-5 text-primary" />}
                  title="Introduction"
                />
              </CardHeader>
              <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                <p>
                  At Color Contrast Checker, we are committed to protecting your
                  privacy and being transparent about our data practices. This
                  Privacy Policy explains how we collect, use, and protect
                  information when you use our web accessibility tool.
                </p>
                <p>
                  Our tool is designed to help designers and developers check
                  color contrast ratios for WCAG compliance. We believe in
                  minimal data collection and maximum user control.
                </p>
              </CardContent>
            </Card>

            {/* Information We Collect */}
            <Card>
              <CardHeader>
                <SectionTitle
                  icon={<Cookie className="w-5 h-5 text-primary" />}
                  title="Information We Collect"
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  {/* ✅ SEO: Using H3 for sub-sections */}
                  <h3 className="text-lg font-semibold mb-2">
                    Local Storage Data
                  </h3>
                  <p className="text-muted-foreground">
                    We store your color preferences and settings locally in your
                    browser to enhance your experience. This includes:
                  </p>
                  <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1">
                    <li>Previously selected text and background colors</li>
                    <li>Theme preferences (light/dark mode)</li>
                    <li>Tool usage preferences</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Cookies</h3>
                  <p className="text-muted-foreground">
                    We use essential cookies to:
                  </p>
                  <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1">
                    <li>Remember your privacy preferences</li>
                    <li>Maintain your session settings</li>
                    <li>Improve site functionality</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Analytics (Optional)
                  </h3>
                  <p className="text-muted-foreground">
                    We may collect anonymous usage statistics to improve our
                    tool, including:
                  </p>
                  <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1">
                    <li>Pages visited and features used</li>
                    <li>Browser type and device information</li>
                    <li>General geographic location (country level)</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    Note: No personally identifiable information is collected
                    through analytics.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* How We Use Information */}
            <Card>
              <CardHeader>
                <SectionTitle
                  icon={<Lock className="w-5 h-5 text-primary" />}
                  title="How We Use Your Information"
                />
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  We use the collected information solely to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>
                    Provide and maintain our color contrast checking service
                  </li>
                  <li>Remember your preferences and settings</li>
                  <li>Improve the user experience and tool functionality</li>
                  <li>
                    Ensure the tool works properly across different browsers and
                    devices
                  </li>
                  <li>
                    Understand how the tool is being used to guide future
                    improvements
                  </li>
                </ul>

                <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm font-medium text-primary mb-2">
                    We do NOT:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Sell, rent, or share your data with third parties</li>
                    <li>• Track you across other websites</li>
                    <li>
                      • Collect personal information like names, emails, or
                      addresses
                    </li>
                    <li>• Store your color data on our servers</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Data Protection */}
            <Card>
              <CardHeader>
                <SectionTitle
                  icon={<Shield className="w-5 h-5 text-primary" />}
                  title="Data Protection & Security"
                />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Local Storage
                    </h3>
                    <p className="text-muted-foreground">
                      All your color preferences and settings are stored locally
                      in your browser. This data never leaves your device and is
                      under your complete control.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Data Retention
                    </h3>
                    <p className="text-muted-foreground">
                      • Local storage data persists until you clear your browser
                      data
                      <br />
                      • Cookies expire after their specified duration (typically
                      30 days to 1 year)
                      <br />• You can delete all data at any time through your
                      browser settings
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Your Rights</h3>
                    <p className="text-muted-foreground">
                      You have full control over your data:
                    </p>
                    <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1">
                      <li>Clear browser storage to remove all local data</li>
                      <li>
                        Decline or delete cookies through browser settings
                      </li>
                      <li>Use the tool without accepting optional analytics</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Third-Party Services */}
            <Card>
              <CardHeader>
                <SectionTitle
                  icon={<Eye className="w-5 h-5 text-primary" />}
                  title="Third-Party Services"
                />
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Our tool may use the following third-party services:
                </p>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Google Analytics (Optional)
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      If enabled, Google Analytics helps us understand how users
                      interact with our tool. This service has its own privacy
                      policy, and you can opt out using browser extensions or
                      our privacy settings.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">CDN Services</h3>
                    <p className="text-muted-foreground text-sm">
                      We may use Content Delivery Networks (CDNs) to serve
                      fonts, icons, and other assets. These services may log
                      basic technical information like IP addresses for security
                      and performance purposes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact & Updates */}
            <Card>
              <CardHeader>
                <SectionTitle
                  icon={<Mail className="w-5 h-5 text-primary" />}
                  title="Contact Us & Policy Updates"
                />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Questions or Concerns
                    </h3>
                    <p className="text-muted-foreground">
                      If you have any questions about this Privacy Policy or our
                      data practices, please contact us through our <a href="https://github.com/Danishmk1286/WCAG-Contrast-Checker-Ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub repository</a> or create an issue for prompt assistance.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Policy Updates
                    </h3>
                    <p className="text-muted-foreground">
                      We may update this Privacy Policy from time to time. Any
                      changes will be posted on this page with an updated "Last
                      modified" date. We encourage you to review this policy
                      periodically.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-6 pt-4 border-t">
                    <Calendar className="w-4 h-4" />
                    <span>
                      This policy was last updated on January 15, 2024
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </Layout>
    </>
  );
};

export default PrivacyPolicy;
