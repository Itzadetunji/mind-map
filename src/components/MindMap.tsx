import {
	addEdge,
	Background,
	type Connection,
	Controls,
	type Edge,
	MiniMap,
	type Node,
	Panel,
	ReactFlow,
	SelectionMode,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import { Hand, MousePointer2, Redo, Undo } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { MindMapContext } from "@/context/MindMapContext";
import { useHistory } from "@/hooks/useHistory";
import type { MindMapProject } from "@/lib/database.types";
import { AIChatSidebar } from "./AIChatSidebar";
import { FloatingSearchBar } from "./FloatingSearchBar";
import { MindMapContextMenu } from "./MindMapContextMenu";
import ConditionNode from "./nodes/ConditionNode";
import CoreConceptNode from "./nodes/CoreConceptNode";
import CustomNode from "./nodes/CustomNode";
import FeatureNode from "./nodes/FeatureNode";
import ScreenUiNode from "./nodes/ScreenUiNode";
import UserFlowNode from "./nodes/UserFlowNode";
import { Tooltip } from "./ui/tooltip-custom";

const nodeTypes = {
	"core-concept": CoreConceptNode,
	"user-flow": UserFlowNode,
	feature: FeatureNode,
	"screen-ui": ScreenUiNode,
	condition: ConditionNode,
	"custom-node": CustomNode,
};

// Default blank canvas with only root node
const defaultNodes: Node[] = [
	{
		id: "root",
		type: "core-concept",
		position: { x: 0, y: 0 },
		data: { label: "New Project" },
	},
];

const defaultEdges: Edge[] = [];

interface MindMapProps {
	project?: MindMapProject | null;
	projectTitle?: string;
	onNodesChange?: (nodes: Node[]) => void;
	onEdgesChange?: (edges: Edge[]) => void;
	onProjectTitleChange?: (title: string) => void;
	hasPrompt?: boolean;
	onPromptSubmitted?: () => void;
}

export default function MindMap({
	project,
	projectTitle = "New Project",
	onNodesChange: onNodesChangeCallback,
	onEdgesChange: onEdgesChangeCallback,
	onProjectTitleChange,
	hasPrompt = false,
	onPromptSubmitted,
}: MindMapProps) {
	// Initialize with project data if available, otherwise use blank canvas
	const projectNodes = project?.graph_data?.nodes as Node[] | undefined;
	const projectEdges = project?.graph_data?.edges as Edge[] | undefined;

	const [nodes, setNodes, onNodesChange] = useNodesState(
		projectNodes && projectNodes.length > 0 ? projectNodes : defaultNodes,
	);
	const [edges, setEdges, onEdgesChange] = useEdgesState(
		projectEdges && projectEdges.length > 0 ? projectEdges : defaultEdges,
	);
	const { takeSnapshot, undo, redo, canUndo, canRedo } = useHistory(
		nodes,
		edges,
	);

	const [menu, setMenu] = useState<{
		id: string;
		top: number;
		left: number;
		type: "pane" | "node" | "add-child-menu";
		node?: Node;
	} | null>(null);
	const [showGrid, setShowGrid] = useState(true);
	const [tool, setTool] = useState<"hand" | "select">("hand");
	const [showChatSidebar, setShowChatSidebar] = useState(false);
	// Track if first prompt was just submitted in this session
	const [hasLocalPrompt, setHasLocalPrompt] = useState(hasPrompt);

	// Track previous state to detect actual saveable changes
	const prevNodesRef = useRef<string>("");
	const prevEdgesRef = useRef<string>("");
	const isInitialMountRef = useRef(true);

	// Update hasLocalPrompt when hasPrompt prop changes
	useEffect(() => {
		setHasLocalPrompt(hasPrompt);
	}, [hasPrompt]);

	// Helper to extract only saveable node properties (ignore selected, dragging, etc.)
	const getSaveableNodes = useCallback((nodeList: Node[]) => {
		return nodeList.map((n) => ({
			id: n.id,
			type: n.type,
			position: n.position,
			data: n.data,
		}));
	}, []);

	// Helper to extract only saveable edge properties
	const getSaveableEdges = useCallback((edgeList: Edge[]) => {
		return edgeList.map((e) => ({
			id: e.id,
			source: e.source,
			target: e.target,
			label: e.label,
		}));
	}, []);

	// Update nodes/edges when project changes
	useEffect(() => {
		if (project?.graph_data) {
			const pNodes = project.graph_data.nodes as Node[] | undefined;
			const pEdges = project.graph_data.edges as Edge[] | undefined;
			if (pNodes && pNodes.length > 0) {
				setNodes(pNodes);
				// Initialize the ref with project data
				prevNodesRef.current = JSON.stringify(getSaveableNodes(pNodes));
			}
			if (pEdges && pEdges.length > 0) {
				setEdges(pEdges);
				prevEdgesRef.current = JSON.stringify(getSaveableEdges(pEdges));
			}
		}
	}, [project, setNodes, setEdges, getSaveableNodes, getSaveableEdges]);

	// Notify parent of changes - only when saveable data actually changes
	useEffect(() => {
		// Skip initial mount
		if (isInitialMountRef.current) {
			isInitialMountRef.current = false;
			// Initialize refs on first render
			prevNodesRef.current = JSON.stringify(getSaveableNodes(nodes));
			prevEdgesRef.current = JSON.stringify(getSaveableEdges(edges));
			return;
		}

		const currentNodesJson = JSON.stringify(getSaveableNodes(nodes));
		const currentEdgesJson = JSON.stringify(getSaveableEdges(edges));

		// Only notify parent if saveable data changed
		if (currentNodesJson !== prevNodesRef.current) {
			prevNodesRef.current = currentNodesJson;
			onNodesChangeCallback?.(nodes);
		}

		if (currentEdgesJson !== prevEdgesRef.current) {
			prevEdgesRef.current = currentEdgesJson;
			onEdgesChangeCallback?.(edges);
		}
	}, [
		nodes,
		edges,
		onNodesChangeCallback,
		onEdgesChangeCallback,
		getSaveableNodes,
		getSaveableEdges,
	]);

	const handleOpenAddMenu = useCallback(
		(nodeId: string, x: number, y: number) => {
			const node = nodes.find((n) => n.id === nodeId);
			if (node) {
				setMenu({
					id: "add-child-menu",
					top: y,
					left: x,
					type: "add-child-menu",
					node,
				});
			}
		},
		[nodes],
	);

	const handleUndo = useCallback(() => {
		const previousState = undo(nodes, edges);
		if (previousState) {
			setNodes(previousState.nodes);
			setEdges(previousState.edges);
		}
	}, [undo, nodes, edges, setNodes, setEdges]);

	const handleRedo = useCallback(() => {
		const nextState = redo(nodes, edges);
		if (nextState) {
			setNodes(nextState.nodes);
			setEdges(nextState.edges);
		}
	}, [redo, nodes, edges, setNodes, setEdges]);

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Tool selection
			if (e.key.toLowerCase() === "h" && !e.ctrlKey && !e.metaKey) {
				setTool("hand");
			}
			if (e.key.toLowerCase() === "v" && !e.ctrlKey && !e.metaKey) {
				setTool("select");
			}

			if ((e.metaKey || e.ctrlKey) && e.key === "z") {
				e.preventDefault();
				if (e.shiftKey) {
					handleRedo();
				} else {
					handleUndo();
				}
			}
			if ((e.metaKey || e.ctrlKey) && e.key === "y") {
				e.preventDefault();
				handleRedo();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handleUndo, handleRedo]);

	const onConnect = useCallback(
		(params: Edge | Connection) => {
			takeSnapshot(nodes, edges);
			setEdges((eds) => addEdge(params, eds));
		},
		[setEdges, takeSnapshot, nodes, edges],
	);

	const onBeforeMenuAction = useCallback(() => {
		takeSnapshot(nodes, edges);
	}, [takeSnapshot, nodes, edges]);

	const onNodeContextMenu = useCallback(
		(event: React.MouseEvent, node: Node) => {
			event.preventDefault();
			setMenu({
				id: node.id,
				top: event.clientY,
				left: event.clientX,
				type: "node",
				node: node,
			});
		},
		[],
	);

	const onPaneContextMenu = useCallback(
		(event: MouseEvent | React.MouseEvent<Element, MouseEvent>) => {
			event.preventDefault();
			setMenu({
				id: "pane",
				top: event.clientY,
				left: event.clientX,
				type: "pane",
			});
		},
		[],
	);

	const onNodeClick = useCallback(() => {
		setMenu(null);
		setEdges((edges) =>
			edges.map((e) => ({ ...e, animated: false, style: undefined })),
		);
	}, [setEdges]);

	const onPaneClick = useCallback(() => {
		setMenu(null);
		setEdges((edges) =>
			edges.map((e) => ({ ...e, animated: false, style: undefined })),
		);
	}, [setEdges]);
	const onNodeDragStart = useCallback(() => setMenu(null), []);

	return (
		<MindMapContext.Provider value={{ openAddMenu: handleOpenAddMenu }}>
			<div style={{ width: "100%", height: "100%" }}>
				<ReactFlow
					nodes={nodes}
					edges={edges}
					nodeTypes={nodeTypes}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onNodeClick={onNodeClick}
					onConnect={onConnect}
					onNodeDragStart={onNodeDragStart}
					onNodeContextMenu={onNodeContextMenu}
					onPaneContextMenu={onPaneContextMenu}
					onPaneClick={onPaneClick}
					onMoveStart={() => setMenu(null)}
					fitView
					panOnDrag={tool === "hand"}
					selectionOnDrag={tool === "select"}
					selectionMode={SelectionMode.Partial}
					panOnScroll={true}
				>
					{/* Show FloatingSearchBar only if no prompt exists yet */}
					{!hasLocalPrompt && (
						<FloatingSearchBar
							projectId={project?.id}
							onProjectCreated={() => {
								setHasLocalPrompt(true);
								onPromptSubmitted?.();
							}}
						/>
					)}
					{/* Show AI Chat toggle button only if prompt exists */}
					{hasLocalPrompt && (
						<Panel position="top-right" className="mr-2 mt-2">
							<button
								type="button"
								onClick={() => setShowChatSidebar(!showChatSidebar)}
								className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors shadow-sm"
							>
								💬 AI Chat
							</button>
						</Panel>
					)}
					<Controls />
					<Panel
						position="top-center"
						className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800"
					>
						<Tooltip content="Pan Tool (H)" side="bottom">
							<button
								type="button"
								onClick={() => setTool("hand")}
								className={`p-2 rounded-md transition-colors ${
									tool === "hand"
										? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
										: "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
								}`}
							>
								<Hand className="w-4 h-4" />
							</button>
						</Tooltip>
						<Tooltip content="Select Tool (V)" side="bottom">
							<button
								type="button"
								onClick={() => setTool("select")}
								className={`p-2 rounded-md transition-colors ${
									tool === "select"
										? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
										: "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
								}`}
							>
								<MousePointer2 className="w-4 h-4" />
							</button>
						</Tooltip>
						<div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
						<Tooltip content="Undo (Ctrl+Z)" side="bottom">
							<button
								type="button"
								onClick={handleUndo}
								disabled={!canUndo}
								className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md disabled:opacity-50"
							>
								<Undo className="w-4 h-4" />
							</button>
						</Tooltip>
						<Tooltip content="Redo (Ctrl+Y)" side="bottom">
							<button
								type="button"
								onClick={handleRedo}
								disabled={!canRedo}
								className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md disabled:opacity-50"
							>
								<Redo className="w-4 h-4" />
							</button>
						</Tooltip>
					</Panel>
					<MiniMap />
					{showGrid && <Background gap={12} size={1} />}
					{menu && (
						<MindMapContextMenu
							menu={menu}
							onClose={() => setMenu(null)}
							onToggleGrid={() => setShowGrid((prev) => !prev)}
							onToggleTheme={() =>
								document.documentElement.classList.toggle("dark")
							}
							onBeforeAction={onBeforeMenuAction}
						/>
					)}
				</ReactFlow>
				{/* Only show chat sidebar if prompt exists */}
				{hasLocalPrompt && (
					<AIChatSidebar
						isOpen={showChatSidebar}
						onClose={() => setShowChatSidebar(false)}
						project={project ?? null}
						projectTitle={projectTitle}
						nodes={nodes}
						edges={edges}
						onApplyChanges={(newNodes, newEdges) => {
							takeSnapshot(nodes, edges);
							setNodes(newNodes);
							setEdges(newEdges);
						}}
						onProjectTitleChange={onProjectTitleChange}
					/>
				)}
			</div>
		</MindMapContext.Provider>
	);
}
