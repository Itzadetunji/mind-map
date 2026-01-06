import {
	Handle,
	type Node,
	type NodeProps,
	Position,
	useReactFlow,
} from "@xyflow/react";
import { Brain, GripVertical, Lock } from "lucide-react";
import { useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AutoResizeTextarea } from "../shared/AutoResizeTextArea";

type CoreConceptNodeData = Node<
	{
		label: string;
		locked?: boolean;
	},
	"core-concept"
>;

export default function CoreConceptNode({
	id,
	data,
}: NodeProps<CoreConceptNodeData>) {
	const { updateNodeData } = useReactFlow();

	const updateLabel = useCallback(
		(evt: React.ChangeEvent<HTMLTextAreaElement>) => {
			updateNodeData(id, { label: evt.target.value });
		},
		[id, updateNodeData],
	);

	return (
		<div className="min-w-60 group">
			<Handle
				type="source"
				position={Position.Bottom}
				className="w-3 h-3 bg-slate-900 dark:bg-slate-100 z-50"
			/>

			{data.locked && (
				<div className="absolute -top-3 -right-3 z-10 bg-white dark:bg-slate-800 p-1 rounded-full border shadow-sm">
					<Lock size={12} className="text-red-500" />
				</div>
			)}

			<Card className="border-2 border-slate-900 shadow-xl bg-white dark:bg-slate-900 dark:border-slate-100 relative">
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
				<CardHeader className="flex flex-row gap-2 p-4 pb-2 space-y-0">
					<div className="mt-0.5">
						<Brain className="size-6 text-slate-900 dark:text-slate-100" />
					</div>
					<AutoResizeTextarea
						className="nodrag flex w-full resize-none bg-transparent text-lg font-bold transition-colors focus:outline-none focus:ring-0 col-auto"
						value={data.label}
						onChange={updateLabel}
						rows={1}
					/>
				</CardHeader>
				<CardContent className="p-4 pt-2">
					<p className="text-xs text-muted-foreground uppercase tracking-wider">
						Idea
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
