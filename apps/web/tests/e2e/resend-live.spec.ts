import { expect, test, type Page } from "@playwright/test";

type BootstrapPayload = {
	approvedSendTicketId?: string | null;
};

const secret = process.env.E2E_BOOTSTRAP_SECRET ?? "fylo-e2e-secret";

async function ensureBootstrapUserKey(page: Page) {
	return page.evaluate(() => {
		const existing = window.sessionStorage.getItem("fylo:e2e-bootstrap-user-key");
		if (existing) {
			return existing;
		}

		const next = window.crypto.randomUUID();
		window.sessionStorage.setItem("fylo:e2e-bootstrap-user-key", next);
		return next;
	});
}

async function bootstrapLiveSend(page: Page) {
	await page.goto("/");
	const bootstrapUserKey = await ensureBootstrapUserKey(page);

	const sessionResponse = await page.evaluate(async ({ bootstrapSecret, userKey }) => {
		const response = await fetch("/api/e2e/bootstrap", {
			method: "POST",
			headers: {
				"content-type": "application/json",
				"x-e2e-bootstrap-secret": bootstrapSecret,
			},
			body: JSON.stringify({ liveSend: true, bootstrapUserKey: userKey }),
		});

		return {
			ok: response.ok,
			status: response.status,
			body: await response.text(),
		};
	}, { bootstrapSecret: secret, userKey: bootstrapUserKey });

	expect(sessionResponse.status, sessionResponse.body).toBe(201);

	const tokenResponse = await page.evaluate(async () => {
		const response = await fetch("/api/auth/convex/token");

		return {
			ok: response.ok,
			status: response.status,
			body: await response.text(),
		};
	});

	expect(tokenResponse.status, tokenResponse.body).toBe(200);

	const seededResponse = await page.evaluate(async ({ bootstrapSecret, userKey }) => {
		const response = await fetch("/api/e2e/bootstrap", {
			method: "POST",
			headers: {
				"content-type": "application/json",
				"x-e2e-bootstrap-secret": bootstrapSecret,
			},
			body: JSON.stringify({ liveSend: true, bootstrapUserKey: userKey }),
		});

		return {
			ok: response.ok,
			status: response.status,
			body: await response.text(),
		};
	}, { bootstrapSecret: secret, userKey: bootstrapUserKey });

	expect(seededResponse.status, seededResponse.body).toBe(200);
	const payload = JSON.parse(seededResponse.body) as BootstrapPayload;
	expect(payload.approvedSendTicketId).toBeTruthy();

	return payload.approvedSendTicketId!;
}

test.describe("live resend verification", () => {
	test.skip(process.env.E2E_RESEND_LIVE !== "1", "Live Resend test is opt-in");

	test("sends the approved reply through Resend and records the outbound message", async ({
		page,
	}) => {
		const ticketId = await bootstrapLiveSend(page);

		await page.goto(`/tickets/${ticketId}`);
		await expect(
			page.getByRole("button", { name: "Send approved reply" }),
		).toBeEnabled();
		await page.getByRole("button", { name: "Send approved reply" }).click();

		const status = page.locator("p").filter({
			hasText: /Reply sent via Resend \(/,
		});
		await expect(status).toBeVisible();
		const statusText = await status.textContent();
		const providerMessageId = statusText?.match(/Reply sent via Resend \((.+)\)/)?.[1];

		expect(providerMessageId).toBeTruthy();

		const verification = await page.evaluate(
			async ({ bootstrapSecret, currentTicketId }) => {
				const response = await fetch(
					`/api/e2e/bootstrap?ticketId=${encodeURIComponent(currentTicketId)}`,
					{
						headers: {
							"x-e2e-bootstrap-secret": bootstrapSecret,
						},
					},
				);

				return {
					ok: response.ok,
					status: response.status,
					body: await response.text(),
				};
			},
			{ bootstrapSecret: secret, currentTicketId: ticketId },
		);

		expect(verification.status, verification.body).toBe(200);
		const outbound = JSON.parse(verification.body) as {
			deliveryStatus: string;
			providerMessageId: string;
			externalId: string;
			to: string[];
			from: string | null;
			subject: string | null;
			sentAt: number | null;
			rawBody: string;
		};

		expect(outbound.deliveryStatus).toBe("sent");
		expect(outbound.providerMessageId).toBe(providerMessageId);
		expect(outbound.externalId).toBe(providerMessageId);
		expect(outbound.to.length).toBe(1);
		expect(outbound.from).toBeTruthy();
		expect(outbound.subject).toBe("Fylo live send verification");
		expect(outbound.sentAt).toBeTruthy();
		expect(JSON.parse(outbound.rawBody)).toMatchObject({
			state: "sent",
			providerMessageId,
		});
	});
});
