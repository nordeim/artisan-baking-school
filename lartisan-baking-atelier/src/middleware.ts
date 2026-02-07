import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

/**
 * Route categories for authentication requirements
 */
const ROUTE_CATEGORIES = {
  /**
   * Public routes that don't require authentication
   * These are accessible to everyone
   */
  public: [
    "/",
    "/courses",
    "/courses/:path*",
    "/login",
    "/register",
    "/about",
    "/contact",
    "/api/auth/:path*",
  ],

  /**
   * Protected routes that require authentication
   * Users without session are redirected to login
   */
  protected: [
    "/dashboard",
    "/dashboard/:path*",
    "/checkout",
    "/checkout/:path*",
    "/learn",
    "/learn/:path*",
    "/api/orders",
    "/api/orders/:path*",
    "/api/cart",
    "/api/cart/:path*",
  ],

  /**
   * Admin routes that require ADMIN role
   * Non-admin users get 403 Forbidden
   */
  admin: ["/admin", "/admin/:path*", "/api/admin", "/api/admin/:path*"],
};

/**
 * Check if a pathname matches a route pattern
 * Supports wildcards (:path*) and exact matches
 *
 * @param pathname - The request pathname
 * @param pattern - The route pattern to match against
 * @returns boolean indicating if pathname matches pattern
 */
function matchesRoute(pathname: string, pattern: string): boolean {
  // Exact match
  if (pattern === pathname) {
    return true;
  }

  // Wildcard match: /dashboard/:path* matches /dashboard/profile
  if (pattern.endsWith("/:path*")) {
    const basePath = pattern.replace("/:path*", "");
    return pathname === basePath || pathname.startsWith(`${basePath}/`);
  }

  // Exact segment match with wildcard: /api/auth/:path*
  if (pattern.includes("/:path*")) {
    const [basePattern] = pattern.split("/:path*");
    return pathname.startsWith(basePattern);
  }

  return false;
}

/**
 * Determine route type based on pathname
 *
 * @param pathname - The request pathname
 * @returns 'public' | 'protected' | 'admin' | null
 */
function getRouteType(
  pathname: string,
): "public" | "protected" | "admin" | null {
  // Check admin routes first (most restrictive)
  for (const pattern of ROUTE_CATEGORIES.admin) {
    if (matchesRoute(pathname, pattern)) {
      return "admin";
    }
  }

  // Check protected routes
  for (const pattern of ROUTE_CATEGORIES.protected) {
    if (matchesRoute(pathname, pattern)) {
      return "protected";
    }
  }

  // Check public routes
  for (const pattern of ROUTE_CATEGORIES.public) {
    if (matchesRoute(pathname, pattern)) {
      return "public";
    }
  }

  // Unknown routes treated as public (Next.js will handle 404)
  return null;
}

/**
 * Check if request is an API route
 *
 * @param pathname - The request pathname
 * @returns boolean indicating if it's an API route
 */
function isApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

/**
 * Create redirect response to login page
 * Preserves original pathname in ?from query parameter
 *
 * @param req - The original request
 * @returns NextResponse with redirect
 */
function createLoginRedirect(req: NextRequest): NextResponse {
  const { pathname, search } = req.nextUrl;
  const from = encodeURIComponent(pathname + search);
  const loginUrl = new URL(`/login?from=${from}`, req.url);

  return NextResponse.redirect(loginUrl, {
    status: 307, // Temporary Redirect
  });
}

/**
 * Create unauthorized response for API routes
 *
 * @returns NextResponse with 401 status
 */
function createUnauthorizedResponse(): NextResponse {
  return NextResponse.json(
    {
      error: "Unauthorized",
      message: "Authentication required",
    },
    { status: 401 },
  );
}

/**
 * Create forbidden response for API routes
 *
 * @returns NextResponse with 403 status
 */
function createForbiddenResponse(): NextResponse {
  return NextResponse.json(
    {
      error: "Forbidden",
      message: "Admin access required",
    },
    { status: 403 },
  );
}

/**
 * Next.js Middleware for route protection
 *
 * Handles authentication and authorization for protected and admin routes.
 * Public routes pass through without checks.
 *
 * Features:
 * - Validates JWT session via HTTP-only cookies
 * - Automatic token refresh on expired access tokens
 * - Redirects to login for unauthorized protected routes
 * - Returns 403 for non-admin users accessing admin routes
 * - Preserves original URL in ?from parameter for post-login redirect
 * - API routes return JSON errors instead of redirects
 *
 * @param req - NextRequest object
 * @returns NextResponse for redirects/errors, undefined to continue
 *
 * @example
 * // In next.config.js
 * export const config = {
 *   matcher: ['/dashboard/:path*', '/admin/:path*', '/api/orders/:path*']
 * };
 */
export async function middleware(
  req: NextRequest,
): Promise<NextResponse | undefined> {
  const { pathname } = req.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname === "/favicon.ico" ||
    pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$/)
  ) {
    return undefined;
  }

  // Determine route type
  const routeType = getRouteType(pathname);

  // If route type couldn't be determined, let Next.js handle it
  if (!routeType) {
    return undefined;
  }

  // Public routes - allow access without auth
  if (routeType === "public") {
    return undefined;
  }

  try {
    // Get and validate session
    const session = await getSession();

    // No session - authentication required
    if (!session) {
      // API routes return JSON error
      if (isApiRoute(pathname)) {
        return createUnauthorizedResponse();
      }

      // Page routes redirect to login
      return createLoginRedirect(req);
    }

    // Check admin authorization
    if (routeType === "admin" && session.role !== "ADMIN") {
      // API routes return JSON error
      if (isApiRoute(pathname)) {
        return createForbiddenResponse();
      }

      // Page routes show 403 page
      return NextResponse.rewrite(new URL("/403", req.url), {
        status: 403,
      });
    }

    // Valid session - allow access
    return undefined;
  } catch (error) {
    // Handle errors gracefully
    console.error("Middleware error:", error);

    // API routes return JSON error
    if (isApiRoute(pathname)) {
      return createUnauthorizedResponse();
    }

    // Page routes redirect to login
    return createLoginRedirect(req);
  }
}

/**
 * Middleware configuration
 * Specifies which routes the middleware should run on
 *
 * Using matcher config is more efficient than pathname checks in middleware
 * as it only runs on specified routes instead of every request
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
