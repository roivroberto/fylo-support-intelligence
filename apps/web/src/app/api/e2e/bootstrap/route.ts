import { NextResponse } from "next/server";

import { seedE2EDataReference } from "../../../../../../../packages/backend/convex/e2e_reference";
import { fetchAuthMutation } from "@/lib/auth-server";
import { hasAuthSessionCookie } from "@/lib/auth-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BootstrapPayload = {
	viewerRole?: "lead" | "agent";
};

const E2E_PASSWORD = "Fylo-E2E-password-123!";

function isBootstrapEnabled() {
	return (
		process.env.ENABLE_E2E_BOOTSTRAP === "1" &&
		process.env.NODE_ENV !== "production"
	);
}

function readSetCookieHeaders(headers: Headers) {
	if (typeof headers.getSetCookie === "function") {
		return headers.getSetCookie();
	}

	const setCookie = headers.get("set-cookie");
	return setCookie ? [setCookie] : [];
}

async function readBootstrapPayload(request: Request): Promise<BootstrapPayload> {
	try {
		const rawBody = await request.text();

		if (!rawBody) {
			return {};
		}

		const parsed = JSON.parse(rawBody) as Record<string, unknown>;
		return {
			viewerRole:
				parsed.viewerRole === "agent" || parsed.viewerRole === "lead"
					? parsed.viewerRole
					: undefined,
		};
	} catch {
		return {};
	}
}

function buildBootstrapIdentity(viewerRole: "lead" | "agent") {
	return {
		email: `e2e+${viewerRole}@fylo.local`,
		name: viewerRole === "agent" ? "E2E Agent" : "E2E Lead",
		password: E2E_PASSWORD,
	};
}

export async function POST(request: Request) {
	const key = request.headers.get("x-e2e-bootstrap-secret");
	const payload = await readBootstrapPayload(request);
	const viewerRole = payload.viewerRole ?? "lead";

	if (!isBootstrapEnabled()) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	if (!key || key !== process.env.E2E_BOOTSTRAP_SECRET) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	if (hasAuthSessionCookie(request.headers.get("cookie"))) {
		try {
			const seeded = await fetchAuthMutation(seedE2EDataReference, {
				viewerRole: payload.viewerRole,
			});
			return NextResponse.json(seeded);
		} catch (error) {
			return NextResponse.json(
				{
					error: "Failed to seed E2E data",
					detail: error instanceof Error ? error.message : String(error),
				},
				{ status: 500 },
			);
		}
	}

	const origin = new URL(request.url).origin;
	const identity = buildBootstrapIdentity(viewerRole);
	let authResponse = await fetch(`${origin}/api/auth/sign-in/email`, {
		method: "POST",
		headers: {
			accept: "application/json",
			"content-type": "application/json",
		},
		body: JSON.stringify({
			email: identity.email,
			password: identity.password,
		}),
	});

	if (!authResponse.ok) {
		authResponse = await fetch(`${origin}/api/auth/sign-up/email`, {
			method: "POST",
			headers: {
				accept: "application/json",
				"content-type": "application/json",
			},
			body: JSON.stringify(identity),
		});

		if (!authResponse.ok) {
			return NextResponse.json(
				{
					error: "Failed to create E2E session",
					detail: await authResponse.text(),
				},
				{ status: 500 },
			);
		}
	}

	const authBody = (await authResponse.json()) as {
		user?: { email?: string };
	};
	const response = NextResponse.json(
		{
			createdSession: true,
			viewerEmail: authBody.user?.email ?? identity.email,
		},
		{ status: 201 },
	);

	for (const setCookie of readSetCookieHeaders(authResponse.headers)) {
		response.headers.append("set-cookie", setCookie);
	}

	return response;
}
