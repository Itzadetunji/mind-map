import type { SubscriptionTierType } from "@/lib/database.types";

const DODO_CHECKOUT_BASE_URL =
	import.meta.env.VITE_DODO_PAYMENTS_CHECKOUT_BASE_URL ?? "";

const DODO_PRODUCT_IDS: Record<SubscriptionTierType, string> = {
	hobby:
		import.meta.env.VITE_DODO_PAYMENTS_HOBBY_PRODUCT_ID ??
		"pdt_0NXd7hDv4RrUKKUi8ghtx",
	pro: import.meta.env.VITE_DODO_PAYMENTS_PRO_PRODUCT_ID ?? "",
	free: "",
};

export function getDodoProductIdForTier(tier: SubscriptionTierType): string {
	return DODO_PRODUCT_IDS[tier] ?? "";
}

export function buildDodoCheckoutUrl(options: {
	productId: string;
	email?: string | null;
}): string {
	if (!DODO_CHECKOUT_BASE_URL) {
		throw new Error(
			"Missing VITE_DODO_PAYMENTS_CHECKOUT_BASE_URL environment variable",
		);
	}

	if (!options.productId) {
		throw new Error("Missing Dodo product ID for selected tier");
	}

	if (DODO_CHECKOUT_BASE_URL.includes("{productId}")) {
		const replaced = DODO_CHECKOUT_BASE_URL.replace(
			"{productId}",
			options.productId,
		);
		return appendEmailIfNeeded(replaced, options.email);
	}

	const url = new URL(DODO_CHECKOUT_BASE_URL);
	url.searchParams.set("product_id", options.productId);
	if (options.email) {
		url.searchParams.set("customer_email", options.email);
	}
	return url.toString();
}

function appendEmailIfNeeded(urlString: string, email?: string | null): string {
	if (!email) {
		return urlString;
	}

	const url = new URL(urlString);
	url.searchParams.set("customer_email", email);
	return url.toString();
}
