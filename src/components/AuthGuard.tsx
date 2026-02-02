import { Outlet } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";
import { AppSidebar } from "./AppSidebar";
import { AuthScreen } from "./AuthScreen";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "./ui/sidebar";

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
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className="flex h-16 shrink-0 items-center justify-between border-b px-4">
					<div className="flex items-center gap-2">
						<SidebarTrigger className="-ml-1" />
					</div>
				</header>
				<div className="flex flex-1 flex-col w-full h-full overflow-hidden">
					<Outlet />{" "}
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
