import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ENTRY_COOKIE } from "@/lib/shop/entry";

/**
 * Runs before every page request.
 *
 * Shop pages: the email gate is compulsory (owner decision), so visitors who
 * haven't entered their email yet are sent to /enter first.
 *
 * Admin pages:
 *  1. Refreshes the Supabase login cookie so sessions don't silently expire.
 *  2. Quickly sends logged-out visitors to the login page.
 *  This is only a first gate — every admin page and action still calls
 *  requireAdmin(), and Row Level Security protects the data itself.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return adminGate(request);
  }

  const hasEntered = request.cookies.get(ENTRY_COOKIE)?.value === "1";
  if (pathname === "/enter") return NextResponse.next();
  if (!hasEntered) {
    const url = new URL("/enter", request.url);
    if (pathname !== "/") url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

async function adminGate(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          for (const [key, value] of Object.entries(headers ?? {})) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims?.sub);
  const isPublicAdminPage =
    request.nextUrl.pathname === "/admin/login" ||
    request.nextUrl.pathname === "/admin/no-access";

  if (!isLoggedIn && !isPublicAdminPage) {
    const redirect = NextResponse.redirect(new URL("/admin/login", request.url));
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return redirect;
  }

  return response;
}

export const config = {
  // Everything except Next.js internals, API routes and static files
  // (brand images, icons, robots.txt, etc.).
  matcher: ["/((?!_next/|api/|brand/|favicon\\.ico|.*\\.(?:png|jpg|jpeg|webp|svg|ico|txt|xml|webmanifest)$).*)"],
};
