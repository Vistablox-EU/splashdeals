import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROUTING_CONFIG } from './lib/routing/config';

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

  // 0.4 🗑️ PERMANENTLY DELETED PATHS — 410 Gone (checked before any redirect)
  const DELETED_PROXY_PATHS = new Set([
    '/waterpark/petroland',
    '/facilities/waterpark/petroland',
    '/en/facilities/waterpark/petroland',
    '/rs/facilities/waterpark/petroland',
    '/waterpark',
    '/en/waterpark',
    '/rs/waterpark',
    '/facilities/waterpark',
    '/en/facilities/waterpark',
    '/rs/facilities/waterpark',
  ]);
  if (DELETED_PROXY_PATHS.has(pathname)) {
    return new NextResponse(
      '<html><head><title>410 Gone</title><meta name="robots" content="noindex,nofollow"/></head><body><h1>410 Gone</h1><p>This page has been permanently deleted.</p></body></html>',
      {
        status: 410,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=86400, immutable',
          'X-Robots-Tag': 'noindex, nofollow',
        },
      }
    );
  }

  // 0.5 🚀 SERVER-SIDE 301 EDGE REDIRECTS FOR FACILITIES
  if (pathname === '/facilities' || pathname === '/facilities/') {
    const redirectUrl = new URL('/', request.url);
    request.nextUrl.searchParams.forEach((value, key) => redirectUrl.searchParams.set(key, value));
    return NextResponse.redirect(redirectUrl, { status: 301 });
  }

  if (pathname.startsWith('/facilities/')) {
    const categorySlug = pathname.substring('/facilities/'.length).replace(/\/$/, "");
    const categorySlugLower = categorySlug.toLowerCase();

    const CITY_SLUGS = new Set([
      'beograd', 'belgrade', 'novi-sad', 'jagodina', 'vrnjacka-banja', 'subotica',
      'nis', 'kragujevac', 'arandjelovac', 'soko-banja', 'uzice', 'backi-petrovac',
      'petrovac-na-mlavi', 'zlatibor', 'vojvodina', 'central-serbia', 'apatin',
      'valjevo', 'ruma', 'indjija', 'stara-pazova', 'veliko-gradiste', 'krusevac',
      'cacak', 'leskovac', 'sabac', 'kikinda', 'mionica'
    ]);

    if (CITY_SLUGS.has(categorySlugLower)) {
      const redirectUrl = new URL('/search', request.url);
      redirectUrl.searchParams.set('q', categorySlug);
      return NextResponse.redirect(redirectUrl, { status: 301 });
    }

    const redirectUrl = new URL(`/${categorySlug}`, request.url);
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

    // Strip i18n prefixes from canonical redirect path
    const i18nMatch = canonicalUrl.pathname.match(/^\/(en|rs)(?:\/|$)(.*)/i);
    if (i18nMatch) {
      canonicalUrl.pathname = '/' + i18nMatch[2];
    }

    return NextResponse.redirect(canonicalUrl, { status: 301 });
  }

  // 1. 🌐 i18n PREFIX REMOVAL
  const i18nMatch = pathname.match(/^\/(en|rs)(?:\/|$)(.*)/i);
  if (i18nMatch) {
    const [, , remainingPath] = i18nMatch;
    const cleanPath = '/' + remainingPath;
    const redirectUrl = new URL(cleanPath, request.url);
    request.nextUrl.searchParams.forEach((value, key) => redirectUrl.searchParams.set(key, value));
    return NextResponse.redirect(redirectUrl, { status: 301 });
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

  // 6. 🛡️ ROBOT PROTECTION: Admin/Cart/Auth/Success noindex
  const noindexPaths = [
    pathname.startsWith('/admin'),
    pathname === '/cart' || pathname.startsWith('/cart/'),
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
