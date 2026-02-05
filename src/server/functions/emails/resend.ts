import { Resend } from "resend";

/**
 * Lazily-initialized Resend client for server-side email sending.
 *
 * Make sure you set `RESEND_API_KEY` in your environment (.env)
 * before using this client.
 */
export const getResendClient = () => {
	const apiKey = process.env.PROTOMAP_RESEND_API_KEY;

	if (!apiKey) {
		throw new Error("Missing RESEND_API_KEY environment variable");
	}

	return new Resend(apiKey);
};
