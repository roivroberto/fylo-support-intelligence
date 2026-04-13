import "@Fylo/env/web";
import type { NextConfig } from "next";

import { resolveNextWorkspaceRoot } from "./workspace-root";

const workspaceRoot = resolveNextWorkspaceRoot(import.meta.dirname);

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"], 
  reactCompiler: true,
  turbopack: {
	root: workspaceRoot,
	},
  typedRoutes: true,
};

export default nextConfig;
