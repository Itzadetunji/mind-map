import { createFileRoute } from "@tanstack/react-router";

import { useDailyCreditsCheck } from "@/api/http/v1/credits/credits.hooks";
import { AuthGuard } from "@/components/AuthGuard";

const AuthLayout = () => {
	useDailyCreditsCheck();
	return <AuthGuard />;
};

export const Route = createFileRoute("/(auth)")({
	component: AuthLayout,
});
