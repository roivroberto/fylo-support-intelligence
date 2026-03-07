import { expect, test, type Page } from "@playwright/test";

const BOOTSTRAP_SECRET = process.env.E2E_BOOTSTRAP_SECRET ?? "fylo-e2e-secret";
const AUTH_PASSWORD = "Fylo-E2E-password-123!";

async function ensureWorkspaceSeeded(page: Page) {
	const tokenResponse = await page.evaluate(async () => {
		const response = await fetch("/api/auth/convex/token");

		return {
			status: response.status,
			body: await response.text(),
		};
	});

	expect(tokenResponse.status, tokenResponse.body).toBe(200);

	const seedResponse = await page.evaluate(async (bootstrapSecret) => {
		const response = await fetch("/api/e2e/bootstrap", {
			method: "POST",
			headers: {
				"content-type": "application/json",
				"x-e2e-bootstrap-secret": bootstrapSecret,
			},
			body: JSON.stringify({}),
		});

		return {
			status: response.status,
			body: await response.text(),
		};
	}, BOOTSTRAP_SECRET);

	expect(seedResponse.status, seedResponse.body).toBe(200);
}

test("supports sign-up and sign-in through protected route redirects", async ({
	page,
}) => {
	test.slow();

	const email = `auth-flow-${Date.now()}@fylo.local`;

	await page.goto("/visibility");
	await expect(page).toHaveURL(/\/sign-in\?next=%2Fvisibility/);

	await page.goto("/sign-up?next=%2Fqueue");
	await page.getByLabel("Name").fill("Auth Flow User");
	await page.getByLabel("Email").fill(email);
	await page.getByLabel("Password").fill(AUTH_PASSWORD);
	await page.getByRole("button", { name: "Create account" }).click();

	await expect(page).toHaveURL(/\/queue$/);
	await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();

	await ensureWorkspaceSeeded(page);

	await page.getByRole("button", { name: "Sign out" }).click();
	await expect(page.getByText("signed out")).toBeVisible();

	await page.goto("/visibility");
	await expect(page).toHaveURL(/\/sign-in\?next=%2Fvisibility/);

	await page.getByLabel("Email").fill(email);
	await page.getByLabel("Password").fill(AUTH_PASSWORD);
	await page.getByRole("button", { name: "Sign in" }).click();

	await expect(page).toHaveURL(/\/visibility$/);
	await expect(
		page.getByRole("heading", {
			name: "Make workload hotspots obvious before routing drifts",
		}),
	).toBeVisible();
});
