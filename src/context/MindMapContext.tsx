import { createContext, useContext } from "react";

interface MindMapContextType {
	openAddMenu: (nodeId: string, x: number, y: number) => void;
	takeSnapshotForUndo: () => void;
	/** When true, the mind map is not editable (e.g. shared view). Nodes should disable editing. */
	readOnly: boolean;
}

export const MindMapContext = createContext<MindMapContextType | null>(null);

export function useMindMapContext() {
	const context = useContext(MindMapContext);
	if (!context) {
		throw new Error(
			"useMindMapContext must be used within a MindMapContextProvider",
		);
	}
	return context;
}
