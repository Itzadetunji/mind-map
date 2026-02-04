import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	TABLE_ADVERTISEMENTS,
	TABLES,
} from "@/lib/constants/database.constants";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";

export const ADVERTISEMENTS_QUERY_KEY = ["advertisements"];

export const useGetActiveAdvertisements = () => {
	return useQuery<Database["public"]["Tables"]["advertisements"]["Row"][]>({
		queryKey: ADVERTISEMENTS_QUERY_KEY,
		queryFn: async () => {
			const { data, error } = await supabase
				.from(TABLES.ADVERTISEMENTS)
				.select("*")
				.eq(TABLE_ADVERTISEMENTS.STATUS, "active")
				.eq(TABLE_ADVERTISEMENTS.APPROVED, true)
				.order(TABLE_ADVERTISEMENTS.CREATED_AT, { ascending: false });

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

			const { data, error } = await supabase
				.from(TABLES.ADVERTISEMENTS)
				.insert({
					...ad,
					user_id: session.user.id,
					status: "pending",
					approved: false,
				})
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
