import { useEffect, useRef } from "react";

export const AutoResizeTextarea = ({
	value,
	onChange,
	placeholder,
	className,
	minRows = 1,
	...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
	minRows?: number;
}) => {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		const textarea = textareaRef.current;
		if (textarea) {
			// Reset height to auto to correctly calculate new scrollHeight
			textarea.style.height = "auto";
			// Set height to scrollHeight
			textarea.style.height = `${textarea.scrollHeight}px`;
		}
	}, [value]);

	return (
		<textarea
			ref={textareaRef}
			className={className}
			value={value}
			onChange={onChange}
			placeholder={placeholder}
			rows={minRows}
			// Stop propagation of wheel events to prevent canvas zooming while scrolling here
			onWheel={(e) => e.stopPropagation()}
			{...props}
		/>
	);
};
