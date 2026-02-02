import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	Handle,
	type Node,
	type NodeProps,
	Position,
	useReactFlow,
	useViewport,
} from "@xyflow/react";
import {
	GripVertical,
	Image as ImageIcon,
	Loader2,
	Lock,
	Plus,
	Trash2,
	X,
	Zap,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMindMapContext } from "@/context/MindMapContext";
import { STORAGE_BUCKETS } from "@/lib/constants/database.constants";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { AutoResizeTextarea } from "../shared/AutoResizeTextArea";

type FeatureItem = {
	id: string;
	label: string;
};

type FeatureNodeData = Node<
	{
		label: string;
		features?: FeatureItem[];
		imageUrl?: string;
		locked?: boolean;
	},
	"feature"
>;

function SortableFeatureItem({
	feature,
	index,
	updateFeature,
	removeFeature,
}: {
	feature: FeatureItem;
	index: number;
	updateFeature: (index: number, value: string) => void;
	removeFeature: (index: number) => void;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: feature.id });
	const { zoom } = useViewport();

	const style = {
		transform: CSS.Transform.toString(
			transform
				? {
						...transform,
						x: transform.x / zoom,
						y: transform.y / zoom,
					}
				: null,
		),
		transition,
		zIndex: isDragging ? 2 : 1,
		position: "relative" as const,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className="flex items-center gap-2 relative bg-white dark:bg-slate-900"
		>
			<div
				{...attributes}
				{...listeners}
				className="nodrag cursor-grab text-slate-400 hover:text-slate-600 focus:outline-none shrink-0 flex items-center justify-center h-7 w-5"
			>
				<GripVertical size={14} />
			</div>
			<input
				className="nodrag flex h-7 w-full bg-transparent py-1 text-xs transition-colors focus:outline-none focus:ring-0 focus-visible:ring-0"
				value={feature.label}
				onChange={(e) => updateFeature(index, e.target.value)}
			/>
			<button
				onClick={() => removeFeature(index)}
				className="nodrag p-1 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded transition-colors cursor-pointer"
				type="button"
			>
				<X size={12} />
			</button>
		</div>
	);
}

