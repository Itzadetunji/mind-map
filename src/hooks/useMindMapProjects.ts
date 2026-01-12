import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MindMapProject } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

export function useMindMapProjects() {
	const user = useAuthStore((state) => state.user);

	return useQuery({
		queryKey: ["mindMapProjects", user?.id],
		queryFn: async () => {
			if (!user) return [];

			const { data, error } = await supabase
				.from("mind_maps")
				.select("*")
				.eq("user_id", user.id)
				.order("updated_at", { ascending: false });

			if (error) throw error;
			return data as MindMapProject[];
		},
		enabled: !!user,
	});
}

export function useMindMapProject(projectId: string | null) {
	const user = useAuthStore((state) => state.user);

	return useQuery({
		queryKey: ["mindMapProject", projectId],
		queryFn: async () => {
			if (!user || !projectId) return null;

			const { data, error } = await supabase
				.from("mind_maps")
				.select("*")
				.eq("id", projectId)
				.eq("user_id", user.id)
				.single();

			if (error) throw error;
			return data as MindMapProject;
		},
		enabled: !!user && !!projectId,
	});
}

export function useCreateMindMapProject() {
	const user = useAuthStore((state) => state.user);
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			project: Omit<
				MindMapProject,
				"id" | "created_at" | "updated_at" | "user_id"
			>,
		) => {
			if (!user) throw new Error("User not authenticated");

			const { data, error } = await supabase
				.from("mind_maps")
				.insert({
					...project,
					user_id: user.id,
				})
				.select()
				.single();

			if (error) throw error;
			return data as MindMapProject;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["mindMapProjects"] });
		},
	});
}

export function useUpdateMindMapProject() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			...updates
		}: Partial<MindMapProject> & { id: string }) => {
			const { data, error } = await supabase
				.from("mind_maps")
				.update({ ...updates, updated_at: new Date().toISOString() })
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data as MindMapProject;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["mindMapProjects"] });
			queryClient.invalidateQueries({ queryKey: ["mindMapProject", data.id] });
		},
	});
}

export function useDeleteMindMapProject() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (projectId: string) => {
			const { error } = await supabase
				.from("mind_maps")
				.delete()
				.eq("id", projectId);

			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["mindMapProjects"] });
		},
	});
}
