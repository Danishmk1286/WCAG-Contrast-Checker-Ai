// CRITICAL: Ensure React loads FIRST before any other imports
// This ensures React is available before vendor chunks try to use it
import React from 'react'
import * as ReactDOM from 'react-dom'
import { createRoot } from 'react-dom/client'

// PRODUCTION-SAFE LOGGING: Log React availability immediately after import
// This runs before any other module code executes
if (typeof window !== 'undefined') {
  const logPrefix = '[Prod Diagnostic]';
  
  // Log React existence before any hook calls
  console.log(`${logPrefix} React imported:`, typeof React !== 'undefined', React?.version || 'N/A');
  console.log(`${logPrefix} ReactDOM imported:`, typeof ReactDOM !== 'undefined', ReactDOM?.version || 'N/A');
  
  // Log React exports availability
  console.log(`${logPrefix} React.useLayoutEffect:`, typeof React.useLayoutEffect);
  console.log(`${logPrefix} React.useState:`, typeof React.useState);
  console.log(`${logPrefix} React.useEffect:`, typeof React.useEffect);
  
  // Log window.React presence (may be set by dev tools or other scripts)
  console.log(`${logPrefix} window.React:`, typeof window.React);
  console.log(`${logPrefix} window.__REACT_DEVTOOLS_GLOBAL_HOOK__:`, typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
  
  // Log React object structure
  if (React) {
    console.log(`${logPrefix} React exports:`, Object.keys(React).slice(0, 10).join(', '));
  }
  
  // Expose React globally for production safety (shared hosting may have module resolution issues)
  // This ensures React is available even if module resolution fails
  if (typeof window.React === 'undefined') {
    window.React = React;
    console.log(`${logPrefix} Exposed React globally as window.React`);
  }
  
  if (typeof window.ReactDOM === 'undefined') {
    window.ReactDOM = ReactDOM;
    console.log(`${logPrefix} Exposed ReactDOM globally as window.ReactDOM`);
  }
  
  // Verify React is fully functional
  if (typeof React === 'undefined' || typeof React.useLayoutEffect === 'undefined') {
    console.error(`${logPrefix} FATAL: React is not properly loaded!`, {
      React: typeof React,
      useLayoutEffect: typeof React?.useLayoutEffect,
      version: React?.version
    });
    throw new Error('React initialization failed - useLayoutEffect is undefined');
  }
  
  console.log(`${logPrefix} React initialization verified successfully`);
}

// Import CSS - Vite handles this automatically, no need for preload
import './index.css'

// PRODUCTION-SAFE: Ensure React is available before importing App
// App may trigger vendor chunk loading, so React must be ready
if (typeof window !== 'undefined') {
  const logPrefix = '[Prod Diagnostic]';
  
  // Final verification before App import
  if (typeof React === 'undefined' || typeof React.useLayoutEffect === 'undefined') {
    const error = new Error('React not available before App import - vendor chunk may have loaded first');
    console.error(`${logPrefix} FATAL:`, error);
    throw error;
  }
  
  console.log(`${logPrefix} React verified before App import - proceeding to load App`);
}

// Log vendor bundle initialization order
if (typeof window !== 'undefined') {
  console.log('[Prod Diagnostic] About to import App - React ready:', typeof React !== 'undefined');
  console.log('[Prod Diagnostic] Vendor bundle load order will be tracked via console');
}

// Now import App - this may trigger vendor chunk loading
// React must be available before this point
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'

try {
    const rootElement = document.getElementById("root");
    if (!rootElement) {
        throw new Error("Root element not found");
    }
    
    // Final check before render
    if (typeof React === 'undefined' || typeof React.useLayoutEffect === 'undefined') {
      throw new Error('React became undefined after App import - check vendor chunk dependencies');
    }
    
    console.log('[Prod Diagnostic] Rendering App - React verified');
    
    // Wrap App with ErrorBoundary for production error handling
    createRoot(rootElement).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
} catch (error) {
    // Log errors in both dev and production for debugging
    console.error("[App Render Error]", error);
    console.error("[App Render Error] React state:", {
      React: typeof React,
      useLayoutEffect: typeof React?.useLayoutEffect,
      version: React?.version,
      windowReact: typeof window.React
    });
    
    // Display error in DOM as fallback (ErrorBoundary won't catch errors during render setup)
    const errorHTML = `
    <div style="padding: 20px; font-family: monospace; background: #0a0a0a; color: #fff; min-height: 100vh;">
      <h1 style="color: #ef4444;">Error Loading App</h1>
      <pre style="background: #1a1a1a; padding: 10px; border-radius: 4px; color: #fff;">${error instanceof Error ? error.message : String(error)}</pre>
      <details style="margin-top: 10px;">
        <summary style="cursor: pointer; color: #a3a3a3;">Stack Trace</summary>
        <pre style="background: #1a1a1a; padding: 10px; border-radius: 4px; font-size: 10px; color: #a3a3a3; white-space: pre-wrap;">${error instanceof Error ? error.stack : String(error)}</pre>
      </details>
      <details style="margin-top: 10px;">
        <summary style="cursor: pointer; color: #a3a3a3;">React State</summary>
        <pre style="background: #1a1a1a; padding: 10px; border-radius: 4px; font-size: 10px; color: #a3a3a3;">React: ${typeof React}, useLayoutEffect: ${typeof React?.useLayoutEffect}, version: ${React?.version || 'N/A'}</pre>
      </details>
      <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: #fff; border: none; border-radius: 4px; cursor: pointer;">Reload Page</button>
    </div>
  `;
    
    // Try to render error in root element, fallback to body
    if (rootElement) {
      rootElement.innerHTML = errorHTML;
    } else {
      document.body.innerHTML = errorHTML;
    }
}

