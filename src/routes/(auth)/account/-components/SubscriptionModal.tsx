import { useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { SubscriptionPlanGrid } from "@/components/shared/SubscriptionPlanCard";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/authStore";

interface SubscriptionModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function SubscriptionModal({
	open,
	onOpenChange,
}: SubscriptionModalProps) {
	const navigate = useNavigate();
	const signOut = useAuthStore((state) => state.signOut);

	const handleSubscribe = () => {
		onOpenChange(false);
		navigate({ to: "/account" });
	};

	const handleLogout = async () => {
		await signOut();
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-3xl max-h-[90vh] w-full overflow-y-auto">
				<DialogHeader className="text-center pb-6">
					<DialogTitle className="text-3xl font-bold">
						Get Ready to Build
					</DialogTitle>
					<DialogDescription className="text-lg">
						Choose a plan that fits your needs. Start with a 3-day free trial.
						Cancel anytime.
					</DialogDescription>
				</DialogHeader>

				<div className="grid md:grid-cols-2 gap-6">
					<SubscriptionPlanGrid
						mode="landing"
						onSubscribe={() => handleSubscribe()}
					/>
				</div>

				<div className="flex flex-col gap-2 items-center">
					<div className="text-center mt-6 text-xs text-muted-foreground">
						Secure payment powered by Dodo payments.
					</div>

					<Button
						variant="ghost"
						onClick={handleLogout}
						className="text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-2 w-fit"
					>
						<LogOut className="h-4 w-4" />
						Log out
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
