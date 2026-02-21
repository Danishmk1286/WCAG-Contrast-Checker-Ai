import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Scroll threshold - show button after scrolling this many pixels
const SCROLL_THRESHOLD = 400;

const ScrollToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Check if user prefers reduced motion
  const prefersReducedMotion = useCallback(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Handle scroll event with throttling - avoid forced reflow
  useEffect(() => {
    let ticking = false;
    let lastScrollY = 0;
    let rafId: number | null = null;

    const handleScroll = () => {
      if (!ticking) {
        // Cancel any pending RAF to avoid multiple queued callbacks
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
        
        rafId = requestAnimationFrame(() => {
          // Batch all layout reads in a single RAF callback
          const currentScrollY = window.scrollY || window.pageYOffset || 0;
          
          // Only update state if scroll position changed significantly
          if (Math.abs(currentScrollY - lastScrollY) > 50 || lastScrollY === 0) {
            lastScrollY = currentScrollY;
            setIsVisible(currentScrollY > SCROLL_THRESHOLD);
          }
          
          ticking = false;
          rafId = null;
        });
        ticking = true;
      }
    };

    // Initial check - defer to avoid blocking initial render
    rafId = requestAnimationFrame(() => {
      lastScrollY = window.scrollY || window.pageYOffset || 0;
      setIsVisible(lastScrollY > SCROLL_THRESHOLD);
      rafId = null;
    });

    // Add scroll listener with passive flag
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  // Scroll to top handler - avoid forced reflow
  const scrollToTop = useCallback(() => {
    // Use requestAnimationFrame to batch layout reads and avoid forced reflow
    requestAnimationFrame(() => {
      if (prefersReducedMotion()) {
        // Instant scroll for reduced motion preference
        window.scrollTo({
          top: 0,
          behavior: 'auto'
        });
      } else {
        // Smooth scroll to top
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    });
  }, [prefersReducedMotion]);

  // Handle keyboard activation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollToTop();
    }
  }, [scrollToTop]);

  if (!isVisible) return null;

  return (
    <Button
      onClick={scrollToTop}
      onKeyDown={handleKeyDown}
      className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:text-primary-foreground hover:opacity-100 focus:bg-primary/90 focus:text-primary-foreground focus:opacity-100 active:bg-primary/80 active:text-primary-foreground active:opacity-100 transition-all duration-200 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      aria-label="Back to top"
      title="Back to top"
    >
      <ArrowUp className="w-5 h-5" />
    </Button>
  );
};

export default ScrollToTop;



