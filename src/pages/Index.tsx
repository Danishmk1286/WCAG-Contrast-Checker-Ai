import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import ColorSelector from "@/components/ColorSelector";
import ContrastResults from "@/components/ContrastResults";
// Lazy load heavy components for better initial performance
const LivePreview = lazy(() => import("@/components/LivePreview"));
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Tree-shake lucide-react imports - only import what we need
import Zap from "lucide-react/dist/esm/icons/zap";
import Shield from "lucide-react/dist/esm/icons/shield";
import Eye from "lucide-react/dist/esm/icons/eye";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import Users from "lucide-react/dist/esm/icons/users";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import Award from "lucide-react/dist/esm/icons/award";

interface ContrastResult {
  ratio: number;
  aaLarge: boolean;
  aaNormal: boolean;
  aaaLarge: boolean;
  aaaNormal: boolean;
}

import { getApiBaseUrl } from "@/lib/api";

const API_BASE = getApiBaseUrl();

const Index = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Initialize session tracking - defer to avoid blocking initial render
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const initSession = async () => {
        try {
          let sid = localStorage.getItem('analytics_session_id');
          if (!sid) {
            const response = await fetch(`${API_BASE}/analytics/session`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ referrer: document.referrer }),
            });
            if (response.ok) {
              const data = await response.json();
              sid = data.sessionId;
              localStorage.setItem('analytics_session_id', sid);
            }
          }
          setSessionId(sid);
        } catch (error) {
          // Silently fail - non-critical for initial render
        }
      };
      initSession();
    }, 200);

    return () => clearTimeout(timeoutId);
  }, []);
  
  const [textColor, setTextColor] = useState("#ffffff");
  const [backgroundColor, setBackgroundColor] = useState("#4a4d4a");
  const [contrastResult, setContrastResult] = useState<ContrastResult | null>(
    null
  );

  // --- WCAG Contrast Calculation Logic ---
  const hexToRgb = (
    hex: string
  ): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const getLuminance = (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const getContrastRatio = (color1: string, color2: string): number => {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    if (!rgb1 || !rgb2) return 0;
    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  };

  const checkCompliance = (ratio: number): ContrastResult => {
    return {
      ratio,
      aaLarge: ratio >= 3,
      aaNormal: ratio >= 4.5,
      aaaLarge: ratio >= 4.5,
      aaaNormal: ratio >= 7,
    };
  };
  // --- END Calculation Logic ---

  // Track if this is the initial mount to avoid counting default colors as a check
  const isInitialMount = useRef(true);
  
  useEffect(() => {
    const ratio = getContrastRatio(textColor, backgroundColor);
    setContrastResult(checkCompliance(ratio));
    
    // Skip counting on initial mount with default colors
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Only count as a check if colors are different from defaults
    const isActualCheck = textColor !== "#ffffff" || backgroundColor !== "#4a4d4a";
    
    // Track contrast check
    if (sessionId && isActualCheck) {
      fetch(`${API_BASE}/analytics/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          eventType: 'contrast_check',
          eventData: { textColor, backgroundColor, ratio },
        }),
      }).catch(() => {}); // Silently fail if tracking fails
      
      // Dispatch custom event for popup logic
      const event = new CustomEvent('contrastCheckCompleted', {
        detail: { textColor, backgroundColor, ratio }
      });
      window.dispatchEvent(event);
    }
  }, [textColor, backgroundColor, sessionId]);

  return (
    <>
      <SEOHead
        title="Smart Color Contrast Assistant | AI-Powered WCAG & ADA Checker"
        description="Outperform WebAIM with the Smart Color Contrast Assistant. Get instant AI color suggestions to meet WCAG 2.1 AA/AAA standards without losing your brand identity."
        canonicalUrl="https://www.thecolorcontrastchecker.com/"
      />
      <Layout>
        <main role="main" aria-label="Main content">
        {/* Main Tool Section */}
        <section
          id="color-selector-section"
          className="py-10 md:py-12 px-0 md:px-4"
          aria-labelledby="tool-heading"
        >
          <h2 id="tool-heading" className="sr-only">WCAG Color Contrast Checker Tool</h2>
          <div className="container mx-auto max-w-6xl md:px-4">
            {/* Mobile: Single Column Layout | Desktop: Two Column Layout */}
            <div 
              className="flex flex-col md:grid md:gap-6 lg:grid-cols-2 md:mb-6 md:items-stretch"
              style={{
                contain: 'layout style',
                willChange: 'auto'
              }}
            >
              {/* Contrast Results - Mobile: First, Desktop: Left Side - Sticky */}
              <div 
                className="px-0 md:px-0 flex min-h-0 md:lg:sticky md:lg:top-4 mb-1.5 md:mb-0"
                style={{
                  contain: 'layout style',
                  minHeight: '400px'
                }}
              >
                {contrastResult && (
                  <ContrastResults 
                    result={contrastResult}
                    textColor={textColor}
                    backgroundColor={backgroundColor}
                  />
                )}
              </div>

              {/* Color Controls - Mobile: Second, Desktop: Right Side */}
              <div 
                className="px-0 md:px-0 flex min-h-0"
                style={{
                  contain: 'layout style',
                  minHeight: '400px'
                }}
              >
                <div className="w-full flex flex-col min-h-0 h-full">
                  <ColorSelector
                    textColor={textColor}
                    backgroundColor={backgroundColor}
                    onTextColorChange={setTextColor}
                    onBackgroundColorChange={setBackgroundColor}
                  />
                </div>
              </div>
            </div>

            {/* Second Row: Full Live Preview - Hidden on Mobile */}
            <div id="live-preview-section" className="hidden md:block mt-10 md:mt-12">
              <div className="mb-4 text-center sm:text-left">
                <h3 className="text-xl sm:text-lg font-semibold text-foreground mb-2">
                  Live Contrast Preview
                </h3>
                <p className="text-base sm:text-sm text-foreground/75 font-medium">
                  See how your colors perform in real website interfaces and
                  components
                </p>
              </div>
              <Suspense fallback={
                <div className="w-full rounded-xl border border-border bg-muted/30 p-8 text-center">
                  <div className="animate-pulse text-muted-foreground">Loading preview...</div>
                </div>
              }>
                <LivePreview
                  textColor={textColor}
                  backgroundColor={backgroundColor}
                />
              </Suspense>
            </div>
          </div>

        </section>

        {/* Why Accessibility Matters - Value Proposition Section */}
        <section className="py-12 md:py-16 px-4" aria-labelledby="why-contrast-heading">
          <div className="container mx-auto max-w-6xl">
            {/* Section Header */}
            <div className="text-center mb-12 md:mb-16">
              <Badge variant="secondary" className="mb-4 text-xs font-medium px-3 py-1">
                Why It Matters
              </Badge>
              <h2 id="why-contrast-heading" className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
                79% of Websites Fail Accessibility Standards
              </h2>
              <p className="text-base md:text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
                Poor contrast makes content unreadable for millions of users with low vision, color blindness, or aging eyes.
              </p>
            </div>

            {/* Two-Column Value Layout */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left: Problem Statement */}
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Eye className="w-6 h-6 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">What is Contrast Ratio?</h3>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      The luminance difference between text and background. WCAG uses a formula that models how the human eye perceives brightness.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Who Does It Affect?</h3>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Over 300 million people with color blindness, plus users with low vision or aging eyes who struggle with low-contrast interfaces.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">AI-Powered Fix</h3>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Our ML model analyzes your colors and suggests accessible alternatives that preserve your design intent.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: WCAG Standards Quick Reference */}
              <div className="space-y-4">
                <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">WCAG AA</h3>
                      <p className="text-xs text-foreground/60">Minimum standard</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-background/60 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-primary">4.5:1</p>
                      <p className="text-xs text-foreground/60">Normal Text</p>
                    </div>
                    <div className="bg-background/60 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-primary">3:1</p>
                      <p className="text-xs text-foreground/60">Large Text</p>
                    </div>
                  </div>
                </Card>

                <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/30 rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">WCAG AAA</h3>
                      <p className="text-xs text-foreground/60">Enhanced standard</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-background/60 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-primary">7:1</p>
                      <p className="text-xs text-foreground/60">Normal Text</p>
                    </div>
                    <div className="bg-background/60 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-primary">4.5:1</p>
                      <p className="text-xs text-foreground/60">Large Text</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works - Features Section */}
        <section id="features" className="py-12 md:py-16 px-4 bg-muted/40" aria-labelledby="features-heading">
          <div className="container mx-auto max-w-6xl">
            {/* Section Header */}
            <div className="text-center mb-12 md:mb-16">
              <Badge variant="secondary" className="mb-4 text-xs font-medium px-3 py-1">
                How It Works
              </Badge>
              <h2 id="features-heading" className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
                AI-Powered Color Accessibility
              </h2>
              <p className="text-base md:text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
                Test contrast ratios and get intelligent suggestions that meet WCAG 2.1 and 2.2 standards.
              </p>
            </div>

            {/* Feature Grid - Horizontal Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: <Zap className="w-5 h-5" aria-hidden="true" />,
                  title: "AI-Powered Suggestions",
                  description: "Machine learning trained on 5,000+ accessible color combinations suggests fixes that preserve your design aesthetic.",
                },
                {
                  icon: <Shield className="w-5 h-5" aria-hidden="true" />,
                  title: "WCAG 2.1 & 2.2 Compliant",
                  description: "Real-time validation against AA and AAA standards with instant pass/fail feedback for normal and large text.",
                },
                {
                  icon: <Award className="w-5 h-5" aria-hidden="true" />,
                  title: "Legal Protection",
                  description: "Reduce ADA compliance risk and avoid accessibility lawsuits by ensuring your designs meet regulatory standards.",
                },
                {
                  icon: <TrendingUp className="w-5 h-5" aria-hidden="true" />,
                  title: "Better UX & SEO",
                  description: "Accessible designs improve readability for all users and boost search rankings with semantic HTML best practices.",
                },
              ].map((feature, index) => (
                <Card
                  key={index}
                  className="group p-6 border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/40 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex gap-4">
                    <div className="w-11 h-11 bg-primary/10 group-hover:bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0 text-primary transition-colors duration-300">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground mb-1.5">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-foreground/65 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        </main>
      </Layout>
    </>
  );
};

export default Index;
