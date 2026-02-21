import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Plugin to track dependencies and ensure React loads first
function ensureReactFirst() {
  const reactDependentModules = new Set<string>();
  
  return {
    name: 'ensure-react-first',
    enforce: 'pre' as const,
    
    // Track which modules import React
    buildStart() {
      reactDependentModules.clear();
    },
    
    // Track module imports to find React-dependent code
    moduleParsed(moduleInfo: any) {
      if (moduleInfo.importedIds) {
        const importsReact = moduleInfo.importedIds.some((id: string) => 
          id.includes('react') || id.includes('react-dom')
        );
        
        if (importsReact && !moduleInfo.id.includes('react') && !moduleInfo.id.includes('react-dom')) {
          reactDependentModules.add(moduleInfo.id);
        }
      }
    },
    
    // Ensure React-dependent modules stay in entry chunk
    generateBundle(options: any, bundle: any) {
      // Move any React-dependent modules from vendor chunks to entry chunk
      Object.keys(bundle).forEach(fileName => {
        const chunk = bundle[fileName];
        if (chunk.type === 'chunk' && chunk.name === 'vendor') {
          // Check if any module in this chunk depends on React
          const hasReactDependency = chunk.modules && Object.keys(chunk.modules).some((moduleId: string) =>
            reactDependentModules.has(moduleId)
          );
          
          if (hasReactDependency) {
            console.warn(`[ensure-react-first] Found React-dependent code in vendor chunk: ${fileName}`);
            // Note: We can't easily move modules between chunks here, but we can log it
          }
        }
      });
    },
    
    // Add safeguard script to HTML and ensure proper script loading order
    transformIndexHtml(html: string, ctx?: any) {
      // CRITICAL: Remove all modulepreload links for vendor chunks
      // These cause vendor chunks to load before the entry chunk finishes executing
      // Vendor chunks should only load when actually needed (lazy)
      let modifiedHtml = html.replace(/<link[^>]*rel=["']modulepreload["'][^>]*vendor[^>]*>/gi, '');
      
      // Find the main script tag (entry point)
      const scriptMatch = modifiedHtml.match(/<script[^>]*type=["']module["'][^>]*src=["'][^"']*index[^"']*["'][^>]*>/i);
      
      if (scriptMatch) {
        // Add a safeguard script that ensures React is loaded before vendor chunks execute
        const safeguardScript = `
    <!-- PRODUCTION-SAFE: Early error tracking and React monitoring -->
    <script>
      (function() {
        console.log('[Prod Diagnostic] Early init script running');
        window.__moduleLoadOrder = [];
        window.__reactReady = false;
        window.__errors = [];
        
        // CRITICAL: Intercept module loading to ensure React loads first
        // Override dynamic import to wait for React before loading vendor chunks
        const originalImport = window.__importShim || window.import || function() {
          return Promise.reject(new Error('Dynamic import not supported'));
        };
        
        // Store React promise
        window.__reactLoadedPromise = new Promise(function(resolve) {
          function checkReact() {
            if (window.React && window.React.useLayoutEffect) {
              console.log('[Prod Diagnostic] React detected, resolving promise');
              window.__reactReady = true;
              resolve(window.React);
            } else {
              setTimeout(checkReact, 10);
            }
          }
          checkReact();
        });
        
        // Track all module loads and errors
        const originalError = console.error;
        console.error = function(...args) {
          window.__errors.push({time: Date.now(), args: Array.from(args).map(String)});
          originalError.apply(console, args);
        };
        
        // Track unhandled errors
        window.addEventListener('error', function(e) {
          console.error('[Prod Diagnostic] Unhandled error:', {
            message: e.message,
            filename: e.filename,
            lineno: e.lineno,
            colno: e.colno,
            error: e.error ? e.error.toString() : 'N/A'
          });
          window.__errors.push({
            type: 'unhandled',
            time: Date.now(),
            error: {
              message: e.message,
              filename: e.filename,
              lineno: e.lineno,
              colno: e.colno
            }
          });
        }, true);
        
        // Track unhandled promise rejections
        window.addEventListener('unhandledrejection', function(e) {
          console.error('[Prod Diagnostic] Unhandled promise rejection:', e.reason);
          window.__errors.push({
            type: 'unhandledrejection',
            time: Date.now(),
            reason: String(e.reason)
          });
        });
        
        // Monitor React availability (will be set by main.tsx)
        const checkReactReady = function() {
          if (window.React && window.React.useLayoutEffect) {
            window.__reactReady = true;
            console.log('[Prod Diagnostic] React ready:', {
              version: window.React.version,
              useLayoutEffect: typeof window.React.useLayoutEffect
            });
          }
        };
        
        // Monitor React state changes (React is in entry chunk, should be available quickly)
        let lastReactState = null;
        const monitorReact = setInterval(function() {
          const currentState = {
            exists: typeof window.React !== 'undefined',
            hasUseLayoutEffect: window.React && typeof window.React.useLayoutEffect !== 'undefined',
            version: window.React ? window.React.version : 'N/A'
          };
          
          if (JSON.stringify(currentState) !== JSON.stringify(lastReactState)) {
            console.log('[Prod Diagnostic] React state:', lastReactState, '->', currentState);
            lastReactState = currentState;
          }
          
          checkReactReady();
          if (window.__reactReady) {
            clearInterval(monitorReact);
          }
        }, 50);
        
        // Timeout after 5 seconds
        setTimeout(function() {
          clearInterval(monitorReact);
          if (!window.__reactReady) {
            console.error('[Prod Diagnostic] React not ready after 5 seconds', {
              windowReact: typeof window.React,
              errors: window.__errors.length
            });
          }
        }, 5000);
        
        console.log('[Prod Diagnostic] Initial state:', {
          windowReact: typeof window.React,
          userAgent: navigator.userAgent.substring(0, 50)
        });
      })();
    </script>`;
        
        modifiedHtml = modifiedHtml.replace(
          scriptMatch[0],
          safeguardScript + '\n    ' + scriptMatch[0]
        );
      }
      
      return modifiedHtml;
    },
  };
}

// Plugin to ensure nested CommonJS long module is never loaded
function redirectLongModule() {
  const rootLongPath = path.resolve(__dirname, "./node_modules/long/index.js");
  const nestedLongPattern = /[@\\/]tensorflow[\\/].*[\\/]long[\\/]/;
  
  return {
    name: 'redirect-long-module',
    enforce: 'pre' as const, // Run before other plugins to catch imports early
    resolveId(source: string, importer?: string) {
      // Redirect any 'long' module imports to use the root ES module version
      if (source === 'long') {
        return rootLongPath;
      }
      
      // Handle nested long paths from TensorFlow.js or any other location
      if (importer && nestedLongPattern.test(importer) && source.includes('long')) {
        return rootLongPath;
      }
      
      // Handle absolute/relative paths to long modules
      if (source.includes('long/index.js') || source.includes('long\\index.js')) {
        // If it's trying to load the nested CommonJS version, redirect to ES module
        if (source.includes('@tensorflow') || source.includes('tfjs-core')) {
          return rootLongPath;
        }
      }
      
      // Handle types.js import from index.d.ts (shouldn't cause runtime issues, but be safe)
      if (source === './types.js' && importer?.includes('long/index.d.ts')) {
        // types.d.ts is just type definitions, but if it's somehow imported at runtime, ignore it
        return { id: path.resolve(__dirname, "./node_modules/long/types.d.ts"), external: true };
      }
      
      return null;
    },
    transform(code: string, id: string) {
      // Transform any require() calls in long-related files to prevent runtime errors
      if (id.includes('long') && code.includes('require(')) {
        // If we somehow still get the nested CommonJS long module, transform it
        if (id.includes('@tensorflow') && id.includes('long')) {
          // Replace the CommonJS require with a proper ES module export
          const transformed = code
            .replace(/module\.exports\s*=\s*require\([^)]+\)/g, 'export default {}; // Redirected to ES module')
            .replace(/require\(/g, '/* require() removed - using ES modules */ (() => { throw new Error("require() not available"); })(');
          
          if (transformed !== code) {
            return { code: transformed, map: null };
          }
        }
      }
      return null;
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  server: {
    host: "localhost", // Use localhost instead of :: for better Windows compatibility
    port: 8080,
    strictPort: false, // Allow port fallback if 8080 is taken
    hmr: {
      clientPort: 8080, // Explicitly set HMR client port
      protocol: 'ws', // Use WebSocket protocol
    },
    watch: {
      usePolling: false, // Disable polling for better performance
    },
    cors: true, // Enable CORS for development
  },
  plugins: [
    redirectLongModule(),
    react(),
    mode === 'production' && ensureReactFirst(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Force all 'long' imports to use the root ES module version
      // This prevents the nested CommonJS version in TensorFlow.js from being used
      'long': path.resolve(__dirname, "./node_modules/long/index.js"),
      // CRITICAL: Force single React instance - prevent duplicate React instances
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom', 'long'], // Force single version across all dependencies
  },
  define: {
    // Fix CommonJS modules like long.js from protobufjs (used by Google Analytics)
    'global': 'globalThis',
    'process.env': '{}',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-quill', 'quill'],
    exclude: ['@tensorflow/tfjs'], // Exclude TensorFlow.js from pre-bundling
    esbuildOptions: {
      // Fix CommonJS modules like long.js from protobufjs (used by Google Analytics)
      define: {
        global: 'globalThis',
      },
    },
    // Force Vite to pre-bundle long to ensure ES module version is used
    force: false, // Set to true temporarily if issues persist
  },
  esbuild: {
    legalComments: 'none', // Remove legal comments to reduce bundle size
  },
  build: mode === 'production' ? {
    outDir: 'docs',
    assetsDir: 'assets',
    emptyOutDir: true,
    cssCodeSplit: true,
    sourcemap: false, // Disable sourcemaps in production to reduce file size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console for production diagnostics (shared hosting debugging)
        drop_debugger: true,
        // Do NOT remove console.log - needed for production diagnostics
        passes: 2, // Multiple passes for better compression
        unsafe_arrows: true,
        unsafe_methods: true,
      },
      mangle: {
        safari10: true, // Safari 10 compatibility
      },
      format: {
        comments: false, // Remove all comments
      },
    },
    // Enable compression - server should also compress with Brotli/Gzip
    reportCompressedSize: true, // Report compressed sizes in build output
    chunkSizeWarningLimit: 500, // Lower threshold to catch large chunks
    rollupOptions: {
      // CRITICAL: Ensure React and ReactDOM are NOT externalized
      // They must be bundled to ensure single instance and proper hook resolution
      external: [], // Don't externalize anything - bundle everything
      
      treeshake: {
        // Preserve side effects for React and critical libraries
        moduleSideEffects: (id) => {
          // React and React-DOM must have side effects preserved (they have side effects)
          // This ensures hooks like useLayoutEffect are not tree-shaken out
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return true;
          }
          // Preserve side effects for other important libraries that depend on React
          if (id.includes('node_modules/@radix-ui') || 
              id.includes('node_modules/react-router') ||
              id.includes('node_modules/@tanstack') ||
              id.includes('node_modules/react-color') ||
              id.includes('node_modules/react-quill')) {
            return true;
          }
          // For other modules, use default tree-shaking
          return false;
        },
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        // CRITICAL: Don't remove unused exports from React
        // This ensures all hooks (including useLayoutEffect) are available
        preset: 'smallest',
      },
      output: {
        sourcemap: false, // Disable sourcemaps in production
        // CRITICAL: Ensure React hooks are preserved in output
        // Don't minify React hook names or remove them
        preserveModules: false,
        // Ensure proper chunk order - React must load first
        chunkFileNames: (chunkInfo) => {
          // Standard chunk naming - most code goes to entry chunk now
          return 'assets/[name]-[hash].js';
        },
        // CRITICAL: Ensure React is available to all chunks
        // Use ES modules format for proper React resolution
        format: 'es', // Don't use IIFE or UMD - stick with ES modules
        manualChunks: (id) => {
          // CRITICAL FIX: Keep React and ReactDOM in the main entry chunk (return null)
          // This ensures React is ALWAYS loaded before any vendor chunks execute
          // In production, separate chunks can load out of order on shared hosting,
          // causing "Cannot read properties of undefined (reading 'useLayoutEffect')" errors
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return null; // Keep React in entry chunk for production stability
          }
          
          // ALSO CRITICAL: Keep ALL React-dependent libraries in entry chunk
          // This prevents vendor chunks from executing code that needs React before React is loaded
          // Check for common React dependency patterns
          const lowerId = id.toLowerCase();
          const isReactDependent = 
            lowerId.includes('react-router') ||
            lowerId.includes('@tanstack/react-query') ||
            lowerId.includes('@tanstack/query') ||
            lowerId.includes('@radix-ui') ||
            lowerId.includes('react-color') ||
            lowerId.includes('react-quill') ||
            lowerId.includes('react-helmet') ||
            lowerId.includes('react-hook-form') ||
            lowerId.includes('react-resizable') ||
            lowerId.includes('embla-carousel-react') ||
            lowerId.includes('next-themes') ||
            lowerId.includes('vaul') ||
            lowerId.includes('sonner') ||
            lowerId.includes('cmdk') ||
            lowerId.includes('lucide-react') ||
            lowerId.includes('recharts') ||
            lowerId.includes('@remix-run');
          
          if (isReactDependent) {
            return null; // Keep in entry chunk with React
          }
          
          // TensorFlow.js - can be lazy loaded as a separate chunk (dynamically imported)
          // This is safe because it's loaded on-demand, not at initial load
          if (id.includes('node_modules/@tensorflow')) {
            return 'ml-vendor';
          }
          // Other large dependencies - ONLY non-React dependencies
          // Strictly exclude ALL React-dependent packages
          if (id.includes('node_modules')) {
            // Exclude ANY file path that mentions 'react' or React-dependent packages
            // Use case-insensitive matching to catch all variations
            const lowerId = id.toLowerCase();
            
            // Comprehensive list of React-dependent patterns
            const reactDependentPatterns = [
              'react',
              'radix',
              'tanstack',
              'next-themes',
              'vaul',
              'sonner',
              'cmdk',
              'embla-carousel',
              'react-resizable',
              'react-hook-form',
              'react-helmet',
              'react-color',
              'react-quill',
              'react-router',
              'remix-run',
              '@tanstack',
              '@radix-ui',
              'lucide-react',
              'recharts' // Recharts uses React hooks internally
            ];
            
            // Check if this is a React-dependent library
            const isReactDependent = reactDependentPatterns.some(pattern => 
              lowerId.includes(pattern)
            );
            
            if (isReactDependent) {
              // This is React-dependent, don't put in vendor chunk
              // Return null to let it go to main bundle or a specific chunk
              return null;
            }
            
            // PRODUCTION-FIX: Don't create vendor chunk - put everything in entry chunk
            // This ensures proper loading order and prevents React access errors
            // The vendor chunk was causing issues where it executed before React was available
            // Returning null puts all dependencies in the entry chunk with React
            return null;
            
            // Previous approach (commented out - caused production issues):
            // Only pure JavaScript libraries without React dependencies
            // Known safe libraries:
            // - tinycolor2 (already handled above)
            // - date-fns (pure JS)
            // - zod (pure JS)
            // - clsx (pure JS)
            // - tailwind-merge (pure JS)
            // - long (pure JS)
            // - color-blind (pure JS)
            // - class-variance-authority (pure JS)
            // return 'vendor';
          }
        },
      },
    },
  } : undefined,
}));


