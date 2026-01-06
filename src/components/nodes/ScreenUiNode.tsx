import {
	Handle,
	type Node,
	type NodeProps,
	Position,
	useReactFlow,
} from "@xyflow/react";
import { Image as ImageIcon, Layout } from "lucide-react";
import { useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AutoResizeTextarea } from "../shared/AutoResizeTextArea";

type ScreenUiNodeData = Node<
	{
		label: string;
		imageUrl?: string;
	},
	"screen-ui"
>;

export default function ScreenUiNode({
	id,
	data,
}: NodeProps<ScreenUiNodeData>) {
	const { updateNodeData } = useReactFlow();

	const updateLabel = useCallback(
		(evt: React.ChangeEvent<HTMLTextAreaElement>) => {
			updateNodeData(id, { label: evt.target.value });
		},
		[id, updateNodeData],
	);

	return (
		<div className="min-w-60">
			<Handle
				type="target"
				position={Position.Top}
				className="w-3 h-3 bg-slate-900 dark:bg-slate-100"
			/>

			<Card className="border-slate-500 overflow-hidden shadow-md bg-white dark:bg-slate-900 border-2">
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
							className="w-full h-auto object-cover"
						/>
					) : (
						<div className="flex flex-col items-center gap-2 text-slate-400 p-4">
							<ImageIcon className="w-8 h-8 opacity-50" />
							<span className="text-xs">No Preview</span>
						</div>
					)}
				</CardContent>
			</Card>

			<Handle
				type="source"
				position={Position.Bottom}
				className="w-3 h-3 bg-slate-900 dark:bg-slate-100"
			/>
		</div>
	);
}
