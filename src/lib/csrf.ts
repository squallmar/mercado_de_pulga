export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )csrf-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
