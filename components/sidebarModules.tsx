"use client";

import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import SidebarDiscussions from "@/components/sidebarDiscussions";
import { Menu } from "lucide-react";

export type SidebarNavItem = {
	id: number;
	title: string;
	href: string;
};

type SidebarConfig = {
	items: SidebarNavItem[];
};

const defaultSidebarItems: SidebarNavItem[] = [
	{ id: 0, title: "Recording", href: "#recording" },
	{ id: 1, title: "Discussions", href: "#discussions" },
	{ id: 2, title: "Handouts", href: "#handouts" },
	{ id: 3, title: "Resources", href: "#resources" },
];

type SidebarModulesProps = {
	items?: SidebarNavItem[];
	activeId?: number;
	onSelect?: (id: number) => void;
	onAction?: () => void;
	className?: string;
	renderItemLabel?: (item: SidebarNavItem, isActive: boolean) => React.ReactNode;
};

function getSidebarConfig(items?: SidebarNavItem[]): SidebarConfig {
	return {
		items: items ?? defaultSidebarItems,
	};
}

// Renders a reusable, collapsible sidebar for modules/discussions based on provided nav items.
export default function SidebarModules({
	items,
	activeId = 0,
	onSelect,
	onAction,
	className,
	renderItemLabel,
}: SidebarModulesProps) {
	const sidebarConfig = getSidebarConfig(items);
	const resolvedItems = sidebarConfig.items;
	const defaultHomeId =
		resolvedItems.find((item) => item.title.toLowerCase() === "home")?.id ??
		resolvedItems[0]?.id ??
		0;

	const [isOpen, setIsOpen] = useState(true);
	const [active, setActive] = useState(activeId);
	const [isDiscussionsOpen, setIsDiscussionsOpen] = useState(false);
	const [activeDiscussionId, setActiveDiscussionId] = useState(0);

	useEffect(() => {
		setActive(activeId);
	}, [activeId]);

	const handleToggleSidebar = () => {
		setIsOpen((prev) => !prev);
	};

	const handleSelect = (id: number) => {
		setActive(id);
		onSelect?.(id);
	};

	const handleItemClick = (
		event: React.MouseEvent<HTMLAnchorElement>,
		id: number,
		title: string,
	) => {
		event.preventDefault();

		if (title.toLowerCase() === "discussions") {
			setActiveDiscussionId(0);
			setIsDiscussionsOpen(true);
			return;
		}

		handleSelect(id);
	};

	const handleCloseDiscussions = () => {
		setIsDiscussionsOpen(false);
		handleSelect(defaultHomeId);
	};

	const handleDiscussionSelect = (id: number) => {
		setActiveDiscussionId(id);
	};

	return (
		<aside
			className={cn(
				"flex min-h-screen flex-col overflow-hidden border-r border-zinc-200 bg-white font-sans transition-[width] duration-200 ease-out",
				isOpen ? "w-[220px]" : "w-14",
				className,
			)}
		>
			<div className="px-4 pb-2 pt-[18px]">
				<button
					type="button"
					onClick={handleToggleSidebar}
					aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
					className="cursor-pointer"
				>
					<Menu className="h-6 w-6" aria-hidden="true" />
				</button>
			</div>

			{isDiscussionsOpen ? (
				<SidebarDiscussions
					activeId={activeDiscussionId}
					isOpen={isOpen}
					onSelect={handleDiscussionSelect}
					onClose={handleCloseDiscussions}
					onPost={onAction}
				/>
			) : (
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
									<a
										href={item.href}
										aria-current={isActive ? "page" : undefined}
										onClick={(event) =>
											handleItemClick(event, item.id, item.title)
										}
										className={cn(
											"relative block whitespace-nowrap px-4 pb-2.5 pt-[11px] text-[15px] tracking-[0.01em] text-zinc-900 transition-colors",
											isActive ? "font-bold" : "font-normal hover:bg-zinc-100",
										)}
									>
										{renderItemLabel ? renderItemLabel(item, isActive) : item.title}

										{isActive && (
											<span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-t-[1px] bg-zinc-900" />
										)}
									</a>
								</li>
							);
						})}
					</ul>
				</nav>
			)}
		</aside>
	);
}
