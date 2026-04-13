import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const config = require("./playwright.shared.cjs");

export default config;
