import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/AuthGuard";
import { Header } from "@/components/Header";
import { useDailyCreditsCheck } from "@/hooks/credits.hooks";

const AuthLayout = () => {
	useDailyCreditsCheck();

	return (
		<>
			<Header />
			<AuthGuard />
		</>
	);
};

export const Route = createFileRoute("/(auth)")({
	component: AuthLayout,
});
