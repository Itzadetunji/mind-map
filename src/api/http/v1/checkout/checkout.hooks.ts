import { useMutation } from "@tanstack/react-query";
import { createCheckout } from "@/server/functions/checkout/create";
import { useAuthStore } from "@/stores/authStore";
import type { CreateCheckoutPayload } from "./checkout.types";

export function useCreateCheckout() {
	const user = useAuthStore((state) => state.user);

	return useMutation({
		mutationFn: async (
			payload: Omit<CreateCheckoutPayload, "email" | "name">,
		) => {
			if (!user?.email) throw new Error("User email required");
			return await createCheckout({
				data: {
					...payload,
					tier: payload.tier as "hobby" | "pro",
					email: user.email,
					name: (user.user_metadata?.full_name as string) || user.email,
					userId: user.id,
				},
			});
		},
	});
}
