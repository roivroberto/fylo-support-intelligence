import { makeFunctionReference } from "convex/server";

export const createNoteReference = makeFunctionReference<
	"mutation",
	{ ticketId: string; body: string },
	string
>("notes:create");
