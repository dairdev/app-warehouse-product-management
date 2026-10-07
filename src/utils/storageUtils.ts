/**
 * Safe localStorage wrapper with QuotaExceededError protection and automatic sanitization.
 */

/**
 * Sanitizes JSON payload by stripping or downscaling bloated base64 image strings (> 50KB).
 */
export function sanitizeStorageValue(value: string): string {
  try {
    const parsed = JSON.parse(value);

    // If it's an array of machinery, products, or requests
    if (Array.isArray(parsed)) {
      const sanitized = parsed.map((item) => {
        if (!item || typeof item !== 'object') return item;
        const copy = { ...item };

        // Sanitize machinery / product single imageUrl if huge base64
        if (
          typeof copy.imageUrl === 'string' &&
          copy.imageUrl.startsWith('data:image/') &&
          copy.imageUrl.length > 50000
        ) {
          copy.imageUrl = '/src/assets/images/backhoe_loader_1791133840461.jpg';
        }

        // Sanitize product media array if huge base64
        if (Array.isArray(copy.media)) {
          copy.media = copy.media.map((m: any) => {
            if (
              m &&
              typeof m.url === 'string' &&
              m.url.startsWith('data:image/') &&
              m.url.length > 50000
            ) {
              return { ...m, url: '/src/assets/images/cement_portland_bags_1790484625515.jpg' };
            }
            return m;
          });
        }

        return copy;
      });
      return JSON.stringify(sanitized);
    }

    return value;
  } catch {
    return value;
  }
}

/**
 * Clears old legacy version keys, temporary entries, or bloated items from other keys.
 */
export function purgeStaleStorage(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (
        k &&
        (k.endsWith('_v1') ||
          k.includes('_temp') ||
          k.includes('_cache') ||
          k.startsWith('temp_') ||
          k.startsWith('debug_'))
      ) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        // ignore
      }
    });
  } catch {
    // ignore
  }
}

/**
 * Scans all existing localStorage keys and sanitizes oversized base64 images.
 */
export function sanitizeAllStorageKeys(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) keys.push(k);
    }

    keys.forEach((k) => {
      try {
        const val = localStorage.getItem(k);
        if (val && val.includes('data:image/') && val.length > 80000) {
          const sanitized = sanitizeStorageValue(val);
          localStorage.setItem(k, sanitized);
        }
      } catch {
        // ignore
      }
    });
  } catch {
    // ignore
  }
}

/**
 * Safely persists an item to localStorage with multi-tiered error recovery.
 * Never throws an uncaught QuotaExceededError.
 */
export function safeLocalStorageSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: unknown) {
    console.warn(`[Storage] QuotaExceeded or write error for "${key}". Initiating auto-recovery...`, err);

    // Tier 1: Purge legacy and temporary cache keys
    try {
      purgeStaleStorage();
      localStorage.setItem(key, value);
      return true;
    } catch {
      // Continue to Tier 2
    }

    // Tier 2: Sanitize current value if it has huge base64 images
    try {
      const sanitized = sanitizeStorageValue(value);
      localStorage.setItem(key, sanitized);
      return true;
    } catch {
      // Continue to Tier 3
    }

    // Tier 3: Sanitize all other keys in localStorage and retry with sanitized value
    try {
      sanitizeAllStorageKeys();
      const sanitized = sanitizeStorageValue(value);
      localStorage.setItem(key, sanitized);
      return true;
    } catch (finalErr) {
      console.error(`[Storage] Unable to save to localStorage for "${key}" even after sanitization.`, finalErr);
      return false;
    }
  }
}
