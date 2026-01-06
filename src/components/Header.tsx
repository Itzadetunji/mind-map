import { Link } from "@tanstack/react-router";
import { Network } from "lucide-react";

export function Header() {
	return (
		<header className="p-4 flex items-center bg-white text-black border-b border-gray-200 z-10 relative dark:bg-black dark:text-white dark:border-gray-800">
			<div className="flex items-center gap-2">
				<Network className="w-8 h-8 text-black dark:text-white" />
				<h1 className="text-xl font-semibold">
					<Link to="/">Mind Mapper</Link>
				</h1>
			</div>
		</header>
	);
}
