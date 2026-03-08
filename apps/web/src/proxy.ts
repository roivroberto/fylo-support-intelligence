import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { AUTH_SESSION_HEADER, hasAuthSessionCookie } from "./lib/auth-session";

const PROTECTED_ROUTE_PREFIXES = ["/queue", "/visibility", "/settings", "/tickets"];

function isProtectedRoute(pathname: string) {
	return PROTECTED_ROUTE_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);
}

export function proxy(request: NextRequest) {
	const isAuthenticated = hasAuthSessionCookie(request.headers.get("cookie"));
	const pathname = request.nextUrl.pathname;
	const search = request.nextUrl.search;

	if (!isAuthenticated && isProtectedRoute(pathname)) {
		const signInUrl = new URL("/sign-in", request.url);
		signInUrl.searchParams.set("next", `${pathname}${search}`);

		return NextResponse.redirect(signInUrl);
	}

	const requestHeaders = new Headers(request.headers);
	requestHeaders.set(AUTH_SESSION_HEADER, isAuthenticated ? "1" : "0");

	return NextResponse.next({
		request: {
			headers: requestHeaders,
		},
	});
}

export const config = {
	matcher: [
		"/((?!api/auth|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
	],
};
