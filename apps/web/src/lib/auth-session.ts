export const AUTH_SESSION_HEADER = "x-fylo-auth-session";

const AUTH_SESSION_COOKIE_NAMES = [
	"better-auth.session_token=",
	"__Secure-better-auth.session_token=",
	"convex_jwt=",
	"__Secure-convex_jwt=",
];

export function hasAuthSessionCookie(cookieHeader: string | null) {
	if (!cookieHeader) {
		return false;
	}

	return AUTH_SESSION_COOKIE_NAMES.some((cookieName) =>
		cookieHeader.includes(cookieName),
	);
}
