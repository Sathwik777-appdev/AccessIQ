export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (['http:', 'https:'].includes(parsed.protocol)) {
      return url;
    }
  } catch {}
  return '#';
}
