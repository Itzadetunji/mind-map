import { LogIn } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

export function AuthButton() {
	const { user, loading, signInWithGoogle, signOut } = useAuthStore();

	if (loading) {
		return (
			<div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
		);
	}

	if (user) {
		return (
			<div className="flex items-center gap-3">
				<span className="text-sm text-slate-600 dark:text-slate-400 hidden sm:block">
					{user.email}
				</span>
				{user.user_metadata?.avatar_url && (
					<img
						src={user.user_metadata.avatar_url}
						alt={user.user_metadata.full_name || "User"}
						className="w-8 h-8 rounded-full"
					/>
				)}
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
