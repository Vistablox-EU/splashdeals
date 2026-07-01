import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROUTING_CONFIG } from './lib/routing/config';
import { isDeletedPath } from './lib/routing/deleted-paths';

/**
 * 🌊 Splashdeals Proxy (Next.js 16+ Architecture)
 * Edge-only gateway: URL normalization, redirects, cache, security headers.
 * NO auth, NO business logic — those belong in the app layer.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host');

  // 0. 🧹 URL NORMALIZATION: Replace spaces with hyphens
  if (pathname.includes('%20') || pathname.includes(' ')) {
    const cleanPath = pathname.replace(/%20/g, '-').replace(/ /g, '-');
    const redirectUrl = new URL(cleanPath, request.url);
    request.nextUrl.searchParams.forEach((value, key) => redirectUrl.searchParams.set(key, value));
    return NextResponse.redirect(redirectUrl, { status: 301 });
  }

  // 0. 🏰 CANONICAL DOMAIN ENFORCEMENT (Apex -> WWW)
  if (process.env.NODE_ENV === 'production' && host === 'splashdeals.rs') {
    const canonicalUrl = new URL(pathname, `https://www.splashdeals.rs`);
    request.nextUrl.searchParams.forEach((value, key) => canonicalUrl.searchParams.set(key, value));

    for (const rule of ROUTING_CONFIG.LEGACY_REDIRECTS) {
      const match = pathname.match(rule.pattern);
      if (match) {
        canonicalUrl.pathname = rule.destination(match);
        break;
      }
    }

    return NextResponse.redirect(canonicalUrl, { status: 301 });
  }

  // 1. 🗑️ PERMANENTLY DELETED LEGACY PATHS → 404
  // Runs at the edge BEFORE Vercel sends 103 Early Hints, so the 404 status is preserved.
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && isDeletedPath(segments)) {
    return new Response(
      '<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Stranica Nije Pronađena | Splashdeals</title></head><body style="background:#020617;color:#94a3b8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0"><div style="text-align:center"><div style="font-size:6rem;font-weight:900;color:#06b6d4;margin:0">404</div><p style="font-size:1.25rem;margin-top:0.5rem">Stranica nije pronađena.</p></div></body></html>',
      { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  // 2. 🧟 DECLARATIVE REDIRECTS (SEO & Legacy Cleanup)
  for (const rule of ROUTING_CONFIG.LEGACY_REDIRECTS) {
    const match = pathname.match(rule.pattern);
    if (match) {
      const destination = rule.destination(match);
      return NextResponse.redirect(new URL(destination, request.url), {
        status: rule.permanent ? 301 : 302
      });
    }
  }

  // 3. 🎟️ TICKET MIGRATION (Single-hop Internal Rewrite)
  const ticketMatch = pathname.match(ROUTING_CONFIG.TICKET_MIGRATION.pattern);
  if (ticketMatch) {
    const [, ticketId] = ticketMatch;
    return NextResponse.rewrite(
      new URL(`/api/seo/redirect-ticket?id=${ticketId}`, request.url)
    );
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  });

  // 3.5 🤖 BINGBOT: Override cache headers to allow indexing
  const userAgent = request.headers.get('user-agent') || '';
  const isBingbot = userAgent.toLowerCase().includes('bingbot') || userAgent.toLowerCase().includes('bingpreview');
  if (isBingbot) {
    response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    response.headers.set('Vary', 'User-Agent');
  } else {
    // 3.7 ⚡ PERFORMANCE: Cache-Control Header Optimization
    const isStaticPage = [
      '/terms',
      '/privacy',
      '/how-it-works',
      '/support',
      '/cookies'
    ].some(path => pathname === path || pathname.startsWith(path + '/'));

    const isApi = pathname === '/api' || pathname.startsWith('/api/');
    const isAdmin = pathname.startsWith('/admin');
    const isCart = pathname === '/cart' || pathname.startsWith('/cart/');
    const isSuccess = pathname === '/success' || pathname.startsWith('/success/');
    const isAuth = pathname === '/auth' || pathname.startsWith('/auth/');

    if (isStaticPage) {
      response.headers.set('Cache-Control', 'public, max-age=86400, immutable');
    } else if (!isAdmin && !isApi && !isCart && !isSuccess && !isAuth) {
      // Dynamic marketplace, facilities, search and deal pages
      response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    }
  }

  // 4. 💸 GROWTH ENGINE: Affiliate Referral Tracking
  const refCode = request.nextUrl.searchParams.get('ref');
  if (refCode) {
    response.cookies.set('splashdeals_affiliate', refCode, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  // 5. 🛡️ SECURITY HEADERS
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  // 6. 🛡️ ROBOT PROTECTION: Admin/Cart/Checkout/Auth/Success noindex
  const noindexPaths = [
    pathname.startsWith('/admin'),
    pathname === '/cart' || pathname.startsWith('/cart/'),
    pathname === '/checkout' || pathname.startsWith('/checkout/'),
    pathname === '/auth' || pathname.startsWith('/auth/'),
    pathname === '/success' || pathname.startsWith('/success/'),
  ];
  if (noindexPaths.some(Boolean)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  // 7. 🔗 CANONICAL LINK HEADER (production only)
  if (process.env.NODE_ENV === 'production' && host && !host.startsWith('www.')) {
    response.headers.set('Link', `<https://www.splashdeals.rs${pathname}>; rel="canonical"`);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.png|.*\\.svg|site\\.webmanifest).*)',
  ],
};
