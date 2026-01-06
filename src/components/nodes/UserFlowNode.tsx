import {
	Handle,
	type Node,
	type NodeProps,
	Position,
	useReactFlow,
} from "@xyflow/react";
import { GripVertical, Lock, Plus, Workflow } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useMindMapContext } from "@/context/MindMapContext";
import { cn } from "@/lib/utils";
import { AutoResizeTextarea } from "../shared/AutoResizeTextArea";

type UserFlowNodeData = Node<
	{
		label: string;
		description?: string;
		locked?: boolean;
	},
	"user-flow"
>;

export default function UserFlowNode({
	id,
	data,
}: NodeProps<UserFlowNodeData>) {
	const { updateNodeData } = useReactFlow();
	const { openAddMenu } = useMindMapContext();

	const updateLabel = useCallback(
		(evt: React.ChangeEvent<HTMLTextAreaElement>) => {
			updateNodeData(id, { label: evt.target.value });
		},
		[id, updateNodeData],
	);

	const updateDescription = useCallback(
		(evt: React.ChangeEvent<HTMLTextAreaElement>) => {
			updateNodeData(id, { description: evt.target.value });
		},
		[id, updateNodeData],
	);

	return (
		<div className="min-w-75 group">
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

			<Card className="border-slate-400 shadow-md bg-white dark:bg-slate-900 border-2 relative overflow-hidden">
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
				<CardHeader className="flex flex-row items-center space-y-0 gap-2 p-3 bg-slate-100 dark:bg-slate-800">
					<Workflow className="w-4 h-4 text-slate-900 dark:text-slate-100" />
					<AutoResizeTextarea
						className="nodrag flex w-full resize-none bg-transparent text-sm font-bold transition-colors focus:outline-none focus:ring-0 col-auto overflow-hidden"
						value={data.label}
						onChange={updateLabel}
						minRows={1}
					/>
				</CardHeader>
				<CardContent className="p-3">
					<AutoResizeTextarea
						className="nodrag resize-none flex min-h-20 w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-0 overflow-hidden"
						value={data.description || ""}
						onChange={updateDescription}
						placeholder="Describe the user journey..."
						minRows={3}
					/>
					<p className="text-[10px] text-muted-foreground mt-2 uppercase select-none">
						User Journey
					</p>
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
				className="w-3 h-3 bg-slate-900 dark:bg-slate-100 z-50"
			/>
		</div>
	);
}
