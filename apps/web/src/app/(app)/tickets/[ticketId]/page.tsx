import { notFound } from "next/navigation";
import React from "react";
import { getTicketDraftReference } from "../../../../../../../packages/backend/convex/drafts_reference";
import { getTicketDetailReference } from "../../../../../../../packages/backend/convex/ticket_detail_reference";
import { TicketDetail } from "../../../../components/ticket/ticket-detail";
import { fetchAuthQuery } from "../../../../lib/auth-server";

function isTicketIdValidationError(error: unknown) {
	if (!(error instanceof Error)) {
		return false;
	}

	return /ArgumentValidationError|invalid argument|validator/i.test(
		error.message,
	);
}

export default async function TicketDetailPage({
	params,
}: {
	params: Promise<{ ticketId: string }>;
}) {
	const { ticketId } = await params;
	let ticket;
	let draft;

	try {
		[ticket, draft] = await Promise.all([
			fetchAuthQuery(getTicketDetailReference, { ticketId }),
			fetchAuthQuery(getTicketDraftReference, { ticketId }),
		]);
	} catch (error) {
		if (isTicketIdValidationError(error)) {
			notFound();
		}

		throw error;
	}

	if (!ticket) {
		notFound();
	}

	return <TicketDetail ticket={{ ...ticket, draft: draft ?? undefined }} />;
}
