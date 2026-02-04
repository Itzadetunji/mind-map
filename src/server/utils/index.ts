import { StatusCodes } from "http-status-codes";
import { getSupabaseAdminClient } from "../../../supabase/index";

export interface ApiErrorBody {
	success: false;
	message: string;
	errors: string[];
}

export interface ApiSuccessBody<T = unknown> {
	success: true;
	data: T;
	message: string;
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

export function apiResponse<T = unknown>(
	data: T,
	message = "OK",
	statusCode = StatusCodes.OK,
): Response {
	const body: ApiSuccessBody<T> = {
		success: true,
		data,
		message,
	};
	return new Response(JSON.stringify(body), {
		status: statusCode,
		headers: { "Content-Type": "application/json" },
	});
}

const supabaseAdmin = getSupabaseAdminClient();

export const getUserById = async (user_id: string) => {
	const { data, error } = await supabaseAdmin.auth.admin.getUserById(user_id);

	if (error) {
		console.error("Error fetching user:", error);
		return { user: null, error };
	}

	const user = data?.user;
	return { user, error: null };
};
