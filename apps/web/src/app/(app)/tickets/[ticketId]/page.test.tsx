import { beforeEach, describe, expect, it, vi } from "vitest";

const notFound = vi.fn(() => {
	throw new Error("NEXT_NOT_FOUND");
});

const fetchAuthQuery = vi.fn();

vi.mock("next/navigation", () => ({
	notFound,
}));

vi.mock("../../../../lib/auth-server", () => ({
	fetchAuthQuery,
}));

vi.mock("../../../../components/ticket/ticket-detail", () => ({
	TicketDetail: ({ ticket }: { ticket: { id: string } }) => ticket.id,
}));

vi.mock(
	"../../../../../../../packages/backend/convex/ticket_detail_reference",
	() => ({
		getTicketDetailReference: {},
	}),
);

vi.mock(
	"../../../../../../../packages/backend/convex/drafts_reference",
	() => ({
		getTicketDraftReference: {},
	}),
);

describe("TicketDetailPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("maps malformed ticket ids to notFound", async () => {
		fetchAuthQuery.mockRejectedValueOnce(new Error("ArgumentValidationError"));

		const { default: TicketDetailPage } = await import("./page");

		await expect(
			TicketDetailPage({ params: Promise.resolve({ ticketId: "bad-id" }) }),
		).rejects.toThrow("NEXT_NOT_FOUND");
		expect(notFound).toHaveBeenCalled();
	});

	it("lets non-validation backend failures surface", async () => {
		fetchAuthQuery.mockRejectedValueOnce(new Error("Forbidden"));

		const { default: TicketDetailPage } = await import("./page");

		await expect(
			TicketDetailPage({ params: Promise.resolve({ ticketId: "bad-id" }) }),
		).rejects.toThrow("Forbidden");
		expect(notFound).not.toHaveBeenCalled();
	});
});
