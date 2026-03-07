const { defineConfig } = require("@playwright/test");
const { randomUUID } = require("node:crypto");
const dotenv = require("dotenv");

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
		rootEnv.BETTER_AUTH_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
	NEXT_PUBLIC_CONVEX_SITE_URL:
		webEnv.NEXT_PUBLIC_CONVEX_SITE_URL ??
		process.env.NEXT_PUBLIC_CONVEX_SITE_URL,
	NEXT_PUBLIC_CONVEX_URL:
		webEnv.NEXT_PUBLIC_CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL,
	NEXT_PUBLIC_SITE_URL:
		webEnv.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL,
	SITE_URL: rootEnv.SITE_URL ?? process.env.SITE_URL ?? "http://localhost:3001",
};

const e2eEnv = {
	E2E_BOOTSTRAP_SECRET: e2eBootstrapSecret,
	ENABLE_E2E_BOOTSTRAP: "1",
	NEXT_PUBLIC_SITE_URL: "http://localhost:3001",
	SITE_URL: "http://localhost:3001",
};

module.exports = defineConfig({
	testDir: "./apps/web/tests/e2e",
	webServer: {
		command: "bun run dev",
		cwd: "./apps/web",
		env: {
			...process.env,
			...selectedEnv,
			...e2eEnv,
		},
		port: 3001,
		reuseExistingServer: false,
	},
	use: {
		baseURL: "http://localhost:3001",
		trace: "on-first-retry",
	},
});
