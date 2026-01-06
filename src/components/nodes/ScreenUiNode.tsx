import {
	Handle,
	type Node,
	type NodeProps,
	Position,
	useReactFlow,
} from "@xyflow/react";
import { GripVertical, Image as ImageIcon, Layout, Lock } from "lucide-react";
import { useCallback, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleImageUpload = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (file) {
				const reader = new FileReader();
				reader.onloadend = () => {
					updateNodeData(id, { imageUrl: reader.result as string });
				};
				reader.readAsDataURL(file);
			}
		},
		[id, updateNodeData],
	);

	const triggerFileInput = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const updateLabel = useCallback(
		(evt: React.ChangeEvent<HTMLTextAreaElement>) => {
			updateNodeData(id, { label: evt.target.value });
		},
		[id, updateNodeData],
	);

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
				<CardHeader className="flex flex-row space-y-0 items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800">
					<Layout className="w-4 h-4 text-slate-900 dark:text-slate-100" />
					<AutoResizeTextarea
						className="nodrag flex w-full resize-none bg-transparent text-sm font-bold transition-colors focus:outline-none focus:ring-0 col-auto"
						value={data.label}
						onChange={updateLabel}
						rows={1}
					/>
				</CardHeader>
				<CardContent className="p-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center min-h-30">
					{data.imageUrl ? (
						<img
							src={data.imageUrl}
							alt={data.label}
							className="w-full h-auto object-contain max-h-60 max-w-60 p-1 rounded-sm"
						/>
					) : (
						<div className="flex flex-col items-center gap-2 text-slate-400 p-4">
							<button
								onClick={triggerFileInput}
								className="nodrag flex flex-col items-center gap-1 hover:text-slate-600 transition-colors"
								type="button"
							>
								<ImageIcon className="w-8 h-8 opacity-50" />
								<span className="text-xs">Add Preview</span>
							</button>
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

			<Handle
				type="source"
				position={Position.Bottom}
				className="w-3 h-3 bg-slate-900 dark:bg-slate-100 z-50"
			/>
		</div>
	);
}
