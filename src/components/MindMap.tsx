import {
	addEdge,
	Background,
	type Connection,
	Controls,
	type Edge,
	getNodesBounds,
	MiniMap,
	type Node,
	Panel,
	ReactFlow,
	SelectionMode,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import { toPng } from "html-to-image";
import {
	ChevronDown,
	Download,
	FileText,
	Hand,
	Image as ImageIcon,
	Loader2,
	MousePointer2,
	Redo,
	Undo,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { MindMapContext } from "@/context/MindMapContext";
import { useHistory } from "@/hooks/mind-maps.hooks";
import type { MindMapProject } from "@/lib/database.types";
import { generateDocumentation } from "@/server/v1/generate-documentation";
import { AIChatSidebar } from "./AIChatSidebar";
import { FloatingSearchBar } from "./FloatingSearchBar";
import { MindMapContextMenu } from "./MindMapContextMenu";
import ConditionNode from "./nodes/ConditionNode";
import CoreConceptNode from "./nodes/CoreConceptNode";
import CustomNode from "./nodes/CustomNode";
import FeatureNode from "./nodes/FeatureNode";
import UserFlowNode from "./nodes/UserFlowNode";
import { ErrorDialog } from "./shared/ErrorDialog";
import { Button } from "./ui/button";
import { Tooltip } from "./ui/tooltip-custom";

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
	// Download dropdown state
	const [showDownloadMenu, setShowDownloadMenu] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);
	const downloadMenuRef = useRef<HTMLDivElement>(null);
	// Error dialog states
	const [showDocErrorDialog, setShowDocErrorDialog] = useState(false);
	const [showImageErrorDialog, setShowImageErrorDialog] = useState(false);

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

	// Close download menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				downloadMenuRef.current &&
				!downloadMenuRef.current.contains(event.target as globalThis.Node)
			) {
				setShowDownloadMenu(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Download documentation handler
	const handleDownload = useCallback(
		async (format: "readme" | "prd") => {
			if (isDownloading) return;
			setIsDownloading(true);
			setShowDownloadMenu(false);

			try {
				const result = await generateDocumentation({
					data: {
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
					},
				});

				// Create blob and download
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
		[isDownloading, project, nodes, edges],
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
			value={{ openAddMenu: handleOpenAddMenu, takeSnapshotForUndo }}
		>
			<div style={{ width: "100%", height: "100%" }}>
				<ReactFlow
					nodes={nodes}
					edges={edges}
					nodeTypes={nodeTypes}
					onNodesChange={onNodesChange}
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
								className="bg-[#03045E]/10 dark:bg-[#0077B6]/20 text-[#03045E] dark:text-[#0077B6] hover:bg-[#03045E]/20 dark:hover:bg-[#0077B6]/30 border-[#03045E]/20 dark:border-[#0077B6]/30 shadow-sm"
							>
								💬 AI Chat
							</Button>
						</Panel>
					)}
					{!readOnly && <Controls />}
					{!readOnly && (
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
							{/* Download Documentation Button - shows when 2+ nodes */}
							{nodes.length >= 2 && (
								<>
									<div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
									<div className="relative" ref={downloadMenuRef}>
										<Tooltip content="Download Documentation" side="bottom">
											<button
												type="button"
												onClick={() => setShowDownloadMenu(!showDownloadMenu)}
												disabled={isDownloading}
												className="flex items-center gap-1 p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md disabled:opacity-50"
											>
												{isDownloading ? (
													<Loader2 className="w-4 h-4 animate-spin" />
												) : (
													<Download className="w-4 h-4" />
												)}
												<ChevronDown className="w-3 h-3" />
											</button>
										</Tooltip>
										{showDownloadMenu && (
											<div className="absolute top-full mt-1 left-0 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 min-w-45 z-50">
												<button
													type="button"
													onClick={handleDownloadImage}
													className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
												>
													<ImageIcon className="w-4 h-4 text-green-500" />
													<div>
														<div className="font-medium">Image (PNG)</div>
														<div className="text-xs text-slate-500">
															Export as image
														</div>
													</div>
												</button>
												<div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
												<button
													type="button"
													onClick={() => handleDownload("readme")}
													className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
												>
													<FileText className="w-4 h-4 text-blue-500" />
													<div>
														<div className="font-medium">README.md</div>
														<div className="text-xs text-slate-500">
															For AI & Developers
														</div>
													</div>
												</button>
												<button
													type="button"
													onClick={() => handleDownload("prd")}
													className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
												>
													<FileText className="w-4 h-4 text-[#03045E] dark:text-[#0077B6]" />
													<div>
														<div className="font-medium">PRD Document</div>
														<div className="text-xs text-slate-500">
															For Stakeholders
														</div>
													</div>
												</button>
											</div>
										)}
									</div>
								</>
							)}
						</Panel>
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
							onDownloadImage={handleDownloadImage}
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
			</div>
		</MindMapContext.Provider>
	);
};
