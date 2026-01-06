import { addEdge, type Node, useReactFlow } from "@xyflow/react";
import dagre from "dagre";
import { toPng } from "html-to-image";
import {
	Calendar,
	CheckSquare,
	Copy,
	Cpu,
	Edit,
	Eye,
	GitBranch,
	GitCommitVertical,
	Grid,
	Layout,
	Link as LinkIcon,
	ListTodo,
	Lock,
	Maximize,
	Move,
	Plus,
	Smartphone,
	Sparkles,
	Trash,
	Unlock,
	Zap,
} from "lucide-react";
import { useCallback, useMemo } from "react";
import { ContextMenu, type MenuItem } from "./ui/context-menu-custom";

interface MindMapContextMenuProps {
	menu: {
		id: string; // just a unique key or 'pane'
		top: number;
		left: number;
		type: "pane" | "node" | "add-child-menu";
		node?: Node;
	} | null;
	onClose: () => void;
	onToggleGrid?: () => void;
	onToggleTheme?: () => void;
	onBeforeAction?: () => void;
}

export function MindMapContextMenu({
	menu,
	onClose,
	onToggleGrid,
	onToggleTheme,
	onBeforeAction,
}: MindMapContextMenuProps) {
	const {
		getNodes,
		setNodes,
		addNodes,
		getEdges,
		setEdges,
		fitView,
		setViewport,
		screenToFlowPosition,
	} = useReactFlow();

	const handleAction = useCallback(
		async (actionName: string) => {
			console.log(`Action triggered: ${actionName}`, menu);

			if (!menu) return;

			// Trigger snapshot for undo/redo before modifying state
			if (
				[
					"add-root-node",
					"layout-auto",
					"delete",
					"duplicate",
					"lock",
					"add-child",
					"add-sibling",
				].some((k) => actionName.includes(k)) ||
				actionName.startsWith("type-") ||
				actionName.startsWith("flow-")
			) {
				onBeforeAction?.();
			}

			switch (actionName) {
				case "add-root-node": {
					const position = screenToFlowPosition({ x: menu.left, y: menu.top });
					addNodes({
						id: crypto.randomUUID(),
						type: "core-concept",
						position,
						data: { label: "New Root Node" },
					});
					break;
				}
				case "add-feature-node": {
					const position = screenToFlowPosition({ x: menu.left, y: menu.top });
					addNodes({
						id: crypto.randomUUID(),
						type: "feature",
						position,
						data: { label: "New Feature", features: [] },
					});
					break;
				}
				case "add-user-flow-node": {
					const position = screenToFlowPosition({ x: menu.left, y: menu.top });
					addNodes({
						id: crypto.randomUUID(),
						type: "user-flow",
						position,
						data: { label: "User Flow", description: "" },
					});
					break;
				}
				case "add-screen-ui-node": {
					const position = screenToFlowPosition({ x: menu.left, y: menu.top });
					addNodes({
						id: crypto.randomUUID(),
						type: "screen-ui",
						position,
						data: { label: "Screen UI", description: "" },
					});
					break;
				}
				case "add-custom-node": {
					const position = screenToFlowPosition({ x: menu.left, y: menu.top });
					addNodes({
						id: crypto.randomUUID(),
						type: "custom-node",
						position,
						data: { label: "Custom Node", description: "" },
					});
					break;
				}
				case "add-condition-node": {
					const position = screenToFlowPosition({ x: menu.left, y: menu.top });
					const conditionId = crypto.randomUUID();
					const yesId = crypto.randomUUID();
					const noId = crypto.randomUUID();

					const conditionNode = {
						id: conditionId,
						type: "condition",
						position,
						data: { label: "Condition?" },
					};

					const yesNode = {
						id: yesId,
						type: "user-flow",
						position: { x: position.x - 200, y: position.y + 200 },
						data: { label: "Yes" },
					};

					const noNode = {
						id: noId,
						type: "user-flow",
						position: { x: position.x + 200, y: position.y + 200 },
						data: { label: "No" },
					};

					// Add Nodes
					addNodes([conditionNode, yesNode, noNode]);

					// Add Edges
					// We need to wait for nodes to be added or add them all at once
					// React Flow update batching handles this usually.

					setEdges((edges) => [
						...edges,
						{
							id: `e${conditionId}-${yesId}`,
							source: conditionId,
							target: yesId,
							sourceHandle: `${conditionId}-true`,
							label: "True",
						},
						{
							id: `e${conditionId}-${noId}`,
							source: conditionId,
							target: noId,
							sourceHandle: `${conditionId}-false`,
							label: "False",
						},
					]);

					break;
				}
				case "layout-auto": {
					const nodes = getNodes();
					const edges = getEdges();
					const dagreGraph = new dagre.graphlib.Graph();
					dagreGraph.setDefaultEdgeLabel(() => ({}));
					dagreGraph.setGraph({ rankdir: "LR" });

					nodes.forEach((node) => {
						dagreGraph.setNode(node.id, { width: 150, height: 50 }); // Approximate size
					});

					edges.forEach((edge) => {
						dagreGraph.setEdge(edge.source, edge.target);
					});

					dagre.layout(dagreGraph);

					const layoutedNodes = nodes.map((node) => {
						const nodeWithPosition = dagreGraph.node(node.id);
						return {
							...node,
							position: {
								x: nodeWithPosition.x - 75,
								y: nodeWithPosition.y - 25,
							},
						};
					});
					setNodes(layoutedNodes);
					window.requestAnimationFrame(() => fitView());
					break;
				}
				case "view-fit":
					fitView();
					break;
				case "view-reset":
					setViewport({ x: 0, y: 0, zoom: 1 });
					break;
				case "settings-grid":
					onToggleGrid?.();
					break;
				case "settings-theme":
					onToggleTheme?.();
					break;
				case "settings-export": {
					// Determine viewport to export
					// Currently just printing to console for simplicity in this step, or try to download
					const viewport = document.querySelector(
						".react-flow__viewport",
					) as HTMLElement;
					if (viewport) {
						toPng(viewport).then((dataUrl) => {
							const link = document.createElement("a");
							link.download = "mind-map.png";
							link.href = dataUrl;
							link.click();
						});
					}
					break;
				}
				// Node actions
				case "delete":
					if (menu.node) {
						const nodeId = menu.node.id;
						setNodes((nodes) => nodes.filter((n) => n.id !== nodeId));
						setEdges((edges) =>
							edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
						);
					}
					break;
				case "duplicate":
					if (menu.node) {
						const fallbackId = crypto.randomUUID();
						const newNode = {
							...menu.node,
							id: fallbackId,
							position: {
								x: menu.node.position.x + 50,
								y: menu.node.position.y + 50,
							},
							selected: true,
							data: { ...menu.node.data },
						};
						setNodes((nodes) => [
							...nodes.map((n) => ({ ...n, selected: false })),
							newNode,
						]);
					}
					break;
				case "lock":
					if (menu.node) {
						const nodeId = menu.node.id;
						setNodes((nodes) =>
							nodes.map((n) =>
								n.id === nodeId
									? {
											...n,
											draggable: !!n.data.locked, // If locked=true, draggable=true (unlock operation). If locked=falseOrUndefined, draggable=false (lock operation).
											data: { ...n.data, locked: !n.data.locked },
										}
									: n,
							),
						);
					}
					break;

				// Add Child logic
				case "add-child-feature":
				case "add-child-screen":
				case "add-child-tech":
				case "add-child-custom":
				case "add-child-user-flow": {
					if (menu.node) {
						const nodeId = menu.node.id;
						const typeMap: Record<string, string> = {
							"add-child-feature": "feature",
							"add-child-screen": "screen-ui",
							"add-child-tech": "feature",
							"add-child-custom": "custom-node",
							"add-child-user-flow": "user-flow",
						};
						const type = typeMap[actionName] || "core-concept";
						const id = crypto.randomUUID();
						const newNode = {
							id,
							type,
							position: {
								x: menu.node.position.x + 250,
								y: menu.node.position.y,
							},
							data: { label: `New ${type}` },
						};
						setNodes((nodes) => [...nodes, newNode]);
						setEdges((edges) =>
							addEdge(
								{
									id: `e${nodeId}-${id}`,
									source: nodeId,
									target: id,
								},
								edges,
							),
						);
					}
					break;
				}
				case "add-sibling": {
					if (menu.node) {
						const nodeId = menu.node.id;
						const parentEdge = getEdges().find((e) => e.target === nodeId);
						const id = crypto.randomUUID();
						const newNode = {
							id,
							type: menu.node.type || "core-concept",
							position: {
								x: menu.node.position.x,
								y: menu.node.position.y + 100,
							},
							data: { label: "New Sibling" },
						};
						addNodes(newNode);

						if (parentEdge) {
							setEdges((edges) =>
								addEdge(
									{
										id: `e${parentEdge.source}-${id}`,
										source: parentEdge.source,
										target: id,
									},
									edges,
								),
							);
						}
					}
					break;
				}

				case "flow-add-before": {
					if (menu.node) {
						const nodeId = menu.node.id;
						const incomingEdge = getEdges().find((e) => e.target === nodeId);
						if (incomingEdge) {
							const id = crypto.randomUUID();
							const newNode = {
								id,
								type: "user-flow",
								position: { ...menu.node.position },
								data: { label: "Step Before" },
							};

							// Shift current node down
							setNodes((nodes) =>
								nodes.map((n) =>
									n.id === nodeId
										? {
												...n,
												position: { ...n.position, y: n.position.y + 200 },
											}
										: n,
								),
							);

							// 1. Remove old edge
							setEdges((edges) =>
								edges.filter((e) => e.id !== incomingEdge.id),
							);
							// 2. Add New Node
							addNodes(newNode);
							// 3. Add Edges P->N and N->C
							setEdges((edges) => {
								const e1 = {
									id: `e${incomingEdge.source}-${id}`,
									source: incomingEdge.source,
									target: id,
								};
								const e2 = {
									id: `e${id}-${nodeId}`,
									source: id,
									target: nodeId,
								};
								return [...edges, e1, e2];
							});
						}
					}
					break;
				}

				case "flow-add-after": {
					if (menu.node) {
						const nodeId = menu.node.id;
						const outgoingEdges = getEdges().filter((e) => e.source === nodeId);
						const id = crypto.randomUUID();
						const newNode = {
							id,
							type: "user-flow",
							position: {
								x: menu.node.position.x,
								y: menu.node.position.y + 150,
							},
							data: { label: "Step After" },
						};

						if (outgoingEdges.length > 0) {
							// Insert in between first outgoing path (simple assumption)
							const edge = outgoingEdges[0];
							setEdges((edges) => edges.filter((e) => e.id !== edge.id));
							addNodes(newNode);
							setEdges((edges) => {
								const e1 = {
									id: `e${nodeId}-${id}`,
									source: nodeId,
									target: id,
								};
								const e2 = {
									id: `e${id}-${edge.target}`,
									source: id,
									target: edge.target,
								};
								return [...edges, e1, e2];
							});
						} else {
							// Just append
							addNodes(newNode);
							setEdges((edges) =>
								addEdge(
									{ id: `e${nodeId}-${id}`, source: nodeId, target: id },
									edges,
								),
							);
						}
					}
					break;
				}

				case "flow-trace": {
					if (menu.node) {
						const edges = getEdges();
						const pathEdgeIds = new Set<string>();
						const pathNodeIds = new Set<string>();

						const queue = [menu.node.id];
						// do not add menu.node.id to pathNodeIds if we only want parents

						while (queue.length > 0) {
							const currId = queue.shift();
							if (!currId) continue;

							const incoming = edges.filter((e) => e.target === currId);
							incoming.forEach((e) => {
								pathEdgeIds.add(e.id);
								pathNodeIds.add(e.source);
								queue.push(e.source);
							});
						}

						setEdges((edges) =>
							edges.map((e) => ({
								...e,
								animated: pathEdgeIds.has(e.id),
								style: pathEdgeIds.has(e.id)
									? { stroke: "#2563eb", strokeWidth: 2 }
									: { ...e.style, stroke: "#b1b1b7", strokeWidth: 1 },
							})),
						);
					}
					break;
				}

				case "type-core":
				case "type-flow":
				case "type-feature":
				case "type-screen": {
					if (menu.node) {
						const nodeId = menu.node.id;
						const typeMap: Record<string, string> = {
							"type-core": "core-concept",
							"type-flow": "user-flow",
							"type-feature": "feature",
							"type-screen": "screen-ui",
						};
						const type = typeMap[actionName];
						setNodes((nodes) =>
							nodes.map((n) =>
								n.id === nodeId ? { ...n, type, data: { ...n.data } } : n,
							),
						);
					}
					break;
				}
				default:
					console.log("Action not implemented yet:", actionName);
			}
		},
		[
			menu,
			getNodes,
			setNodes,
			addNodes,
			getEdges,
			setEdges,
			fitView,
			setViewport,
			screenToFlowPosition,
			onToggleGrid,
			onToggleTheme,
			onBeforeAction,
		],
	);

	const items: MenuItem[] = useMemo(() => {
		if (!menu) return [];

		if (menu.type === "add-child-menu" && menu.node) {
			return [
				{
					label: "Add Feature",
					icon: <Plus className="w-4 h-4" />,
					action: () => handleAction("add-child-feature"),
				},
				{
					label: "Add User Flow",
					icon: <Plus className="w-4 h-4" />,
					action: () => handleAction("add-child-user-flow"),
				},
				{
					label: "Add Screen UI",
					icon: <Plus className="w-4 h-4" />,
					action: () => handleAction("add-child-screen"),
				},
				{
					label: "Add Custom Node",
					icon: <Plus className="w-4 h-4" />,
					action: () => handleAction("add-child-custom"),
				},
			];
		}

		if (menu.type === "pane") {
			return [
				{
					label: "Add Node",
					icon: <Plus className="w-4 h-4" />,
					submenu: [
						{
							label: "Add Root Node",
							icon: <Plus className="w-4 h-4" />,
							action: () => handleAction("add-root-node"),
						},
						{
							label: "Add Feature",
							icon: <Plus className="w-4 h-4" />,
							action: () => handleAction("add-feature-node"),
						},
						{
							label: "Add User Flow",
							icon: <Plus className="w-4 h-4" />,
							action: () => handleAction("add-user-flow-node"),
						},
						{
							label: "Add Screen UI",
							icon: <Plus className="w-4 h-4" />,
							action: () => handleAction("add-screen-ui-node"),
						},
						{
							label: "Add Custom Node",
							icon: <Plus className="w-4 h-4" />,
							action: () => handleAction("add-custom-node"),
						},
						{
							label: "Add Condition",
							icon: <GitBranch className="w-4 h-4" />,
							action: () => handleAction("add-condition-node"),
						},
					],
				},
				{
					label: "Generate Mind Map",
					icon: <Sparkles className="w-4 h-4" />,
					submenu: [
						{
							label: "From Prompt...",
							action: () => handleAction("gen-prompt"),
						},
						{
							label: "Expand Current Map",
							action: () => handleAction("gen-expand"),
						},
						{
							label: "Refine Feasibility",
							action: () => handleAction("gen-refine"),
						},
					],
				},
				{ separator: true },
				{
					label: "Layout Options",
					icon: <Layout className="w-4 h-4" />,
					submenu: [
						{ label: "Auto-Layout", action: () => handleAction("layout-auto") },
						{
							label: "Align Selected Nodes",
							action: () => handleAction("layout-align"),
						},
						{
							label: "Distribute Evenly",
							action: () => handleAction("layout-distribute"),
						},
					],
				},
				{
					label: "Zoom & View",
					icon: <Maximize className="w-4 h-4" />,
					submenu: [
						{ label: "Zoom to Fit", action: () => handleAction("view-fit") },
						{
							label: "Zoom to Selection",
							action: () => handleAction("view-selection"),
						},
						{ label: "Reset View", action: () => handleAction("view-reset") },
					],
				},
				{
					label: "Canvas Settings",
					icon: <Grid className="w-4 h-4" />,
					submenu: [
						{
							label: "Change Theme",
							action: () => handleAction("settings-theme"),
						},
						{
							label: "Grid Toggle",
							action: () => handleAction("settings-grid"),
						},
						{ label: "Export", action: () => handleAction("settings-export") },
					],
				},
				{ separator: true },
				{
					label: "Paste",
					action: () => handleAction("paste"),
					disabled: true, // Check clipboard
				},
			];
		}

		if (menu.type === "add-child-menu" && menu.node) {
			return [
				{
					label: "Add Feature",
					icon: <Zap className="w-4 h-4" />,
					action: () => handleAction("add-child-feature"),
				},
				{
					label: "Add User Flow",
					icon: <GitBranch className="w-4 h-4" />,
					action: () => handleAction("add-child-user-flow"),
				},
				{
					label: "Add Screen UI",
					icon: <Smartphone className="w-4 h-4" />,
					action: () => handleAction("add-child-screen"),
				},
				{
					label: "Add Custom Node",
					icon: <Cpu className="w-4 h-4" />,
					action: () => handleAction("add-child-custom"),
				},
			];
		}

		if (menu.type === "node" && menu.node) {
			const commonItems: MenuItem[] = [
				{
					label: "Edit",
					icon: <Edit className="w-4 h-4" />,
					action: () => handleAction("node-edit"),
				},
				{
					label: "AI Enhance",
					icon: <Sparkles className="w-4 h-4" />,
					submenu: [
						{
							label: "Expand This Node",
							action: () => handleAction("ai-expand"),
						},
						{
							label: "Explain in Detail",
							action: () => handleAction("ai-explain"),
						},
						{
							label: "Suggest Alternatives",
							action: () => handleAction("ai-alternatives"),
						},
						{
							label: "Walk Through Flow",
							action: () => handleAction("ai-walkthrough"),
						},
					],
				},
				{ separator: true },
				{
					label: "Add Child Node",
					icon: <GitBranch className="w-4 h-4" />,
					submenu: [
						{
							label: "Feature",
							action: () => handleAction("add-child-feature"),
						},
						{ label: "Screen", action: () => handleAction("add-child-screen") },
						{
							label: "Tech Component",
							action: () => handleAction("add-child-tech"),
						},
						{ label: "Custom", action: () => handleAction("add-child-custom") },
					],
				},
				{
					label: "Add Sibling Node",
					icon: <GitBranch className="w-4 h-4" />, // Rotate?
					action: () => handleAction("add-sibling"),
				},
				{
					label: "Change Type",
					submenu: [
						{ label: "Core Concept", action: () => handleAction("type-core") },
						{ label: "User Flow", action: () => handleAction("type-flow") },
						{ label: "Feature", action: () => handleAction("type-feature") },
						{ label: "Screen UI", action: () => handleAction("type-screen") },
					],
				},
				{
					label: "Trace Flow",
					icon: <Move className="w-4 h-4" />,
					action: () => handleAction("flow-trace"),
				},
				{ separator: true },
				{
					label: "Duplicate",
					icon: <Copy className="w-4 h-4" />,
					action: () => handleAction("duplicate"),
				},
				{
					label: "Delete",
					icon: <Trash className="w-4 h-4" />,
					danger: true,
					action: () => handleAction("delete"),
				},
				{
					label: "Connect To...",
					icon: <LinkIcon className="w-4 h-4" />,
					action: () => handleAction("connect"),
				},
				{
					label: menu.node.data.locked ? "Unlock Position" : "Lock Position",
					icon: menu.node.data.locked ? (
						<Unlock className="w-4 h-4" />
					) : (
						<Lock className="w-4 h-4" />
					),
					action: () => handleAction("lock"),
				},
			];

			const specificItems: MenuItem[] = [];

			if (menu.node.type === "user-flow") {
				specificItems.push(
					{ separator: true },
					{
						label: "Add Step Before",
						icon: <GitCommitVertical className="w-4 h-4" />,
						action: () => handleAction("flow-add-before"),
					},
					{
						label: "Add Step After",
						icon: <GitCommitVertical className="w-4 h-4" />,
						action: () => handleAction("flow-add-after"),
					},
					{
						label: "Convert to Timeline",
						icon: <Calendar className="w-4 h-4" />,
						action: () => handleAction("flow-timeline"),
					},
				);
			} else if (menu.node.type === "feature") {
				specificItems.push(
					{ separator: true },
					{
						label: "Estimate Effort",
						icon: <ListTodo className="w-4 h-4" />,
						action: () => handleAction("feature-estimate"),
					},
					{
						label: "Link to Screen",
						icon: <LinkIcon className="w-4 h-4" />,
						action: () => handleAction("feature-link-screen"),
					},
					{
						label: "Prioritize",
						icon: <CheckSquare className="w-4 h-4" />,
						action: () => handleAction("feature-prioritize"),
					},
				);
			} else if (menu.node.type === "screen-ui") {
				specificItems.push(
					{ separator: true },
					{
						label: "Generate Mockup",
						icon: <Smartphone className="w-4 h-4" />,
						action: () => handleAction("screen-generate"),
					},
					{
						label: "Add UI Elements",
						icon: <Plus className="w-4 h-4" />,
						action: () => handleAction("screen-add-elements"),
					},
					{
						label: "Preview in Device Frame",
						icon: <Eye className="w-4 h-4" />,
						action: () => handleAction("screen-preview"),
					},
				);
			}

			// Insert specific items before the last separator (before Duplicate/Delete)
			// Actually, let's just append specific items at the top or after AI?
			// "Common Card Context Menu" and "User Flow Card" implies specific comes in addition.
			// Let's insert them after "Change Type" and before "Duplicate"
			const insertIndex = 5; // After Change Type
			return [
				...commonItems.slice(0, insertIndex),
				...specificItems,
				...commonItems.slice(insertIndex),
			];
		}

		return [];
	}, [menu, handleAction]);

	if (!menu) return null;

	return (
		<ContextMenu
			items={items}
			position={{ x: menu.left, y: menu.top }}
			onClose={onClose}
		/>
	);
}
