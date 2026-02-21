import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
// Tree-shake lucide-react imports for better performance
import Info from "lucide-react/dist/esm/icons/info";
import Share from "lucide-react/dist/esm/icons/share";
import Menu from "lucide-react/dist/esm/icons/menu";
import Zap from "lucide-react/dist/esm/icons/zap";
import LogOut from "lucide-react/dist/esm/icons/log-out";
import Settings from "lucide-react/dist/esm/icons/settings";
import logoImage from "@/assets/logo.png";
import logoWebp from "@/assets/logo.webp";
import logoAvif from "@/assets/logo.avif";
import OptimizedImage from "@/components/OptimizedImage";
import { getApiBaseUrl } from "@/lib/api";
import { fetchWithTimeout } from "@/lib/apiClient";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const API_BASE = getApiBaseUrl();

  // Check if user is authenticated - NON-BLOCKING with timeout
  useEffect(() => {
    // Defer auth check to avoid blocking critical rendering path
    const timeoutId = setTimeout(() => {
      const checkAuth = async () => {
        try {
          console.log('[Auth] 🔄 Checking authentication (non-blocking)...');
          const response = await fetchWithTimeout(`${API_BASE}/admin/verify`, {
            method: "GET",
            timeout: 3000, // 3 second timeout - balance between fast fail and reliability
            logPrefix: '[Auth]',
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });
          
          // 401 is expected for non-authenticated users - don't log as error
          if (response.status === 401) {
            console.log('[Auth] ✅ User not authenticated (expected)');
            setIsAuthenticated(false);
            return;
          }
          
          if (response.status === 200) {
            console.log('[Auth] ✅ User authenticated');
            setIsAuthenticated(true);
            return;
          }
          
          // Other status codes (404, 500, etc.) - log for debugging but don't treat as auth failure
          if (response.status !== 200 && response.status !== 401) {
            console.warn(`[Auth] ⚠️ Unexpected status: ${response.status}`);
          }
          
          setIsAuthenticated(response.ok);
        } catch (error: any) {
          // Network errors, timeouts, or CORS issues - non-fatal
          console.warn(`[Auth] ⚠️ Auth check failed (non-fatal): ${error?.message || error}`);
          setIsAuthenticated(false);
        }
      };
      checkAuth();
    }, 100); // Defer by 100ms to allow initial render to complete

    return () => clearTimeout(timeoutId);
  }, [location, API_BASE]);

  const handleLogout = async () => {
    // Call backend logout to clear secure cookie
    try {
      const response = await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include", // Required for cookie-based authentication
      });
      
      // 401 is OK - session may already be expired
      if (!response.ok && response.status !== 401) {
        console.warn("Logout endpoint returned:", response.status);
      }
    } catch (error) {
      // Non-fatal – logout should still proceed client-side
      // Network errors are OK - we'll still clear client-side state
      console.error("Header logout error (non-fatal):", error);
    }

    // Clear client-side auth state securely
    setIsAuthenticated(false);

    // Always send the user to the Admin login page.
    // Use full reload so the Admin page re-mounts and shows the login form.
    // This ensures all session data is cleared
    if (location.pathname.startsWith("/admin")) {
      window.location.href = "/admin";
    } else {
      navigate("/admin", { replace: true });
    }
  };

  // Helper function to check if a path is active
  const isActivePath = (path: string) => {
    // Exact match for homepage
    if (path === "/") {
      return location.pathname === "/";
    }
    // StartsWith match for nested pages (like /blog or /blog/post-slug)
    return location.pathname.startsWith(path);
  };

  // Helper function to get navigation link classes (Desktop) - consistent styling
  const getNavLinkClasses = (path: string) => {
    const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 aria-disabled:pointer-events-none aria-disabled:opacity-50 transition-all duration-200";
    return isActivePath(path)
      ? `${baseClasses} bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm hover:shadow-md [&:hover]:text-primary-foreground active:bg-primary/80 active:text-primary-foreground focus-visible:ring-primary focus-visible:ring-offset-2 h-10 px-4 py-2 gap-2`
      : `${baseClasses} text-muted-foreground hover:text-foreground hover:bg-muted [&_span]:text-muted-foreground [&:hover_span]:text-foreground [&_svg]:text-muted-foreground [&:hover_svg]:text-foreground active:bg-accent/90 active:text-foreground focus-visible:ring-accent h-10 px-4 py-2 gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent`;
  };

  // Navigation items with proper SEO structure
  const navItems = [
    { path: "/", label: "Contrast Tool", icon: <Zap className="w-4 h-4" />, description: "Check color contrast ratios for WCAG compliance" },
    { path: "/about", label: "About", icon: <Info className="w-4 h-4" />, description: "About our WCAG compliance tool" },
  ];

  // Helper function to get mobile navigation link classes - consistent styling
  const getMobileNavLinkClasses = (path: string) => {
    const baseClasses =
      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 aria-disabled:pointer-events-none aria-disabled:opacity-50 transition-all duration-200 justify-start gap-3 h-12 text-base";
    return isActivePath(path)
      ? `${baseClasses} bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm [&:hover]:text-primary-foreground active:bg-primary/80 active:text-primary-foreground focus-visible:ring-primary focus-visible:ring-offset-2`
      : `${baseClasses} text-muted-foreground hover:text-foreground hover:bg-muted [&_span]:text-muted-foreground [&:hover_span]:text-foreground [&_svg]:text-muted-foreground [&:hover_svg]:text-foreground active:bg-accent/90 active:text-foreground focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent`;
  };

  const handleShareClick = async () => {
    const url = window.location.href;
    const text = "Check out Smart Color Contrast Assistant - AI-powered WCAG & ADA compliance checker! 🎨";

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Smart Color Contrast Assistant",
          text: text,
          url: url,
        });
      } catch (error) {
        // If share fails (permission denied or not supported), fallback to Twitter
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          text
        )}&url=${encodeURIComponent(url)}`;
        window.open(shareUrl, "_blank");
      }
    } else {
      // Fallback to Twitter
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        text
      )}&url=${encodeURIComponent(url)}`;
      window.open(shareUrl, "_blank");
    }
  };

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Logo (H1 content should be in the body, so this remains a link/span for architecture) */}
          <Link to="/" className="flex items-center gap-2 md:gap-3">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center">
              <OptimizedImage
                src={logoImage}
                webpSrc={logoWebp}
                avifSrc={logoAvif}
                alt="Smart Color Contrast Assistant - AI-Powered WCAG & ADA Checker Logo"
                className="w-full h-full rounded-lg"
                priority={true}
                width={32}
                height={32}
              />
            </div>
            <span className="text-base md:text-lg font-semibold text-foreground hidden sm:block">
              Smart Color Contrast Assistant
            </span>
            <span className="text-sm font-semibold text-foreground sm:hidden">
              Smart Contrast
            </span>
          </Link>

          {/* Right side - Navigation and Actions */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2 mr-2" aria-label="Main navigation">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  asChild
                  className={getNavLinkClasses(item.path)}
                  title={item.description}
                >
                  <Link to={item.path}>
                    {item.icon}
                    <span className="hidden md:inline">{item.label}</span>
                  </Link>
                </Button>
              ))}
            </nav>

            {/* Desktop Share Button */}
            <Button
              variant="ghost"
              onClick={handleShareClick}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 aria-disabled:pointer-events-none aria-disabled:opacity-50 transition-colors focus-visible:ring-accent h-9 rounded-md px-3 gap-2 text-muted-foreground hover:text-foreground hover:bg-muted hidden md:flex"
            >
              <Share className="w-4 h-4" />
              <span className="hidden md:inline">Share</span>
            </Button>

            {/* Admin/Logout Button */}
            {isAuthenticated && (
              <>
                <Button
                  variant="ghost"
                  asChild
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 aria-disabled:pointer-events-none aria-disabled:opacity-50 focus-visible:ring-accent h-9 rounded-md px-3 gap-2 text-muted-foreground hover:text-foreground hover:bg-muted hidden md:flex"
                >
                  <Link to="/admin">
                    <Settings className="w-4 h-4" />
                    <span className="hidden md:inline">Admin</span>
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 aria-disabled:pointer-events-none aria-disabled:opacity-50 focus-visible:ring-accent h-9 rounded-md px-3 gap-2 text-muted-foreground hover:text-foreground hover:bg-muted hidden md:flex"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Logout</span>
                </Button>
              </>
            )}

            <ThemeToggle />

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <Menu className="w-4 h-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center">
                        <img
                          src={logoImage}
                          alt="Smart Color Contrast Assistant - AI-Powered WCAG & ADA Checker Logo"
                          width="40"
                          height="40"
                          className="w-full h-full rounded-md"
                          loading="eager"
                        />
                      </div>
                      <span className="text-sm font-semibold">Navigation</span>
                    </div>
                  </div>

                  {/* Mobile Navigation */}
                  <nav className="flex flex-col gap-2 py-6" aria-label="Main navigation">
                    {navItems.map((item) => (
                      <Button
                        key={item.path}
                        variant="ghost"
                        asChild
                        className={getMobileNavLinkClasses(item.path)}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Link to={item.path}>
                          {item.icon}
                          {item.label}
                        </Link>
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      onClick={() => {
                        handleShareClick();
                        setIsMobileMenuOpen(false);
                      }}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 aria-disabled:pointer-events-none aria-disabled:opacity-50 transition-colors justify-start gap-3 h-12 text-base text-muted-foreground hover:text-foreground hover:bg-muted [&_span]:text-muted-foreground [&:hover_span]:text-foreground [&_svg]:text-muted-foreground [&:hover_svg]:text-foreground active:bg-accent/90 active:text-foreground focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                      <Share className="w-5 h-5" />
                      <span>Share Tool</span>
                    </Button>
                    {isAuthenticated && (
                      <>
                        <Button
                          variant="ghost"
                          asChild
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 aria-disabled:pointer-events-none aria-disabled:opacity-50 transition-colors justify-start gap-3 h-12 text-base text-muted-foreground hover:text-foreground hover:bg-muted [&_span]:text-muted-foreground [&:hover_span]:text-foreground [&_svg]:text-muted-foreground [&:hover_svg]:text-foreground active:bg-accent/90 active:text-foreground focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Link to="/admin">
                            <Settings className="w-5 h-5" />
                            <span>Admin Panel</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            handleLogout();
                            setIsMobileMenuOpen(false);
                          }}
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 aria-disabled:pointer-events-none aria-disabled:opacity-50 transition-colors justify-start gap-3 h-12 text-base text-muted-foreground hover:text-foreground hover:bg-muted [&_span]:text-muted-foreground [&:hover_span]:text-foreground [&_svg]:text-muted-foreground [&:hover_svg]:text-foreground active:bg-accent/90 active:text-foreground focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        >
                          <LogOut className="w-5 h-5" />
                          <span>Logout</span>
                        </Button>
                      </>
                    )}
                  </nav>

                  {/* Mobile Footer */}
                  <div className="mt-auto pt-4 border-t border-border">
                    <div className="text-xs text-foreground/80 text-center font-medium">
                      WCAG 2.1 Compliant Tool
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default React.memo(Header);
