import React from "react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield, AlertTriangle, Users, Calendar } from "lucide-react";

const TermsOfService = () => {
  // 💡 SEO: Generate WebPage Schema JSON-LD
  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: "https://www.thecolorcontrastchecker.com/terms-of-service",
    name: "Terms of Service | Color Contrast Checker",
    description:
      "Read our terms of service, user agreement, and usage guidelines for the Color Contrast Checker tool.",
    lastReviewed: "2024-01-15",
  };

  const lastUpdatedDate = "January 15, 2024";

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
        title="Terms of Service | User Agreement & Usage Guidelines | The Color Contrast Checker"
        description="Read our terms of service, user agreement, and usage guidelines for the Color Contrast Checker tool."
        canonicalUrl="https://www.thecolorcontrastchecker.com/terms-of-service"
      >
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
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Terms of Service
            </h1>
            <p className="text-lg text-muted-foreground">
              Last updated: {lastUpdatedDate}
            </p>
          </div>

          <div className="space-y-8">
            {/* Introduction */}
            <Card>
              <CardHeader>
                <SectionTitle
                  icon={<Shield className="w-5 h-5 text-primary" />}
                  title="Introduction"
                />
              </CardHeader>
              <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                <p>
                  Welcome to the Color Contrast Checker. These Terms of Service
                  ("Terms") govern your access to and use of our web-based color
                  contrast checking tool, blog content, and related services
                  (collectively, the "Service").
                </p>
                <p>
                  By accessing or using our Service, you agree to be bound by
                  these Terms. If you disagree with any part of these Terms,
                  please do not use our Service.
                </p>
              </CardContent>
            </Card>

            {/* Acceptance of Terms */}
            <Card>
              <CardHeader>
                <SectionTitle
                  icon={<Users className="w-5 h-5 text-primary" />}
                  title="Acceptance of Terms"
                />
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  By accessing, browsing, or using the Color Contrast Checker,
                  you acknowledge that you have read, understood, and agree to
                  be bound by these Terms and all applicable laws and
                  regulations.
                </p>
                <p className="text-muted-foreground">
                  If you do not agree with these Terms, you must not use or
                  access the Service. We reserve the right to modify these Terms
                  at any time, and your continued use of the Service after any
                  changes constitutes acceptance of the modified Terms.
                </p>
              </CardContent>
            </Card>

            {/* Description of Service */}
            <Card>
              <CardHeader>
                <SectionTitle
                  icon={<FileText className="w-5 h-5 text-primary" />}
                  title="Description of Service"
                />
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  The Color Contrast Checker is a free, web-based accessibility
                  tool that helps designers and developers:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Check color contrast ratios for WCAG 2.1 and 2.2 compliance</li>
                  <li>Test accessibility standards for text and background color combinations</li>
                  <li>Access educational blog content about web accessibility</li>
                  <li>Submit guest blog posts for publication (subject to approval)</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  We provide this Service "as is" and "as available" without
                  warranties of any kind, either express or implied.
                </p>
              </CardContent>
            </Card>

            {/* User Conduct */}
            <Card>
              <CardHeader>
                <SectionTitle
                  icon={<AlertTriangle className="w-5 h-5 text-primary" />}
                  title="User Conduct"
                />
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  You agree to use the Service only for lawful purposes and in
                  accordance with these Terms. You agree not to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Use the Service in any way that violates any applicable local, national, or international law or regulation</li>
                  <li>Attempt to gain unauthorized access to any portion of the Service or any related systems or networks</li>
                  <li>Interfere with or disrupt the Service or servers or networks connected to the Service</li>
                  <li>Use automated systems (such as bots, crawlers, or scrapers) to access the Service without permission</li>
                  <li>Transmit any viruses, malware, or other harmful code</li>
                  <li>Submit false, misleading, or fraudulent information when submitting guest blog posts</li>
                  <li>Violate the intellectual property rights of others</li>
                </ul>
              </CardContent>
            </Card>

            {/* Intellectual Property */}
            <Card>
              <CardHeader>
                <SectionTitle
                  icon={<Shield className="w-5 h-5 text-primary" />}
                  title="Intellectual Property Rights"
                />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Our Content
                    </h3>
                    <p className="text-muted-foreground">
                      The Service, including its original content, features,
                      functionality, design, and software, is owned by Color
                      Contrast Checker and is protected by international
                      copyright, trademark, patent, trade secret, and other
                      intellectual property laws.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Your Content
                    </h3>
                    <p className="text-muted-foreground">
                      If you submit guest blog posts or other content to us, you
                      retain ownership of your content. However, by submitting
                      content, you grant us a non-exclusive, royalty-free,
                      worldwide, perpetual license to use, publish, modify, and
                      display your content on our Service.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Color Data
                    </h3>
                    <p className="text-muted-foreground">
                      Colors and color combinations tested using our tool are
                      not stored on our servers. All color data remains in your
                      browser's local storage and is under your control.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Disclaimer of Warranties */}
            <Card>
              <CardHeader>
                <SectionTitle
                  icon={<AlertTriangle className="w-5 h-5 text-primary" />}
                  title="Disclaimer of Warranties"
                />
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE"
                  BASIS. WE MAKE NO WARRANTIES, EXPRESS OR IMPLIED, INCLUDING
                  BUT NOT LIMITED TO:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>That the Service will be uninterrupted, timely, secure, or error-free</li>
                  <li>That the results obtained from using the Service will be accurate or reliable</li>
                  <li>That any errors in the Service will be corrected</li>
                  <li>That the Service meets your specific requirements</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  While we strive to provide accurate color contrast calculations
                  based on WCAG standards, you should verify results independently
                  for critical accessibility compliance requirements.
                </p>
              </CardContent>
            </Card>

            {/* Limitation of Liability */}
            <Card>
              <CardHeader>
                <SectionTitle
                  icon={<Shield className="w-5 h-5 text-primary" />}
                  title="Limitation of Liability"
                />
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, COLOR CONTRAST CHECKER
                  SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                  CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED
                  TO:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Loss of profits, revenue, data, or other intangible losses</li>
                  <li>Damages resulting from your use or inability to use the Service</li>
                  <li>Damages resulting from unauthorized access to or alteration of your data</li>
                  <li>Any other matter relating to the Service</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Our total liability to you for all claims arising from or
                  related to the Service shall not exceed the amount you paid
                  to us in the past 12 months, or $0 if you are using the free
                  Service.
                </p>
              </CardContent>
            </Card>

            {/* Guest Blog Submissions */}
            <Card>
              <CardHeader>
                <SectionTitle
                  icon={<FileText className="w-5 h-5 text-primary" />}
                  title="Guest Blog Submissions"
                />
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  If you submit guest blog posts for publication:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>You represent that your content is original and does not infringe on any third-party rights</li>
                  <li>You have the right to grant us the license described in these Terms</li>
                  <li>Your content is accurate, not misleading, and complies with applicable laws</li>
                  <li>We reserve the right to accept, reject, or edit any submitted content</li>
                  <li>We are not obligated to publish your submission or provide feedback</li>
                  <li>Published content may be edited for clarity, length, or compliance with our editorial standards</li>
                </ul>
              </CardContent>
            </Card>

            {/* Indemnification */}
            <Card>
              <CardHeader>
                <SectionTitle
                  icon={<Shield className="w-5 h-5 text-primary" />}
                  title="Indemnification"
                />
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You agree to indemnify, defend, and hold harmless Color
                  Contrast Checker, its affiliates, and their respective
                  officers, directors, employees, and agents from and against
                  any claims, liabilities, damages, losses, and expenses,
                  including reasonable attorneys' fees, arising out of or in any
                  way connected with your use of the Service, violation of these
                  Terms, or infringement of any intellectual property or other
                  right of any person or entity.
                </p>
              </CardContent>
            </Card>

            {/* Termination */}
            <Card>
              <CardHeader>
                <SectionTitle
                  icon={<AlertTriangle className="w-5 h-5 text-primary" />}
                  title="Termination"
                />
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  We reserve the right to terminate or suspend your access to
                  the Service immediately, without prior notice or liability,
                  for any reason, including but not limited to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Breach of these Terms</li>
                  <li>Fraudulent or illegal activity</li>
                  <li>Abuse of the Service</li>
                  <li>Violation of applicable laws or regulations</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Upon termination, your right to use the Service will cease
                  immediately. All provisions of these Terms that by their
                  nature should survive termination shall survive.
                </p>
              </CardContent>
            </Card>

            {/* Changes to Terms */}
            <Card>
              <CardHeader>
                <SectionTitle
                  icon={<Calendar className="w-5 h-5 text-primary" />}
                  title="Changes to Terms"
                />
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We reserve the right to modify or replace these Terms at any
                  time at our sole discretion. If a revision is material, we
                  will provide at least 30 days notice prior to any new terms
                  taking effect. What constitutes a material change will be
                  determined at our sole discretion.
                </p>
                <p className="text-muted-foreground mt-4">
                  By continuing to access or use our Service after those
                  revisions become effective, you agree to be bound by the
                  revised Terms. If you do not agree to the new Terms, please
                  stop using the Service.
                </p>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <SectionTitle
                  icon={<FileText className="w-5 h-5 text-primary" />}
                  title="Contact Us"
                />
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  If you have any questions about these Terms of Service, please
                  contact us through our <a href="https://github.com/Danishmk1286/WCAG-Contrast-Checker-Ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub repository</a> or create an issue for
                  assistance.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-6 pt-4 border-t">
                  <Calendar className="w-4 h-4" />
                  <span>These terms were last updated on {lastUpdatedDate}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </Layout>
    </>
  );
};

export default TermsOfService;

