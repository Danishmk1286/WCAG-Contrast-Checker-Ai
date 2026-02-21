import React from 'react';
import tinycolor from 'tinycolor2';

// Memoize component to prevent unnecessary re-renders

interface LivePreviewProps {
  textColor: string;
  backgroundColor: string;
}

const LivePreview: React.FC<LivePreviewProps> = React.memo(({
  textColor,
  backgroundColor
}) => {
  // Calculate derived colors
  const textColorTiny = tinycolor(textColor);
  const bgColorTiny = tinycolor(backgroundColor);
  
  // Border and accent colors
  const borderColor = textColorTiny.clone().setAlpha(0.15).toRgbString();
  const borderColorStrong = textColorTiny.clone().setAlpha(0.25).toRgbString();
  const accentBg = textColorTiny.clone().setAlpha(0.08).toRgbString();
  const accentBgHover = textColorTiny.clone().setAlpha(0.12).toRgbString();
  
  // Muted text for secondary content
  const mutedText = textColorTiny.clone().setAlpha(0.7).toRgbString();
  const subtleText = textColorTiny.clone().setAlpha(0.5).toRgbString();

  return (
    <div 
      className="w-full rounded-xl overflow-hidden border"
      role="region"
      aria-label="Live preview of color combinations in interface elements"
      style={{ 
        backgroundColor: backgroundColor,
        borderColor: borderColor,
      }}
    >
      {/* Navigation Bar */}
      <nav 
        className="px-6 py-4 border-b flex items-center justify-between"
        style={{ borderColor: borderColor }}
      >
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
              style={{ backgroundColor: textColor, color: backgroundColor }}
            >
              A
            </div>
            <span className="font-semibold text-base" style={{ color: textColor }}>
              Acme Inc
            </span>
          </div>
          
          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            {['Products', 'Solutions', 'Pricing'].map((item, i) => (
              <span 
                key={i}
                className="text-sm font-medium cursor-pointer"
                style={{ color: i === 0 ? textColor : mutedText }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{ color: textColor }}
          >
            Log in
          </button>
          <button
            className="px-4 py-2 text-sm font-medium rounded-lg"
            style={{ backgroundColor: textColor, color: backgroundColor }}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-12 md:py-16">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div 
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{ backgroundColor: accentBg, color: textColor }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: textColor }} />
            New: AI-powered features now available
          </div>
          
          {/* Heading */}
          <h1 
            className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4"
            style={{ color: textColor }}
          >
            Build products faster with modern tools
          </h1>
          
          {/* Subheading */}
          <p 
            className="text-base md:text-lg leading-relaxed mb-8 max-w-2xl mx-auto"
            style={{ color: mutedText }}
          >
            The all-in-one platform for teams who want to ship quality products. 
            Streamline your workflow and collaborate seamlessly.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              className="w-full sm:w-auto px-6 py-3 text-base font-semibold rounded-lg"
              style={{ backgroundColor: textColor, color: backgroundColor }}
            >
              Start Free Trial
            </button>
            <button
              className="w-full sm:w-auto px-6 py-3 text-base font-semibold rounded-lg border"
              style={{ color: textColor, borderColor: borderColorStrong }}
            >
              Book a Demo
            </button>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section 
        className="px-6 py-10 border-t"
        style={{ borderColor: borderColor }}
      >
        <div className="max-w-5xl mx-auto">
          {/* Section Label */}
          <p 
            className="text-xs font-semibold uppercase tracking-wider mb-3 text-center"
            style={{ color: subtleText }}
          >
            Features
          </p>
          <h2 
            className="text-2xl md:text-3xl font-bold text-center mb-8"
            style={{ color: textColor }}
          >
            Everything you need
          </h2>
          
          {/* Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { 
                icon: '⚡', 
                title: 'Lightning Fast', 
                desc: 'Optimized performance with sub-100ms response times globally.' 
              },
              { 
                icon: '🔒', 
                title: 'Enterprise Security', 
                desc: 'SOC 2 Type II certified with end-to-end encryption.' 
              },
              { 
                icon: '📊', 
                title: 'Real-time Analytics', 
                desc: 'Track metrics and gain insights with live dashboards.' 
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-5 rounded-xl border transition-colors"
                style={{ 
                  borderColor: borderColor,
                  backgroundColor: 'transparent',
                }}
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg mb-4"
                  style={{ backgroundColor: accentBg }}
                >
                  {feature.icon}
                </div>
                <h3 
                  className="text-base font-semibold mb-2"
                  style={{ color: textColor }}
                >
                  {feature.title}
                </h3>
                <p 
                  className="text-sm leading-relaxed"
                  style={{ color: mutedText }}
                >
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section 
        className="px-6 py-10 border-t"
        style={{ borderColor: borderColor, backgroundColor: accentBg }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '10K+', label: 'Active Users' },
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '150+', label: 'Integrations' },
              { value: '24/7', label: 'Support' },
            ].map((stat, i) => (
              <div key={i}>
                <p 
                  className="text-2xl md:text-3xl font-bold mb-1"
                  style={{ color: textColor }}
                >
                  {stat.value}
                </p>
                <p 
                  className="text-xs font-medium uppercase tracking-wide"
                  style={{ color: subtleText }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section 
        className="px-6 py-10 border-t"
        style={{ borderColor: borderColor }}
      >
        <div className="max-w-md mx-auto">
          <h3 
            className="text-xl font-bold mb-2 text-center"
            style={{ color: textColor }}
          >
            Stay updated
          </h3>
          <p 
            className="text-sm text-center mb-6"
            style={{ color: mutedText }}
          >
            Get the latest news and updates delivered to your inbox.
          </p>
          
          <div className="flex gap-3">
            <label htmlFor="live-preview-email-input" className="sr-only">
              Enter your email address
            </label>
            <input
              id="live-preview-email-input"
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2.5 text-sm rounded-lg border outline-none"
              style={{
                backgroundColor: 'transparent',
                color: textColor,
                borderColor: borderColorStrong,
              }}
              aria-label="Enter your email address"
            />
            <button
              className="px-5 py-2.5 text-sm font-semibold rounded-lg whitespace-nowrap"
              style={{ backgroundColor: textColor, color: backgroundColor }}
            >
              Subscribe
            </button>
          </div>
          <p 
            className="text-xs mt-3 text-center"
            style={{ color: subtleText }}
          >
            By subscribing, you agree to our Privacy Policy.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer 
        className="px-6 py-6 border-t"
        style={{ borderColor: borderColor }}
      >
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p 
            className="text-sm"
            style={{ color: subtleText }}
          >
            © 2024 Acme Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {['Privacy', 'Terms', 'Contact'].map((link, i) => (
              <span 
                key={i}
                className="text-sm cursor-pointer"
                style={{ color: mutedText }}
              >
                {link}
              </span>
            ))}
          </div>
        </div>
      </footer>
      
      {/* Placeholder style for input */}
      <style>{`
        input::placeholder {
          color: ${subtleText};
        }
      `}</style>
    </div>
  );
});

// Color Specification Panel Component
interface ColorSpecPanelProps {
  textColor: string;
  backgroundColor: string;
}

const ColorSpecPanel: React.FC<ColorSpecPanelProps> = ({ textColor, backgroundColor }) => {
  const textColorTiny = tinycolor(textColor);
  
  // Compute all derived colors as hex values
  const colors = {
    // Global
    pageBackground: backgroundColor,
    bodyBackground: backgroundColor,
    defaultText: textColor,
    headingText: textColor,
    mutedText: textColorTiny.clone().setAlpha(0.7).toHex8String(),
    subtleText: textColorTiny.clone().setAlpha(0.5).toHex8String(),
    
    // Buttons
    primaryButtonBg: textColor,
    primaryButtonText: backgroundColor,
    secondaryButtonBg: 'transparent',
    secondaryButtonText: textColor,
    secondaryButtonBorder: textColorTiny.clone().setAlpha(0.25).toHex8String(),
    
    // Links
    activeLinkColor: textColor,
    defaultLinkColor: textColorTiny.clone().setAlpha(0.7).toHex8String(),
    footerLinkColor: textColorTiny.clone().setAlpha(0.7).toHex8String(),
    
    // Borders & UI
    primaryBorder: textColorTiny.clone().setAlpha(0.15).toHex8String(),
    inputBorder: textColorTiny.clone().setAlpha(0.25).toHex8String(),
    dividerLine: textColorTiny.clone().setAlpha(0.15).toHex8String(),
    accentBackground: textColorTiny.clone().setAlpha(0.08).toHex8String(),
    
    // Footer
    footerBackground: backgroundColor,
    footerText: textColorTiny.clone().setAlpha(0.5).toHex8String(),
    footerBorder: textColorTiny.clone().setAlpha(0.15).toHex8String(),
  };

  // Helper to render color row
  const ColorRow = ({ element, role, hex, isTransparent = false }: { 
    element: string; 
    role: string; 
    hex: string;
    isTransparent?: boolean;
  }) => (
    <div className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
      <div 
        className="w-8 h-8 rounded-md border border-border/50 flex-shrink-0"
        style={{ 
          backgroundColor: isTransparent ? 'transparent' : hex,
          backgroundImage: isTransparent ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
          backgroundSize: '8px 8px',
          backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
        }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{element}</p>
        <p className="text-xs text-foreground/60">{role}</p>
      </div>
      <code className="text-xs font-mono bg-muted/50 px-2 py-1 rounded text-foreground/80">
        {isTransparent ? 'transparent' : hex.toUpperCase()}
      </code>
    </div>
  );

  return (
    <div className="mt-8 rounded-xl border border-border/60 bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/40 bg-muted/30">
        <h4 className="text-base font-semibold text-foreground">Color Specification</h4>
        <p className="text-xs text-foreground/60 mt-1">
          Exact colors used in the Live Preview above
        </p>
      </div>
      
      {/* Color Groups */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border/40">
        {/* Global Colors */}
        <div className="p-4">
          <h5 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-3">
            Global
          </h5>
          <div className="space-y-0">
            <ColorRow element="Page Background" role="Body & sections" hex={colors.pageBackground} />
            <ColorRow element="Heading Text" role="H1, H2, H3 titles" hex={colors.headingText} />
            <ColorRow element="Default Text" role="Primary content" hex={colors.defaultText} />
            <ColorRow element="Muted Text" role="Body paragraphs" hex={colors.mutedText} />
            <ColorRow element="Subtle Text" role="Captions, labels" hex={colors.subtleText} />
          </div>
        </div>

        {/* Button Colors */}
        <div className="p-4">
          <h5 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-3">
            Buttons
          </h5>
          <div className="space-y-0">
            <ColorRow element="Primary Button BG" role="CTA buttons" hex={colors.primaryButtonBg} />
            <ColorRow element="Primary Button Text" role="Button labels" hex={colors.primaryButtonText} />
            <ColorRow element="Secondary Button BG" role="Outline buttons" hex={colors.secondaryButtonBg} isTransparent />
            <ColorRow element="Secondary Button Text" role="Outline labels" hex={colors.secondaryButtonText} />
            <ColorRow element="Secondary Border" role="Outline stroke" hex={colors.secondaryButtonBorder} />
          </div>
        </div>

        {/* Links & Borders */}
        <div className="p-4">
          <h5 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-3">
            Links & Borders
          </h5>
          <div className="space-y-0">
            <ColorRow element="Active Link" role="Current nav item" hex={colors.activeLinkColor} />
            <ColorRow element="Default Link" role="Navigation links" hex={colors.defaultLinkColor} />
            <ColorRow element="Primary Border" role="Cards, dividers" hex={colors.primaryBorder} />
            <ColorRow element="Input Border" role="Form fields" hex={colors.inputBorder} />
            <ColorRow element="Accent Background" role="Badges, highlights" hex={colors.accentBackground} />
          </div>
        </div>

        {/* Footer Colors */}
        <div className="p-4">
          <h5 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-3">
            Footer
          </h5>
          <div className="space-y-0">
            <ColorRow element="Footer Background" role="Footer section" hex={colors.footerBackground} />
            <ColorRow element="Footer Text" role="Copyright text" hex={colors.footerText} />
            <ColorRow element="Footer Links" role="Privacy, Terms" hex={colors.footerLinkColor} />
            <ColorRow element="Footer Border" role="Top divider" hex={colors.footerBorder} />
            <ColorRow element="Divider Lines" role="Section borders" hex={colors.dividerLine} />
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="px-5 py-3 bg-muted/20 border-t border-border/40">
        <p className="text-xs text-foreground/50">
          <span className="font-medium">Note:</span> Colors with alpha transparency (semi-transparent) are shown in 8-digit hex format (RRGGBBAA). 
          All colors are derived from your selected text color ({textColor.toUpperCase()}) and background color ({backgroundColor.toUpperCase()}).
        </p>
      </div>
    </div>
  );
};

// Export both components
export { ColorSpecPanel };

LivePreview.displayName = "LivePreview";

export default LivePreview;
