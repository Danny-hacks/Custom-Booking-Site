import { NextResponse, type NextRequest } from "next/server";

// Sends "/" and any path without a locale to /en or /fr (from Accept-Language).
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (/^\/(en|fr)(\/|$)/.test(pathname)) {
    const headers = new Headers(req.headers);
    headers.set("x-pathname", pathname); // lets the 404 page speak the visitor's language
    return NextResponse.next({ request: { headers } });
  }
  const lang = req.headers.get("accept-language")?.toLowerCase().startsWith("fr") ? "fr" : "en";
  const url = req.nextUrl.clone();
  url.pathname = `/${lang}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|admin|_next|img|favicon.ico|.*\\..*).*)"],
};
