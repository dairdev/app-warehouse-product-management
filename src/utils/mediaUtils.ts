/**
 * Utility to normalize media URLs (images, videos) for local dev, subdomains,
 * or subdirectory deployments like /tienda/.
 */
export function getMediaUrl(url?: string | null): string {
  if (!url) return '';

  // Data URLs, blob URLs, and full external http/https URLs are returned as-is
  if (
    url.startsWith('data:') ||
    url.startsWith('blob:') ||
    url.startsWith('http://') ||
    url.startsWith('https://')
  ) {
    return url;
  }

  // If app is running on a subpath like /tienda
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/tienda')) {
    if (url.startsWith('/uploads/')) {
      return `/tienda${url}`;
    }
    if (url.startsWith('uploads/')) {
      return `/tienda/${url}`;
    }
  }

  return url;
}
