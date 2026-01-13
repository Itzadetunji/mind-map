import { forwardRef, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface AutoResizeTextareaProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	minRows?: number;
}

export const AutoResizeTextarea = forwardRef<
	HTMLTextAreaElement,
	AutoResizeTextareaProps
>(({ value, onChange, placeholder, className, minRows = 1, ...props }, ref) => {
	const internalRef = useRef<HTMLTextAreaElement>(null);
	const textareaRef =
		(ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

	useEffect(() => {
		const textarea = textareaRef.current;
		if (textarea) {
			// Reset height to auto to correctly calculate new scrollHeight
			textarea.style.height = "auto";
			// Set height to scrollHeight
			textarea.style.height = `${textarea.scrollHeight}px`;
		}
	}, [value, textareaRef]);

	return (
		<Textarea
			ref={textareaRef}
			className={cn("min-h-0  shadow-none border-none p-0 w-fit", className)}
			value={value}
			onChange={onChange}
			placeholder={placeholder}
			rows={minRows}
			// Stop propagation of wheel events to prevent canvas zooming while scrolling here
			onWheel={(e) => e.stopPropagation()}
			{...props}
		/>
	);
});

AutoResizeTextarea.displayName = "AutoResizeTextarea";
