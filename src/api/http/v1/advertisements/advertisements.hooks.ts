import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase-database.types";

export const ADVERTISEMENTS_QUERY_KEY = ["advertisements"];

export const useGetActiveAdvertisements = () => {
	return useQuery<Database["public"]["Tables"]["advertisements"]["Row"][]>({
		queryKey: ADVERTISEMENTS_QUERY_KEY,
		queryFn: async () => {
			const { data, error } = await supabase
				.from("advertisements")
				.select("*")
				.eq("status", "active")
				.eq("approved", true)
				.order("created_at", { ascending: false });

			if (error) {
				console.error("Error fetching advertisements:", error);
				throw error;
			}

			return data;
		},
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
};

export const useCreateAdvertisement = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (ad: {
			website_url: string;
			name: string;
			description: string;
			logo_url?: string;
		}) => {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (!session) throw new Error("Not authenticated");

			const insertData: Database["public"]["Tables"]["advertisements"]["Insert"] =
				{
					...ad,
					user_id: session.user.id,
					status: "pending",
					approved: false,
				};

			const { data, error } = await supabase
				.from("advertisements")
				.insert(insertData as never)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ADVERTISEMENTS_QUERY_KEY });
			toast.success("Advertisement submitted successfully");
		},
		onError: (error) => {
			console.error("Error creating advertisement:", error);
			toast.error("Failed to submit advertisement");
		},
	});
};