export default function FeatureNode({ id, data }: NodeProps<FeatureNodeData>) {
	const { updateNodeData } = useReactFlow();
	const { openAddMenu, takeSnapshotForUndo } = useMindMapContext();
	const features = data.features || [];
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [isImageLoading, setIsImageLoading] = useState(true);
	const prevImageUrlRef = useRef(data.imageUrl);

	// Reset loading state when image URL changes
	if (prevImageUrlRef.current !== data.imageUrl) {
		setIsImageLoading(true);
		prevImageUrlRef.current = data.imageUrl;
	}

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

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

	const updateFeature = useCallback(
		(index: number, value: string) => {
			const newFeatures = [...features];
			newFeatures[index] = { ...newFeatures[index], label: value };
			updateNodeData(id, { features: newFeatures });
		},
		[id, features, updateNodeData],
	);

	const addFeature = useCallback(() => {
		takeSnapshotForUndo(); // Capture state before adding
		const newFeature = {
			id: crypto.randomUUID(),
			label: "New Feature",
		};
		updateNodeData(id, { features: [...features, newFeature] });
	}, [id, features, updateNodeData, takeSnapshotForUndo]);

	const removeFeature = useCallback(
		(index: number) => {
			takeSnapshotForUndo(); // Capture state before removing
			const newFeatures = features.filter((_, i) => i !== index);
			updateNodeData(id, { features: newFeatures });
		},
		[id, features, updateNodeData, takeSnapshotForUndo],
	);

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event;

			if (active.id !== over?.id) {
				takeSnapshotForUndo(); // Capture state before reordering
				const oldIndex = features.findIndex((f) => f.id === active.id);
				const newIndex = features.findIndex((f) => f.id === over?.id);

				const newFeatures = arrayMove(features, oldIndex, newIndex);
				updateNodeData(id, { features: newFeatures });
			}
		},
		[features, id, updateNodeData, takeSnapshotForUndo],
	);

	// Image upload handlers
	const handleImageUpload = useCallback(
		async (event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) return;

			try {
				setIsUploading(true);
				takeSnapshotForUndo();
				const fileExt = file.name.split(".").pop();
				const fileName = `${crypto.randomUUID()}.${fileExt}`;
				const filePath = `${fileName}`;

				const { error: uploadError } = await supabase.storage
					.from(STORAGE_BUCKETS.MIND_MAPS_IMAGES)
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
			takeSnapshotForUndo();
			updateNodeData(id, { imageUrl: undefined });
		},
		[id, updateNodeData, takeSnapshotForUndo],
	);

	const triggerFileInput = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	return (
		<div className="min-w-70 group">
			<Handle
				type="target"
				position={Position.Top}
				className="w-3 h-3 bg-slate-600 dark:bg-slate-400 z-50"
			/>
			{data.locked && (
				<div className="absolute -top-3 -right-3 z-10 bg-white dark:bg-slate-800 p-1 rounded-full border shadow-sm">
					<Lock size={12} className="text-red-500" />
				</div>
			)}
			<Card className="border-slate-300 shadow-sm bg-white dark:bg-slate-900 border relative">
				<div
					className={cn(
						`absolute right-0 top-0 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing`,
						{
							hidden: data.locked,
						},
					)}
				>
					<GripVertical size={20} className=" size-3.5 text-slate-400" />
				</div>
				<CardHeader className="flex flex-row gap-2 p-3 border-b space-y-0">
					<div className="mt-0.75">
						<Zap className="w-4 h-4 text-slate-700 dark:text-slate-300" />
					</div>
					<AutoResizeTextarea
						className="nodrag resize-none rounded-none bg-transparent text-lg font-bold transition-colors focus:outline-none focus:ring-0 focus-visible:ring-0 col-auto max-w-80 max-h-80"
						value={data.label}
						onChange={updateLabel}
						onFocus={handleFocus}
						rows={1}
					/>
				</CardHeader>
				<CardContent className="p-3 space-y-3">
					{/* Image Preview Section */}
					<div className="group/image relative">
						{isUploading ? (
							<div className="flex flex-col items-center gap-2 p-4 text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-md">
								<Loader2 className="w-6 h-6 animate-spin" />
								<span className="text-xs">Uploading...</span>
							</div>
						) : data.imageUrl ? (
							<div className="relative w-full flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-md overflow-hidden">
								{isImageLoading && (
									<Skeleton className="absolute inset-0 rounded-sm w-full h-full" />
								)}
								<img
									src={data.imageUrl}
									alt={data.label}
									className={cn(
										"w-full h-auto object-contain max-h-40 p-1 rounded-sm transition-opacity duration-300",
										isImageLoading ? "opacity-0" : "opacity-100",
									)}
									onLoad={() => setIsImageLoading(false)}
								/>
								<Button
									type="button"
									variant="destructive"
									size="icon"
									onClick={handleDeleteImage}
									className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover/image:opacity-100 transition-all z-10 shadow-sm"
									title="Remove image"
								>
									<Trash2 className="h-3 w-3" />
								</Button>
							</div>
						) : (
							<button
								type="button"
								onClick={triggerFileInput}
								className="nodrag w-full flex items-center justify-center gap-2 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md border border-dashed border-slate-300 dark:border-slate-600 transition-colors cursor-pointer"
							>
								<ImageIcon className="w-4 h-4" />
								<span className="text-xs">Add Preview</span>
							</button>
						)}
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							className="hidden"
							onChange={handleImageUpload}
						/>
					</div>

					{/* Features List */}
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
					>
						<SortableContext
							items={features}
							strategy={verticalListSortingStrategy}
						>
							<div className="space-y-2">
								{features.map((feature, i) => (
									<SortableFeatureItem
										key={feature.id}
										feature={feature}
										index={i}
										updateFeature={updateFeature}
										removeFeature={removeFeature}
									/>
								))}
							</div>
						</SortableContext>
					</DndContext>

					<button
						onClick={addFeature}
						className="nodrag flex items-center gap-1 text-xs font-medium text-black dark:text-white hover:text-black w-full justify-center p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded border cursor-pointer border-dashed border-slate-400 dark:border-slate-500 transition-colors"
						type="button"
					>
						<Plus size={12} />
						Add Feature
					</button>
				</CardContent>
			</Card>
			<div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						openAddMenu(id, e.clientX, e.clientY);
					}}
					className="bg-blue-500 rounded-full p-0.5 text-white hover:bg-blue-600 shadow-sm cursor-pointer"
					title="Add Child Node"
				>
					<Plus size={12} />
				</button>
			</div>
			<Handle
				type="source"
				position={Position.Bottom}
				className="w-3 h-3 bg-slate-600 dark:bg-slate-400 z-50"
			/>
		</div>
	);
}
