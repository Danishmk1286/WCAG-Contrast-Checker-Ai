import {
  Code,
  Palette,
  Accessibility,
  Mail,
  ExternalLink,
  Zap,
  Shield,
  Award,
  TrendingUp,
  Github,
  Eye,
  Users,
  CheckCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const About = () => {
  const technologies = [
    "React 18",
    "TypeScript",
    "Tailwind CSS",
    "Vite",
    "TensorFlow.js",
    "Radix UI",
  ];

  const features = [
    {
      icon: <Palette className="w-5 h-5" />,
      title: "AI-Powered Color Analysis",
      description:
        "Instantly check contrast ratios with intelligent color suggestions",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "WCAG 2.1 & 2.2 Compliance",
      description: "Full compliance with AA and AAA accessibility guidelines",
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Real-time Testing",
      description: "Test color combinations as you type with instant feedback",
    },
  ];

  const benefits = [
    {
      icon: <Award className="w-5 h-5" />,
      title: "Legal Protection",
      description:
        "Reduce legal risk and ensure regulatory compliance. Protect against accessibility-related lawsuits.",
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Better UX & SEO",
      description:
        "Improve readability for all users and boost search rankings with accessible design.",
    },
  ];

  // Helper to make section titles H2 for clear SEO structure
  const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
    <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
      {title}
    </h2>
  );

  return (
    <>
      {/* ✅ SEO: Defined Title, Description, and Canonical URL for E-E-A-T */}
      <SEOHead
        title="About Us | AI Color Contrast Checker Tool | WCAG Accessibility Documentation"
        description="Learn about our professional WCAG color contrast checker and accessibility testing tool. Built with modern web technologies for designers and developers who prioritize inclusive design."
        canonicalUrl="https://www.thecolorcontrastchecker.com/about"
      />
      <Layout>
        <main className="container mx-auto py-8 md:py-12 max-w-6xl px-4">
          {/* Hero Section with Authority Background */}
          <div className="relative rounded-2xl overflow-hidden mb-10 md:mb-16">
            {/* Background with gradient for authority */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent dark:from-primary/10 dark:via-primary/5 dark:to-transparent"></div>
            <div className="absolute inset-0 bg-muted/30 dark:bg-muted/20"></div>
            
            {/* Content */}
            <div className="relative text-center px-6 py-12 md:py-16 lg:py-20">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Palette className="w-6 h-6 text-primary" />
                <Accessibility className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 md:mb-5 tracking-tight">
                About Smart Color Contrast Assistant
              </h1>
              <p className="text-base md:text-lg text-foreground/80 max-w-2xl mx-auto leading-relaxed">
                The AI-powered WCAG contrast checker that doesn't just find problems—it fixes them while preserving your brand identity.
              </p>
            </div>
            
            {/* Subtle border for definition */}
            <div className="absolute inset-0 border border-border/40 dark:border-border/30 rounded-2xl pointer-events-none"></div>
          </div>

          {/* The Problem We Solve */}
          <Card className="mb-6 md:mb-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <Badge variant="secondary" className="w-fit mb-2 text-xs font-medium px-3 py-1">
                The Problem
              </Badge>
              <SectionTitle title="Why Traditional Contrast Checkers Fall Short" />
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground/80 leading-relaxed">
                <strong>79% of websites fail accessibility standards</strong>, and color contrast is one of the most common violations. 
                Traditional tools tell you what's wrong but leave you to figure out the fix yourself. This creates a frustrating cycle:
              </p>
              <div className="grid md:grid-cols-3 gap-4 my-6">
                <div className="flex gap-3 p-4 bg-background/60 rounded-lg border border-border/40">
                  <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Eye className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-sm mb-1">Identify Failure</h4>
                    <p className="text-xs text-foreground/70">Your brand colors fail WCAG contrast requirements</p>
                  </div>
                </div>
                <div className="flex gap-3 p-4 bg-background/60 rounded-lg border border-border/40">
                  <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Palette className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-sm mb-1">Manual Adjustment</h4>
                    <p className="text-xs text-foreground/70">You guess and check until something passes</p>
                  </div>
                </div>
                <div className="flex gap-3 p-4 bg-background/60 rounded-lg border border-border/40">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-sm mb-1">Brand Compromise</h4>
                    <p className="text-xs text-foreground/70">Your final colors look nothing like the original</p>
                  </div>
                </div>
              </div>
              <p className="text-foreground/80 leading-relaxed">
                Over <strong>300 million people worldwide</strong> have color blindness, and <strong>250+ million</strong> have moderate to severe vision impairment. 
                Additionally, aging populations experience natural degradation in contrast sensitivity. Poor color contrast makes your content unreadable for these users.
              </p>
            </CardContent>
          </Card>

          {/* Our Solution */}
          <Card className="mb-6 md:mb-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <Badge variant="secondary" className="w-fit mb-2 text-xs font-medium px-3 py-1">
                Our Solution
              </Badge>
              <SectionTitle title="AI-Powered Color Suggestions That Preserve Brand Identity" />
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground/80 leading-relaxed">
                Smart Color Contrast Assistant is different. When your colors fail WCAG standards, our machine learning model 
                instantly suggests the <strong>closest accessible alternatives</strong> that maintain your brand's visual identity.
              </p>
              <div className="grid md:grid-cols-2 gap-4 my-6">
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground text-sm mb-1">Minimal Color Shift</h4>
                    <p className="text-xs text-foreground/70">Suggestions stay perceptually close to your original using Delta E (CIEDE2000) color science</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground text-sm mb-1">Hue Preservation</h4>
                    <p className="text-xs text-foreground/70">AI prioritizes keeping your color's hue and saturation, adjusting only lightness when needed</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground text-sm mb-1">One-Click Fix</h4>
                    <p className="text-xs text-foreground/70">Apply accessible alternatives instantly without manual color picker adjustments</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground text-sm mb-1">Multiple Options</h4>
                    <p className="text-xs text-foreground/70">Choose from several accessible alternatives ranked by visual similarity to your brand</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* The AI Difference - Technical Section */}
          <Card className="mb-6 md:mb-8 border border-border/60 hover:border-primary/30 transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <Badge variant="secondary" className="w-fit mb-2 text-xs font-medium px-3 py-1">
                The AI Difference
              </Badge>
              <SectionTitle title="How Our AI Finds Brand-Safe Accessible Colors" />
              <CardDescription>
                Unlike static contrast checkers, our machine learning model suggests colors that preserve your design intent while meeting WCAG standards.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {/* Delta E Card */}
                <div className="p-5 bg-muted/30 rounded-xl border border-border/40">
                  <div className="w-11 h-11 bg-primary/15 rounded-xl flex items-center justify-center mb-4">
                    <Palette className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">Delta E (CIEDE2000)</h3>
                  <p className="text-sm text-foreground/70 leading-relaxed mb-3">
                    Industry-standard formula for perceptual color differences. Ensures suggested colors look similar to your original—not just mathematically close, but <em>visually</em> close.
                  </p>
                  <div className="bg-background/80 rounded-lg p-2 border border-border/30">
                    <p className="text-xs font-mono text-primary text-center">ΔE &lt; 2.0 = Imperceptible</p>
                  </div>
                </div>

                {/* TensorFlow Card */}
                <div className="p-5 bg-muted/30 rounded-xl border border-border/40">
                  <div className="w-11 h-11 bg-primary/15 rounded-xl flex items-center justify-center mb-4">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">TensorFlow.js ML</h3>
                  <p className="text-sm text-foreground/70 leading-relaxed mb-3">
                    Neural network trained on <strong>5,000+ validated accessible color combinations</strong> from real design systems. Learns patterns designers use to balance aesthetics with compliance.
                  </p>
                  <div className="bg-background/80 rounded-lg p-2 border border-border/30">
                    <p className="text-xs font-mono text-primary text-center">Runs locally in browser</p>
                  </div>
                </div>

                {/* Brand Safety Card */}
                <div className="p-5 bg-muted/30 rounded-xl border border-border/40">
                  <div className="w-11 h-11 bg-primary/15 rounded-xl flex items-center justify-center mb-4">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">Brand Preservation</h3>
                  <p className="text-sm text-foreground/70 leading-relaxed mb-3">
                    AI prioritizes maintaining your color's hue and saturation, only adjusting lightness when needed. Your brand colors stay recognizable while becoming accessible.
                  </p>
                  <div className="bg-background/80 rounded-lg p-2 border border-border/30">
                    <p className="text-xs font-mono text-primary text-center">Hue-locked suggestions</p>
                  </div>
                </div>
              </div>

              {/* How It Works Flow */}
              <div className="bg-muted/30 rounded-xl p-5 border border-border/40">
                <h3 className="text-base font-bold text-foreground mb-5 text-center">How the AI Suggestion Process Works</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  {[
                    { step: "1", title: "Analyze", desc: "Colors converted to LAB color space for perceptual accuracy" },
                    { step: "2", title: "Calculate", desc: "WCAG contrast ratio computed against target compliance" },
                    { step: "3", title: "Generate", desc: "ML model produces candidates ranked by Delta E similarity" },
                    { step: "4", title: "Validate", desc: "Only WCAG-passing colors presented, sorted by brand fit" },
                  ].map((item, index) => (
                    <div key={index} className="text-center">
                      <div className="w-9 h-9 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-sm">
                        {item.step}
                      </div>
                      <h4 className="font-semibold text-foreground text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-foreground/60">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Reference - WCAG Formula */}
          <Card className="mb-6 md:mb-8 border border-border/60 hover:border-primary/30 transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <Badge variant="secondary" className="w-fit mb-2 text-xs font-medium px-3 py-1">
                Technical Reference
              </Badge>
              <SectionTitle title="WCAG Contrast Formula" />
              <CardDescription>
                Understanding how contrast ratios are calculated helps you make informed design decisions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid lg:grid-cols-5 gap-6">
                {/* Formula Highlight */}
                <div className="lg:col-span-2 p-5 bg-muted/30 rounded-xl border border-border/40">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-primary/15 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-base font-bold text-foreground">Luminance Formula</h3>
                  </div>
                  
                  <div className="bg-background/80 rounded-lg p-4 mb-4 border border-border/30">
                    <p className="text-sm font-mono text-primary font-semibold mb-1 text-center">
                      (L1 + 0.05) / (L2 + 0.05)
                    </p>
                    <p className="text-xs text-foreground/60 text-center">
                      L1 = lighter color luminance<br />
                      L2 = darker color luminance
                    </p>
                  </div>

                  <p className="text-sm text-foreground/70 leading-relaxed">
                    WCAG computes relative luminance using gamma-corrected sRGB values, weighting RGB channels to match human visual perception.
                  </p>
                </div>

                {/* Feature Checklist */}
                <div className="lg:col-span-3 grid sm:grid-cols-3 gap-4">
                  {[
                    {
                      icon: <Eye className="w-5 h-5" />,
                      title: "Live Preview",
                      items: ["Real component mockups", "Multiple text sizes", "Instant visual feedback"],
                    },
                    {
                      icon: <Shield className="w-5 h-5" />,
                      title: "Compliance Check",
                      items: ["AA & AAA validation", "Normal & large text", "Pass/fail indicators"],
                    },
                    {
                      icon: <Zap className="w-5 h-5" />,
                      title: "AI Suggestions",
                      items: ["5,000+ training samples", "Design-aware fixes", "One-click apply"],
                    },
                  ].map((feature, index) => (
                    <div key={index} className="p-4 bg-muted/30 rounded-lg border border-border/40">
                      <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-3">
                        {feature.icon}
                      </div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">{feature.title}</h3>
                      <ul className="space-y-1.5">
                        {feature.items.map((item, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-foreground/65">
                            <CheckCircle className="w-3 h-3 text-primary flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What is this tool - simplified */}
          <Card className="mb-6 md:mb-8 border border-border/60 hover:border-primary/30 transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <SectionTitle title="What is this tool?" />
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-foreground/80 leading-relaxed">
                Smart Color Contrast Assistant is a web-based accessibility tool that ensures color combinations meet WCAG standards. 
                It provides real-time contrast ratio calculations and AI-powered suggestions for accessible designs.
              </p>
              <p className="text-foreground/80 leading-relaxed">
                Our tool calculates contrast ratios between foreground and background colors, showing whether they pass 
                WCAG AA (4.5:1 for normal text, 3:1 for large text) and AAA (7:1 for normal text, 4.5:1 for large text) standards. 
                When colors fail, the AI engine suggests accessible alternatives that preserve your brand identity.
              </p>
            </CardContent>
          </Card>

          {/* Key Benefits */}
          <Card className="mb-6 md:mb-8 border border-border/60 hover:border-primary/30 transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <SectionTitle title="Why Choose Our Tool?" />
              <CardDescription>
                Professional features for designers and developers who prioritize accessibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-shrink-0 w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground mb-1 text-sm">
                        {benefit.title}
                      </h3>
                      <p className="text-sm text-foreground/75 leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="mb-6 md:mb-8 border border-border/60 hover:border-primary/30 transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <SectionTitle title="Key Features" />
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-shrink-0 w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground mb-1 text-sm">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-foreground/75 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Technologies Used */}
          <Card className="mb-6 md:mb-8 border border-border/60 hover:border-primary/30 transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <SectionTitle title="Built with Modern Technologies" />
              <CardDescription>
                Cutting-edge tools for optimal performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {technologies.map((tech) => (
                  <Badge
                    key={tech}
                    variant="secondary"
                    className="text-xs px-2 py-0.5"
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-foreground mb-1 text-sm">
                    Frontend Framework
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    React 18 with TypeScript for type-safe, component-based development.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1 text-sm">Styling</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Tailwind CSS with a custom design system following accessibility best practices.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1 text-sm">
                    Build Tool
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Vite for fast development and optimized production builds.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1 text-sm">
                    UI Components
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Radix UI primitives with custom styling for accessibility-first components.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional SEO Resources */}
          <Card className="mb-6 md:mb-8 border border-border/60 hover:border-primary/30 transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <SectionTitle title="Related Accessibility Resources" />
              <CardDescription>
                External resources and guidelines for web accessibility compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground text-sm">
                    Official Guidelines
                  </h4>
                  <div className="space-y-2">
                    <a
                      href="https://www.w3.org/WAI/WCAG21/Understanding/"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      WCAG 2.1 Guidelines - W3C
                    </a>
                    <a
                      href="https://www.section508.gov/"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Section 508 Standards
                    </a>
                    <a
                      href="https://www.ada.gov/"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      ADA Compliance Guide
                    </a>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground text-sm">Testing Tools</h4>
                  <div className="space-y-2">
                    <a
                      href="https://webaim.org/resources/contrastchecker/"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      WebAIM Contrast Checker
                    </a>
                    <a
                      href="https://www.deque.com/axe/"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      axe Accessibility Testing
                    </a>
                    <a
                      href="https://wave.webaim.org/"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      WAVE Web Accessibility Evaluator
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GitHub Repository Section */}
          <Card className="mb-6 md:mb-8 border border-border/60 hover:border-primary/30 transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <SectionTitle title="GitHub Repository" />
              <CardDescription>
                This project is open source and available on GitHub
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-foreground/80 leading-relaxed text-sm">
                  Our color contrast checker is an open-source project built for the accessibility community. 
                  You can view the source code, contribute improvements, report issues, or star the repository to show your support.
                </p>
                <Button asChild size="default" className="gap-2">
                  <a
                    href="https://github.com/Danishmk1286/WCAG-Contrast-Checker-Ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                  >
                    <Github className="w-4 h-4" />
                    View on GitHub
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <div className="mt-8 pt-6 border-t border-border/60 text-center">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Ready to Check Your Design?
            </h2>
            <p className="text-foreground/75 mb-5 max-w-xl mx-auto leading-relaxed text-sm">
              Use our free tool to verify compliance against WCAG standards and create accessible color combinations.
            </p>
            <Button asChild size="default" className="gap-2">
              <Link to="/">
                <Zap className="w-4 h-4" />
                Go to Contrast Checker
              </Link>
            </Button>
          </div>

          {/* Contact for Bug Reports */}
          <Card className="mt-6 border border-border/60 hover:border-primary/30 transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <SectionTitle title="Report Issues & Contact" />
              <CardDescription>
                Found a bug or have suggestions? We'd love to hear from you!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-foreground/75 leading-relaxed text-sm">
                  If you encounter any issues, bugs, or have suggestions for improvements, please reach out. 
                  We're committed to making our tool the best it can be for the accessibility community.
                </p>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <a
                    href="mailto:Danishmk1286@gmail.com?subject=Color Contrast Checker - Bug Report"
                    className="text-sm text-primary hover:underline"
                  >
                    Danishmk1286@gmail.com
                  </a>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Please include details about the issue, steps to reproduce, and your browser/device information.
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </Layout>
    </>
  );
};

export default About;
