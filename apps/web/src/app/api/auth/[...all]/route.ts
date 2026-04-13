import { NextRequest } from "next/server";

import { handler } from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_ORIGINS = [
	"http://localhost:3001",
	"http://127.0.0.1:3001",
] as const;

function getCorsHeaders(origin: string | null) {
	const allowedOrigin =
		origin && ALLOWED_ORIGINS.includes(origin as (typeof ALLOWED_ORIGINS)[number])
			? origin
			: ALLOWED_ORIGINS[0];
	return {
		"Access-Control-Allow-Origin": allowedOrigin,
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Authorization",
		"Access-Control-Allow-Credentials": "true",
	};
}

function withCors(
	handlerFn: (req: NextRequest, ...args: unknown[]) => Promise<Response>,
) {
	return async (req: NextRequest, ...args: unknown[]) => {
		const origin = req.headers.get("origin");
		const corsHeaders = getCorsHeaders(origin);

		if (req.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		const response = await handlerFn(req, ...args);
		const newHeaders = new Headers(response.headers);
		Object.entries(corsHeaders).forEach(([key, value]) => {
			newHeaders.set(key, value);
		});
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: newHeaders,
		});
	};
}

export const OPTIONS = async (req: NextRequest) => {
	const origin = req.headers.get("origin");
	const corsHeaders = getCorsHeaders(origin);
	return new Response(null, { status: 204, headers: corsHeaders });
};

export const GET = withCors(handler.GET);
export const POST = withCors(handler.POST);
