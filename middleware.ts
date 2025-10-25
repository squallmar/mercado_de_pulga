import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Enterprise: Redis-based limiter if configured; fallback to in-memory
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 60; // per IP per minute default
const SENSITIVE_LIMIT = 20; // tighter per minute on sensitive endpoints

let upstashLimiter: Ratelimit | null = null;
(() => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    const redis = new Redis({ url, token });
    upstashLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(MAX_REQUESTS, '1 m') });
  }
})();

// In-memory fallback
const buckets = new Map<string, { count: number; reset: number }>();
function fallbackRateLimit(key: string, limit: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + WINDOW_MS });
    return true;
  }
  if (bucket.count >= limit) {
    return false;
  }
  bucket.count++;
  return true;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static files and images
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/images')) {
    return NextResponse.next();
  }

  const ipHeader = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
  const ip = (ipHeader || '127.0.0.1').split(',')[0].trim();

  // Identify sensitive endpoints
  const isSensitive = (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/payments/create') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/messages') ||
    (pathname.startsWith('/api/products') && (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE'))
  );

  // Webhooks are verified by signature; skip rate limiting but keep other checks minimal
  const isWebhook = pathname.startsWith('/api/payments/webhook');

  if (!isWebhook) {
    const limit = isSensitive ? SENSITIVE_LIMIT : MAX_REQUESTS;
    let ok = false;
    if (upstashLimiter) {
      const { success } = await upstashLimiter.limit(`${ip}:${pathname}`);
      ok = success;
    } else {
      ok = fallbackRateLimit(`${ip}:${pathname}`, limit);
    }
    if (!ok) {
      return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // CSRF protection for mutating API requests (exclude webhooks and NextAuth)
  const cookieName = 'csrf-token';
  const method = req.method.toUpperCase();
  const isApi = pathname.startsWith('/api');
  const csrfCookie = req.cookies.get(cookieName)?.value;
  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const exemptCsrf = pathname.startsWith('/api/payments/webhook') || pathname.startsWith('/api/auth');

  if (isApi && isMutating && !exemptCsrf) {
    const headerToken = req.headers.get('x-csrf-token');
    if (!csrfCookie || !headerToken || headerToken !== csrfCookie) {
      return new NextResponse(JSON.stringify({ error: 'Invalid CSRF token' }), { status: 403 });
    }
  }

  // Ensure CSRF cookie exists (readable by client for double-submit)
  if (!csrfCookie) {
    const res = NextResponse.next();
    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    res.cookies.set(cookieName, token, { path: '/', sameSite: 'lax', httpOnly: false, secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 7 });
    return res;
  }

  // Protect admin routes (API and page)
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== 'admin') {
      if (pathname.startsWith('/api')) {
        return new NextResponse(JSON.stringify({ error: 'Acesso negado' }), { status: 403 });
      }
      const url = req.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/payments/webhook/stripe).*)', // Do not alter body for Stripe webhook (raw body needed)
  ],
};
