import type { Edge, Node } from "@xyflow/react";

export const MINDMAP_CLIPBOARD_KEY = "mindmap_clipboard_v1";

export type MindMapClipboardPayload = {
	nodes: Array<Pick<Node, "id" | "type" | "position" | "data">>;
	edges: Array<
		Pick<Edge, "id" | "source" | "target" | "label" | "sourceHandle">
	>;
	timestamp: number;
};

const isBrowser = typeof window !== "undefined";

export const hasMindMapClipboard = () => {
	if (!isBrowser) return false;
	return Boolean(window.localStorage.getItem(MINDMAP_CLIPBOARD_KEY));
};

export const readMindMapClipboard = async () => {
	if (!isBrowser) return null;

	let text: string | null = null;

	if (navigator.clipboard?.readText) {
		try {
			text = await navigator.clipboard.readText();
		} catch {
			text = null;
		}
	}

	if (!text) {
		text = window.localStorage.getItem(MINDMAP_CLIPBOARD_KEY);
	}

	if (!text) return null;

	try {
		const parsed = JSON.parse(text) as MindMapClipboardPayload;
		if (!parsed?.nodes || !Array.isArray(parsed.nodes)) return null;
		if (!parsed?.edges || !Array.isArray(parsed.edges)) return null;
		return parsed;
	} catch {
		return null;
	}
};

export const writeMindMapClipboard = async (
	payload: MindMapClipboardPayload,
) => {
	if (!isBrowser) return;
	const text = JSON.stringify(payload);

	window.localStorage.setItem(MINDMAP_CLIPBOARD_KEY, text);

	if (navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			// Clipboard permissions can fail; localStorage fallback remains.
		}
	}
};
