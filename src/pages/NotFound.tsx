import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Home from "lucide-react/dist/esm/icons/home";
import Palette from "lucide-react/dist/esm/icons/palette";
import BookOpen from "lucide-react/dist/esm/icons/book-open";
import Zap from "lucide-react/dist/esm/icons/zap";
import SEOHead from "@/components/SEOHead";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Log 404s to the console for internal debugging and monitoring
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <>
      {/* SEO: Block search engines from indexing the 404 page */}
      <SEOHead
        title="404 Page Not Found | Smart Color Contrast Assistant"
        description="Lost your way? Don't let your users get lost in low contrast. Return to our AI-powered WCAG contrast checker."
        metaRobots="noindex, nofollow"
      />
      <Layout>
        <div className="min-h-screen flex items-center justify-center py-12">
          <div className="text-center max-w-2xl mx-auto px-4">
            {/* Visual 404 Indicator */}
            <div className="relative mb-8">
              <div className="text-[10rem] md:text-[12rem] font-black text-primary/10 leading-none select-none" aria-hidden="true">
                404
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center">
                  <Palette className="w-12 h-12 text-primary" aria-hidden="true" />
                </div>
              </div>
            </div>
            
            {/* Accessibility-Themed Headline */}
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Lost your way?
            </h1>
            <p className="text-xl md:text-2xl text-primary font-semibold mb-4">
              Don't let your users get lost in low contrast.
            </p>
            <p className="text-base text-foreground/70 mb-8 max-w-lg mx-auto leading-relaxed">
              The page you're looking for doesn't exist. But while you're here, 
              why not check if your colors are accessible? Our AI can help you 
              fix contrast issues instantly.
            </p>
            
            {/* Primary CTA - Contrast Analyzer */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Button asChild size="lg" className="gap-2 text-base font-semibold px-8">
                <Link to="/">
                  <Zap className="w-5 h-5" aria-hidden="true" />
                  Go to Contrast Analyzer
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link to="/">
                  <Home className="w-4 h-4" aria-hidden="true" />
                  Return Home
                </Link>
              </Button>
            </div>

            {/* Secondary Navigation Cards */}
            <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto">
              <Card className="p-4 hover:border-primary/40 transition-colors">
                <Link to="/blog" className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Accessibility Blog</p>
                    <p className="text-xs text-foreground/60">Learn WCAG best practices</p>
                  </div>
                </Link>
              </Card>
              <Card className="p-4 hover:border-primary/40 transition-colors">
                <Link to="/resources" className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Palette className="w-5 h-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Resources</p>
                    <p className="text-xs text-foreground/60">WCAG guides & tools</p>
                  </div>
                </Link>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default NotFound;
