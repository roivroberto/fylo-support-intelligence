import { beforeEach, describe, expect, it, vi } from "vitest";

const notFound = vi.fn(() => {
	throw new Error("NEXT_NOT_FOUND");
});

const fetchAuthQuery = vi.fn();
const fetchAuthAction = vi.fn();
const getTicketDetailReference = {};
const getTicketDraftReference = {};
const ensureTicketDraftReference = {};

vi.mock("next/navigation", () => ({
	notFound,
}));

vi.mock("../../../../lib/auth-server", () => ({
	fetchAuthQuery,
	fetchAuthAction,
}));

vi.mock("../../../../components/ticket/ticket-detail", () => ({
	TicketDetail: () => null,
}));

vi.mock(
	"../../../../../../../packages/backend/convex/ticket_detail_reference",
	() => ({
		getTicketDetailReference,
	}),
);

vi.mock(
	"../../../../../../../packages/backend/convex/drafts_reference",
	() => ({
		getTicketDraftReference,
		ensureTicketDraftReference,
	}),
);

describe("TicketDetailPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("ensures a draft when the ticket has none", async () => {
		const ticket = { id: "ticket_1", reviewState: "ready" };
		const ensuredDraft = {
			summary: "Summary",
			recommendedAction: "Reply",
			draftReply: "Hello customer",
			usedFallback: false,
			generatedAtLabel: "AI generated draft",
		};

		fetchAuthQuery.mockResolvedValueOnce(ticket);
		fetchAuthQuery.mockResolvedValueOnce(null);
		fetchAuthAction.mockResolvedValueOnce(ensuredDraft);

		const { default: TicketDetailPage } = await import("./page");

		const page = await TicketDetailPage({
			params: Promise.resolve({ ticketId: "ticket_1" }),
		});

		expect(fetchAuthQuery).toHaveBeenNthCalledWith(1, getTicketDetailReference, {
			ticketId: "ticket_1",
		});
		expect(fetchAuthQuery).toHaveBeenNthCalledWith(2, getTicketDraftReference, {
			ticketId: "ticket_1",
		});
		expect(fetchAuthAction).toHaveBeenCalledTimes(1);
		expect(fetchAuthAction).toHaveBeenCalledWith(ensureTicketDraftReference, {
			ticketId: "ticket_1",
		});
		expect(page.props).toEqual(
			expect.objectContaining({
				ticket: ticket,
				draft: ensuredDraft,
			}),
		);
	});

	it("uses the stored draft without ensuring again when one already exists", async () => {
		const ticket = { id: "ticket_1", reviewState: "ready" };
		const storedDraft = {
			summary: "Stored summary",
			recommendedAction: "Reply",
			draftReply: "Hello customer",
			usedFallback: false,
			generatedAtLabel: "AI generated draft",
		};

		fetchAuthQuery.mockResolvedValueOnce(ticket);
		fetchAuthQuery.mockResolvedValueOnce(storedDraft);

		const { default: TicketDetailPage } = await import("./page");

		const page = await TicketDetailPage({
			params: Promise.resolve({ ticketId: "ticket_1" }),
		});

		expect(fetchAuthQuery).toHaveBeenNthCalledWith(1, getTicketDetailReference, {
			ticketId: "ticket_1",
		});
		expect(fetchAuthQuery).toHaveBeenNthCalledWith(2, getTicketDraftReference, {
			ticketId: "ticket_1",
		});
		expect(fetchAuthAction).not.toHaveBeenCalled();
		expect(page.props).toEqual(
			expect.objectContaining({
				ticket,
				draft: storedDraft,
			}),
		);
	});

	it("maps missing tickets to notFound without ensuring a draft", async () => {
		fetchAuthQuery.mockResolvedValueOnce(null);
		fetchAuthQuery.mockResolvedValueOnce(null);

		const { default: TicketDetailPage } = await import("./page");

		await expect(
			TicketDetailPage({ params: Promise.resolve({ ticketId: "ticket_1" }) }),
		).rejects.toThrow("NEXT_NOT_FOUND");

		expect(fetchAuthQuery).toHaveBeenNthCalledWith(1, getTicketDetailReference, {
			ticketId: "ticket_1",
		});
		expect(fetchAuthQuery).toHaveBeenNthCalledWith(2, getTicketDraftReference, {
			ticketId: "ticket_1",
		});
		expect(fetchAuthAction).not.toHaveBeenCalled();
		expect(notFound).toHaveBeenCalled();
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
