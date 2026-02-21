import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Star, Github, X, ExternalLink, Sparkles } from 'lucide-react';
import {
  getTotalChecks,
  incrementTotalChecks,
  getLastPopupCheckCount,
  setLastPopupCheckCount,
  isPermanentlyDismissed,
  setPermanentlyDismissed,
  isSessionSuppressed,
  setSessionSuppressed,
  shouldShowPopup,
  handlePopupClose,
  handlePermanentDismissal,
} from '@/lib/githubPopupLogic';

const GitHubAppreciationPopup: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  /**
   * Check if popup should be visible based on current state
   * This is a pure function call that evaluates all conditions
   */
  const checkVisibility = useCallback(() => {
    const totalChecks = getTotalChecks();
    const lastPopupCheckCount = getLastPopupCheckCount();
    const permanentlyDismissed = isPermanentlyDismissed();
    const sessionSuppressed = isSessionSuppressed();
    const currentlyVisible = isVisible;

    const shouldShow = shouldShowPopup(
      totalChecks,
      lastPopupCheckCount,
      permanentlyDismissed,
      sessionSuppressed,
      currentlyVisible
    );

    if (shouldShow && !isVisible) {
      setIsVisible(true);
      setLastPopupCheckCount(totalChecks);
    }
  }, [isVisible]);

  // Listen for contrast check completion events
  useEffect(() => {
    const handleContrastCheck = () => {
      // Increment total checks
      incrementTotalChecks();
      
      // Check if popup should be shown
      // Use setTimeout to ensure state updates are processed
      setTimeout(() => {
        checkVisibility();
      }, 100);
    };

    window.addEventListener('contrastCheckCompleted', handleContrastCheck);

    // Initial check on mount
    checkVisibility();

    return () => {
      window.removeEventListener('contrastCheckCompleted', handleContrastCheck);
    };
  }, [checkVisibility]);

  /**
   * Handle popup close (temporary dismissal)
   * User clicked X or "Nah, I'm good"
   */
  const handleClose = useCallback(() => {
    const currentCheckCount = getTotalChecks();
    handlePopupClose(currentCheckCount);
    setIsVisible(false);
  }, []);

  /**
   * Handle GitHub action (Star or View Repo)
   * This permanently dismisses the popup
   */
  const handleGitHubAction = useCallback(async (action: string) => {
    // Prevent duplicate triggers
    if (!isVisible) return;
    
    // Track the action
    console.log(`User clicked: ${action}`);

    // Permanently dismiss popup
    const currentCheckCount = getTotalChecks();
    handlePermanentDismissal(currentCheckCount);
    
    // Close popup immediately to prevent double-clicks
    setIsVisible(false);
    
    // Open GitHub repository in new tab
    const githubWindow = window.open('https://github.com/Danishmk1286/WCAG-Contrast-Checker-Ai', '_blank');
    
    // Track the click event
    try {
      const { getApiBaseUrl } = await import('@/lib/api');
      const API_BASE = getApiBaseUrl();
      const sessionId = localStorage.getItem('analytics_session_id');
      
      if (sessionId) {
        // Log GitHub action click
        fetch(`${API_BASE}/analytics/event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            eventType: 'github_action_click',
            eventData: { action, timestamp: new Date().toISOString() },
          }),
        }).catch(() => {});
      }
      
      // Track in Google Analytics if available
      if (window.gtag) {
        window.gtag('event', 'github_action', {
          event_category: 'engagement',
          event_label: action,
          value: 1
        });
      }
    } catch (error) {
      console.error('Failed to track GitHub action:', error);
    }
    
    // Monitor if user actually stars the repo
    if (action === 'star' && githubWindow) {
      // Check periodically if user is on GitHub and might have starred
      // Note: We can't directly check if they starred due to CORS, but we can track the intent
      let checkCount = 0;
      const maxChecks = 20; // Check for 20 seconds
      
      const checkInterval = setInterval(() => {
        checkCount++;
        
        // If window is closed or we've checked enough times, stop
        if (githubWindow.closed || checkCount >= maxChecks) {
          clearInterval(checkInterval);
          
          // If window was open for a while, assume user might have starred
          if (checkCount >= 5 && !githubWindow.closed) {
            // Use IIFE to handle async code in setInterval
            (async () => {
              try {
                const { getApiBaseUrl } = await import('@/lib/api');
                const API_BASE = getApiBaseUrl();
                const sessionId = localStorage.getItem('analytics_session_id');
                
                if (sessionId) {
                  // Log potential star (user spent time on GitHub page)
                  fetch(`${API_BASE}/analytics/event`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      sessionId,
                      eventType: 'github_star_intent',
                      eventData: { 
                        action: 'star',
                        timeSpent: checkCount,
                        timestamp: new Date().toISOString() 
                      },
                    }),
                  }).catch(() => {});
                }
                
                if (window.gtag) {
                  window.gtag('event', 'github_star_intent', {
                    event_category: 'engagement',
                    event_label: 'star_clicked',
                    value: checkCount
                  });
                }
              } catch (error) {
                console.error('Failed to track star intent:', error);
              }
            })();
          }
        }
      }, 1000); // Check every second
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      <style>{`
        @keyframes githubPopupSlideIn {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .github-popup-container {
          animation: githubPopupSlideIn 0.5s ease-out;
        }
      `}</style>
      <div 
        className="fixed bottom-4 right-4 z-[100] max-w-sm w-[calc(100%-2rem)] sm:w-auto github-popup-container"
      >
        <Card className="border-2 border-primary/30 shadow-2xl bg-card/95 backdrop-blur-sm">
        <CardHeader className="relative pb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="absolute right-1 top-1 h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-full"
            aria-label="Close popup"
          >
            <X className="w-4 h-4" />
          </Button>
          
          <div className="text-center pt-1 pr-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center mx-auto mb-3 relative">
              <Sparkles className="w-6 h-6 text-primary-foreground animate-pulse" />
              <Star className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1 animate-bounce" />
            </div>
            
            <CardTitle className="text-lg text-foreground mb-1.5 font-bold">
              Loving this tool? ⭐
            </CardTitle>
            
            <p className="text-xs text-muted-foreground leading-relaxed px-2">
              If this contrast checker made your life easier (or at least less frustrating), 
              a GitHub star would make our day! 🚀
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-2 pt-0">
          {/* GitHub Actions */}
          <div className="space-y-2">
            <Button
              onClick={() => handleGitHubAction('star')}
              className="w-full gap-2 bg-foreground text-background hover:bg-foreground/90 text-sm"
              size="sm"
            >
              <Github className="w-4 h-4" />
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              Star on GitHub
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
            
            <Button
              onClick={() => handleGitHubAction('fork')}
              variant="outline"
              className="w-full gap-2 text-sm"
              size="sm"
            >
              <Github className="w-4 h-4" />
              View Repo
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            onClick={handleClose}
            className="w-full text-muted-foreground hover:text-foreground text-xs h-8"
            size="sm"
          >
            Nah, I'm good 😎
          </Button>
        </CardContent>
      </Card>
      </div>
    </>
  );
};

export default GitHubAppreciationPopup;