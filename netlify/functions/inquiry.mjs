// Netlify Function: receives project inquiries and notifies the owner.
// Configuration lives in environment variables; see docs/setup-and-deployment.md.
import { createInquiryHandler } from "../../lib/inquiry/handler.mjs";

const handleInquiry = createInquiryHandler();

export default (request, context) => handleInquiry(request, context);

export const config = {
  path: "/api/inquiry",
  // Netlify-enforced limit across all function instances (in addition to the in-memory limiter).
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowLimit: 10, windowSize: 60 },
};
