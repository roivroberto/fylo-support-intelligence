import { sha256Hex } from "./lib/hash";

export async function createPayloadDigest(payload: string) {
	return (await sha256Hex(payload)).slice(0, 16);
}

export async function recordIngestFailure(
	reason: string,
	payloadDigest: string,
) {
	const failure = {
		status: "recorded" as const,
		reason,
		payloadDigest,
	};

	console.error("ingest_failure", failure);
	return failure;
}
