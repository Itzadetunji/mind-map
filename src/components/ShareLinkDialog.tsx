import { Check, Copy, Link2, Loader2, X } from "lucide-react";
import { useState } from "react";
import {
	useCreateShareLink,
	useRevokeShareLink,
	useShareLink,
} from "@/hooks/share-links.hooks";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";

interface ShareLinkDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	mindMapId: string;
}

export function ShareLinkDialog({
	open,
	onOpenChange,
	mindMapId,
}: ShareLinkDialogProps) {
	const shareLinkQuery = useShareLink(mindMapId);
	const createShareLink = useCreateShareLink();
	const revokeShareLink = useRevokeShareLink();
	const [copied, setCopied] = useState(false);

	const handleCreateLink = async () => {
		try {
			await createShareLink.mutateAsync(mindMapId);
		} catch (error) {
			console.error("Failed to create share link:", error);
		}
	};

	const handleRevokeLink = async () => {
		try {
			await revokeShareLink.mutateAsync(mindMapId);
		} catch (error) {
			console.error("Failed to revoke share link:", error);
		}
	};

	const handleCopyLink = async () => {
		if (shareLinkQuery.data?.shareUrl) {
			await navigator.clipboard.writeText(shareLinkQuery.data.shareUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Share Mind Map</DialogTitle>
					<DialogDescription>
						Create a shareable link that allows others to view your mind map
						(read-only).
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{shareLinkQuery.isLoading ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="w-6 h-6 animate-spin text-primary dark:text-[#0077B6]" />
						</div>
					) : shareLinkQuery.data ? (
						<div className="space-y-4">
							<div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
								<Link2 className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
								<input
									type="text"
									value={shareLinkQuery.data.shareUrl}
									readOnly
									className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-300"
								/>
								<Button
									variant="ghost"
									size="icon"
									onClick={handleCopyLink}
									className="h-8 w-8 shrink-0"
								>
									{copied ? (
										<Check className="w-4 h-4 text-green-600" />
									) : (
										<Copy className="w-4 h-4" />
									)}
								</Button>
							</div>

							<div className="flex gap-2">
								<Button
									variant="outline"
									onClick={handleRevokeLink}
									disabled={revokeShareLink.isPending}
									className="flex-1"
								>
									{revokeShareLink.isPending ? (
										<>
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />
											Revoking...
										</>
									) : (
										<>
											<X className="w-4 h-4 mr-2" />
											Revoke Link
										</>
									)}
								</Button>
							</div>
						</div>
					) : (
						<div className="space-y-4">
							<p className="text-sm text-slate-600 dark:text-slate-400">
								No share link exists yet. Create one to share your mind map with
								others.
							</p>
							<Button
								onClick={handleCreateLink}
								disabled={createShareLink.isPending}
								className="w-full"
							>
								{createShareLink.isPending ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Creating...
									</>
								) : (
									<>
										<Link2 className="w-4 h-4 mr-2" />
										Create Share Link
									</>
								)}
							</Button>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
