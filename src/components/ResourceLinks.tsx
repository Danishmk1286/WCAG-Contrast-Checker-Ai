import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Book, Globe, Users, Award, Shield } from 'lucide-react';

const ResourceLinks: React.FC = () => {
  const allResources = [
    // Official WCAG Guidelines
    {
      title: "WCAG 2.1 Guidelines - W3C",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/",
      description: "Official Web Content Accessibility Guidelines 2.1 documentation and implementation guidance",
      category: "Official Guidelines",
      icon: <Book className="w-5 h-5 md:w-6 md:h-6" />,
      badge: "Official"
    },
    {
      title: "WCAG 2.2 Guidelines - W3C", 
      url: "https://www.w3.org/WAI/WCAG22/Understanding/",
      description: "Latest WCAG 2.2 accessibility guidelines and implementation techniques",
      category: "Official Guidelines",
      icon: <Book className="w-5 h-5 md:w-6 md:h-6" />,
      badge: "Latest"
    },
    {
      title: "WebAIM Contrast Checker",
      url: "https://webaim.org/resources/contrastchecker/",
      description: "Alternative contrast checking tool by WebAIM accessibility organization",
      category: "Testing Tools",
      icon: <Globe className="w-5 h-5 md:w-6 md:h-6" />,
      badge: "Tool"
    },
    
    // Government & Legal Resources
    {
      title: "Section 508 Standards - GSA",
      url: "https://www.section508.gov/",
      description: "US Federal accessibility standards for government websites and digital services",
      category: "Government",
      icon: <Shield className="w-5 h-5 md:w-6 md:h-6" />,
      badge: "Federal"
    },
    {
      title: "ADA Compliance Guidelines",
      url: "https://www.ada.gov/resources/web-guidance/",
      description: "Americans with Disabilities Act web accessibility guidance and requirements",
      category: "Legal",
      icon: <Shield className="w-5 h-5 md:w-6 md:h-6" />,
      badge: "Legal"
    },
    {
      title: "EN 301 549 European Standard",
      url: "https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf",
      description: "European accessibility standard for ICT products and services",
      category: "Standards",
      icon: <Award className="w-5 h-5 md:w-6 md:h-6" />,
      badge: "EU Standard"
    },
    
    // Design & Development Tools
    {
      title: "Colour Contrast Analyser - TPG",
      url: "https://www.tpgi.com/color-contrast-checker/",
      description: "Professional contrast analysis tool by accessibility experts",
      category: "Professional Tools",
      icon: <Globe className="w-5 h-5 md:w-6 md:h-6" />,
      badge: "Pro Tool"
    },
    {
      title: "Stark Accessibility Plugin",
      url: "https://www.getstark.co/",
      description: "Accessibility plugins for Figma, Sketch, and Adobe XD design tools",
      category: "Design Tools",
      icon: <Globe className="w-5 h-5 md:w-6 md:h-6" />,
      badge: "Plugin"
    },
    {
      title: "axe DevTools Browser Extension",
      url: "https://www.deque.com/axe/devtools/",
      description: "Automated accessibility testing directly in your browser development tools",
      category: "Dev Tools",
      icon: <Globe className="w-5 h-5 md:w-6 md:h-6" />,
      badge: "Extension"
    },
    {
      title: "Lighthouse Accessibility Audit",
      url: "https://developers.google.com/web/tools/lighthouse",
      description: "Google's automated accessibility auditing tool for web performance",
      category: "Google Tools",
      icon: <Globe className="w-5 h-5 md:w-6 md:h-6" />,
      badge: "Google"
    },
    
    // Educational Resources
    {
      title: "WebAIM Training Materials",
      url: "https://webaim.org/training/",
      description: "Comprehensive web accessibility training and certification programs",
      category: "Training",
      icon: <Users className="w-5 h-5 md:w-6 md:h-6" />,
      badge: "Training"
    },
    {
      title: "A11Y Project Checklist",
      url: "https://www.a11yproject.com/checklist/",
      description: "Community-driven accessibility checklist and implementation resources",
      category: "Community",
      icon: <Users className="w-5 h-5 md:w-6 md:h-6" />,
      badge: "Checklist"
    },
    {
      title: "Deque University",
      url: "https://dequeuniversity.com/",
      description: "Professional accessibility training and certification programs",
      category: "Certification",
      icon: <Award className="w-5 h-5 md:w-6 md:h-6" />,
      badge: "University"
    },
    {
      title: "MDN Accessibility Docs",
      url: "https://developer.mozilla.org/en-US/docs/Web/Accessibility",
      description: "Mozilla's comprehensive accessibility documentation for web developers",
      category: "Documentation",
      icon: <Book className="w-5 h-5 md:w-6 md:h-6" />,
      badge: "Mozilla"
    },
    
    // Industry Standards & Certification
    {
      title: "IAAP Certification",
      url: "https://www.accessibilityassociation.org/s/certification",
      description: "International Association of Accessibility Professionals certification programs",
      category: "Certification",
      icon: <Award className="w-5 h-5 md:w-6 md:h-6" />,
      badge: "Certification"
    },
    {
      title: "ISO/IEC 40500:2012",
      url: "https://www.iso.org/standard/58625.html",
      description: "International standard identical to WCAG 2.0 accessibility guidelines",
      category: "ISO Standard",
      icon: <Award className="w-5 h-5 md:w-6 md:h-6" />,
      badge: "ISO"
    },
    {
      title: "VPAT Templates - GSA",
      url: "https://www.section508.gov/sell/vpat/",
      description: "Voluntary Product Accessibility Template for compliance documentation",
      category: "Templates",
      icon: <Shield className="w-5 h-5 md:w-6 md:h-6" />,
      badge: "Template"
    }
  ];

  return (
    <section className="py-8 md:py-12 lg:py-16 px-4 sm:px-6 bg-card/20 border-t border-border">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-8 md:mb-12 px-2">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 md:mb-4 leading-tight">
            Essential Accessibility Resources & Guidelines
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Comprehensive collection of official guidelines, tools, and educational resources for web accessibility compliance and best practices.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-5 md:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {allResources.map((resource, index) => (
            <Card key={index} className="group transition-all duration-300 cursor-pointer border border-border/50 hover:border-primary/30" 
                  onClick={() => window.open(resource.url, '_blank', 'noopener,noreferrer')}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      {resource.icon}
                    </div>
                    <Badge variant="secondary" className="text-xs px-2 py-1">
                      {resource.badge}
                    </Badge>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
                <CardTitle className="text-base md:text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {resource.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                  {resource.description}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {resource.category}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-3 text-xs opacity-0 group-hover:opacity-100 transition-all duration-300 text-foreground/80 hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(resource.url, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    Visit →
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 md:mt-12 text-center">
          <Card className="p-4 md:p-6 bg-primary/5 border-primary/20 transition-all duration-300">
            <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-3 md:mb-4">
              <Badge variant="secondary" className="text-xs md:text-sm">WCAG 2.1 & 2.2 Compliant</Badge>
              <Badge variant="secondary" className="text-xs md:text-sm">Section 508 Compatible</Badge>
              <Badge variant="secondary" className="text-xs md:text-sm">ADA Guidelines</Badge>
              <Badge variant="secondary" className="text-xs md:text-sm">EN 301 549 Standard</Badge>
            </div>
            <p className="text-sm md:text-base text-muted-foreground max-w-3xl mx-auto leading-relaxed px-2">
              Our color contrast checker adheres to all major accessibility standards and guidelines. 
              Use these resources to deepen your understanding of web accessibility and create truly inclusive digital experiences.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ResourceLinks;