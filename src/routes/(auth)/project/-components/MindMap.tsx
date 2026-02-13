import {
	addEdge,
	applyNodeChanges,
	Background,
	type Connection,
	Controls,
	type Edge,
	getNodesBounds,
	MiniMap,
	type Node,
	type NodeChange,
	Panel,
	ReactFlow,
	SelectionMode,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import { toPng } from "html-to-image";
import { useCallback, useEffect, useRef, useState } from "react";

import { useGenerateDocumentation } from "@/api/http/v1/docs/docs.hooks";
import { useUserSubscription } from "@/api/http/v1/credits/credits.hooks";
import { useHistory } from "@/api/http/v1/mind-maps/mind-maps.hooks";
import { MindMapContext } from "@/context/MindMapContext";
import type { MindMapProject } from "@/lib/database.types";
import { writeMindMapClipboard } from "@/lib/mindmap-clipboard";
import { AIChatSidebar } from "../../../../components/AIChatSidebar";
import { FloatingSearchBar } from "../../../../components/FloatingSearchBar";
import { MindMapToolbar } from "../../../../components/MindMapToolbar";
import ConditionNode from "../../../../components/nodes/ConditionNode";
import CoreConceptNode from "../../../../components/nodes/CoreConceptNode";
import CustomNode from "../../../../components/nodes/CustomNode";
import FeatureNode from "../../../../components/nodes/FeatureNode";
import UserFlowNode from "../../../../components/nodes/UserFlowNode";
import { ErrorDialog } from "../../../../components/shared/ErrorDialog";
import { Button } from "../../../../components/ui/button";
import { MindMapContextMenu } from "./MindMapContextMenu";
import { MobileExperienceDialog } from "./MobileExperienceDialog";

const nodeTypes = {
	"core-concept": CoreConceptNode,
	"user-flow": UserFlowNode,
	feature: FeatureNode,
	"screen-ui": FeatureNode, // screen-ui now uses FeatureNode (merged)
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
	onNodesChange?: (nodes: Node[]) => void;
	onEdgesChange?: (edges: Edge[]) => void;
	hasPrompt?: boolean;
	onPromptSubmitted?: () => void;
	readOnly?: boolean;
}

export const MindMap = ({
	project,
	onNodesChange: onNodesChangeCallback,
	onEdgesChange: onEdgesChangeCallback,
	hasPrompt = false,
	onPromptSubmitted,
	readOnly = false,
}: MindMapProps) => {
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
	const { data: subscription } = useUserSubscription();
	const isFreeUser =
		!subscription?.tier || subscription.tier === "free";

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
	const shiftKeyRef = useRef(false);
	const [isShiftPressed, setIsShiftPressed] = useState(false);
	// Track Shift key for multi-select (shift+click adds to selection)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Shift") {
				shiftKeyRef.current = true;
				setIsShiftPressed(true);
			}
		};
		const handleKeyUp = (e: KeyboardEvent) => {
			if (e.key === "Shift") {
				shiftKeyRef.current = false;
				setIsShiftPressed(false);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		};
	}, []);
	// Track if first prompt was just submitted in this session
	const [hasLocalPrompt, setHasLocalPrompt] = useState(hasPrompt);
	// Download dropdown state
	const [showDownloadMenu, setShowDownloadMenu] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);
	const downloadMenuRef = useRef<HTMLDivElement>(null);
	// Share dropdown state
	const [showShareMenu, setShowShareMenu] = useState(false);
	const shareMenuRef = useRef<HTMLDivElement>(null);
	// Error dialog states
	const [showDocErrorDialog, setShowDocErrorDialog] = useState(false);
	const [showImageErrorDialog, setShowImageErrorDialog] = useState(false);
	const generateDocumentation = useGenerateDocumentation();

	// Track previous state to detect actual saveable changes
	const prevNodesRef = useRef<string>("");
	const prevEdgesRef = useRef<string>("");
	const isInitialMountRef = useRef(true);
	// Track if we're in the middle of an undo/redo operation
	const isUndoRedoRef = useRef(false);
	// Track project ID to detect project switches
	const currentProjectIdRef = useRef<string | null>(null);

	// Update hasLocalPrompt when hasPrompt prop changes
	useEffect(() => {
		setHasLocalPrompt(hasPrompt);
	}, [hasPrompt]);

	// Close download and share menus when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as globalThis.Node;
			if (
				downloadMenuRef.current &&
				!downloadMenuRef.current.contains(target)
			) {
				setShowDownloadMenu(false);
			}
			if (shareMenuRef.current && !shareMenuRef.current.contains(target)) {
				setShowShareMenu(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Download documentation handler
	const handleDownload = useCallback(
		async (format: "readme" | "prd") => {
			if (isDownloading || generateDocumentation.isPending) return;
			setIsDownloading(true);
			setShowDownloadMenu(false);

			try {
				const result = await generateDocumentation.mutateAsync({
					projectTitle: project?.title || "Mind Map Project",
					firstPrompt: project?.first_prompt || undefined,
					nodes: nodes.map((n) => ({
						id: n.id,
						type: n.type,
						data: n.data,
					})),
					edges: edges.map((e) => ({
						id: e.id,
						source: e.source,
						target: e.target,
						label: typeof e.label === "string" ? e.label : undefined,
						sourceHandle: e.sourceHandle,
					})),
					format,
				});

				const blob = new Blob([result.content], { type: "text/markdown" });
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = result.filename;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			} catch (error) {
				console.error("Failed to generate documentation:", error);
				setShowDocErrorDialog(true);
			} finally {
				setIsDownloading(false);
			}
		},
		[
			isDownloading,
			generateDocumentation.isPending,
			generateDocumentation.mutateAsync,
			project,
			nodes,
			edges,
		],
	);

	// Download mind map as image
	const handleDownloadImage = useCallback(async () => {
		if (isDownloading || nodes.length === 0) return;
		setIsDownloading(true);
		setShowDownloadMenu(false);

		try {
			// Get the bounds of all nodes
			const nodesBounds = getNodesBounds(nodes);

			// Add padding around the content
			const padding = 100;

			// Calculate the final image dimensions (content + padding on all sides)
			const imageWidth = nodesBounds.width + padding * 2;
			const imageHeight = nodesBounds.height + padding * 2;

			const viewportElement = document.querySelector(".react-flow__viewport");
			if (!viewportElement)
				throw new Error("Could not find React Flow viewport element");

			// Generate PNG with proper transform to center and fit content
			// Translate to position content with padding offset
			const dataUrl = await toPng(viewportElement as HTMLElement, {
				backgroundColor: "#ffffff",
				width: imageWidth,
				height: imageHeight,
				style: {
					width: `${imageWidth}px`,
					height: `${imageHeight}px`,
					transform: `translate(${-nodesBounds.x + padding}px, ${-nodesBounds.y + padding}px) scale(1)`,
				},
				pixelRatio: 1.5,
			});

			// Download the image
			const projectName = project?.title || "mind-map";
			const sanitizedName = projectName
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "_")
				.replace(/^_+|_+$/g, "");

			const a = document.createElement("a");
			a.href = dataUrl;
			a.download = `${sanitizedName}.png`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		} catch (error) {
			console.error("Failed to download image:", error);
			setShowImageErrorDialog(true);
		} finally {
			setIsDownloading(false);
		}
	}, [isDownloading, nodes, project?.title]);

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
			sourceHandle: e.sourceHandle,
		}));
	}, []);

	// Update nodes/edges when project changes - ONLY on initial load or project switch
	useEffect(() => {
		if (project?.graph_data) {
			// Only reset if this is a different project
			if (currentProjectIdRef.current === project.id) {
				// Same project - don't reset, as we have local changes
				return;
			}

			// New project or initial load
			currentProjectIdRef.current = project.id;

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

		// Skip during undo/redo operations - we'll notify after the operation completes
		if (isUndoRedoRef.current) {
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
			// Mark that we're doing undo/redo to prevent intermediate saves
			isUndoRedoRef.current = true;
			setNodes(previousState.nodes);
			setEdges(previousState.edges);

			// After state settles, update refs and notify parent
			setTimeout(() => {
				isUndoRedoRef.current = false;
				prevNodesRef.current = JSON.stringify(
					getSaveableNodes(previousState.nodes),
				);
				prevEdgesRef.current = JSON.stringify(
					getSaveableEdges(previousState.edges),
				);
				onNodesChangeCallback?.(previousState.nodes);
				onEdgesChangeCallback?.(previousState.edges);
			}, 50);
		}
	}, [
		undo,
		nodes,
		edges,
		setNodes,
		setEdges,
		getSaveableNodes,
		getSaveableEdges,
		onNodesChangeCallback,
		onEdgesChangeCallback,
	]);

	const handleRedo = useCallback(() => {
		const nextState = redo(nodes, edges);
		if (nextState) {
			// Mark that we're doing undo/redo to prevent intermediate saves
			isUndoRedoRef.current = true;
			setNodes(nextState.nodes);
			setEdges(nextState.edges);

			// After state settles, update refs and notify parent
			setTimeout(() => {
				isUndoRedoRef.current = false;
				prevNodesRef.current = JSON.stringify(
					getSaveableNodes(nextState.nodes),
				);
				prevEdgesRef.current = JSON.stringify(
					getSaveableEdges(nextState.edges),
				);
				onNodesChangeCallback?.(nextState.nodes);
				onEdgesChangeCallback?.(nextState.edges);
			}, 50);
		}
	}, [
		redo,
		nodes,
		edges,
		setNodes,
		setEdges,
		getSaveableNodes,
		getSaveableEdges,
		onNodesChangeCallback,
		onEdgesChangeCallback,
	]);

	const handleCopySelection = useCallback(async () => {
		const selectedNodes = nodes.filter((node) => node.selected);
		if (selectedNodes.length === 0) return;

		const selectedIds = new Set(selectedNodes.map((node) => node.id));
		const selectedEdges = edges.filter(
			(edge) => selectedIds.has(edge.source) && selectedIds.has(edge.target),
		);

		await writeMindMapClipboard({
			nodes: selectedNodes.map((node) => ({
				id: node.id,
				type: node.type,
				position: node.position,
				data: node.data,
			})),
			edges: selectedEdges.map((edge) => ({
				id: edge.id,
				source: edge.source,
				target: edge.target,
				label: typeof edge.label === "string" ? edge.label : undefined,
				sourceHandle: edge.sourceHandle,
			})),
			timestamp: Date.now(),
		});
	}, [nodes, edges]);

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement | null;
			const isEditableTarget = Boolean(
				target &&
					(target.isContentEditable ||
						["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)),
			);
			// Tool selection
			if (e.key.toLowerCase() === "h" && !e.ctrlKey && !e.metaKey) {
				setTool("hand");
			}
			if (e.key.toLowerCase() === "v" && !e.ctrlKey && !e.metaKey) {
				setTool("select");
			}

			if (isEditableTarget) return;

			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "c") {
				e.preventDefault();
				handleCopySelection();
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
	}, [handleUndo, handleRedo, handleCopySelection]);

	// Shift+click: add clicked node to selection instead of replacing
	const handleNodesChange = useCallback(
		(changes: NodeChange[]) => {
			const hasSelect = changes.some((c) => c.type === "select");
			if (hasSelect && shiftKeyRef.current && !readOnly) {
				setNodes((nds) => {
					const prevSelected = new Set(
						nds.filter((n) => n.selected).map((n) => n.id),
					);
					const next = applyNodeChanges(changes, nds);
					return next.map((n) => ({
						...n,
						selected: prevSelected.has(n.id) || n.selected === true,
					}));
				});
			} else {
				onNodesChange(changes);
			}
		},
		[onNodesChange, setNodes, readOnly],
	);

	const onConnect = useCallback(
		(params: Edge | Connection) => {
			if (readOnly) return;
			takeSnapshot(nodes, edges);
			setEdges((eds) => addEdge(params, eds));
		},
		[setEdges, takeSnapshot, nodes, edges, readOnly],
	);

	const onBeforeMenuAction = useCallback(() => {
		takeSnapshot(nodes, edges);
	}, [takeSnapshot, nodes, edges]);

	const onNodeContextMenu = useCallback(
		(event: React.MouseEvent, node: Node) => {
			if (readOnly) return;
			event.preventDefault();
			setMenu({
				id: node.id,
				top: event.clientY,
				left: event.clientX,
				type: "node",
				node: node,
			});
		},
		[readOnly],
	);

	const onPaneContextMenu = useCallback(
		(event: MouseEvent | React.MouseEvent<Element, MouseEvent>) => {
			if (readOnly) return;
			event.preventDefault();
			setMenu({
				id: "pane",
				top: event.clientY,
				left: event.clientX,
				type: "pane",
			});
		},
		[readOnly],
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

	const onNodeDragStart = useCallback(() => {
		if (readOnly) return;
		setMenu(null);
		// Capture snapshot before drag for undo support
		takeSnapshot(nodes, edges);
	}, [readOnly, takeSnapshot, nodes, edges]);

	// Capture snapshot before nodes are deleted (select tool + Delete key)
	const onNodesDelete = useCallback(
		(deleted: Node[]) => {
			if (readOnly) return;
			takeSnapshot(nodes, edges);
			setNodes((nds) => nds.filter((n) => !deleted.find((d) => d.id === n.id)));
		},
		[setNodes, takeSnapshot, nodes, edges, readOnly],
	);

	// Capture snapshot before edges are deleted (select tool + Delete key)
	const onEdgesDelete = useCallback(
		(deleted: Edge[]) => {
			if (readOnly) return;
			takeSnapshot(nodes, edges);
			setEdges((eds) => eds.filter((e) => !deleted.find((d) => d.id === e.id)));
		},
		[setEdges, takeSnapshot, nodes, edges, readOnly],
	);

	// Expose takeSnapshot for node components to capture before internal changes
	const takeSnapshotForUndo = useCallback(() => {
		takeSnapshot(nodes, edges);
	}, [takeSnapshot, nodes, edges]);

	return (
		<MindMapContext.Provider
			value={{
				openAddMenu: handleOpenAddMenu,
				takeSnapshotForUndo,
				readOnly,
			}}
		>
			<div style={{ width: "100%", height: "100%" }}>
				<ReactFlow
					nodes={nodes}
					edges={edges}
					nodeTypes={nodeTypes}
					onNodesChange={handleNodesChange}
					onEdgesChange={onEdgesChange}
					onNodeClick={onNodeClick}
					onConnect={readOnly ? undefined : onConnect}
					onNodeDragStart={readOnly ? undefined : onNodeDragStart}
					onNodesDelete={readOnly ? undefined : onNodesDelete}
					onEdgesDelete={readOnly ? undefined : onEdgesDelete}
					onNodeContextMenu={onNodeContextMenu}
					onPaneContextMenu={onPaneContextMenu}
					onPaneClick={onPaneClick}
					onMoveStart={() => setMenu(null)}
					fitView
					panOnDrag={readOnly ? true : tool === "hand"}
					selectionOnDrag={readOnly ? false : tool === "select"}
					selectionMode={readOnly ? SelectionMode.Full : SelectionMode.Partial}
					panOnScroll={true}
					nodesDraggable={!readOnly}
					nodesConnectable={!readOnly}
					elementsSelectable={!readOnly}
				>
					{/* Show FloatingSearchBar only if no prompt exists yet and not read-only */}
					{!hasLocalPrompt && !readOnly && (
						<FloatingSearchBar
							projectId={project?.id}
							onProjectCreated={() => {
								setHasLocalPrompt(true);
								onPromptSubmitted?.();
							}}
						/>
					)}
					{/* Show AI Chat toggle button only if prompt exists and not read-only */}
					{hasLocalPrompt && !readOnly && (
						<Panel position="top-right" className="mr-2 mt-2">
							<Button
								onClick={() => setShowChatSidebar(!showChatSidebar)}
								variant="outline"
								size="sm"
								className="bg-primary/10 dark:bg-[#0077B6]/20 text-primary dark:text-[#0077B6] hover:bg-primary/20 dark:hover:bg-[#0077B6]/30 border-primary/20 dark:border-[#0077B6]/30 shadow-sm"
							>
								💬 AI Chat
							</Button>
						</Panel>
					)}
					{/* Show multi-select indicator when Shift is pressed */}
					{!readOnly && isShiftPressed && tool === "select" && (
						<Panel position="top-center" className="mt-2">
							<div className="px-3 py-1.5 bg-primary/90 dark:bg-[#0077B6]/90 text-white text-xs font-medium rounded-md shadow-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
								<span>⇧</span>
								<span>Multi-select mode</span>
							</div>
						</Panel>
					)}
					{!readOnly && <Controls />}
					{!readOnly && (
						<MindMapToolbar
							tool={tool}
							onToolChange={setTool}
							onUndo={handleUndo}
							onRedo={handleRedo}
							canUndo={canUndo}
							canRedo={canRedo}
							nodesLength={nodes.length}
							showDownloadMenu={showDownloadMenu}
							onDownloadMenuToggle={() =>
								setShowDownloadMenu(!showDownloadMenu)
							}
							isDownloading={isDownloading}
							onDownloadImage={handleDownloadImage}
							onDownload={handleDownload}
							downloadMenuRef={downloadMenuRef}
							mindMapId={project?.id}
							showShareMenu={showShareMenu}
							onShareMenuToggle={() => setShowShareMenu(!showShareMenu)}
							shareMenuRef={shareMenuRef}
							isFreeUser={isFreeUser}
						/>
					)}
					<MiniMap />
					{showGrid && <Background gap={12} size={1} />}
					{menu && !readOnly && (
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
				{/* Only show chat sidebar if prompt exists and not read-only */}
				{hasLocalPrompt && !readOnly && (
					<AIChatSidebar
						isOpen={showChatSidebar}
						onClose={() => setShowChatSidebar(false)}
						project={project ?? null}
						nodes={nodes}
						edges={edges}
						onApplyChanges={(newNodes, newEdges) => {
							takeSnapshot(nodes, edges);
							setNodes(newNodes);
							setEdges(newEdges);
						}}
					/>
				)}

				{/* Error Dialogs */}
				<ErrorDialog
					open={showDocErrorDialog}
					onOpenChange={setShowDocErrorDialog}
					title="Documentation Generation Failed"
					description="Failed to generate documentation. Please try again."
				/>
				<ErrorDialog
					open={showImageErrorDialog}
					onOpenChange={setShowImageErrorDialog}
					title="Image Download Failed"
					description="Failed to download image. Please try again."
				/>

				<MobileExperienceDialog />
			</div>
		</MindMapContext.Provider>
	);
};
