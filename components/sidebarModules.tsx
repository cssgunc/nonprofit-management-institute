"use client";

import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import { Menu } from "lucide-react";
import Link from "next/link";

export type SidebarNavItem = {
	id: number;
	title: string;
	href: string;
};

const defaultSidebarItems: SidebarNavItem[] = [
	{ id: 0, title: "Recording", href: "/recording" },
	{ id: 1, title: "Discussions", href: "/discussions" },
	{ id: 2, title: "Materials", href: "/materials" },
];

type SidebarModulesProps = {
	items?: SidebarNavItem[];
	activeId?: number;
	onSelect?: (id: number) => void;
	className?: string;
	renderItemLabel?: (item: SidebarNavItem, isActive: boolean) => React.ReactNode;
};

export default function SidebarModules({
	items,
	activeId = 0,
	onSelect,
	className,
	renderItemLabel,
}: SidebarModulesProps) {
	const resolvedItems = items ?? defaultSidebarItems;

	const [isOpen, setIsOpen] = useState(true);
	const [active, setActive] = useState(activeId);

	useEffect(() => {
		setActive(activeId);
	}, [activeId]);

	return (
		<aside
			className={cn(
				"flex h-[calc(100vh-7rem)] min-h-0 flex-col overflow-hidden border-r border-zinc-200 bg-white font-sans transition-[width] duration-200 ease-out",
				isOpen ? "w-[220px]" : "w-14",
				className,
			)}
		>
			<div className="px-4 pb-2 pt-[18px]">
				<button
					type="button"
					onClick={() => setIsOpen((prev) => !prev)}
					aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
					className="cursor-pointer"
				>
					<Menu className="h-6 w-6" aria-hidden="true" />
				</button>
			</div>
			<nav
				className={cn(
					"flex-1 transition-opacity duration-150",
					isOpen
						? "pointer-events-auto opacity-100"
						: "pointer-events-none opacity-0",
				)}
			>
				<ul className="m-0 list-none p-0">
					{resolvedItems.map((item) => {
						const isActive = active === item.id;

						return (
							<li key={item.id}>
								<Link
									href={item.href}
									aria-current={isActive ? "page" : undefined}
									onClick={() => {
										setActive(item.id);
										onSelect?.(item.id);
									}}
									className={cn(
										"relative block whitespace-nowrap px-4 pb-2.5 pt-[11px] text-[15px] tracking-[0.01em] text-zinc-900 transition-colors",
										isActive ? "font-bold" : "font-normal hover:bg-zinc-100",
									)}
								>
									{renderItemLabel ? renderItemLabel(item, isActive) : item.title}

									{isActive && (
										<span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-t-[1px] bg-zinc-900" />
									)}
								</Link>
							</li>
						);
					})}
				</ul>
			</nav>
		</aside>
	);
}
