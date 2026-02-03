export interface CreateShareLinkPayload {
	mindMapId: string;
	userId: string;
}

export interface CreateShareLinkResponse {
	shareToken: string;
	shareUrl: string;
}

export interface GetShareLinkPayload {
	mindMapId: string;
	userId: string;
}

export interface ShareLinkInfo {
	shareToken: string;
	shareUrl: string;
}

export interface GetShareLinkResponse {
	shareLink: ShareLinkInfo | null;
}

export interface RevokeShareLinkPayload {
	mindMapId: string;
	userId: string;
}

export interface GetSharedMindMapPayload {
	shareToken: string;
}

export interface SharedMindMapData {
	id: string;
	title: string;
	description: string | null;
	graph_data: unknown;
}

export interface GetSharedMindMapResponse {
	mindMap: SharedMindMapData;
}
