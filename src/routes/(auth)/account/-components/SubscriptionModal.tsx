import { Link, useNavigate } from "@tanstack/react-router";
import { Check, Crown, LogOut, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
					{/* Hobby Plan */}
					<Card className="flex flex-col border-2 relative">
						<CardHeader>
							<CardTitle className="text-xl">Hobby Plan</CardTitle>
							<CardDescription>
								Perfect for getting started with your side projects
							</CardDescription>
							<div className="mt-4">
								<span className="text-4xl font-bold">$9.99</span>
								<span className="text-muted-foreground">/month</span>
							</div>
						</CardHeader>
						<CardContent className="flex-1">
							<ul className="space-y-3">
								<li className="flex items-center gap-2 text-sm">
									<Check className="h-4 w-4 text-green-500" />
									20 Active Projects
								</li>
								<li className="flex items-center gap-2 text-sm">
									<Check className="h-4 w-4 text-green-500" />
									35 Initial Credits
								</li>
								<li className="flex items-center gap-2 text-sm">
									<Check className="h-4 w-4 text-green-500" />5 Daily Credits
									(up to 150/mo)
								</li>
								<li className="flex items-center gap-2 text-sm">
									<Check className="h-4 w-4 text-green-500" />
									Unlimited document export
								</li>
								<li className="flex items-center gap-2 text-sm">
									<Check className="h-4 w-4 text-green-500" />
									Standard AI features
								</li>
							</ul>
						</CardContent>
						<CardFooter>
							<Button
								onClick={handleSubscribe}
								variant="outline"
								className="w-full h-12 rounded-full text-base"
							>
								Start 3-day free trial
							</Button>
						</CardFooter>
					</Card>

					{/* Pro Plan */}
					<Card className="flex flex-col border-2 border-primary bg-primary/5 relative">
						<div className="absolute -top-3 left-1/2 -translate-x-1/2">
							<span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
								Best Value
							</span>
						</div>
						<CardHeader>
							<CardTitle className="text-xl">Pro Plan</CardTitle>
							<CardDescription>
								For serious founders who want to ship faster.
							</CardDescription>
							<div className="mt-4">
								<span className="text-4xl font-bold">$24.99</span>
								<span className="text-muted-foreground line-through ml-2 text-sm">
									$40
								</span>
								<span className="text-muted-foreground">/month</span>
							</div>
							<p className="text-primary text-xs font-semibold mt-1">
								Early deal - Limited time
							</p>
						</CardHeader>
						<CardContent className="flex-1">
							<ul className="space-y-3">
								<li className="flex items-center gap-2 text-sm">
									<Check className="h-4 w-4 text-green-500" />
									Everything in Hobby Plan
								</li>
								<li className="flex items-center gap-2 text-sm">
									<Check className="h-4 w-4 text-green-500" />
									Unlimited active projects
								</li>
								<li className="flex items-center gap-2 text-sm">
									<Check className="h-4 w-4 text-green-500" />
									70 Initial Credits
								</li>
								<li className="flex items-center gap-2 text-sm">
									<Check className="h-4 w-4 text-green-500" />
									Priority Support
								</li>
								<li className="flex items-center gap-2 text-sm">
									<Check className="h-4 w-4 text-green-500" />
									Early access to new features
								</li>
							</ul>
						</CardContent>
						<CardFooter>
							<Button
								onClick={handleSubscribe}
								className="w-full h-12 rounded-full text-base bg-primary text-white hover:bg-primary/90"
							>
								Start 3-day free trial
							</Button>
						</CardFooter>
					</Card>
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
