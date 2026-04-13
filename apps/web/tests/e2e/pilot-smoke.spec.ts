import { expect, test } from "@playwright/test";

test("queue page heading renders", async ({ page }) => {
	await page.goto("/queue");
	await expect(
		page.getByRole("heading", { name: "Shared Queue" }),
	).toBeVisible();
});
