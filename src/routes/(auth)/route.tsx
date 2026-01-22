import { createFileRoute } from "@tanstack/react-router";

import { AuthGuard } from "@/components/AuthGuard";
import { Header } from "@/components/Header";

const AuthLayout = () => {
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
