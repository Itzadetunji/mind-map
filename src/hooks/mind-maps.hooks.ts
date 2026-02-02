import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Edge, Node } from "@xyflow/react";
import { useCallback, useState } from "react";
import {
	type MindMapInsert,
	type MindMapUpdate,
	TABLE_MIND_MAPS,
	TABLES,
} from "@/lib/constants/database.constants";
import type { MindMapProject } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

export const mindMapsQueryKeys = {
	all: ["mind-maps"] as const,
	list: (userId?: string) =>
		[...mindMapsQueryKeys.all, "list", userId] as const,
	detail: (projectId?: string) =>
		[...mindMapsQueryKeys.all, "detail", projectId] as const,
} as const;

export function useMindMapProjects() {
	const user = useAuthStore((state) => state.user);

	return useQuery({
		queryKey: mindMapsQueryKeys.list(user?.id),
		queryFn: async () => {
			if (!user) return [];

			const { data, error } = await supabase
				.from(TABLES.MIND_MAPS)
				.select("*")
				.eq(TABLE_MIND_MAPS.USER_ID, user.id)
				.order(TABLE_MIND_MAPS.UPDATED_AT, { ascending: false });

			if (error) throw error;
			return data as MindMapProject[];
		},
		enabled: !!user,
	});
}

export function useMindMapProject(projectId: string | null) {
	const user = useAuthStore((state) => state.user);

	return useQuery({
		queryKey: mindMapsQueryKeys.detail(projectId ?? undefined),
		queryFn: async () => {
			if (!user || !projectId) return null;

			const { data, error } = await supabase
				.from(TABLES.MIND_MAPS)
				.select("*")
				.eq(TABLE_MIND_MAPS.ID, projectId)
				.eq(TABLE_MIND_MAPS.USER_ID, user.id)
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

			const insertData: MindMapInsert = {
				...project,
				[TABLE_MIND_MAPS.USER_ID]: user.id,
			};
			const { data, error } = await supabase
				.from(TABLES.MIND_MAPS)
				.insert(insertData)
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
}

export function useUpdateMindMapProject() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			...updates
		}: Partial<MindMapProject> & { id: string }) => {
			const updateData: MindMapUpdate = {
				...updates,
				[TABLE_MIND_MAPS.UPDATED_AT]: new Date().toISOString(),
			};
			const { data, error } = await supabase
				.from(TABLES.MIND_MAPS)
				.update(updateData)
				.eq(TABLE_MIND_MAPS.ID, id)
				.select()
				.single();

			if (error) throw error;
			return data as MindMapProject;
		},
		onSuccess: (data) => {
			// Update cache directly instead of invalidating to prevent refetch
			queryClient.setQueryData(mindMapsQueryKeys.detail(data.id), data);
			// Update the projects list cache as well
			queryClient.setQueryData<MindMapProject[]>(
				mindMapsQueryKeys.list(data.user_id),
				(oldData) => {
					if (!oldData) return [data];
					return oldData.map((p) => (p.id === data.id ? data : p));
				},
			);
		},
	});
}

export function useDeleteMindMapProject() {
	const queryClient = useQueryClient();
	const user = useAuthStore((state) => state.user);

	return useMutation({
		mutationFn: async (projectId: string) => {
			if (!user) throw new Error("User not authenticated");

			// Use the PostgreSQL function to delete mind map and associated chats
			const { error } = await supabase.rpc("delete_mind_map_with_chats", {
				p_mind_map_id: projectId,
				p_user_id: user.id,
			});

			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: mindMapsQueryKeys.list(user?.id),
			});
		},
	});
}

interface HistoryState {
	nodes: Node[];
	edges: Edge[];
}

export function useHistory(_initialNodes: Node[], _initialEdges: Edge[]) {
	const [past, setPast] = useState<HistoryState[]>([]);
	const [future, setFuture] = useState<HistoryState[]>([]);

	const takeSnapshot = useCallback((nodes: Node[], edges: Edge[]) => {
		setPast((old) => {
			// Optional: Limit history size
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
}
