import { Panel } from "@xyflow/react";
import {
	Check,
	ChevronDown,
	Copy,
	Download,
	FileText,
	Hand,
	Image as ImageIcon,
	Link2,
	Loader2,
	MousePointer2,
	Redo,
	Share2,
	Undo,
	X,
} from "lucide-react";
import { useState } from "react";
import type { RefObject } from "react";

import {
	useCreateShareLink,
	useRevokeShareLink,
	useShareLink,
} from "@/api/http/v1/share-links/share-links.hooks";
import { Button } from "./ui/button";
import { Tooltip } from "./ui/tooltip-custom";

function ShareLinkDropdownContent({ mindMapId }: { mindMapId: string }) {
	const shareLinkQuery = useShareLink(mindMapId);
	const createShareLink = useCreateShareLink();
	const revokeShareLink = useRevokeShareLink();
	const [copied, setCopied] = useState(false);

	const handleCreateLink = async () => {
		try {
			await createShareLink.mutateAsync(mindMapId);
		} catch (error) {
			console.error("Failed to create share link:", error);
		}
	};

	const handleRevokeLink = async () => {
		try {
			await revokeShareLink.mutateAsync(mindMapId);
		} catch (error) {
			console.error("Failed to revoke share link:", error);
		}
	};

	const handleCopyLink = async () => {
		if (shareLinkQuery.data?.shareUrl) {
			await navigator.clipboard.writeText(shareLinkQuery.data.shareUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	if (shareLinkQuery.isLoading) {
		return (
			<div className="flex items-center justify-center py-6 px-4">
				<Loader2 className="w-5 h-5 animate-spin text-slate-500" />
			</div>
		);
	}

	if (shareLinkQuery.data) {
		return (
			<div className="space-y-3 p-2 min-w-64">
				<div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
					<Link2 className="w-4 h-4 text-slate-500 shrink-0" />
					<input
						type="text"
						value={shareLinkQuery.data.shareUrl}
						readOnly
						className="flex-1 min-w-0 bg-transparent border-none outline-none text-xs text-slate-700 dark:text-slate-300 truncate"
					/>
					<button
						type="button"
						onClick={handleCopyLink}
						className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
					>
						{copied ? (
							<Check className="w-4 h-4 text-green-600" />
						) : (
							<Copy className="w-4 h-4" />
						)}
					</button>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={handleRevokeLink}
					disabled={revokeShareLink.isPending}
					className="w-full h-8 text-xs"
				>
					{revokeShareLink.isPending ? (
						<Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
					) : (
						<X className="w-3 h-3 mr-1.5" />
					)}
					Revoke Link
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-3 p-2 min-w-64">
			<p className="text-xs text-slate-600 dark:text-slate-400">
				Create a shareable link (read-only) for this mind map.
			</p>
			<Button
				size="sm"
				onClick={handleCreateLink}
				disabled={createShareLink.isPending}
				className="w-full h-8 text-xs"
			>
				{createShareLink.isPending ? (
					<Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
				) : (
					<Link2 className="w-3 h-3 mr-1.5" />
				)}
				Create Share Link
			</Button>
		</div>
	);
}

const toolButtonClass = (active: boolean) =>
	`p-2 rounded-md transition-colors ${
		active
			? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
			: "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
	}`;

const actionButtonClass =
	"p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md disabled:opacity-50";

export interface MindMapToolbarProps {
	tool: "hand" | "select";
	onToolChange: (tool: "hand" | "select") => void;
	onUndo: () => void;
	onRedo: () => void;
	canUndo: boolean;
	canRedo: boolean;
	nodesLength: number;
	showDownloadMenu: boolean;
	onDownloadMenuToggle: () => void;
	isDownloading: boolean;
	onDownloadImage: () => void;
	onDownload: (format: "readme" | "prd") => void;
	downloadMenuRef: RefObject<HTMLDivElement | null>;
	mindMapId?: string | null;
	showShareMenu: boolean;
	onShareMenuToggle: () => void;
	shareMenuRef: RefObject<HTMLDivElement | null>;
	/** When true, only README and image export are allowed (free tier). */
	isFreeUser?: boolean;
}

export function MindMapToolbar({
	tool,
	onToolChange,
	onUndo,
	onRedo,
	canUndo,
	canRedo,
	nodesLength,
	showDownloadMenu,
	onDownloadMenuToggle,
	isDownloading,
	onDownloadImage,
	onDownload,
	downloadMenuRef,
	mindMapId,
	showShareMenu,
	onShareMenuToggle,
	shareMenuRef,
	isFreeUser = false,
}: MindMapToolbarProps) {
	return (
		<Panel
			position="top-center"
			className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800"
		>
			<Tooltip content="Pan Tool (H)" side="bottom">
				<button
					type="button"
					onClick={() => onToolChange("hand")}
					className={toolButtonClass(tool === "hand")}
				>
					<Hand className="w-4 h-4" />
				</button>
			</Tooltip>
			<Tooltip content="Select Tool (V)" side="bottom">
				<button
					type="button"
					onClick={() => onToolChange("select")}
					className={toolButtonClass(tool === "select")}
				>
					<MousePointer2 className="w-4 h-4" />
				</button>
			</Tooltip>
			<div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
			<Tooltip content="Undo (Ctrl+Z)" side="bottom">
				<button
					type="button"
					onClick={onUndo}
					disabled={!canUndo}
					className={actionButtonClass}
				>
					<Undo className="w-4 h-4" />
				</button>
			</Tooltip>
			<Tooltip content="Redo (Ctrl+Y)" side="bottom">
				<button
					type="button"
					onClick={onRedo}
					disabled={!canRedo}
					className={actionButtonClass}
				>
					<Redo className="w-4 h-4" />
				</button>
			</Tooltip>

			{nodesLength >= 2 && (
				<>
					<div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
					<div className="relative" ref={downloadMenuRef}>
						<Tooltip content="Download Documentation" side="bottom">
							<button
								type="button"
								onClick={onDownloadMenuToggle}
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
									onClick={onDownloadImage}
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
									onClick={() => onDownload("readme")}
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
								<div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
								{isFreeUser ? (
									<Tooltip
										content="PRD export is for paid users. Upgrade to unlock."
										side="right"
									>
										<span className="block w-full">
											<button
												type="button"
												disabled
												className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left opacity-50 cursor-not-allowed"
											>
											<FileText className="w-4 h-4 text-primary dark:text-[#0077B6]" />
											<div>
												<div className="font-medium">PRD Document</div>
												<div className="text-xs text-slate-500">
													For Stakeholders
												</div>
											</div>
											</button>
										</span>
									</Tooltip>
								) : (
									<button
										type="button"
										onClick={() => onDownload("prd")}
										className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
									>
										<FileText className="w-4 h-4 text-primary dark:text-[#0077B6]" />
										<div>
											<div className="font-medium">PRD Document</div>
											<div className="text-xs text-slate-500">
												For Stakeholders
											</div>
										</div>
									</button>
								)}
							</div>
						)}
					</div>
				</>
			)}

			{mindMapId && (
				<>
					<div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
					<div className="relative" ref={shareMenuRef}>
						<Tooltip content="Share" side="bottom">
							<button
								type="button"
								onClick={onShareMenuToggle}
								className={`flex items-center gap-1 ${actionButtonClass}`}
							>
								<Share2 className="w-4 h-4" />
								<ChevronDown className="w-3 h-3" />
							</button>
						</Tooltip>
						{showShareMenu && (
							<div className="absolute top-full mt-1 left-0 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50">
								<ShareLinkDropdownContent mindMapId={mindMapId} />
							</div>
						)}
					</div>
				</>
			)}
		</Panel>
	);
}
