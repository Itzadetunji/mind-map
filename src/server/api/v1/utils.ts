import { StatusCodes } from "http-status-codes";

export interface ApiErrorBody {
	success: false;
	message: string;
	errors: string[];
}

export function apiErrorResponse(
	statusCode: number,
	message: string,
	errors?: string[],
): Response {
	const body: ApiErrorBody = {
		success: false,
		message,
		errors: errors ?? [message],
	};
	return new Response(JSON.stringify(body), {
		status: statusCode,
		headers: { "Content-Type": "application/json" },
	});
}

export { StatusCodes };
