import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));
const webSrc = fileURLToPath(new URL("./apps/web/src", import.meta.url));

export default defineConfig({
	root,
	resolve: {
		alias: {
			"@": webSrc,
		},
	},
	test: {
		projects: [
			{
				test: {
					name: "backend",
					environment: "node",
					include: ["packages/backend/**/*.test.ts"],
				},
			},
			{
				test: {
					name: "web",
					environment: "jsdom",
					include: ["apps/web/**/*.test.{ts,tsx}"],
					setupFiles: ["./apps/web/src/test/setup.ts"],
				},
			},
		],
	},
});
