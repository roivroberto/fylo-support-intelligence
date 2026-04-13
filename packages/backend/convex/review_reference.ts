import { makeFunctionReference } from "convex/server";

export const applyLeadReviewReference = makeFunctionReference<
	"mutation",
	{
		ticketId: string;
		action: "approve" | "reassign";
		assignedWorkerId?: string;
	},
	unknown
>("review:applyLeadReview");
