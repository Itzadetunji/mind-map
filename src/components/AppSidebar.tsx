import { Link } from "@tanstack/react-router";
import { Home, LogOut, Settings, User, Zap } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";
import { useUserCredits } from "@/hooks/api/credits.hooks";
import { useAuthStore } from "@/stores/authStore";

export function AppSidebar() {
	const { user, signOut } = useAuthStore();
	const { data: credits } = useUserCredits();

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<Link to="/projects">
								<div className="flex min-w-8 size-8 overflow-hidden items-center justify-center rounded-full bg-white text-sidebar-primary-foreground ">
									<img
										src="/assets/brand/logo-white.png"
										alt="Proto Map"
										className="size-6 object-contain"
									/>
								</div>
								<div className="flex flex-col gap-0.5 leading-none font-semibold flex-1">
									ProtoMap
								</div>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel className="flex items-center gap-2">
						Application
						<Separator className="flex-1 bg-border/50" />
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton asChild tooltip="Projects">
									<Link
										to="/projects"
										activeProps={{
											className:
												"bg-sidebar-accent text-sidebar-accent-foreground",
										}}
									>
										<Home />
										<span>Projects</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton asChild tooltip="Account">
									<Link
										to="/account"
										activeProps={{
											className:
												"bg-sidebar-accent text-sidebar-accent-foreground",
										}}
									>
										<Settings />
										<span>Account & Subscription</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							asChild
						>
							<div className="flex items-center gap-2">
								<div className="flex items-center justify-center rounded-md border bg-sidebar-accent text-sidebar-primary-foreground h-8 min-w-8">
									<Zap className="size-4 text-yellow-500 fill-yellow-500" />
								</div>
								<div className="flex flex-col gap-1 leading-none">
									<span className="font-semibold">Credits</span>
									<span className="text-xs text-muted-foreground">
										{credits?.credits ?? 0} Available
									</span>
								</div>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton
									size="lg"
									className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								>
									<Avatar className="h-8 w-8 rounded-lg">
										<AvatarImage
											src={user?.user_metadata?.avatar_url}
											alt={user?.user_metadata?.full_name}
										/>
										<AvatarFallback className="rounded-lg">
											<User className="size-4" />
										</AvatarFallback>
									</Avatar>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-semibold">
											{user?.user_metadata?.full_name || "User"}
										</span>
										<span className="truncate text-xs">{user?.email}</span>
									</div>
									<Settings className="ml-auto size-4" />
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
								side="bottom"
								align="end"
								sideOffset={4}
							>
								<DropdownMenuLabel className="p-0 font-normal">
									<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
										<Avatar className="h-8 w-8 rounded-lg">
											<AvatarImage
												src={user?.user_metadata?.avatar_url}
												alt={user?.user_metadata?.full_name}
											/>
											<AvatarFallback className="rounded-lg">
												<User className="size-4" />
											</AvatarFallback>
										</Avatar>
										<div className="grid flex-1 text-left text-sm leading-tight">
											<span className="truncate font-semibold">
												{user?.user_metadata?.full_name || "User"}
											</span>
											<span className="truncate text-xs">{user?.email}</span>
										</div>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem asChild>
									<Link to="/account">
										<Settings className="mr-2 h-4 w-4" />
										Account Settings
									</Link>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={signOut}>
									<LogOut className="mr-2 h-4 w-4" />
									Log out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
