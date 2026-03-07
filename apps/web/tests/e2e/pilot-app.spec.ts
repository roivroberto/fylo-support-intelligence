import { expect, test, type Page } from "@playwright/test";

type BootstrapPayload = {
	viewerEmail: string;
	viewerRole: "lead" | "agent";
	busyAgentUserId: string;
	watchAgentUserId: string;
	clearAgentUserId: string;
	ticketId: string;
	missingInfoTicketId: string;
	persistedDraftTicketId: string;
};

type BootstrapOptions = {
	viewerRole?: "lead" | "agent";
	persistedDraftSeedKey?: string;
	bootstrapUserKey?: string;
};

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

async function requestBootstrap(
	page: Page,
	secret: string,
	options: BootstrapOptions,
) {
	return page.evaluate(
		async ({ bootstrapSecret, bootstrapOptions }) => {
			const bootstrapResponse = await fetch("/api/e2e/bootstrap", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-e2e-bootstrap-secret": bootstrapSecret,
				},
				body: JSON.stringify(bootstrapOptions),
			});

			return {
				ok: bootstrapResponse.ok,
				status: bootstrapResponse.status,
				body: await bootstrapResponse.text(),
			};
		},
		{ bootstrapSecret: secret, bootstrapOptions: options },
	);
}

async function bootstrapSession(page: Page, options: BootstrapOptions = {}) {
	const secret = process.env.E2E_BOOTSTRAP_SECRET ?? "fylo-e2e-secret";
	await page.goto("/");
	const bootstrapUserKey = await ensureBootstrapUserKey(page);
	const sessionResponse = await requestBootstrap(page, secret, {
		...options,
		bootstrapUserKey,
	});

	expect(sessionResponse.status, sessionResponse.body).toBe(201);
	expect(sessionResponse.ok, sessionResponse.body).toBeTruthy();

	const tokenResponse = await page.evaluate(async () => {
		const response = await fetch("/api/auth/convex/token");

		return {
			ok: response.ok,
			status: response.status,
			body: await response.text(),
		};
	});

	if (tokenResponse.status !== 200 || !tokenResponse.ok) {
		throw new Error(
			`convex token bootstrap failed: ${tokenResponse.status} ${tokenResponse.body}`,
		);
	}

	expect(tokenResponse.status, tokenResponse.body).toBe(200);
	expect(tokenResponse.ok, tokenResponse.body).toBeTruthy();

	const response = await requestBootstrap(page, secret, {
		...options,
		bootstrapUserKey,
	});

	expect(response.status, response.body).toBe(200);
	expect(response.ok, response.body).toBeTruthy();

	return JSON.parse(response.body) as BootstrapPayload;
}

async function readDraftReply(page: Page) {
	return page
		.locator("pre")
		.filter({ hasText: /./ })
		.last()
		.textContent();
}

async function readDraftMetadata(page: Page) {
	return page
		.locator("section span")
		.filter({ hasText: /draft/i })
		.first()
		.textContent();
}

async function readDraftGeneratedAt(page: Page) {
	return page.getByText(/^Generated /).first().textContent();
}

