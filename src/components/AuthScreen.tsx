import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import { GoogleIcon } from "./svg-icons/google-icon";
import { Button } from "./ui/button";

export function AuthScreen() {
	const { user, loading, signInWithGoogle } = useAuthStore();

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-white">
				<Loader2 className="w-8 h-8 animate-spin text-slate-400" />
			</div>
		);
	}

	if (user) {
		return null; // User is authenticated, don't show auth screen
	}

	return (
		<div className="min-h-dvh grid grid-cols-1 md:grid-cols-2 bg-white text-slate-900">
			<div className="relative  flex-col justify-between px-6 py-6 sm:px-10 sm:py-8 bg-white hidden md:flex">
				<Link className="flex items-center gap-3 text-slate-900" to="/">
					<div className="flex size-10 items-center justify-center rounded-md border border-slate-200 bg-white shadow-xs">
						<img
							src="/assets/brand/logo-transparent.png"
							alt="Proto Map"
							className="size-6"
						/>
					</div>
					<div className="text-sm font-medium tracking-wide">Protomap</div>
				</Link>

				<div className="hidden lg:block" aria-hidden />

				<footer className="max-w-xl text-sm text-slate-600">
					<p className="leading-relaxed">
						"I have always wanted to visualize my idea before building it out.
						Seems I can do that now."
					</p>
					<p>- Adetunji</p>
				</footer>
			</div>

			<div className="relative flex items-center justify-center px-6 py-16 sm:px-10 bg-primary">
				<Link
					className="flex items-center gap-3 text-white absolute top-6 left-6 md:hidden"
					to="/"
				>
					<figure className="flex size-10 items-center justify-center rounded-md border border-slate-200 bg-white shadow-xs">
						<img
							src="/assets/brand/logo-transparent.png"
							alt="Proto Map"
							className="size-6"
						/>
					</figure>
					<div className="text-sm font-medium tracking-wide">Protomap</div>
				</Link>
				<div
					className="absolute inset-0 bg-linear-to-b from-white/5 to-transparent pointer-events-none"
					aria-hidden
				/>
				<div className="relative w-full max-w-md text-center text-white">
					<h1 className="text-2xl font-semibold">Welcome to Protomap</h1>
					<p className="mt-2 text-sm text-white/70">
						Sign in to manage your projects
					</p>

					<div className="mt-8">
						<Button
							onClick={signInWithGoogle}
							variant="outline"
							size="lg"
							className="w-full justify-center rounded-full bg-white text-slate-900 hover:bg-slate-100 border-0 shadow-md"
						>
							<GoogleIcon className="size-5" />
							Sign in with Google
						</Button>
					</div>

					<p className="mt-6 text-xs text-white/60">
						By continuing, you agree to our{" "}
						<Link
							to="/terms"
							className="underline decoration-white/40 underline-offset-4"
						>
							Terms of Service
						</Link>{" "}
						and{" "}
						<Link
							to="/privacy"
							className="underline decoration-white/40 underline-offset-4"
						>
							Privacy Policy
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
