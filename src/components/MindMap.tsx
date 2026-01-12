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
import { useCallback, useEffect, useState } from "react";

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

const initialNodes: Node[] = [
	{
		id: "1",
		type: "core-concept",
		position: { x: 0, y: 0 },
		data: { label: "Mind Mapper App" },
	},
	{
		id: "2",
		type: "user-flow",
		position: { x: -350, y: 150 },
		data: {
			label: "Onboarding Flow",
			description: "User sign up and initial tutorial.",
		},
	},
	{
		id: "3",
		type: "feature",
		position: { x: 0, y: 200 },
		data: {
			label: "Canvas Editor",
			features: [
				{ id: "f1", label: "Drag & Drop" },
				{ id: "f2", label: "Zoom/Pan" },
				{ id: "f3", label: "Custom Nodes" },
			],
		},
	},
	{
		id: "4",
		type: "screen-ui",
		position: { x: 350, y: 150 },
		data: {
			label: "Login Screen",
			imageUrl: "", // Intentionally empty to show placeholder
		},
	},
];

const initialEdges: Edge[] = [
	{ id: "e1-2", source: "1", target: "2" },
	{ id: "e1-3", source: "1", target: "3" },
	{ id: "e1-4", source: "1", target: "4" },
];

interface MindMapProps {
	project?: MindMapProject | null;
	onNodesChange?: (nodes: Node[]) => void;
	onEdgesChange?: (edges: Edge[]) => void;
	showChatSidebar?: boolean;
	onChatSidebarClose?: () => void;
}

export default function MindMap({
	project,
	onNodesChange: onNodesChangeCallback,
	onEdgesChange: onEdgesChangeCallback,
	showChatSidebar = false,
	onChatSidebarClose,
}: MindMapProps) {
	// Initialize with project data if available
	const projectNodes = project?.graph_data?.nodes as Node[] | undefined;
	const projectEdges = project?.graph_data?.edges as Edge[] | undefined;

	const [nodes, setNodes, onNodesChange] = useNodesState(
		projectNodes && projectNodes.length > 0 ? projectNodes : initialNodes,
	);
	const [edges, setEdges, onEdgesChange] = useEdgesState(
		projectEdges && projectEdges.length > 0 ? projectEdges : initialEdges,
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

	// Update nodes/edges when project changes
	useEffect(() => {
		if (project?.graph_data) {
			const pNodes = project.graph_data.nodes as Node[] | undefined;
			const pEdges = project.graph_data.edges as Edge[] | undefined;
			if (pNodes && pNodes.length > 0) {
				setNodes(pNodes);
			}
			if (pEdges && pEdges.length > 0) {
				setEdges(pEdges);
			}
		}
	}, [project, setNodes, setEdges]);

	// Notify parent of changes
	useEffect(() => {
		onNodesChangeCallback?.(nodes);
	}, [nodes, onNodesChangeCallback]);

	useEffect(() => {
		onEdgesChangeCallback?.(edges);
	}, [edges, onEdgesChangeCallback]);

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
					<FloatingSearchBar />
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
				<AIChatSidebar
					isOpen={showChatSidebar}
					onClose={() => onChatSidebarClose?.()}
					project={project ?? null}
					nodes={nodes}
					edges={edges}
					onApplyChanges={(newNodes, newEdges) => {
						takeSnapshot(nodes, edges);
						setNodes(newNodes);
						setEdges(newEdges);
					}}
				/>
			</div>
		</MindMapContext.Provider>
	);
}
