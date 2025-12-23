// middleware.js
import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Rotas que precisam de CSP
const protectedPaths = [
  '/',
  '/register',
  '/login',
  '/admin',
  '/products',
  '/api/auth/**'
]

export function middleware(request) {
  const { pathname } = request.nextUrl
  
  // Verifica se a rota precisa de CSP
  const needsCSP = protectedPaths.some(path => {
    if (path.endsWith('/**')) {
      const basePath = path.slice(0, -3)
      return pathname.startsWith(basePath)
    }
    return pathname === path || pathname.startsWith(path + '/')
  })

  if (!needsCSP) {
    return NextResponse.next()
  }

  // Gerar nonce único para cada request
  const nonce = crypto.randomBytes(16).toString('base64')
  
  // CSP com nonce
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    `script-src 'self' 'nonce-${nonce}' https://js.stripe.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://res.cloudinary.com",
    "font-src 'self' data:",
    "connect-src 'self' https://api.stripe.com https://*.sentry.io",
    "frame-src 'self' https://js.stripe.com",
    process.env.NODE_ENV === 'production' ? "upgrade-insecure-requests" : ""
  ].filter(Boolean).join('; ')

  const response = NextResponse.next()
  
  // Adicionar headers
  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Nonce', nonce)
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  
  // Para produção, adicionar HSTS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    )
  }

  return response
}

// Configurar matcher para o middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth/callback (NextAuth callbacks)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth/callback|_next/static|_next/image|favicon.ico).*)',
  ],
}