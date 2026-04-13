import type { ApprovedReplyPayload, ApprovedReplySender } from "./send_reply";

type ResendClientOptions = {
	apiKey: string;
	from: string;
	fetchImpl?: typeof fetch;
};

export type ResendClient = ApprovedReplySender & {
	from: string;
};

export function createResendClient(options: ResendClientOptions): ResendClient {
	const fetchImpl = options.fetchImpl ?? fetch;

	return {
		from: options.from,
		async send(payload: ApprovedReplyPayload) {
			const response = await fetchImpl("https://api.resend.com/emails", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${options.apiKey}`,
					"Content-Type": "application/json",
					"Idempotency-Key": payload.idempotencyKey,
				},
				body: JSON.stringify({
					from: options.from,
					to: [payload.to],
					subject: payload.subject,
					html: payload.html,
				}),
			});

			if (!response.ok) {
				throw new Error(`Resend send failed with status ${response.status}`);
			}

			const body = (await response.json()) as { id?: unknown };
			if (typeof body.id !== "string" || body.id.length === 0) {
				throw new Error("Resend response missing message id");
			}

			return { id: body.id };
		},
	};
}

export function createResendClientFromEnv(
	env: NodeJS.ProcessEnv = process.env,
) {
	const apiKey = env.RESEND_API_KEY ?? "";
	const from = env.RESEND_FROM_EMAIL ?? env.RESEND_FROM ?? "";

	if (!apiKey) {
		throw new Error("RESEND_API_KEY is required to send approved replies");
	}

	if (!from) {
		throw new Error("RESEND_FROM_EMAIL or RESEND_FROM is required");
	}

	return createResendClient({ apiKey, from });
}
