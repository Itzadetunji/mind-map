import { StatusCodes } from "http-status-codes";
import { SubscriptionTier, SubscriptionTierType } from "@/lib/database.types";
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

export const getUserByEmail = async (email: string) => {
	const { data, error } = await supabaseAdmin.auth.admin.listUsers();

	if (error) {
		console.error("Error fetching users:", error);
		return { user: null, error };
	}

	const user =
		data?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ??
		null;

	return { user, error: null };
};

export const getWebhookInitialCredits = (
	tier: SubscriptionTierType | null,
): number => {
	switch (tier) {
		case SubscriptionTier.HOBBY:
			return 35;
		case SubscriptionTier.PRO:
			return 70;
		default:
			return 0;
	}
};

export const resolveTierFromProductId = (productId: string | null) => {
	if (!productId) return null;

	const isTest =
		(process.env.DODO_PAYMENTS_ENVIRONMENT || "live_mode") === "test_mode" ||
		process.env.NODE_ENV === "development";

	const hobbyProductId = isTest
		? process.env.TEST_DODO_PAYMENTS_HOBBY_PRODUCT_ID
		: process.env.DODO_PAYMENTS_HOBBY_PRODUCT_ID;
	const proProductId = isTest
		? process.env.TEST_DODO_PAYMENTS_PRO_PRODUCT_ID
		: process.env.DODO_PAYMENTS_PRO_PRODUCT_ID;

	if (productId === hobbyProductId) return SubscriptionTier.HOBBY;
	if (productId === proProductId) return SubscriptionTier.PRO;

	return null;
};
