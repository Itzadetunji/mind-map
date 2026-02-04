import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "../../../../components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../../../components/ui/dialog";

export const MobileExperienceDialog = () => {
	const [open, setOpen] = useState(false);
	const navigate = useNavigate();

	const closeDialog = (open: boolean) => {
		if (window.innerWidth > 1024) setOpen(open);
	};

	useEffect(() => {
		const updateDialog = () => {
			setOpen(window.innerWidth < 1024);
		};

		updateDialog();
		window.addEventListener("resize", updateDialog);
		return () => window.removeEventListener("resize", updateDialog);
	}, []);

	return (
		<Dialog open={open} onOpenChange={closeDialog}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Best experienced on desktop</DialogTitle>
					<DialogDescription>
						Mind Map editing works best on larger screens. Want to see what you
						can create?
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="default" onClick={() => navigate({ to: "/" })}>
						See what you can create
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
