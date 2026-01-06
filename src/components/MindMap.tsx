import {
	addEdge,
	Background,
	type Connection,
	Controls,
	type Edge,
	MiniMap,
	ReactFlow,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import { useCallback, useEffect, useState } from "react";

import "@xyflow/react/dist/style.css";
import CoreConceptNode from "./nodes/CoreConceptNode";
import FeatureNode from "./nodes/FeatureNode";
import ScreenUiNode from "./nodes/ScreenUiNode";
import UserFlowNode from "./nodes/UserFlowNode";

const nodeTypes = {
	"core-concept": CoreConceptNode,
	"user-flow": UserFlowNode,
	feature: FeatureNode,
	"screen-ui": ScreenUiNode,
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
	const [nodes, , onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const onConnect = useCallback(
		(params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
		[setEdges],
	);

	if (!mounted) return null;

	return (
		<div style={{ width: "100%", height: "100%" }}>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				fitView
			>
				<Controls />
				<MiniMap />
				<Background gap={12} size={1} />
			</ReactFlow>
		</div>
	);
}
