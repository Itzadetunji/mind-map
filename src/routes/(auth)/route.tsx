import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthGuard } from "@/components/AuthGuard";
import { Separator } from "@/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { useDailyCreditsCheck } from "@/hooks/credits.hooks";

const AuthLayout = () => {
	useDailyCreditsCheck();

	return <AuthGuard />;
};

export const Route = createFileRoute("/(auth)")({
	component: AuthLayout,
});
