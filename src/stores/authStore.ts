import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { supabase } from "@/lib/supabase";

interface AuthState {
	user: User | null;
	session: Session | null;
	loading: boolean;
	initialized: boolean;
	signInWithGoogle: () => Promise<void>;
	signOut: () => Promise<void>;
	initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
	user: null,
	session: null,
	loading: true,
	initialized: false,

	initialize: async () => {
		if (get().initialized) return;

		// Get initial session
		const {
			data: { session },
		} = await supabase.auth.getSession();

		set({
			session,
			user: session?.user ?? null,
			loading: false,
			initialized: true,
		});

		// Listen for auth changes
		supabase.auth.onAuthStateChange((_event, session) => {
			set({
				session,
				user: session?.user ?? null,
				loading: false,
			});
		});
	},

	signInWithGoogle: async () => {
		const { error } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo: `${window.location.origin}/`,
			},
		});
		if (error) {
			console.error("Error signing in with Google:", error);
			throw error;
		}
	},

	signOut: async () => {
		const { error } = await supabase.auth.signOut();
		if (error) {
			console.error("Error signing out:", error);
			throw error;
		}
	},
}));
