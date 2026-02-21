/**
 * GitHub Appreciation Popup Logic
 * 
 * Manages the state and visibility logic for the GitHub appreciation popup.
 * Uses localStorage for persistent state and sessionStorage for session-specific state.
 */

// Configuration constants
const MIN_CHECKS_TO_SHOW = 5; // Minimum contrast checks before first popup
const CHECKS_BETWEEN_POPUPS = 10; // Number of checks between popup appearances

// Storage keys
const STORAGE_KEYS = {
  TOTAL_CHECKS: 'github-popup-total-checks',
  LAST_POPUP_CHECK_COUNT: 'github-popup-last-check-count',
  PERMANENTLY_DISMISSED: 'github-popup-dismissed-permanently',
  SESSION_SUPPRESSED: 'github-popup-session-suppressed',
} as const;

/**
 * Get total contrast checks count from localStorage
 */
export const getTotalChecks = (): number => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TOTAL_CHECKS);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
};

/**
 * Increment total contrast checks count
 */
export const incrementTotalChecks = (): number => {
  try {
    const current = getTotalChecks();
    const newCount = current + 1;
    localStorage.setItem(STORAGE_KEYS.TOTAL_CHECKS, String(newCount));
    return newCount;
  } catch {
    return getTotalChecks();
  }
};

/**
 * Get the check count when popup was last shown (session-specific)
 */
export const getLastPopupCheckCount = (): number => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEYS.LAST_POPUP_CHECK_COUNT);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
};

/**
 * Set the check count when popup is shown
 */
export const setLastPopupCheckCount = (count: number): void => {
  try {
    sessionStorage.setItem(STORAGE_KEYS.LAST_POPUP_CHECK_COUNT, String(count));
  } catch {
    // Ignore storage errors
  }
};

/**
 * Check if popup has been permanently dismissed
 */
export const isPermanentlyDismissed = (): boolean => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PERMANENTLY_DISMISSED);
    return stored === 'true';
  } catch {
    return false;
  }
};

/**
 * Mark popup as permanently dismissed
 */
export const setPermanentlyDismissed = (): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PERMANENTLY_DISMISSED, 'true');
  } catch {
    // Ignore storage errors
  }
};

/**
 * Check if popup is suppressed in current session
 */
export const isSessionSuppressed = (): boolean => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEYS.SESSION_SUPPRESSED);
    return stored === 'true';
  } catch {
    return false;
  }
};

/**
 * Suppress popup for current session
 */
export const setSessionSuppressed = (suppressed: boolean): void => {
  try {
    if (suppressed) {
      sessionStorage.setItem(STORAGE_KEYS.SESSION_SUPPRESSED, 'true');
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.SESSION_SUPPRESSED);
    }
  } catch {
    // Ignore storage errors
  }
};

/**
 * Pure function to determine if popup should be visible
 * 
 * @param totalChecks - Total number of contrast checks performed
 * @param lastPopupCheckCount - Check count when popup was last shown
 * @param isPermanentlyDismissed - Whether user permanently dismissed popup
 * @param isSessionSuppressed - Whether popup is suppressed in current session
 * @param isCurrentlyVisible - Whether popup is currently visible
 * @returns boolean indicating if popup should be shown
 */
export const shouldShowPopup = (
  totalChecks: number,
  lastPopupCheckCount: number,
  isPermanentlyDismissed: boolean,
  isSessionSuppressed: boolean,
  isCurrentlyVisible: boolean
): boolean => {
  // Never show if permanently dismissed
  if (isPermanentlyDismissed) {
    return false;
  }

  // Don't show if already visible
  if (isCurrentlyVisible) {
    return false;
  }

  // Don't show if suppressed in current session
  if (isSessionSuppressed) {
    return false;
  }

  // First time: show after minimum checks
  if (lastPopupCheckCount === 0) {
    return totalChecks >= MIN_CHECKS_TO_SHOW;
  }

  // Subsequent times: show after checks between popups
  const checksSinceLastPopup = totalChecks - lastPopupCheckCount;
  return checksSinceLastPopup >= CHECKS_BETWEEN_POPUPS;
};

/**
 * Handle popup close (temporary dismissal)
 */
export const handlePopupClose = (currentCheckCount: number): void => {
  setSessionSuppressed(true);
  setLastPopupCheckCount(currentCheckCount);
};

/**
 * Handle permanent dismissal (Star or View Repo clicked)
 */
export const handlePermanentDismissal = (currentCheckCount: number): void => {
  setPermanentlyDismissed();
  setSessionSuppressed(true);
  setLastPopupCheckCount(currentCheckCount);
};







