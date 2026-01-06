import {
	Handle,
	type Node,
	type NodeProps,
	Position,
	useReactFlow,
} from "@xyflow/react";
import { Brain } from "lucide-react";
import { useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AutoResizeTextarea } from "../shared/AutoResizeTextArea";

type CoreConceptNodeData = Node<
	{
		label: string;
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
		<div className="min-w-60">
			<Handle
				type="source"
				position={Position.Bottom}
				className="w-3 h-3 bg-slate-900 dark:bg-slate-100"
			/>

			<Card className="border-2 border-slate-900 shadow-xl bg-white dark:bg-slate-900 dark:border-slate-100">
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
