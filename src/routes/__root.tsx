import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import reactFlowCss from "@xyflow/react/dist/style.css?url";
import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Proto Map",
			},
		],
		links: [
			{
				rel: "icon",
				href: "/favicon.ico",
				sizes: "any",
			},
			{
				rel: "apple-touch-icon",
				href: "/apple-touch-icon.png",
			},
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "stylesheet",
				href: reactFlowCss,
			},
		],
	}),

	component: RootComponent,
	notFoundComponent: NotFoundComponent,
});

function RootComponent() {
	const initialize = useAuthStore((state) => state.initialize);

	useEffect(() => {
		initialize();
	}, [initialize]);

	return (
		<RootDocument>
			<Outlet />
		</RootDocument>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body className="flex flex-col h-dvh">
				{children}
				<Scripts />
			</body>
		</html>
	);
}

function NotFoundComponent() {
	return (
		<div className="flex flex-1 items-center justify-center p-6">
			<div className="text-center">
				<h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
					Page not found
				</h1>
				<p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
					The page you are looking for does not exist.
				</p>
			</div>
		</div>
	);
}