test.describe("pilot app routes", () => {
	test("rejects bootstrap requests without the shared secret", async ({ page }) => {
		await page.goto("/");

		const response = await page.evaluate(async () => {
			const bootstrapResponse = await fetch("/api/e2e/bootstrap", {
				method: "POST",
			});

			return {
				ok: bootstrapResponse.ok,
				status: bootstrapResponse.status,
			};
		});

		expect(response.ok).toBeFalsy();
		expect(response.status).toBe(403);
	});

	test("reuses the same bootstrap identity after signing out", async ({ page }) => {
		const first = await bootstrapSession(page);

		await page.goto("/queue");
		await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
		await page.getByRole("button", { name: "Sign out" }).click();
		await expect(page.getByText("signed out")).toBeVisible();

		const second = await bootstrapSession(page);

		expect(second.viewerEmail).toBe(first.viewerEmail);
	});

	test("shows the public route surfaces with current queue and review content", async ({ page }) => {
		const seeded = await bootstrapSession(page);

		await page.goto("/");
		await expect(page.getByRole("heading", { name: "Fylo" })).toBeVisible();

		await page.goto("/queue");
		await expect(
			page.getByRole("heading", { name: "Shared Queue" }),
		).toBeVisible();
		await expect(page.getByText(/tickets visible in the current queue/i)).toBeVisible();
		await expect(
			page.getByRole("link", { name: "VIP onboarding escalation" }),
		).toBeVisible();
		await expect(page.getByText(/provider|fallback/i).first()).toBeVisible();

		await page.getByRole("link", { name: "Review" }).click();
		await expect(
			page.getByRole("heading", { name: "Human decisions still in flight" }),
		).toBeVisible();
		await expect(
			page.getByRole("link", { name: "VIP onboarding escalation" }),
		).toBeVisible();
		await expect(
			page.getByText(/manager_verification|manual_triage/i),
		).toBeVisible();
		await page.getByRole("link", { name: "VIP onboarding escalation" }).click();
		await expect(page).toHaveURL(new RegExp(`/tickets/${seeded.ticketId}$`));
	});

	test("loads seeded authenticated routes with rich visibility data", async ({ page }) => {
		const seeded = await bootstrapSession(page);

		await page.goto("/visibility");
		await expect(
			page.getByRole("heading", {
				name: "Make workload hotspots obvious before routing drifts",
			}),
		).toBeVisible();
		await expect(page.getByText("4 lanes visible in the current workspace")).toBeVisible();
		await expect(page.getByText("2 review items need follow-through")).toBeVisible();
		await expect(page.getByText(/tickets? still unassigned/i)).toBeVisible();
		await expect(page.getByText(seeded.busyAgentUserId)).toBeVisible();

		const busyCard = page.locator("article").filter({
			hasText: seeded.busyAgentUserId,
		});
		await expect(busyCard.getByText(/^busy$/i)).toBeVisible();
		await expect(
			busyCard.getByText(
				"Exception routing is stacking up here, so this lane is the current bottleneck.",
			),
		).toBeVisible();

		const watchCard = page.locator("article").filter({
			hasText: seeded.watchAgentUserId,
		});
		await expect(watchCard.getByText(/^watch$/i)).toBeVisible();
		await expect(
			watchCard.getByText(
				"Healthy overall, but one more manual-review handoff will start to crowd the queue.",
			),
		).toBeVisible();

		const clearCard = page.locator("article").filter({
			hasText: seeded.clearAgentUserId,
		});
		await expect(clearCard.getByText(/^clear$/i)).toBeVisible();
		await expect(
			clearCard.getByText(
				"Plenty of room for overflow if policy rules allow a secondary-skill handoff.",
			),
		).toBeVisible();

		await page.getByRole("link", { name: "Policy" }).click();
		await expect(
			page.getByRole("heading", {
				name: "Tune assignment confidence without leaving the pilot shell",
			}),
		).toBeVisible();

		await page.getByRole("link", { name: "Visibility" }).click();
		await expect(
			page.getByRole("heading", {
				name: "Make workload hotspots obvious before routing drifts",
			}),
		).toBeVisible();

		await page.goto(`/tickets/${seeded.ticketId}`);
		await expect(
			page.getByRole("heading", { name: "VIP onboarding escalation" }),
		).toBeVisible();
		await expect(page.getByText("manager_verification")).toBeVisible();
		await expect(
			page.locator("p").filter({ hasText: seeded.busyAgentUserId }).first(),
		).toBeVisible();
		await expect(
			page.locator("p").filter({ hasText: "vip@northstar.example" }).first(),
		).toBeVisible();
		await expect(
			page.getByText("Escalated by policy rule for lead confirmation."),
		).toBeVisible();
	});

	test("persists policy edits for the authenticated workspace", async ({ page }) => {
		await bootstrapSession(page);
		await page.goto("/settings/policy");

		const thresholdInput = page.getByLabel("Auto-assign threshold");
		const maxAssignmentsInput = page.getByLabel("Max active tickets per worker");

		await thresholdInput.fill("0.85");
		await maxAssignmentsInput.fill("7");
		await page
			.getByRole("checkbox", {
				name: "Allow secondary-skill coverage",
			})
			.uncheck();
		await page.getByRole("button", { name: "Save policy" }).click();

		await expect(page.getByText("Saved to routing policy")).toBeVisible();

		await page.reload();
		await expect(thresholdInput).toHaveValue("0.85");
		await expect(maxAssignmentsInput).toHaveValue("7");
		await expect(
			page.getByRole("checkbox", {
				name: "Allow secondary-skill coverage",
			}),
		).not.toBeChecked();
	});

	test("disables policy edits for agent members", async ({ page }) => {
		await bootstrapSession(page, { viewerRole: "agent" });
		await page.goto("/settings/policy");

		await expect(page.getByLabel("Auto-assign threshold")).toBeDisabled();
		await expect(
			page.getByLabel("Max active tickets per worker"),
		).toBeDisabled();
		await expect(
			page.getByRole("checkbox", {
				name: "Require lead review for policy exceptions",
			}),
		).toBeDisabled();
		await expect(
			page.getByRole("checkbox", {
				name: "Allow secondary-skill coverage",
			}),
		).toBeDisabled();
		await expect(
			page.getByRole("button", { name: "Save policy" }),
		).toBeDisabled();
	});

	test("renders seeded ticket notes and draft content without sending", async ({ page }) => {
		const seeded = await bootstrapSession(page);

		await page.goto(`/tickets/${seeded.ticketId}`);

		await expect(
			page
				.locator("p")
				.filter({ hasText: "VIP onboarding needs lead confirmation." })
				.first(),
		).toBeVisible();
		await expect(page.getByText("AI reply workspace")).toBeVisible();
		await expect(
			page.locator("section span").filter({ hasText: /draft/i }).first(),
		).toBeVisible();
		await expect(page.getByText("Conversation summary")).toBeVisible();
			await expect(page.getByText(/ready to send to/i)).toBeVisible();
			await expect(
				page.getByRole("button", { name: "Send approved reply" }),
			).toBeEnabled();
			await expect(page.getByRole("button", { name: "Add note" })).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Approve assignment" }),
		).toBeVisible();
	});

	test("adds notes and applies review actions from the ticket workspace", async ({ page }) => {
		const seeded = await bootstrapSession(page);

		await page.goto(`/tickets/${seeded.ticketId}`);
		await page.getByLabel("New note").fill("Lead confirmed the next customer update.");
		await page.getByRole("button", { name: "Add note" }).click();
		await expect(page.getByText("Note added")).toBeVisible();
		await expect(
			page.getByText("Lead confirmed the next customer update."),
		).toBeVisible();

		await page.getByRole("button", { name: "Approve assignment" }).click();
		await expect(page.getByText("Review approved")).toBeVisible();
	});

	test("persists persisted draft generation across reloads and regeneration", async ({
		page,
	}) => {
		const seeded = await bootstrapSession(page, {
			persistedDraftSeedKey: "persisted-draft-proof",
		});
		expect(seeded.persistedDraftTicketId).toBeTruthy();

		await page.goto(`/tickets/${seeded.persistedDraftTicketId}`);
		await expect(page.getByText("AI reply workspace")).toBeVisible();

		const initialDraftReply = (await readDraftReply(page))?.trim() ?? "";
		const initialDraftMetadata = (await readDraftMetadata(page))?.trim() ?? "";
		const initialGeneratedAt = (await readDraftGeneratedAt(page))?.trim() ?? "";

		expect(initialDraftReply).toBeTruthy();
		expect(initialDraftMetadata).toMatch(/draft/i);
		expect(initialGeneratedAt).toMatch(/^Generated /);

		await page.reload();
		await expect(page.getByText(initialDraftReply)).toBeVisible();
		await expect(
			page.locator("section span").filter({ hasText: initialDraftMetadata }).first(),
		).toBeVisible();
		await expect(page.getByText(initialGeneratedAt)).toBeVisible();

		await page.getByRole("button", { name: "Regenerate draft" }).click();
		await expect(
			page.getByRole("button", { name: "Regenerate draft" }),
		).toBeEnabled({ timeout: 30_000 });
		await expect(page.getByText(/^Generated /).first()).not.toHaveText(
			initialGeneratedAt,
			{ timeout: 30_000 },
		);

		const regeneratedDraftReply = (await readDraftReply(page))?.trim() ?? "";
		const regeneratedDraftMetadata = (await readDraftMetadata(page))?.trim() ?? "";
		const regeneratedGeneratedAt = (await readDraftGeneratedAt(page))?.trim() ?? "";

		expect(
			regeneratedDraftReply !== initialDraftReply ||
				regeneratedDraftMetadata !== initialDraftMetadata ||
				regeneratedGeneratedAt !== initialGeneratedAt,
		).toBeTruthy();
	});

	test("isolates persisted draft bootstrap data per run", async ({ browser }) => {
		const firstContext = await browser.newContext();
		const secondContext = await browser.newContext();
		const firstPage = await firstContext.newPage();
		const secondPage = await secondContext.newPage();

		const first = await bootstrapSession(firstPage, {
			persistedDraftSeedKey: "persisted-draft-run-a",
		});
		const second = await bootstrapSession(secondPage, {
			persistedDraftSeedKey: "persisted-draft-run-b",
		});

		expect(first.persistedDraftTicketId).toBeTruthy();
		expect(second.persistedDraftTicketId).toBeTruthy();
		expect(first.persistedDraftTicketId).not.toBe(second.persistedDraftTicketId);

		await firstContext.close();
		await secondContext.close();
	});

	test("disables approved send when requester details are missing", async ({ page }) => {
		const seeded = await bootstrapSession(page);

		await page.goto(`/tickets/${seeded.missingInfoTicketId}`);

		await expect(
			page.getByText("No notes yet. Capture reviewer context and handoff details here."),
		).toBeVisible();
		await expect(
			page.locator("section span").filter({ hasText: /draft/i }).first(),
		).toBeVisible();
		await expect(
			page.getByText("Requester email and subject are required before sending."),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Send approved reply" }),
		).toBeDisabled();
		expect((await readDraftReply(page))?.trim()).toBeTruthy();
	});

	test("returns a 404 for invalid ticket ids", async ({ page }) => {
		await bootstrapSession(page);
		const response = await page.goto("/tickets/not-a-ticket-id");

		expect(response?.status()).toBe(404);
		await expect(page.getByText(/This page could not be found/i)).toBeVisible();
	});
});
