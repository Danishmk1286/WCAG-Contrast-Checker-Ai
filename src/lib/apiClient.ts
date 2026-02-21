/**
 * API Client with Timeout and Fallback Support
 * 
 * Provides robust API calls with:
 * - Timeout handling (3 seconds default)
 * - Static fallback support
 * - Comprehensive error logging
 * - Non-blocking behavior
 */

const DEFAULT_TIMEOUT_MS = 3000; // 3 seconds max wait

interface FetchOptions extends RequestInit {
  timeout?: number;
  fallbackUrl?: string;
  logPrefix?: string;
}

/**
 * Fetch with timeout and comprehensive error handling
 */
export const fetchWithTimeout = async (
  url: string,
  options: FetchOptions = {}
): Promise<Response> => {
  const {
    timeout = DEFAULT_TIMEOUT_MS,
    logPrefix = '[API]',
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn(`${logPrefix} ⏰ TIMEOUT: Request to ${url} exceeded ${timeout}ms`);
    controller.abort();
  }, timeout);

  try {
    const startTime = Date.now();
    console.log(`${logPrefix} 🚀 Starting request to ${url}`);
    
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      console.error(`${logPrefix} ❌ Request failed: ${url} - Status: ${response.status} (${duration}ms)`);
    } else {
      console.log(`${logPrefix} ✅ Request succeeded: ${url} - Status: ${response.status} (${duration}ms)`);
    }

    return response;
  } catch (error: any) {
    
    if (error.name === 'AbortError') {
      console.error(`${logPrefix} ⏰ TIMEOUT: Request to ${url} aborted after ${timeout}ms`);
      throw new Error(`Request timeout: ${url} exceeded ${timeout}ms`);
    }
    
    if (error.message?.includes('CORS')) {
      console.error(`${logPrefix} 🚫 CORS ERROR: ${url} - ${error.message}`);
      throw new Error(`CORS error: ${error.message}`);
    }
    
    if (error.message?.includes('Failed to fetch')) {
      console.error(`${logPrefix} 🌐 NETWORK ERROR: ${url} - Server unreachable`);
      throw new Error(`Network error: Server unreachable`);
    }
    
    console.error(`${logPrefix} ❌ ERROR: ${url} - ${error.message || error}`);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Load JSON with timeout and fallback
 */
export const fetchJsonWithFallback = async <T>(
  url: string,
  fallbackUrl: string | null,
  options: FetchOptions = {}
): Promise<T> => {
  const logPrefix = options.logPrefix || '[API]';
  
  try {
    // Try primary API first
    const response = await fetchWithTimeout(url, {
      ...options,
      logPrefix: `${logPrefix} [PRIMARY]`,
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`${logPrefix} ✅ Loaded from primary API: ${url}`);
    return data;
  } catch (error: any) {
    console.warn(`${logPrefix} ⚠️ Primary API failed: ${url} - ${error.message}`);
    
    // Try fallback if available
    if (fallbackUrl) {
      try {
        console.log(`${logPrefix} 🔄 Attempting fallback: ${fallbackUrl}`);
        const fallbackResponse = await fetchWithTimeout(fallbackUrl, {
          ...options,
          logPrefix: `${logPrefix} [FALLBACK]`,
        });
        
        if (!fallbackResponse.ok) {
          throw new Error(`Fallback returned ${fallbackResponse.status}`);
        }
        
        const data = await fallbackResponse.json();
        console.log(`${logPrefix} ✅ Loaded from fallback: ${fallbackUrl}`);
        return data;
      } catch (fallbackError: any) {
        console.error(`${logPrefix} ❌ Fallback also failed: ${fallbackUrl} - ${fallbackError.message}`);
        throw new Error(`Both primary and fallback failed: ${error.message}`);
      }
    }
    
    throw error;
  }
};

/**
 * Load static blog posts from frontend data (no API calls)
 */
export const loadStaticBlogPosts = async (): Promise<any[]> => {
  try {
    console.log('[STATIC] 🔄 Loading static blog posts from frontend...');
    // Dynamic import to avoid issues if module not found
    const { getStaticBlogPostListings } = await import('@/data/staticBlogPosts');
    const posts = getStaticBlogPostListings();
    console.log(`[STATIC] ✅ Loaded ${posts.length} static blog posts from frontend`);
    return posts;
  } catch (error: any) {
    console.warn(`[STATIC] ⚠️ Failed to load static blog posts: ${error.message}`);
    return [];
  }
};

/**
 * Load static blog post by slug from frontend data (no API calls)
 */
export const loadStaticBlogPost = async (slug: string): Promise<any | null> => {
  try {
    console.log(`[STATIC] 🔄 Loading static blog post from frontend: ${slug}`);
    // Dynamic import to avoid issues if module not found
    const { getStaticBlogPost } = await import('@/data/staticBlogPosts');
    const post = getStaticBlogPost(slug);
    if (post) {
      console.log(`[STATIC] ✅ Loaded static blog post from frontend: ${slug}`);
    } else {
      console.warn(`[STATIC] ⚠️ Blog post not found: ${slug}`);
    }
    return post;
  } catch (error: any) {
    console.warn(`[STATIC] ⚠️ Failed to load static blog post ${slug}: ${error.message}`);
    return null;
  }
};

