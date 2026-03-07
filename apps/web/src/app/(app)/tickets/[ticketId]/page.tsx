import { notFound } from "next/navigation";
import React from "react";
import {
	ensureTicketDraftReference,
	getTicketDraftReference,
} from "../../../../../../../packages/backend/convex/drafts_reference";
import { getTicketDetailReference } from "../../../../../../../packages/backend/convex/tickets_reference";
import { TicketDetail } from "../../../../components/ticket/ticket-detail";
import { fetchAuthAction, fetchAuthQuery } from "../../../../lib/auth-server";

function isTicketIdValidationError(error: unknown) {
	// Convex currently surfaces malformed-id failures as generic validation errors,
	// so this stays as a narrow best-effort message check until a structured
	// discriminator is available in the auth query path.
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

	const ensuredDraft =
		draft ??
		(await fetchAuthAction(ensureTicketDraftReference, {
			ticketId,
		}));

	return <TicketDetail ticket={ticket} draft={ensuredDraft} />;
}
