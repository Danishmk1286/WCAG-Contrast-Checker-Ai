import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Cookie, Shield } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
// Import long library to provide Long class for Google Analytics
import Long from 'long';

// Extend Window interface for Google Analytics
declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    Long?: any; // Long class from long.js library (used by Google Analytics)
  }
}

// Helper functions (defined outside component)
const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length);
  }
  return null;
};

const getWithExpiry = (key: string): string | null => {
  try {
    const str = localStorage.getItem(key);
    if (!str) return null;
    const item = JSON.parse(str);
    if (item && typeof item.expiry === 'number' && Date.now() < item.expiry) {
      return item.value as string;
    }
    localStorage.removeItem(key);
    return null;
  } catch {
    return null;
  }
};

// Cached measurement ID to avoid multiple fetches
let cachedMeasurementId: string | null = null;
let isFetchingId = false;

// Load Google Analytics function - properly implements GA4 dynamic loading
const loadGoogleAnalytics = async (measurementId?: string): Promise<void> => {
  // CRITICAL: Make Long class available globally before GA loads
  // Google Analytics' hash_util.js needs Long.fromString at module load time
  if (typeof window.Long === 'undefined') {
    (window as any).Long = Long;
    console.log('[Analytics] Long class made available globally');
  }
  
  console.log("GA loader entered");
  
  // Check Do Not Track signal - only exit early if DNT is enabled (consent is effectively false)
  if (navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes') {
    console.log('[Analytics] Do Not Track enabled - skipping Google Analytics');
    return;
  }

  // Check if script already exists
  const existing = document.querySelector('script[src*="googletagmanager"]');
  if (existing) {
    console.log('[Analytics] Google Analytics script already loaded');
    return;
  }

  // Prevent multiple simultaneous loads
  if ((window as any).__gaLoading) {
    console.log('[Analytics] GA loader already running');
    return;
  }

  // Set lock
  (window as any).__gaLoading = true;

  try {
    // Get Measurement ID - use cached if available, otherwise fetch once
    let finalMeasurementId = measurementId || cachedMeasurementId;
    
    if (!finalMeasurementId && !isFetchingId) {
      isFetchingId = true;
      try {
        const apiBase = getApiBaseUrl();
        console.log('[Analytics] Fetching Measurement ID from:', `${apiBase}/config/ga-measurement-id`);
        const response = await fetch(`${apiBase}/config/ga-measurement-id`);
        
        // Check content-type BEFORE reading body
        const contentType = response.headers.get('content-type');
        console.log('[Analytics] Response status:', response.status, 'Content-Type:', contentType);
        
        if (!response.ok || !contentType || !contentType.includes('application/json')) {
          // Only read text if it's not JSON
          const text = await response.text();
          console.error('[Analytics] Backend returned non-JSON response:', text.substring(0, 200));
          (window as any).__gaLoading = false;
          isFetchingId = false;
          return;
        }
        
        // Parse JSON only if content-type is correct
        const data = await response.json();
        console.log('[Analytics] Received Measurement ID:', data.measurementId ? 'YES' : 'NO');
        finalMeasurementId = data.measurementId || null;
        if (finalMeasurementId) {
          cachedMeasurementId = finalMeasurementId;
          console.log('[Analytics] Measurement ID cached:', finalMeasurementId);
        }
      } catch (error: any) {
        // Handle JSON parse errors specifically
        if (error instanceof SyntaxError && error.message.includes('JSON')) {
          console.error('[Analytics] Backend returned invalid JSON (likely HTML error page):', error.message);
        } else {
          console.error('[Analytics] Failed to fetch Measurement ID from backend:', error);
        }
        (window as any).__gaLoading = false;
        isFetchingId = false;
        return;
      } finally {
        isFetchingId = false;
      }
    }

    // Wait if ID is being fetched (with timeout)
    let waitCount = 0;
    while (isFetchingId && waitCount < 50) { // Max 5 seconds wait
      await new Promise(resolve => setTimeout(resolve, 100));
      waitCount++;
    }
    
    finalMeasurementId = finalMeasurementId || cachedMeasurementId;
    console.log('[Analytics] Final Measurement ID:', finalMeasurementId || 'NOT FOUND');

    if (!finalMeasurementId) {
      console.error('[Analytics] No Measurement ID configured - Google Analytics disabled');
      (window as any).__gaLoading = false;
      return;
    }

    // Validate Measurement ID format (GA4 format: G-XXXXXXXXXX)
    const gaIdPattern = /^G-[A-Z0-9]{10}$/;
    if (!gaIdPattern.test(finalMeasurementId)) {
      console.error('[Analytics] Invalid Measurement ID format:', finalMeasurementId);
      console.error('[Analytics] Expected format: G-XXXXXXXXXX (e.g., G-1234567890)');
      (window as any).__gaLoading = false;
      return;
    }

    // Step 1: Initialize dataLayer and gtag function BEFORE loading script
    window.dataLayer = window.dataLayer || [];
    
    function gtag(...args: any[]) {
      window.dataLayer!.push(args);
    }
    
    window.gtag = gtag;
    
    // Step 2: Set gtag.js date
    gtag('js', new Date());
    
    // Step 3: Configure GA4 with privacy settings BEFORE script loads
    gtag('config', finalMeasurementId, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      send_page_view: true,
      // Cookie settings for compliance with browser restrictions - use first-party cookies
      cookie_flags: 'SameSite=Lax;Secure',
      cookie_expires: 63072000, // 2 years in seconds
      cookie_update: true,
    });
    
    console.log('[Analytics] Config executed with ID:', finalMeasurementId);

    // Step 4: Create and inject script - MUST HAPPEN
    // Double-check script doesn't exist
    const existingCheck = document.querySelector('script[src*="googletagmanager"]');
    if (existingCheck) {
      console.log('[Analytics] Script already exists, skipping injection');
      (window as any).__gaLoading = false;
      return;
    }

    // CRITICAL: Ensure Long class is available globally before loading GA script
    // hash_util.js executes immediately when GA loads and needs Long.fromString
    if (typeof window.Long === 'undefined') {
      (window as any).Long = Long;
      console.log('[Analytics] Long class set globally before GA script load');
    } else if (typeof (window as any).Long.fromString !== 'function') {
      // Fallback: if Long exists but fromString is missing, use the imported Long
      (window as any).Long = Long;
      console.log('[Analytics] Long.fromString missing, using imported Long class');
    }
    
    const script = document.createElement('script');
    // Ensure Measurement ID is properly encoded (though it shouldn't need it for standard IDs)
    const encodedId = encodeURIComponent(finalMeasurementId);
    const scriptUrl = `https://www.googletagmanager.com/gtag/js?id=${encodedId}`;
    
    // Log the exact URL being used for debugging
    console.log('[Analytics] Loading GA script with URL:', scriptUrl);
    console.log('[Analytics] Measurement ID:', finalMeasurementId);
    console.log('[Analytics] Long polyfill available:', typeof window.Long !== 'undefined' && typeof window.Long.fromString === 'function');
    
    script.src = scriptUrl;
    script.async = true;
    script.crossOrigin = 'anonymous';
    // Add error handler to catch and suppress Long.js errors (they're non-fatal)
    script.onerror = (e) => {
      // If Long.js error occurs, it's usually non-fatal - GA will still work
      console.warn('[Analytics] Script load warning (may be non-fatal):', e);
    };
    
    script.onload = () => {
      console.log('[Analytics] GA script loaded successfully from:', scriptUrl);
      (window as any).__gaLoading = false;
      
      // Verify GA is working
      if (window.gtag && typeof window.gtag === 'function') {
        console.log('[Analytics] ✅ Google Analytics is now active and ready');
        // Send a test page view to verify it's working
        try {
          window.gtag('event', 'consent_granted', {
            event_category: 'privacy',
            event_label: 'user_consent'
          });
          console.log('[Analytics] ✅ Test event sent successfully');
        } catch (e) {
          console.error('[Analytics] ❌ Failed to send test event:', e);
        }
      } else {
        console.error('[Analytics] ❌ Script loaded but gtag function not available');
      }
    };
    
    script.onerror = (e) => {
      console.error('[Analytics] ❌ GA script failed to load from:', scriptUrl);
      console.error('[Analytics] Error details:', e);
      console.error('[Analytics] Measurement ID used:', finalMeasurementId);
      console.error('[Analytics]');
      console.error('[Analytics] ⚠️  Possible causes:');
      console.error('[Analytics]    1. Ad blocker or privacy extension (uBlock, Privacy Badger, etc.)');
      console.error('[Analytics]    2. Browser privacy settings blocking third-party scripts');
      console.error('[Analytics]    3. Network/CORS issues');
      console.error('[Analytics]    4. Corporate firewall blocking Google domains');
      console.error('[Analytics]    5. Browser extension interfering');
      console.error('[Analytics]');
      console.error('[Analytics] Note: If the Measurement ID is correct in GA4, the 404 may be:');
      console.error('[Analytics]     - A false positive from an ad blocker');
      console.error('[Analytics]     - The script is actually loading but showing 404 in Network tab');
      console.error('[Analytics]     - Check if gtag function exists: typeof window.gtag =', typeof window.gtag);
      console.error('[Analytics]');
      console.error('[Analytics] To verify:');
      console.error('[Analytics]    1. Disable ad blockers and try again');
      console.error('[Analytics]    2. Check Network tab - look for successful gtag.js response');
      console.error('[Analytics]    3. Check if window.gtag exists after script load');
      console.error('[Analytics]    4. Verify in GA4 Real-Time reports if events are being received');
      
      // Check if gtag actually exists despite the error (ad blockers sometimes fake 404s)
      setTimeout(() => {
        if (window.gtag && typeof window.gtag === 'function') {
          console.warn('[Analytics] ⚠️  Script showed error but gtag function exists - likely ad blocker false positive');
          console.warn('[Analytics] Google Analytics may actually be working. Check GA4 Real-Time reports.');
          (window as any).__gaLoading = false;
        }
      }, 2000);
      
      // Check for common blocking scenarios
      const possibleCauses = [];
      
      // Check if script was blocked by CSP
      const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      const cspHeader = document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content');
      if (cspMeta || cspHeader) {
        possibleCauses.push('Content Security Policy (CSP) may be blocking the script');
        console.warn('[Analytics] CSP found:', cspHeader || 'in meta tag');
      }
      
      // Check browser privacy settings
      if (navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes') {
        possibleCauses.push('Do Not Track (DNT) is enabled');
      }
      
      // Check network connectivity
      if (!navigator.onLine) {
        possibleCauses.push('No internet connection');
      }
      
      // Check if request appears in Network tab (heuristic - can't directly check, but log info)
      console.warn('[Analytics] To debug: Open Network tab, filter by "gtag", and check if request appears');
      console.warn('[Analytics] If request appears but fails: Check status code and CORS headers');
      console.warn('[Analytics] If request doesn\'t appear: Likely blocked by browser/privacy settings');
      
      // Check for browser privacy features
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('firefox')) {
        possibleCauses.push('Firefox Enhanced Tracking Protection may be blocking');
      }
      if (userAgent.includes('safari')) {
        possibleCauses.push('Safari Intelligent Tracking Prevention may be blocking');
      }
      if (userAgent.includes('edge')) {
        possibleCauses.push('Edge Tracking Prevention may be blocking');
      }
      
      if (possibleCauses.length > 0) {
        console.warn('[Analytics] Possible causes:', possibleCauses.join(', '));
      } else {
        console.warn('[Analytics] Unknown cause - check Network tab for blocked request');
      }
      
      console.warn('[Analytics] Google Analytics will not track this session. This is non-fatal and the site will continue to work normally.');
      (window as any).__gaLoading = false;
    };
    
    // Log before append with full URL
    console.log('[Analytics] Injecting GA script NOW:', scriptUrl);
    console.log('[Analytics] Script element created:', script);
    console.log('[Analytics] Document head exists:', !!document.head);
    
    // Append script to document.head - THIS MUST EXECUTE
    try {
      document.head.appendChild(script);
      console.log('[Analytics] Script appended to head - check Network tab for request');
      
      // Immediate verification
      const verifyImmediate = document.querySelector('script[src*="googletagmanager"]');
      if (verifyImmediate) {
        console.log('[Analytics] Script verified in DOM immediately:', verifyImmediate.getAttribute('src'));
      } else {
        console.error('[Analytics] Script NOT found in DOM after append!');
      }
    } catch (appendError) {
      console.error('[Analytics] Error appending script:', appendError);
      (window as any).__gaLoading = false;
      return;
    }
    
    // HARD FAIL check after 2 seconds
    setTimeout(() => {
      const verifyScript = document.querySelector('script[src*="googletagmanager"]');
      if (!verifyScript) {
        console.error('[Analytics] GA injection FAILED - script not in DOM after 2 seconds');
        (window as any).__gaLoading = false;
      } else {
        console.log('[Analytics] Script verified after 2 seconds:', verifyScript.getAttribute('src'));
        // Check if script actually loaded
        if (!window.gtag || typeof window.gtag !== 'function') {
          console.error('[Analytics] Script in DOM but gtag function not available');
        }
      }
    }, 2000);
    
  } catch (error) {
    console.error('[Analytics] Error in loadGoogleAnalytics:', error);
    (window as any).__gaLoading = false;
  }
};

