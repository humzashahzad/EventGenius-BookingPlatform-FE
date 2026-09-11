/**
 * Build full URL for storage paths (venue images, avatars, etc.).
 * Uses VITE_API_BASE_URL so it works across environments (localhost, LAN IP).
 */
export function getStorageUrl(path: string | null | undefined): string {
  if (!path) return ''
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '') || 'http://localhost:8000'
  return path.startsWith('http') ? path : path.startsWith('storage/') ? `${base}/${path}` : `${base}/storage/${path}`
}
