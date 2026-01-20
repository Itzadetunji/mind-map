import {
	Handle,
	type Node,
	type NodeProps,
	Position,
	useReactFlow,
} from "@xyflow/react";
import { Cpu, GripVertical, Lock, Plus } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useMindMapContext } from "@/context/MindMapContext";
import { cn } from "@/lib/utils";
import { AutoResizeTextarea } from "../shared/AutoResizeTextArea";

type CustomNodeData = Node<
	{
		label: string;
		description?: string;
		locked?: boolean;
	},
	"custom-node"
>;

export default function CustomNode({ id, data }: NodeProps<CustomNodeData>) {
	const { updateNodeData } = useReactFlow();
	const { openAddMenu, takeSnapshotForUndo } = useMindMapContext();

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

	// Capture snapshot when user starts editing
	const handleFocus = useCallback(() => {
		takeSnapshotForUndo();
	}, [takeSnapshotForUndo]);

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

			<Card className="border-[#03045E]/40 dark:border-[#0077B6]/40 shadow-md bg-white dark:bg-slate-900 border-2 relative overflow-hidden">
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
				<CardHeader className="flex flex-row space-y-0 gap-2 p-3 bg-[#03045E]/10 dark:bg-[#0077B6]/20">
					<div className="mt-0.75">
						<Cpu className="w-4 h-4 text-[#03045E] dark:text-[#0077B6]" />
					</div>
					<AutoResizeTextarea
						className="nodrag resize-none rounded-none bg-transparent text-sm font-bold transition-colors focus:outline-none focus:ring-0 focus-visible:ring-0 col-auto overflow-hidden max-w-80"
						value={data.label}
						onChange={updateLabel}
						onFocus={handleFocus}
						minRows={1}
						placeholder="Custom Node"
					/>
				</CardHeader>
				<CardContent className="p-3">
					<AutoResizeTextarea
						className="nodrag resize-none rounded-none flex min-h-20 w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus-visible:ring-0 overflow-hidden max-w-80 max-h-80"
						value={data.description || ""}
						onChange={updateDescription}
						onFocus={handleFocus}
						placeholder="Description..."
						minRows={3}
					/>
				</CardContent>
			</Card>
			<div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
				<Button
					variant="default"
					size="icon-sm"
					onClick={(e) => {
						e.stopPropagation();
						openAddMenu(id, e.clientX, e.clientY);
					}}
					className="bg-[#03045E] dark:bg-[#0077B6] hover:bg-[#023E8A] dark:hover:bg-[#0096C7] rounded-full shadow-sm"
					title="Add Child Node"
				>
					<Plus size={12} />
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
