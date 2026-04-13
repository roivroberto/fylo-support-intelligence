import { describe, expect, it } from "vitest";

import appConfig from "./playwright.config";
import rootConfig from "../../playwright.config";

describe("Playwright config", () => {
	it("reuses the app Playwright config at the repository root", () => {
		const webServer = Array.isArray(rootConfig.webServer)
			? rootConfig.webServer[0]
			: rootConfig.webServer;

		expect(rootConfig).toBe(appConfig);
		expect(webServer?.command).toBe("bunx next dev --port 3101");
		expect(webServer).toMatchObject({
			cwd: expect.stringContaining("apps/web"),
			port: 3101,
		});
		expect(rootConfig.use?.baseURL).toBe("http://localhost:3101");
		expect(webServer?.env).toMatchObject({
			BETTER_AUTH_URL: "http://localhost:3101",
			NEXT_PUBLIC_SITE_URL: "http://localhost:3101",
			SITE_URL: "http://localhost:3101",
		});
	});
});
