import { type FC, useEffect, useLayoutEffect, useRef, useState } from "react";

const FORWARD_DURATION_MS = 20000;
const BACKWARD_DURATION_MS = 20000;
const OSCILLATION_CYCLE_MS = FORWARD_DURATION_MS + BACKWARD_DURATION_MS;

type VerticalMarqueeProps = {
	initialItems: string[];
	positionClassName: string;
	direction: "up" | "down";
	startFromItem?: number;
};

type CarouselItem = {
	id: string;
	src: string;
};

const VerticalMarqueeColumn: FC<VerticalMarqueeProps> = ({
	initialItems,
	positionClassName,
	direction,
	startFromItem = 1,
}) => {
	const items = useState<CarouselItem[]>(() =>
		initialItems.map((item, index) => ({
			id: `${item}-${index}`,
			src: item,
		})),
	)[0];
	const duplicatedItems = [
		...items,
		...items.map((item) => ({ ...item, id: `${item.id}-dup` })),
		...items.map((item) => ({ ...item, id: `${item.id}-dup-2` })),
	];
	const [loopHeight, setLoopHeight] = useState(0);
	const listRef = useRef<HTMLUListElement | null>(null);

	useLayoutEffect(() => {
		const calculateLoopHeight = () => {
			if (!listRef.current) {
				return;
			}

			setLoopHeight(listRef.current.scrollHeight / 2);
		};

		calculateLoopHeight();

		const resizeObserver = new ResizeObserver(calculateLoopHeight);
		if (listRef.current) {
			resizeObserver.observe(listRef.current);
		}

		return () => resizeObserver.disconnect();
	}, []);

	useEffect(() => {
		if (!loopHeight || !listRef.current) {
			return;
		}

		const listElement = listRef.current;
		const easeInOutSine = (value: number) =>
			0.5 - 0.5 * Math.cos(Math.PI * value);
		const clampedStartIndex = Math.min(
			Math.max(startFromItem - 1, 0),
			items.length - 1,
		);
		const startOffset = (clampedStartIndex / items.length) * loopHeight;
		const startPosition = -startOffset;
		const travelDistance = loopHeight / 2;
		const endPosition =
			direction === "up"
				? startPosition - travelDistance
				: startPosition + travelDistance;
		let rafId = 0;
		let startTime = 0;

		const animate = (timestamp: number) => {
			if (!startTime) {
				startTime = timestamp;
			}

			const elapsed = timestamp - startTime;
			const cycleTime = elapsed % OSCILLATION_CYCLE_MS;

			const translateY =
				cycleTime < FORWARD_DURATION_MS
					? (() => {
							const segmentProgress = cycleTime / FORWARD_DURATION_MS;
							return (
								startPosition +
								(endPosition - startPosition) * easeInOutSine(segmentProgress)
							);
						})()
					: (() => {
							const segmentProgress =
								(cycleTime - FORWARD_DURATION_MS) / BACKWARD_DURATION_MS;
							return (
								endPosition +
								(startPosition - endPosition) * easeInOutSine(segmentProgress)
							);
						})();

			listElement.style.transform = `translate3d(0, ${translateY}px, 0)`;
			rafId = window.requestAnimationFrame(animate);
		};

		rafId = window.requestAnimationFrame(animate);

		return () => {
			window.cancelAnimationFrame(rafId);
		};
	}, [direction, items.length, loopHeight, startFromItem]);

	return (
		<div
			className={`rotate-x-55 rotate-y-0 -rotate-z-45 transform-3d w-fit absolute ${positionClassName}`}
		>
			<ul
				ref={listRef}
				className="flex flex-col items-center gap-20 will-change-transform"
			>
				{duplicatedItems.map((item) => (
					<li key={item.id}>
						<img src={item.src} alt="" className="w-120" />
					</li>
				))}
			</ul>
		</div>
	);
};

export const AnimatedCarousel: FC = () => {
	const firstColumn = [
		"/assets/carousel/1.webp",
		"/assets/carousel/5.webp",
		"/assets/carousel/3.webp",
		"/assets/carousel/6.webp",
	];

	const secondColumn = [
		"/assets/carousel/4.webp",
		"/assets/carousel/2.webp",
		"/assets/carousel/6.webp",
		"/assets/carousel/5.webp",
	];

	const thirdColumn = [
		"/assets/carousel/1.webp",
		"/assets/carousel/3.webp",
		"/assets/carousel/2.webp",
		"/assets/carousel/4.webp",
	];

	return (
		<div className="h-100 sm:min-h-150 flex flex-row max-w-7xl relative">
			<div className="absolute h-full w-7xl flex gap-x-100 items-center overflow-hidden">
				<VerticalMarqueeColumn
					initialItems={firstColumn}
					positionClassName="-left-1/3"
					direction="up"
					startFromItem={2}
				/>
				<VerticalMarqueeColumn
					initialItems={secondColumn}
					positionClassName="left-1/2 -translate-x-1/2"
					direction="down"
					startFromItem={4}
				/>
				<VerticalMarqueeColumn
					initialItems={thirdColumn}
					positionClassName="-right-1/3"
					direction="up"
					startFromItem={2}
				/>
			</div>
		</div>
	);
};
