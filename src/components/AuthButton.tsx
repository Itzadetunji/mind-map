import { Link } from "@tanstack/react-router";
import { LogIn, User, Zap } from "lucide-react";
import { useUserCredits } from "@/hooks/credits.hooks";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "./ui/button";

export function AuthButton() {
	const { user, loading, signInWithGoogle, signOut } = useAuthStore();
	const { data: credits } = useUserCredits();

	if (loading) {
		return (
			<div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
		);
	}

	if (user) {
		return (
			<div className="flex items-center gap-3">
				{/* Credits display */}
				<Link to="/account">
					<Button
						variant="outline"
						className="flex items-center gap-1.5 bg-[#03045E]/10 dark:bg-[#0077B6]/20 text-[#03045E] dark:text-[#0077B6] hover:bg-[#03045E]/20 dark:hover:bg-[#0077B6]/30 border-[#03045E]/20 dark:border-[#0077B6]/30"
					>
						<Zap className="w-4 h-4" />
						<span className="font-medium">{credits?.credits ?? 0}</span>
					</Button>
				</Link>
				<span className="text-sm text-slate-600 dark:text-slate-400 hidden sm:block">
					{user.email}
				</span>
				<Link to="/account" className="shrink-0">
					{user.user_metadata?.avatar_url ? (
						<img
							src={user.user_metadata.avatar_url}
							alt={user.user_metadata.full_name || "User"}
							className="w-8 h-8 rounded-full hover:ring-2 hover:ring-[#03045E] dark:hover:ring-[#0077B6] transition-all"
						/>
					) : (
						<div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center hover:ring-2 hover:ring-[#03045E] dark:hover:ring-[#0077B6] transition-all">
							<User className="w-4 h-4 text-slate-500" />
						</div>
					)}
				</Link>
				<Button
					variant="outline"
					onClick={signOut}
					size="sm"
				>
					Sign Out
				</Button>
			</div>
		);
	}

	return (
		<Button
			onClick={signInWithGoogle}
			className="bg-[#03045E] dark:bg-[#0077B6] text-white hover:bg-[#023E8A] dark:hover:bg-[#0096C7]"
		>
			<LogIn className="w-4 h-4" />
			<p>Sign in with Google</p>
		</Button>
	);
}
