import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Edge, Node } from "@xyflow/react";
import { useCallback, useState } from "react";
import type { Database } from "@/lib/supabase-database.types";
import type { MindMapProject } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { generateMindMap } from "@/server/functions/mind-maps/generate";
import type {
	GenerateMindMapPayload,
	GenerateMindMapResponse,
} from "./mind-maps.types";

export const mindMapsQueryKeys = {
	all: ["mind-maps"] as const,
	list: (userId?: string) =>
		[...mindMapsQueryKeys.all, "list", userId] as const,
	detail: (projectId?: string) =>
		[...mindMapsQueryKeys.all, "detail", projectId] as const,
} as const;

export const useGenerateMindMap = () => {
	return useMutation<GenerateMindMapResponse, Error, GenerateMindMapPayload>({
		mutationFn: async (data) =>
			generateMindMap({ data }) as Promise<GenerateMindMapResponse>,
	});
};

export const useMindMapProjects = () => {
	const user = useAuthStore((state) => state.user);

	return useQuery({
		queryKey: mindMapsQueryKeys.list(user?.id),
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
};

export const useMindMapProject = (projectId: string | null) => {
	const user = useAuthStore((state) => state.user);

	return useQuery({
		queryKey: mindMapsQueryKeys.detail(projectId ?? undefined),
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
};

export const useCreateMindMapProject = () => {
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

			const insertData: Database["public"]["Tables"]["mind_maps"]["Insert"] = {
				...project,
				user_id: user.id,
			};
			const { data, error } = await supabase
				.from("mind_maps")
				.insert(insertData as never)
				.select()
				.single();

			if (error) throw error;
			return data as MindMapProject;
		},
		onSuccess: (data) => {
			queryClient.setQueryData<MindMapProject[]>(
				mindMapsQueryKeys.list(data.user_id),
				(oldData) => {
					if (!oldData) return [data];
					return [data, ...oldData];
				},
			);
		},
	});
};

export const useUpdateMindMapProject = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			...updates
		}: Partial<MindMapProject> & { id: string }) => {
			const updateData: Database["public"]["Tables"]["mind_maps"]["Update"] = {
				...updates,
				updated_at: new Date().toISOString(),
			};
			const { data, error } = await supabase
				.from("mind_maps")
				.update(updateData as never)
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data as MindMapProject;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(mindMapsQueryKeys.detail(data.id), data);
			queryClient.setQueryData<MindMapProject[]>(
				mindMapsQueryKeys.list(data.user_id),
				(oldData) => {
					if (!oldData) return [data];
					return oldData.map((p) => (p.id === data.id ? data : p));
				},
			);
		},
	});
};

export const useDeleteMindMapProject = () => {
	const queryClient = useQueryClient();
	const user = useAuthStore((state) => state.user);

	return useMutation({
		mutationFn: async (projectId: string) => {
			if (!user) throw new Error("User not authenticated");

			const { error } = await supabase.rpc(
				"delete_mind_map_with_chats",
				{
					p_mind_map_id: projectId,
					p_user_id: user.id,
				} as never,
			);

			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: mindMapsQueryKeys.list(user?.id),
			});
		},
	});
};

interface HistoryState {
	nodes: Node[];
	edges: Edge[];
}

export const useHistory = (_initialNodes: Node[], _initialEdges: Edge[]) => {
	const [past, setPast] = useState<HistoryState[]>([]);
	const [future, setFuture] = useState<HistoryState[]>([]);

	const takeSnapshot = useCallback((nodes: Node[], edges: Edge[]) => {
		setPast((old) => {
			const newPast = [...old, { nodes, edges }];
			if (newPast.length > 50) newPast.shift();
			return newPast;
		});
		setFuture([]);
	}, []);

	const undo = useCallback(
		(currentNodes: Node[], currentEdges: Edge[]) => {
			if (past.length === 0) return null;

			const newPast = [...past];
			const previousState = newPast.pop();

			if (!previousState) return null;

			setPast(newPast);
			setFuture((old) => [
				{ nodes: currentNodes, edges: currentEdges },
				...old,
			]);

			return previousState;
		},
		[past],
	);

	const redo = useCallback(
		(currentNodes: Node[], currentEdges: Edge[]) => {
			if (future.length === 0) return null;

			const newFuture = [...future];
			const nextState = newFuture.shift();

			if (!nextState) return null;

			setFuture(newFuture);
			setPast((old) => [...old, { nodes: currentNodes, edges: currentEdges }]);

			return nextState;
		},
		[future],
	);

	return {
		takeSnapshot,
		undo,
		redo,
		canUndo: past.length > 0,
		canRedo: future.length > 0,
	};
};
