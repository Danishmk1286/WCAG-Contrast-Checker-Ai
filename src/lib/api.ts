/**
 * API Configuration
 * 
 * All frontend API calls are routed to the production server.
 * This ensures consistent behavior across all environments.
 */

const PRODUCTION_API_BASE = "https://api.thecolorcontrastchecker.com/api";

/**
 * Get the API base URL.
 * Always returns the production API endpoint.
 */
export const getApiBaseUrl = (): string => {
  // Allow override via environment variable for testing purposes only
  const envBase = import.meta.env.VITE_API_BASE?.trim();
  if (envBase) {
    return envBase.replace(/\/+$/, ""); // Strip trailing slashes
  }
  
  // Always use production API
  return PRODUCTION_API_BASE;
};

/**
 * Build a full API URL from a path.
 * @param path - The API path (e.g., "/blog/posts" or "blog/posts")
 * @returns Full API URL
 */
export const buildApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
};
