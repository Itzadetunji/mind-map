import {
	Handle,
	type Node,
	type NodeProps,
	Position,
	useReactFlow,
} from "@xyflow/react";
import {
	GripVertical,
	Image as ImageIcon,
	Layout,
	Loader2,
	Lock,
	Plus,
	Trash2,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMindMapContext } from "@/context/MindMapContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { AutoResizeTextarea } from "../shared/AutoResizeTextArea";

type ScreenUiNodeData = Node<
	{
		label: string;
		imageUrl?: string;
		locked?: boolean;
	},
	"screen-ui"
>;

export default function ScreenUiNode({
	id,
	data,
}: NodeProps<ScreenUiNodeData>) {
	const { updateNodeData } = useReactFlow();
	const { openAddMenu, takeSnapshotForUndo } = useMindMapContext();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [isImageLoading, setIsImageLoading] = useState(true);

	const handleImageUpload = useCallback(
		async (event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) return;

			try {
				setIsUploading(true);
				takeSnapshotForUndo(); // Capture state before image upload
				const fileExt = file.name.split(".").pop();
				const fileName = `${crypto.randomUUID()}.${fileExt}`;
				const filePath = `${fileName}`;

				const { error: uploadError } = await supabase.storage
					.from("mind_maps_images")
					.upload(filePath, file);

				if (uploadError) throw uploadError;

				const {
					data: { publicUrl },
				} = supabase.storage.from("mind_maps_images").getPublicUrl(filePath);

				updateNodeData(id, { imageUrl: publicUrl });
			} catch (error) {
				console.error("Error uploading image:", error);
			} finally {
				setIsUploading(false);
				if (fileInputRef.current) fileInputRef.current.value = "";
			}
		},
		[id, updateNodeData, takeSnapshotForUndo],
	);

	const handleDeleteImage = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			takeSnapshotForUndo(); // Capture state before image deletion
			updateNodeData(id, { imageUrl: undefined });
		},
		[id, updateNodeData, takeSnapshotForUndo],
	);

	// Reset loading state when image URL changes
	const prevImageUrlRef = useRef(data.imageUrl);
	if (prevImageUrlRef.current !== data.imageUrl) {
		setIsImageLoading(true);
		prevImageUrlRef.current = data.imageUrl;
	}

	const triggerFileInput = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const updateLabel = useCallback(
		(evt: React.ChangeEvent<HTMLTextAreaElement>) => {
			updateNodeData(id, { label: evt.target.value });
		},
		[id, updateNodeData],
	);

	// Capture snapshot when user starts editing label
	const handleFocus = useCallback(() => {
		takeSnapshotForUndo();
	}, [takeSnapshotForUndo]);

	return (
		<div className="min-w-60 group">
			<Handle
				type="target"
				position={Position.Top}
				className="w-3 h-3 bg-slate-900 dark:bg-slate-100 z-50"
			/>

			{data.locked && (
				<div className="absolute -top-3 -right-3 z-10 bg-white dark:bg-slate-800 p-1 rounded-full border shadow-sm">
					<Lock size={12} className="text-red-500" />
				</div>
			)}

			<Card className="border-slate-500 overflow-hidden shadow-md bg-white dark:bg-slate-900 border-2 relative">
				<div
					className={cn(
						`absolute right-0 top-0 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing`,
						{
							hidden: data.locked,
						},
					)}
				>
					<GripVertical className="size-3.5 text-slate-400" />
				</div>
				<CardHeader className="flex flex-row space-y-0 gap-2 p-3 bg-slate-100 dark:bg-slate-800">
					<div className="mt-0.75">
						<Layout className="w-4 h-4 text-slate-900 dark:text-slate-100" />
					</div>
					<AutoResizeTextarea
						className="nodrag resize-none rounded-none bg-transparent text-sm font-bold transition-colors focus:outline-none focus:ring-0 focus-visible:ring-0 col-auto"
						value={data.label}
						onChange={updateLabel}
						onFocus={handleFocus}
						rows={1}
					/>
				</CardHeader>
				<CardContent className="p-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center min-h-30 relative group/image">
					{isUploading ? (
						<div className="flex flex-col items-center gap-2 p-4 text-slate-400">
							<Loader2 className="w-8 h-8 animate-spin" />
							<span className="text-xs">Uploading...</span>
						</div>
					) : data.imageUrl ? (
						<div className="relative w-full h-full flex items-center justify-center min-h-[100px] min-w-[100px]">
							{isImageLoading && (
								<Skeleton className="absolute inset-0 rounded-sm w-full h-full" />
							)}
							<img
								src={data.imageUrl}
								alt={data.label}
								className={cn(
									"w-full h-auto object-contain max-h-60 max-w-60 p-1 rounded-sm transition-opacity duration-300",
									isImageLoading ? "opacity-0" : "opacity-100",
								)}
								onLoad={() => setIsImageLoading(false)}
							/>
							<Button
								type="button"
								variant="destructive"
								size="icon"
								onClick={handleDeleteImage}
								className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-0 group-hover/image:opacity-100 transition-all z-10 shadow-sm"
								title="Remove image"
							>
								<Trash2 className="h-3 w-3" />
							</Button>
						</div>
					) : (
						<div className="flex flex-col items-center gap-2 text-slate-400 p-4">
							<Button
								variant="ghost"
								onClick={triggerFileInput}
								className="nodrag flex-col h-auto w-auto gap-1 hover:bg-slate-200/50"
								type="button"
							>
								<ImageIcon className="w-8 h-8 opacity-50" />
								<span className="text-xs">Add Preview</span>
							</Button>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								className="hidden"
								onChange={handleImageUpload}
							/>
						</div>
					)}
				</CardContent>
			</Card>
			<div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
				<Button
					size="icon"
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						openAddMenu(id, e.clientX, e.clientY);
					}}
					className="h-6 w-6 rounded-full bg-blue-500 hover:bg-blue-600 shadow-sm"
					title="Add Child Node"
				>
					<Plus className="h-3 w-3" />
				</Button>
			</div>
			<Handle
				type="source"
				position={Position.Bottom}
				className="w-3 h-3 bg-slate-900 dark:bg-slate-100 z-50"
			/>
		</div>
	);
}
