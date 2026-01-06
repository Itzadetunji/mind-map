import { Check, ChevronRight, Circle } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export type MenuItem = {
	label?: string;
	icon?: React.ReactNode;
	action?: () => void;
	shortcut?: string;
	disabled?: boolean;
	submenu?: MenuItem[];
	danger?: boolean;
	separator?: boolean;
	checked?: boolean;
};

interface ContextMenuProps {
	items: MenuItem[];
	position: { x: number; y: number };
	onClose: () => void;
}

export function ContextMenu({ items, position, onClose }: ContextMenuProps) {
	const menuRef = useRef<HTMLDivElement>(null);

	// Close on outside click
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				onClose();
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [onClose]);

	// Adjust position to viewport
	const [adjustedPosition, setAdjustedPosition] = useState(position);

	useEffect(() => {
		if (menuRef.current) {
			const rect = menuRef.current.getBoundingClientRect();
			let x = position.x;
			let y = position.y;

			if (x + rect.width > window.innerWidth) {
				x = window.innerWidth - rect.width - 5;
			}
			if (y + rect.height > window.innerHeight) {
				y = window.innerHeight - rect.height - 5;
			}
			setAdjustedPosition({ x, y });
		}
	}, [position]);

	return createPortal(
		<div
			ref={menuRef}
			className={cn(
				"fixed z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800",
			)}
			style={{
				top: adjustedPosition.y,
				left: adjustedPosition.x,
			}}
		>
			<div className="flex flex-col">
				{items.map((item, index) =>
					item.separator ? (
						<div
							key={`sep-${index}`}
							className="my-1 h-px bg-slate-200 dark:bg-slate-800"
						/>
					) : (
						<MenuItemRow
							key={item.label || index}
							item={item}
							onClose={onClose}
						/>
					),
				)}
			</div>
		</div>,
		document.body,
	);
}

function MenuItemRow({
	item,
	onClose,
}: {
	item: MenuItem;
	onClose: () => void;
}) {
	const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
	const itemRef = useRef<HTMLDivElement>(null);
	const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const handleMouseEnter = () => {
		if (closeTimeoutRef.current) {
			clearTimeout(closeTimeoutRef.current);
			closeTimeoutRef.current = null;
		}
		if (item.submenu) setIsSubmenuOpen(true);
	};

	const handleMouseLeave = () => {
		if (item.submenu) {
			closeTimeoutRef.current = setTimeout(() => {
				setIsSubmenuOpen(false);
			}, 150);
		}
	};

	const handleClick = () => {
		if (!item.submenu && !item.disabled) {
			item.action?.();
			onClose();
		}
	};

	return (
		<div
			ref={itemRef}
			className={cn(
				"relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
				item.disabled && "opacity-50 pointer-events-none",
				item.danger &&
					"text-red-500 hover:text-red-600 focus:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/20",
			)}
			onClick={handleClick}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			<span className="mr-2 h-4 w-4 shrink-0 flex items-center justify-center">
				{item.checked && <Check className="h-4 w-4" />}
				{item.icon && !item.checked && item.icon}
			</span>
			<span className="flex-grow">{item.label}</span>
			{item.submenu && <ChevronRight className="ml-auto h-4 w-4" />}
			{item.shortcut && (
				<span className="ml-auto text-xs tracking-widest text-slate-500">
					{item.shortcut}
				</span>
			)}

			{isSubmenuOpen && item.submenu && (
				<SubMenu
					items={item.submenu}
					parentRef={itemRef}
					onClose={onClose}
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
				/>
			)}
		</div>
	);
}

function SubMenu({
	items,
	parentRef,
	onClose,
	onMouseEnter,
	onMouseLeave,
}: {
	items: MenuItem[];
	parentRef: React.RefObject<HTMLDivElement>;
	onClose: () => void;
	onMouseEnter: () => void;
	onMouseLeave: () => void;
}) {
	const [position, setPosition] = useState({ x: 0, y: 0 });

	useEffect(() => {
		if (parentRef.current) {
			const rect = parentRef.current.getBoundingClientRect();
			// Default to right of the parent
			let x = rect.right;
			let y = rect.top;

			// Check if it fits on the right, else put on left
			if (x + 200 > window.innerWidth) {
				// Assuming 200px minimal width
				x = rect.left - 200; // Simplified
			}

			setPosition({ x, y });
		}
	}, [parentRef]);

	return createPortal(
		<div
			className="fixed z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
			style={{
				top: position.y,
				left: position.x,
				// Simple positioning logic
			}}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			onMouseDown={(e) => e.stopPropagation()}
		>
			{items.map((item, index) =>
				item.separator ? (
					<div
						key={`sep-${index}`}
						className="my-1 h-px bg-slate-200 dark:bg-slate-800"
					/>
				) : (
					<MenuItemRow
						key={item.label || index}
						item={item}
						onClose={onClose}
					/>
				),
			)}
		</div>,
		document.body,
	);
}
