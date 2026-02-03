import { createFileRoute } from "@tanstack/react-router";

import { AuthGuard } from "@/components/AuthGuard";
import { useDailyCreditsCheck } from "@/hooks/api/credits.hooks";

const AuthLayout = () => {
	useDailyCreditsCheck();

	return <AuthGuard />;
};

export const Route = createFileRoute("/(auth)")({
	component: AuthLayout,
});
