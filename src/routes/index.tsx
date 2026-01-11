import { createFileRoute } from "@tanstack/react-router";
import MindMap from "@/components/MindMap";

const App = () => {
	return (
		<main className="w-full flex-1">
			<MindMap />
		</main>
	);
};

export const Route = createFileRoute("/")({
	component: App,
});
