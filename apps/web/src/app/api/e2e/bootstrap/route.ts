import { NextResponse } from "next/server";

import {
	getLatestOutboundForTicketReference,
	seedE2EDataReference,
} from "../../../../../../../packages/backend/convex/e2e_reference";
import { fetchAuthMutation, fetchAuthQuery } from "@/lib/auth-server";
import { hasAuthSessionCookie } from "@/lib/auth-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BootstrapPayload = {
	viewerRole?: "lead" | "agent";
	liveSend?: boolean;
	persistedDraftSeedKey?: string;
	bootstrapUserKey?: string;
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
			liveSend: parsed.liveSend === true,
			persistedDraftSeedKey:
				typeof parsed.persistedDraftSeedKey === "string"
					? parsed.persistedDraftSeedKey
					: undefined,
			bootstrapUserKey:
				typeof parsed.bootstrapUserKey === "string"
					? parsed.bootstrapUserKey
					: undefined,
		};
	} catch {
		return {};
	}
}


function buildBootstrapIdentity(
	viewerRole: "lead" | "agent",
	bootstrapUserKey?: string,
) {
	const suffix = bootstrapUserKey ? `+${bootstrapUserKey}` : "";
	const nameSuffix = bootstrapUserKey ? ` ${bootstrapUserKey.slice(0, 8)}` : "";

	return {
		email: `e2e+${viewerRole}${suffix}@fylo.local`,
		name: `${viewerRole === "agent" ? "E2E Agent" : "E2E Lead"}${nameSuffix}`,
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
			const liveSendTo = payload.liveSend
				? (process.env.SUPPORT_INBOX_EMAIL ?? "").trim()
				: "";

			if (payload.liveSend && !liveSendTo) {
				return NextResponse.json(
					{ error: "SUPPORT_INBOX_EMAIL is required for live send bootstrap" },
					{ status: 500 },
				);
			}

			const seeded = await fetchAuthMutation(seedE2EDataReference, {
				viewerRole: payload.viewerRole,
				liveSendTo: liveSendTo || undefined,
				persistedDraftSeedKey: payload.persistedDraftSeedKey,
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
	const identity = buildBootstrapIdentity(viewerRole, payload.bootstrapUserKey);
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

export async function GET(request: Request) {
	const key = request.headers.get("x-e2e-bootstrap-secret");

	if (!isBootstrapEnabled()) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	if (!key || key !== process.env.E2E_BOOTSTRAP_SECRET) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	if (!hasAuthSessionCookie(request.headers.get("cookie"))) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const ticketId = new URL(request.url).searchParams.get("ticketId");
	if (!ticketId) {
		return NextResponse.json({ error: "ticketId is required" }, { status: 400 });
	}

	try {
		const outbound = await fetchAuthQuery(getLatestOutboundForTicketReference, {
			ticketId,
		});
		return NextResponse.json(outbound);
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to fetch outbound message",
				detail: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}
