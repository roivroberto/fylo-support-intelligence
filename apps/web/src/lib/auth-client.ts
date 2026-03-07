import { env } from "@Fylo/env/web";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: env.NEXT_PUBLIC_SITE_URL,
	plugins: [convexClient()],
});

export type AuthSession = typeof authClient.$Infer.Session;

type AuthClientResponse = {
	error?: {
		message?: string | null;
	} | null;
} | null;

export function getAuthErrorMessage(
	response: AuthClientResponse,
	fallbackMessage: string,
) {
	const message = response?.error?.message;

	if (typeof message !== "string" || message.trim().length === 0) {
		return fallbackMessage;
	}

	return message;
}
