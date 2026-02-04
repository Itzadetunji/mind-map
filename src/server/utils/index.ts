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

export const getUserByEmail = async (email: string) => {
	// The Supabase admin client exposes getUserByEmail on the auth.admin API,
	// but the current type definitions don't include it, so we cast to any.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const admin = supabaseAdmin.auth.admin as any;
	const { data, error } = await admin.getUserByEmail(email);

	if (error) {
		console.error("Error fetching user:", error);
		return { user: null, error };
	}

	const user = data?.user;
	return { user, error: null };
};
