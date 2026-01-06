import { useState } from "react";

interface TooltipProps {
	content: string;
	children: React.ReactNode;
	side?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ content, children, side = "top" }: TooltipProps) {
	const [isVisible, setIsVisible] = useState(false);

	const positionClasses = {
		top: "-top-8 left-1/2 -translate-x-1/2",
		bottom: "-bottom-8 left-1/2 -translate-x-1/2",
		left: "-left-2 right-full top-1/2 -translate-y-1/2 mr-2",
		right: "-right-2 left-full top-1/2 -translate-y-1/2 ml-2",
	};

	return (
		<div
			className="relative flex items-center justify-center"
			onMouseEnter={() => setIsVisible(true)}
			onMouseLeave={() => setIsVisible(false)}
		>
			{children}
			{isVisible && (
				<div
					className={`absolute ${positionClasses[side]} z-50 px-2 py-1 text-xs text-white bg-slate-900 rounded shadow-sm whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150`}
				>
					{content}
					{/* Triangle arrow could be added here if needed */}
				</div>
			)}
		</div>
	);
}
