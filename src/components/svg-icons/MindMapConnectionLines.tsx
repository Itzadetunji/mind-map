import type React from "react";

export const MindMapConnectionLines = (
	props: React.SVGProps<SVGSVGElement>,
) => {
	return (
		<svg {...props}>
			<line
				x1="50%"
				y1="50%"
				x2="22%"
				y2="22%"
				stroke="#03045E"
				strokeWidth="2"
				strokeOpacity="0.3"
			/>
			<line
				x1="50%"
				y1="50%"
				x2="78%"
				y2="22%"
				stroke="#03045E"
				strokeWidth="2"
				strokeOpacity="0.3"
			/>
			<line
				x1="50%"
				y1="50%"
				x2="18%"
				y2="75%"
				stroke="#03045E"
				strokeWidth="2"
				strokeOpacity="0.3"
			/>
			<line
				x1="50%"
				y1="50%"
				x2="82%"
				y2="75%"
				stroke="#03045E"
				strokeWidth="2"
				strokeOpacity="0.3"
			/>
			<line
				x1="50%"
				y1="50%"
				x2="50%"
				y2="90%"
				stroke="#03045E"
				strokeWidth="2"
				strokeOpacity="0.3"
			/>
		</svg>
	);
};
