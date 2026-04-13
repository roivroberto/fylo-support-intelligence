import { env } from "@Fylo/env/web";
import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";
import { headers } from "next/headers";

import { AUTH_SESSION_HEADER } from "./auth-session";

export const {
	handler,
	preloadAuthQuery,
	isAuthenticated,
	getToken,
	fetchAuthQuery,
	fetchAuthMutation,
	fetchAuthAction,
} = convexBetterAuthNextJs({
	convexUrl: env.NEXT_PUBLIC_CONVEX_URL,
	convexSiteUrl: env.NEXT_PUBLIC_CONVEX_SITE_URL,
});

export function shouldAttemptInitialAuthToken(requestHeaders: Headers) {
	return requestHeaders.get(AUTH_SESSION_HEADER) !== "0";
}

export async function getInitialAuthToken() {
	const requestHeaders = await headers();

	if (!shouldAttemptInitialAuthToken(requestHeaders)) {
		return null;
	}

	return getToken();
}
