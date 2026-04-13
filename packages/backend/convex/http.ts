import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { resendInboundWebhook } from "./webhooks/resend";

const http = httpRouter();
authComponent.registerRoutes(http, createAuth);
http.route({
	path: "/webhooks/resend/inbound",
	method: "POST",
	handler: resendInboundWebhook,
});

export default http;
