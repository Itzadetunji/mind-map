import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { GoogleIcon } from "./svg-icons/google-icon";
import { Button } from "./ui/button";

export function AuthScreen() {
	const { user, loading, signInWithGoogle } = useAuthStore();

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
				<Loader2 className="w-8 h-8 animate-spin text-slate-400" />
			</div>
		);
	}

	if (user) {
		return null; // User is authenticated, don't show auth screen
	}

	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
			<div className="max-w-md w-full text-center">
				<div className="mb-8 flex flex-col items-center">
					<img
						src="/assets/brand/logo-transparent.png"
						alt="logo"
						className="size-16"
					/>
					<h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
						Proto Map
					</h1>
					<p className="text-slate-600 dark:text-slate-400">
						Transform your app ideas into visual user flow diagrams with AI
					</p>
				</div>

				<Button
					onClick={signInWithGoogle}
					variant="outline"
					className="w-full"
					size="lg"
				>
					<GoogleIcon className="size-5" />
					Continue with Google
				</Button>

				<p className="mt-6 text-sm text-slate-500 dark:text-slate-500">
					Sign in to save and manage your mind maps
				</p>

				{/* Footer Links */}
				<footer className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
					<div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600 dark:text-slate-400">
						<Link
							to="/privacy"
							className="hover:text-[#03045E] dark:hover:text-[#0077B6] transition-colors"
						>
							Privacy Policy
						</Link>
						<Link
							to="/terms"
							className="hover:text-[#03045E] dark:hover:text-[#0077B6] transition-colors"
						>
							Terms of Service
						</Link>
					</div>
				</footer>
			</div>
		</div>
	);
}
