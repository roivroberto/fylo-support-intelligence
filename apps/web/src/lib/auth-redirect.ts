export const DEFAULT_NEXT_PATH = "/queue";

export function getSafeNextPath(raw: string | null | undefined) {
	if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
		return DEFAULT_NEXT_PATH;
	}

	return raw;
}
