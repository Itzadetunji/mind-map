import { createServerFn } from "@tanstack/react-start";
import DodoPayments from "dodopayments";
import { getSupabaseAdminClient } from "supabase";
import { z } from "zod";

import {
	SubscriptionTier,
	type SubscriptionTierType,
} from "@/lib/database.types";
import type { Database } from "@/lib/supabase-database.types";
import { DodoWebhookSubscriptionData } from "@/routes/v1/dodo/subscription-webhook";
import { getWebhookInitialCredits } from "@/server/utils";

const changePlanSchema = z.object({
	subscriptionId: z.string().min(1),
	tier: z.enum([SubscriptionTier.HOBBY, SubscriptionTier.PRO]),
	userId: z.string().min(1),
});

const getProductIdForTier = (tier: SubscriptionTierType) => {
	const isTest =
		(process.env.DODO_PAYMENTS_ENVIRONMENT || "live_mode") === "test_mode" ||
		process.env.NODE_ENV === "development";

	return isTest
		? tier === SubscriptionTier.HOBBY
			? process.env.TEST_DODO_PAYMENTS_HOBBY_PRODUCT_ID
			: process.env.TEST_DODO_PAYMENTS_PRO_PRODUCT_ID
		: tier === SubscriptionTier.HOBBY
			? process.env.DODO_PAYMENTS_HOBBY_PRODUCT_ID
			: process.env.DODO_PAYMENTS_PRO_PRODUCT_ID;
};

const updateUserCreditsForPlanChange = async (args: {
	supabase: ReturnType<typeof getSupabaseAdminClient>;
	userId: string;
	previousTier: SubscriptionTierType | null;
	newTier: SubscriptionTierType;
}) => {
	const { supabase, userId, previousTier, newTier } = args;

	// Do not modify credits when resulting tier is FREE.
	if (newTier === SubscriptionTier.FREE) {
		return;
	}

	let creditsDelta = 0;

	const isNewPaidSubscription =
		!previousTier || previousTier === SubscriptionTier.FREE;
	const isUpgradeToPro =
		previousTier === SubscriptionTier.HOBBY && newTier === SubscriptionTier.PRO;
	const isDowngradeToHobby =
		previousTier === SubscriptionTier.PRO && newTier === SubscriptionTier.HOBBY;

	if (isNewPaidSubscription) {
		// Case 1: User subscribes to Hobby/Pro from Free/none
		creditsDelta = getWebhookInitialCredits(newTier);
	} else if (isUpgradeToPro) {
		// Case 2: User upgrades from Hobby → Pro
		creditsDelta = 35;
	} else if (isDowngradeToHobby) {
		// Case 3: User downgrades from Pro → Hobby → no change
		creditsDelta = 0;
	}

	if (creditsDelta > 0) {
		const { data: currentCredits, error: creditsError } = await supabase
			.from("user_credits")
			.select("credits")
			.eq("user_id", userId)
			.single();

		// If another error occurs, don't fail the operation – just skip
		// credit adjustment.

		if (creditsError && creditsError.code !== "PGRST116") {
			console.error(
				"Error reading user credits for plan change:",
				creditsError,
			);
		} else if (creditsError?.code === "PGRST116") {
			// No credits row exists yet – create one with the initial credits.
			const insertData: Database["public"]["Tables"]["user_credits"]["Insert"] =
				{
					user_id: userId,
					credits: creditsDelta,
					monthly_credits_remaining: creditsDelta,
				};

			const { error: insertError } = await supabase
				.from("user_credits")
				.insert(insertData as never);

			if (insertError) {
				console.error(
					"Error initializing user credits for plan change:",
					insertError,
				);
			}
		} else if (currentCredits) {
			const existingCredits = currentCredits.credits;

			let updatedCredits = existingCredits + creditsDelta;

			// Apply the 150-credit cap only for the Hobby → Pro upgrade case.
			if (isUpgradeToPro && updatedCredits > 150) {
				updatedCredits = 150;
			}

			const updateData: Database["public"]["Tables"]["user_credits"]["Update"] =
				{
					credits: updatedCredits,
				};

			const { error: updateError } = await supabase
				.from("user_credits")
				.update(updateData as never)
				.eq("user_id", userId);

			if (updateError) {
				// eslint-disable-next-line no-console
				console.error(
					"Error updating user credits for plan change:",
					updateError,
				);
			}
		}
	}
};

export const changeSubscriptionPlan = createServerFn({ method: "POST" })
	.inputValidator(changePlanSchema)
	.handler(async ({ data }) => {
		const { subscriptionId, tier, userId } = data;
		const bearerToken = process.env.DODO_PAYMENTS_API_KEY;
		if (!bearerToken) {
			throw new Error("Missing DODO_PAYMENTS_API_KEY environment variable");
		}

		const productId = getProductIdForTier(tier);
		if (!productId) {
			throw new Error("Missing Dodo product ID for selected tier");
		}

		const environment = (process.env.DODO_PAYMENTS_ENVIRONMENT ||
			"live_mode") as "test_mode" | "live_mode";
		const client = new DodoPayments({ bearerToken, environment });

		const supabase = getSupabaseAdminClient();

		// Fetch the user's existing subscription tier before changing
		const { data: existingSubscription, error: existingSubscriptionError } =
			await supabase
				.from("user_subscriptions")
				.select("tier")
				.eq("user_id", userId)
				.maybeSingle();

		if (
			existingSubscriptionError &&
			existingSubscriptionError.code !== "PGRST116"
		) {
			throw new Error("Failed to read existing subscription");
		}

		const previousTier =
			(existingSubscription?.tier as SubscriptionTierType | null) ?? null;

		try {
			// Use DodoPayments Change Plan API
			const result = (await client.subscriptions.changePlan(subscriptionId, {
				product_id: productId,
				quantity: 1,
				proration_billing_mode: "difference_immediately",
			})) as unknown as DodoWebhookSubscriptionData;

			// Update user credits using the same logic as the webhook
			await updateUserCreditsForPlanChange({
				supabase,
				userId,
				previousTier,
				newTier: tier,
			});

			console.log(result);

			return {
				success: true,
				subscriptionId: result.subscription_id,
				status: result.status,
			};
		} catch (err) {
			throw new Error(
				err instanceof Error
					? err.message
					: "Failed to change subscription plan",
			);
		}
	});