const GDPRNotice: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Cookie/localStorage helpers with expiry
  const setCookie = (name: string, value: string, days: number) => {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    const secure = window.location.protocol === 'https:' ? ';Secure' : '';
    document.cookie = `${name}=${value};expires=${expires};path=/;SameSite=Strict${secure}`;
  };

  const setWithExpiry = (key: string, value: string, days: number) => {
    try {
      const item = { value, expiry: Date.now() + days * 24 * 60 * 60 * 1000 };
      localStorage.setItem(key, JSON.stringify(item));
    } catch {}
  };

  // Track basic presence (page view) - minimal tracking that doesn't require consent
  // This tracks user presence on page load, even before GDPR consent
  const trackBasicPresence = async () => {
    try {
      const { getApiBaseUrl } = await import('@/lib/api');
      const API_BASE = getApiBaseUrl();
      
      // Get or create session ID for basic tracking
      let sessionId = localStorage.getItem('analytics_session_id');
      if (!sessionId) {
        try {
          const response = await fetch(`${API_BASE}/analytics/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              referrer: document.referrer,
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString()
            }),
          });
          if (response.ok) {
            const data = await response.json();
            sessionId = data.sessionId;
            localStorage.setItem('analytics_session_id', sessionId);
          }
        } catch (error) {
          console.error('[Analytics] Failed to create session for basic tracking:', error);
        }
      }
      
      // Log basic page view (presence tracking)
      if (sessionId) {
        fetch(`${API_BASE}/analytics/event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            eventType: 'page_view',
            eventData: { 
              path: window.location.pathname,
              referrer: document.referrer,
              timestamp: new Date().toISOString(),
              consentGiven: false // Track that this is before consent
            },
          }),
        }).catch(() => {}); // Silently fail if tracking fails
      }
    } catch (error) {
      console.error('[Analytics] Failed to track basic presence:', error);
    }
  };

  useEffect(() => {
    // Check Do Not Track signal first
    if (navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes') {
      // Respect Do Not Track - don't show banner or load analytics
      // But still track basic presence (page view) for internal analytics
      trackBasicPresence();
      return;
    }

    // Track basic presence immediately on page load (before consent)
    // This is minimal tracking - just that someone visited the page
    trackBasicPresence();

    // Prefer localStorage with expiry, fallback to cookie
    const stored = getWithExpiry('gdpr-accepted') || getCookie('gdpr-accepted');
    if (!stored) {
      setIsVisible(true);
    } else if (stored === 'true') {
      // If user previously accepted, load full analytics immediately on page load
      if (navigator.doNotTrack !== '1' && navigator.doNotTrack !== 'yes') {
        loadGoogleAnalytics().catch((error) => {
          console.error('[Analytics] Failed to load Google Analytics on page load:', error);
        });
      }
    }
  }, []);

  const handleAccept = async () => {
    console.log('[Analytics] handleAccept called - user accepted consent');
    
    // Check Do Not Track again before accepting
    if (navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes') {
      console.log('[Analytics] Do Not Track enabled, ignoring consent');
      // Even if user accepts, respect DNT
      setWithExpiry('gdpr-accepted', 'declined', 365);
      setCookie('gdpr-accepted', 'declined', 365);
      setIsVisible(false);
      return;
    }

    setWithExpiry('gdpr-accepted', 'true', 365); // 1 year expiry
    setCookie('gdpr-accepted', 'true', 365);
    setIsVisible(false);
    
    // Track consent acceptance
    try {
      const { getApiBaseUrl } = await import('@/lib/api');
      const API_BASE = getApiBaseUrl();
      const sessionId = localStorage.getItem('analytics_session_id');
      
      if (sessionId) {
        fetch(`${API_BASE}/analytics/event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            eventType: 'consent_accepted',
            eventData: { 
              timestamp: new Date().toISOString(),
              consentType: 'full_analytics'
            },
          }),
        }).catch(() => {});
      }
    } catch (error) {
      console.error('[Analytics] Failed to track consent acceptance:', error);
    }
    
    console.log('[Analytics] Consent saved, calling loadGoogleAnalytics...');
    // Load Google Analytics only after consent - properly await async function
    loadGoogleAnalytics().then(() => {
      console.log('[Analytics] loadGoogleAnalytics promise resolved');
    }).catch((error) => {
      console.error('[Analytics] Failed to load Google Analytics after consent:', error);
    });
  };

  const handleDecline = async () => {
    setWithExpiry('gdpr-accepted', 'declined', 365); // 1 year expiry
    setCookie('gdpr-accepted', 'declined', 365);
    setIsVisible(false);
    
    // Track consent decline (still track that user made a choice)
    try {
      const { getApiBaseUrl } = await import('@/lib/api');
      const API_BASE = getApiBaseUrl();
      const sessionId = localStorage.getItem('analytics_session_id');
      
      if (sessionId) {
        fetch(`${API_BASE}/analytics/event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            eventType: 'consent_declined',
            eventData: { 
              timestamp: new Date().toISOString()
            },
          }),
        }).catch(() => {});
      }
    } catch (error) {
      console.error('[Analytics] Failed to track consent decline:', error);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <Card className="max-w-4xl mx-auto border-border bg-card">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Cookie className="w-5 h-5 text-primary" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Privacy & Cookies</h3>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                We use essential cookies and local storage to enhance your experience on our Color Contrast Checker. 
                This includes saving your color preferences and settings. With your consent, we may also use 
                privacy-friendly analytics (Google Analytics) to understand how our tool is used and improve our services. 
                Analytics data is anonymized (IP addresses are anonymized), Google Signals and ad personalization are disabled. 
                We respect your privacy and do not share your data with third parties. By continuing to use our site, you consent to our use of these technologies.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleAccept}
                  size="sm" 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  aria-label="Accept cookies and analytics tracking"
                >
                  Accept & Continue
                </Button>
                <Button 
                  onClick={handleDecline}
                  variant="outline" 
                  size="sm"
                  className="border-border text-muted-foreground hover:text-foreground"
                  aria-label="Decline analytics tracking"
                >
                  Decline
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary/80"
                  asChild
                >
                  <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
                    Learn More
                  </a>
                </Button>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDecline}
              className="flex-shrink-0 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GDPRNotice;