import { describe, expect, it } from "vitest";

import schema from "../../schema";

describe("ticket schema workflow fields", () => {
	it("defines the routing and review workflow fields on tickets", () => {
		const ticketFields = schema.tables.tickets.validator.fields;

		expect(ticketFields.assignedWorkerId).toBeDefined();
		expect(ticketFields.reviewState).toBeDefined();
		expect(ticketFields.routingReason).toBeDefined();
		expect(ticketFields.status).toBeDefined();
		expect(ticketFields.routedAt).toBeDefined();
		expect(ticketFields.reviewedAt).toBeDefined();
	});
});
