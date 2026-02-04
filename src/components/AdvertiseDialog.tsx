import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Megaphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useCreateAdvertisement } from "@/api/http/v1/advertisements/advertisements.hooks";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdvertisersData } from "@/lib/constants";

const formSchema = z.object({
	website_url: z.string().url("Please enter a valid URL").min(1, "Required"),
	name: z.string().min(1, "Required").max(50, "Max 50 characters"),
	description: z.string().min(1, "Required").max(100, "Max 100 characters"),
	logo_url: z.url("Enter a valid logo URL").optional().or(z.literal("")),
});

const adLinkClass =
	"flex items-center gap-3 h-12 px-3 border rounded-md bg-white/70 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-800 transition-colors w-fit";

export const AdvertiseDialog = () => {
	const [open, setOpen] = useState(false);

	const createAd = useCreateAdvertisement();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			website_url: "",
			name: "",
			description: "",
			logo_url: "",
		},
	});

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		try {
			await createAd.mutateAsync(values);
			setOpen(false);
			form.reset();
		} catch {
			toast.error("Failed to create advertisement. Please try again.");
		}
	};

	const [isCarousel, setIsCarousel] = useState(false);

	// Carousel when: more than 3 advertisers OR viewport < 1024px
	useEffect(() => {
		const media = window.matchMedia("(max-width: 1023px)");
		const update = () =>
			setIsCarousel(AdvertisersData.length > 3 || media.matches);
		update();
		media.addEventListener("change", update);
		return () => media.removeEventListener("change", update);
	}, [AdvertisersData.length]);

	const containerRef = useRef<HTMLDivElement>(null);
	const trackRef = useRef<HTMLDivElement>(null);
	const firstSetLength = AdvertisersData.length + 1; // ads + advertise button

	// Badge-style marquee: duplicate first set in pairs until track is ≥ 2× container (seamless -50% loop)
	useEffect(() => {
		if (!isCarousel) return;
		const container = containerRef.current;
		const track = trackRef.current;
		if (!container || !track || firstSetLength === 0) return;

		const firstSet = Array.from(track.children).slice(0, firstSetLength);
		if (firstSet.length === 0) return;

		let safety = 0;
		while (track.scrollWidth < container.clientWidth * 2 && safety < 4) {
			for (const node of firstSet) {
				track.appendChild(node.cloneNode(true));
			}
			for (const node of firstSet) {
				track.appendChild(node.cloneNode(true));
			}
			safety += 1;
		}
	}, [isCarousel, firstSetLength]);

	// if (isLoading) {
	// 	return (
	// 		<div className="flex items-center gap-2">
	// 			<div className="h-10 min-w-30 rounded-md border border-dashed bg-slate-50 dark:bg-slate-900/50 animate-pulse" />
	// 		</div>
	// 	);
	// }

	const advertiseButton = (
		<Button
			variant="outline"
			size="sm"
			onClick={() => setOpen(true)}
			className="flex items-center gap-2 h-12 border-dashed shrink-0"
		>
			<Megaphone className="w-4 h-4" />
			<span className="text-sm font-medium">Advertise</span>
		</Button>
	);

	const renderMarqueeSet = (keySuffix = "") => (
		<>
			{AdvertisersData.map((ad) => (
				<a
					key={`${ad.id}${keySuffix}`}
					href={ad.website_url}
					target="_blank"
					rel="noopener noreferrer"
					className={`${adLinkClass} shrink-0`}
				>
					{ad.logo_url ? (
						<img
							src={ad.logo_url}
							alt={ad.name}
							className="h-7 w-7 rounded-md object-cover shrink-0"
							onError={(e) => {
								(e.currentTarget as HTMLImageElement).style.display = "none";
							}}
						/>
					) : (
						<div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
							<span className="text-xs font-semibold">{ad.name[0]}</span>
						</div>
					)}
					<div className="flex flex-col leading-tight min-w-0">
						<span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
							{ad.name}
						</span>
						<span className="text-xs text-muted-foreground">
							{ad.description}
						</span>
					</div>
				</a>
			))}
			<div key={`advertise${keySuffix}`} className="shrink-0">
				{advertiseButton}
			</div>
		</>
	);

	const carouselContent = (
		<div className="flex items-center gap-2 min-w-0 flex-1 w-full">
			<div
				ref={containerRef}
				className="relative overflow-hidden w-full rounded-lg py-1 advertiser-marquee"
			>
				<div
					ref={trackRef}
					className="flex items-center gap-2 advertiser-marquee-track w-max h-12"
				>
					{renderMarqueeSet("")}
					{renderMarqueeSet("-2")}
				</div>
			</div>
		</div>
	);

	const listContent = (
		<div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
			<ul className="flex items-center gap-2 list-none m-0 p-0">
				{AdvertisersData.map((ad) => (
					<li key={ad.id} className="shrink-0 list-none">
						<a
							href={ad.website_url}
							target="_blank"
							rel="noopener noreferrer"
							className={adLinkClass}
						>
							{ad.logo_url ? (
								<img
									src={ad.logo_url}
									alt={ad.name}
									className="h-7 w-7 rounded-md object-cover"
									onError={(e) => {
										(e.currentTarget as HTMLImageElement).style.display =
											"none";
									}}
								/>
							) : (
								<div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
									<span className="text-xs font-semibold">{ad.name[0]}</span>
								</div>
							)}
							<div className="flex flex-col leading-tight min-w-0">
								<span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
									{ad.name}
								</span>
								<span className="text-xs text-muted-foreground truncate max-w-55">
									{ad.description}
								</span>
							</div>
						</a>
					</li>
				))}
			</ul>
			{advertiseButton}
		</div>
	);

	return (
		<>
			<div className="flex items-center gap-2 min-w-0 flex-1 w-full">
				{isCarousel ? carouselContent : listContent}
			</div>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Advertise</DialogTitle>
						<DialogDescription>
							Share your product. Approved ads appear in the header once
							reviewed.
						</DialogDescription>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="website_url"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Website URL</FormLabel>
										<FormControl>
											<Input
												placeholder="https://myawesomewebsite.com"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="logo_url"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Logo URL (optional)</FormLabel>
										<FormControl>
											<Input
												placeholder="https://example.com/logo.png"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Name</FormLabel>
										<FormControl>
											<Input placeholder="Website name" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Description</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Short description"
												className="resize-none"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="rounded-md bg-orange-50 p-4 mt-4 dark:bg-orange-900/20">
								<p className="text-xs text-orange-800 dark:text-orange-200">
									Ads are reviewed manually by me. Once approved, they will
									appear in the header.
								</p>
							</div>

							<DialogFooter className="mt-6">
								<Button
									type="button"
									variant="outline"
									onClick={() => setOpen(false)}
									disabled={createAd.isPending}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={createAd.isPending}>
									{createAd.isPending && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									Buy Spot
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</>
	);
};
