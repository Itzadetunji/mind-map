import { Outlet } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";
import { AuthScreen } from "./AuthScreen";

export function AuthGuard() {
	const { user, loading } = useAuthStore();

	// Show loading state while checking authentication
	if (loading) {
		return <AuthScreen />;
	}

	// Show auth screen if not authenticated
	if (!user) {
		return <AuthScreen />;
	}

	// User is authenticated, render the protected routes
	return <Outlet />;
}
