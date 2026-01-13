import {
	Handle,
	type Node,
	type NodeProps,
	Position,
	useReactFlow,
} from "@xyflow/react";
import { GripVertical, Lock, Plus } from "lucide-react";
import { useCallback } from "react";
import { useMindMapContext } from "@/context/MindMapContext";
import { cn } from "@/lib/utils";
import { AutoResizeTextarea } from "../shared/AutoResizeTextArea";

type ConditionNodeData = Node<
	{
		label: string;
		locked?: boolean;
	},
	"condition"
>;

export default function ConditionNode({
	id,
	data,
}: NodeProps<ConditionNodeData>) {
	const { updateNodeData } = useReactFlow();
	const { openAddMenu } = useMindMapContext();

	const updateLabel = useCallback(
		(evt: React.ChangeEvent<HTMLTextAreaElement>) => {
			updateNodeData(id, { label: evt.target.value });
		},
		[id, updateNodeData],
	);

	return (
		<div className="relative group flex items-center justify-center">
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

			<div className="absolute -right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
				<div
					className={cn(
						`bg-slate-100 dark:bg-slate-800 rounded-full p-1 cursor-grab active:cursor-grabbing border shadow-sm`,
						{
							hidden: data.locked,
						},
					)}
				>
					<GripVertical size={16} className="text-slate-400" />
				</div>
			</div>

			{/* Diamond Shape using rotation */}
			<div className="w-32 h-32 flex items-center justify-center relative">
				<div className="absolute inset-0 bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-500 rotate-45 rounded-sm shadow-md" />

				<div className="relative z-10 p-2 text-center w-full flex items-center justify-center">
					<AutoResizeTextarea
						className="nodrag text-center bg-transparent text-sm font-bold transition-colors focus:outline-none focus:ring-0 focus-visible:ring-0 resize-none min-h-auto overflow-hidden"
						value={data.label}
						onChange={updateLabel}
						minRows={1}
						placeholder="Condition?"
					/>
				</div>
			</div>
			<div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
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

			{/* Output Handles */}
			<div className="absolute -bottom-2 -left-4 flex items-center gap-1">
				<span className="text-[10px] font-bold text-slate-500 bg-white dark:bg-slate-900 px-1 rounded border">
					True
				</span>
			</div>
			<Handle
				type="source"
				position={Position.Bottom}
				id={`${id}-true`}
				className="w-3 h-3 bg-green-500 z-50 left-1/4!"
			/>

			<div className="absolute -bottom-2 -right-4 flex items-center gap-1">
				<span className="text-[10px] font-bold text-slate-500 bg-white dark:bg-slate-900 px-1 rounded border">
					False
				</span>
			</div>
			<Handle
				type="source"
				position={Position.Bottom}
				id={`${id}-false`}
				className="w-3 h-3 bg-red-500 z-50 left-3/4!"
			/>
		</div>
	);
}
