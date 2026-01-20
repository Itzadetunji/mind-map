import { Link } from "@tanstack/react-router";
import { LogIn, User, Zap } from "lucide-react";
import { useUserCredits } from "@/hooks/credits.hooks";
import { useAuthStore } from "@/stores/authStore";

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
				<Link
					to="/account"
					className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
				>
					<Zap className="w-4 h-4" />
					<span className="font-medium">{credits?.credits ?? 0}</span>
				</Link>
				<span className="text-sm text-slate-600 dark:text-slate-400 hidden sm:block">
					{user.email}
				</span>
				<Link to="/account" className="shrink-0">
					{user.user_metadata?.avatar_url ? (
						<img
							src={user.user_metadata.avatar_url}
							alt={user.user_metadata.full_name || "User"}
							className="w-8 h-8 rounded-full hover:ring-2 hover:ring-indigo-500 transition-all"
						/>
					) : (
						<div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center hover:ring-2 hover:ring-indigo-500 transition-all">
							<User className="w-4 h-4 text-slate-500" />
						</div>
					)}
				</Link>
				<button
					type="button"
					onClick={signOut}
					className="px-3 py-1.5 text-sm rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
				>
					Sign Out
				</button>
			</div>
		);
	}

	return (
		<button
			type="button"
			onClick={signInWithGoogle}
			className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
		>
			<LogIn className="w-4 h-4" />
			<p>Sign in with Google</p>
		</button>
	);
}
