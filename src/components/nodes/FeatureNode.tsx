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
} from "@xyflow/react";
import { GripVertical, Plus, X, Zap } from "lucide-react";
import { useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AutoResizeTextarea } from "../shared/AutoResizeTextArea";

type FeatureItem = {
	id: string;
	label: string;
};

type FeatureNodeData = Node<
	{
		label: string;
		features?: FeatureItem[];
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

	const style = {
		transform: CSS.Transform.toString(transform),
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
				className="nodrag flex h-7 w-full bg-transparent px-2 py-1 text-xs transition-colors focus:outline-none focus:ring-0"
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
	const features = data.features || [];

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

	const updateFeature = useCallback(
		(index: number, value: string) => {
			const newFeatures = [...features];
			newFeatures[index] = { ...newFeatures[index], label: value };
			updateNodeData(id, { features: newFeatures });
		},
		[id, features, updateNodeData],
	);

	const addFeature = useCallback(() => {
		const newFeature = {
			id: crypto.randomUUID(),
			label: "New Feature",
		};
		updateNodeData(id, { features: [...features, newFeature] });
	}, [id, features, updateNodeData]);

	const removeFeature = useCallback(
		(index: number) => {
			const newFeatures = features.filter((_, i) => i !== index);
			updateNodeData(id, { features: newFeatures });
		},
		[id, features, updateNodeData],
	);

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event;

			if (active.id !== over?.id) {
				const oldIndex = features.findIndex((f) => f.id === active.id);
				const newIndex = features.findIndex((f) => f.id === over?.id);

				const newFeatures = arrayMove(features, oldIndex, newIndex);
				updateNodeData(id, { features: newFeatures });
			}
		},
		[features, id, updateNodeData],
	);

	return (
		<div className="min-w-70 ">
			<Handle
				type="target"
				position={Position.Top}
				className="w-3 h-3 bg-slate-600 dark:bg-slate-400"
			/>

			<Card className="border-slate-300 shadow-sm bg-white dark:bg-slate-900 border">
				<CardHeader className="flex flex-row items-center gap-2 p-3 border-b space-y-0">
					<div className="mt-0.5">
						<Zap className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" />
					</div>
					<AutoResizeTextarea
						className="nodrag flex w-full resize-none bg-transparent text-lg font-bold transition-colors focus:outline-none focus:ring-0 col-auto"
						value={data.label}
						onChange={updateLabel}
						rows={1}
					/>
				</CardHeader>
				<CardContent className="p-3">
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
						className="nodrag mt-3 flex items-center gap-1 text-xs font-medium text-black hover:text-black w-full justify-center p-1.5 hover:bg-black/20 rounded border cursor-pointer border-dashed border-black transition-colors"
						type="button"
					>
						<Plus size={12} />
						Add Feature
					</button>
				</CardContent>
			</Card>

			<Handle
				type="source"
				position={Position.Bottom}
				className="w-3 h-3 bg-slate-600 dark:bg-slate-400"
			/>
		</div>
	);
}
