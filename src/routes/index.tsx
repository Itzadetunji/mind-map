import { createFileRoute } from "@tanstack/react-router";

const LandingPage = () => {
	return (
		<main className="w-full flex-1 flex items-center justify-center bg-white dark:bg-black">
			<h1 className="text-4xl font-bold text-black dark:text-white">
				ProtoMap
			</h1>
		</main>
	);
};

export const Route = createFileRoute("/")({
	component: LandingPage,
});
