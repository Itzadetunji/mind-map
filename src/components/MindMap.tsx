import {
	addEdge,
	Background,
	type Connection,
	Controls,
	type Edge,
	MiniMap,
	type Node,
	type NodeChange,
	Panel,
	ReactFlow,
	SelectionMode,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import { Hand, MousePointer2, Redo, Undo } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import "@xyflow/react/dist/style.css";
import { useHistory } from "@/hooks/useHistory";
import { MindMapContextMenu } from "./MindMapContextMenu";
import ConditionNode from "./nodes/ConditionNode";
import CoreConceptNode from "./nodes/CoreConceptNode";
import CustomNode from "./nodes/CustomNode";
import FeatureNode from "./nodes/FeatureNode";
import ScreenUiNode from "./nodes/ScreenUiNode";
import UserFlowNode from "./nodes/UserFlowNode";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

const nodeTypes = {
	"core-concept": CoreConceptNode,
	"user-flow": UserFlowNode,
	feature: FeatureNode,
	"screen-ui": ScreenUiNode,
	condition: ConditionNode,
	"custom-node": CustomNode,
};

const initialNodes = [
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

const initialEdges = [
	{ id: "e1-2", source: "1", target: "2" },
	{ id: "e1-3", source: "1", target: "3" },
	{ id: "e1-4", source: "1", target: "4" },
];

export default function MindMap() {
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
	const { takeSnapshot, undo, redo, canUndo, canRedo } = useHistory(
		nodes,
		edges,
	);

	const [mounted, setMounted] = useState(false);
	const [menu, setMenu] = useState<{
		id: string;
		top: number;
		left: number;
		type: "pane" | "node";
		node?: Node;
	} | null>(null);
	const [showGrid, setShowGrid] = useState(true);
	const [tool, setTool] = useState<"hand" | "select">("hand");

	useEffect(() => {
		setMounted(true);
	}, []);

	// Keyboard shortcuts for Undo/Redo
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
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
	}, [undo, redo, nodes, edges]);

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

	const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
		event.preventDefault();
		setMenu({
			id: "pane",
			top: event.clientY,
			left: event.clientX,
			type: "pane",
		});
	}, []);

	const resetHighlight = useCallback(() => {
		setEdges((edges) =>
			edges.map((e) => ({
				...e,
				animated: false,
				style: { ...e.style, stroke: "#b1b1b7", strokeWidth: 1 },
			})),
		);
		setNodes((nodes) =>
			nodes.map((n) => ({
				...n,
				style: { ...n.style, border: "none" },
			})),
		);
	}, [setEdges, setNodes]);

	const onPaneClick = useCallback(() => {
		if (menu) setMenu(null);
		resetHighlight();
	}, [menu, resetHighlight]);

	const onNodeClick = useCallback(() => {
		resetHighlight();
	}, [resetHighlight]);

	const onNodeDragStart = useCallback(() => {
		// Snapshot before dragging starts
		takeSnapshot(nodes, edges);
		resetHighlight();
	}, [takeSnapshot, nodes, edges, resetHighlight]);

	if (!mounted) return null;

	return (
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
				fitView
				panOnDrag={tool === "hand"}
				selectionOnDrag={tool === "select"}
				selectionMode={SelectionMode.Partial}
				panOnScroll={true}
			>
				<Controls />
				<Panel
					position="top-center"
					className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800"
				>
					<button
						type="button"
						onClick={() => setTool("hand")}
						className={`p-2 rounded-md transition-colors ${
							tool === "hand"
								? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
								: "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
						}`}
						title="Drag / Pan (H)"
					>
						<Hand className="w-4 h-4" />
					</button>
					<button
						type="button"
						onClick={() => setTool("select")}
						className={`p-2 rounded-md transition-colors ${
							tool === "select"
								? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
								: "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
						}`}
						title="Select (V)"
					>
						<MousePointer2 className="w-4 h-4" />
					</button>
					<div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
					<button
						type="button"
						onClick={handleUndo}
						disabled={!canUndo}
						className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md disabled:opacity-50"
						title="Undo (Ctrl+Z)"
					>
						<Undo className="w-4 h-4" />
					</button>
					<button
						type="button"
						onClick={handleRedo}
						disabled={!canRedo}
						className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md disabled:opacity-50"
						title="Redo (Ctrl+Y)"
					>
						<Redo className="w-4 h-4" />
					</button>
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
		</div>
	);
}
