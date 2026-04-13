export type AppRole = "lead" | "agent";

export type SessionUser = {
	email: string | null;
	name: string | null;
	role: AppRole;
};

export function roleFromSession(role: unknown): AppRole {
	return role === "lead" ? "lead" : "agent";
}

export function normalizeSessionUser(user: unknown): SessionUser {
	if (!user || typeof user !== "object") {
		return {
			email: null,
			name: null,
			role: "agent",
		};
	}

	const sessionUser = user as Record<string, unknown>;

	return {
		email: typeof sessionUser.email === "string" ? sessionUser.email : null,
		name: typeof sessionUser.name === "string" ? sessionUser.name : null,
		role: roleFromSession(sessionUser.role),
	};
}
