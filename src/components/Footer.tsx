import React from "react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
// Tree-shake lucide-react imports for better performance
import Linkedin from "lucide-react/dist/esm/icons/linkedin";
import Github from "lucide-react/dist/esm/icons/github";
import Share2 from "lucide-react/dist/esm/icons/share-2";
import Star from "lucide-react/dist/esm/icons/star";
import Heart from "lucide-react/dist/esm/icons/heart";
const Footer: React.FC = () => {
  const handleShareReview = () => {
    const url = window.location.href;
    const text =
      "Check out Smart Color Contrast Assistant! 🎨 AI-powered WCAG & ADA checker that fixes contrast issues instantly. Highly recommend! ⭐";
    if (navigator.share) {
      navigator.share({
        title: "Smart Color Contrast Assistant Review",
        text: text,
        url: url,
      });
    } else {
      // Fallback to Twitter
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        text
      )}&url=${encodeURIComponent(url)}`;
      window.open(shareUrl, "_blank");
    }
  };
  return (
    <footer className="mt-12 bg-card border-t border-border/60">
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          {/* Legal Links */}
          <div className="flex items-center justify-center gap-4 text-xs md:text-sm text-muted-foreground">
            <a
              href="/privacy-policy"
              className="hover:text-primary transition-colors"
            >
              Privacy Policy
            </a>
            <span className="text-border">•</span>
            <a
              href="/terms-of-service"
              className="hover:text-primary transition-colors"
            >
              Terms of Service
            </a>
          </div>
          
          <div className="text-xs md:text-sm text-muted-foreground">
            © 2024 Smart Color Contrast Assistant. All rights reserved.
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <span className="text-muted-foreground">Created by</span>
            <a
              href="https://www.linkedin.com/in/danishmk1286/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-medium"
            >
              <Linkedin className="w-3.5 h-3.5" />
              Danish Khan
            </a>
            <span className="text-border">•</span>
            <a
              href="https://github.com/Danishmk1286/WCAG-Contrast-Checker-Ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-medium"
              aria-label="View project on GitHub"
            >
              <Github className="w-3.5 h-3.5" />
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default React.memo(Footer);
