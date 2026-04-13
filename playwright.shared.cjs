const { defineConfig } = require("@playwright/test");
const { randomUUID } = require("node:crypto");
const dotenv = require("dotenv");

const E2E_PORT = 3101;
const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;

const rootEnv = {};
const webEnv = {};

dotenv.config({ path: ".env.local", processEnv: rootEnv });
dotenv.config({ path: "apps/web/.env.local", processEnv: webEnv });

const e2eBootstrapSecret = process.env.E2E_BOOTSTRAP_SECRET ?? randomUUID();
process.env.E2E_BOOTSTRAP_SECRET = e2eBootstrapSecret;

const selectedEnv = {
	BETTER_AUTH_SECRET:
		rootEnv.BETTER_AUTH_SECRET ?? process.env.BETTER_AUTH_SECRET,
	BETTER_AUTH_URL:
		rootEnv.BETTER_AUTH_URL ?? process.env.BETTER_AUTH_URL ?? E2E_BASE_URL,
	SUPPORT_INBOX_EMAIL:
		rootEnv.SUPPORT_INBOX_EMAIL ?? process.env.SUPPORT_INBOX_EMAIL,
	NEXT_PUBLIC_CONVEX_SITE_URL:
		webEnv.NEXT_PUBLIC_CONVEX_SITE_URL ??
		process.env.NEXT_PUBLIC_CONVEX_SITE_URL,
	NEXT_PUBLIC_CONVEX_URL:
		webEnv.NEXT_PUBLIC_CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL,
	NEXT_PUBLIC_SITE_URL:
		webEnv.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL,
	SITE_URL: rootEnv.SITE_URL ?? process.env.SITE_URL ?? E2E_BASE_URL,
};

const e2eEnv = {
	E2E_BOOTSTRAP_SECRET: e2eBootstrapSecret,
	ENABLE_E2E_BOOTSTRAP: "1",
	BETTER_AUTH_URL: E2E_BASE_URL,
	NEXT_PUBLIC_SITE_URL: E2E_BASE_URL,
	SITE_URL: E2E_BASE_URL,
};

module.exports = defineConfig({
	testDir: "./apps/web/tests/e2e",
	webServer: {
		command: `bunx next dev --port ${E2E_PORT}`,
		cwd: "./apps/web",
		env: {
			...process.env,
			...selectedEnv,
			...e2eEnv,
		},
		port: E2E_PORT,
		reuseExistingServer: false,
	},
	use: {
		baseURL: E2E_BASE_URL,
		trace: "on-first-retry",
	},
});
