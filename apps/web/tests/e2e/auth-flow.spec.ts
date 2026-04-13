import { expect, test } from "@playwright/test";

const AUTH_PASSWORD = "Fylo-E2E-password-123!";

test("supports admin sign-up and invited pod-code sign-up", async ({
	browser,
}) => {
	test.slow();

	const adminContext = await browser.newContext();
	const invitedContext = await browser.newContext();
	const adminPage = await adminContext.newPage();
	const invitedPage = await invitedContext.newPage();
	const adminEmail = `auth-flow-admin-${Date.now()}@fylo.local`;
	const invitedEmail = `auth-flow-invite-${Date.now()}@fylo.local`;

	await adminPage.goto("/visibility");
	await expect(adminPage).toHaveURL(/\/sign-in\?next=%2Fvisibility/);

	await adminPage.goto("/sign-up?next=%2Fqueue");
	await adminPage.getByLabel("Name").fill("Auth Flow Admin");
	await adminPage.getByLabel("Email").fill(adminEmail);
	await adminPage.getByLabel("Password").fill(AUTH_PASSWORD);
	await adminPage.getByRole("button", { name: "Create account" }).click();

	await expect(adminPage).toHaveURL(/\/$/);
	await expect(
		adminPage
			.getByRole("heading", { name: /my workspace|start your workspace|join an existing workspace/i })
			.first(),
	).toBeVisible();
	await expect(adminPage.getByText("My workspace")).toBeVisible();
	const podCode = (await adminPage.locator("code").textContent())?.trim();
	expect(podCode).toMatch(/^pod-/);

	await invitedPage.goto("/visibility");
	await expect(invitedPage).toHaveURL(/\/sign-in\?next=%2Fvisibility/);

	await invitedPage.goto("/sign-up?next=%2Fvisibility");
	await invitedPage.getByLabel("Name").fill("Invited User");
	await invitedPage.getByLabel("Email").fill(invitedEmail);
	await invitedPage.getByLabel("Password").fill(AUTH_PASSWORD);
	await invitedPage.getByLabel("Pod code").fill(podCode ?? "");
	await invitedPage.getByRole("button", { name: "Create account" }).click();

	await expect(invitedPage).toHaveURL(/\/$/);
	await invitedPage.goto("/visibility");
	await expect(invitedPage).toHaveURL(/\/visibility$/);
	await expect(
		invitedPage.getByRole("heading", {
			name: "Make workload hotspots obvious before routing drifts",
		}),
	).toBeVisible();

	await adminContext.close();
	await invitedContext.close();
});
