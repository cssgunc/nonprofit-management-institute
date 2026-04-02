"use client";

import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import SidebarDiscussions, { discussionsSidebarItems } from "@/components/sidebarDiscussions";
import { Menu } from "lucide-react";
import Link from "next/link";

export type SidebarNavItem = {
	id: number;
	title: string;
	href: string;
};

type SidebarConfig = {
	items: SidebarNavItem[];
};

const defaultSidebarItems: SidebarNavItem[] = [
	{ id: 0, title: "Recording", href: "/recording" },
	{ id: 1, title: "Discussions", href: "/discussion" },
	{ id: 2, title: "Materials", href: "/materials" },
];

type SidebarModulesProps = {
	items?: SidebarNavItem[];
	activeId?: number;
	showBackToModule?: boolean;
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
	showBackToModule = true,
	onSelect,
	onAction,
	className,
	renderItemLabel,
}: SidebarModulesProps) {
	const sidebarConfig = getSidebarConfig(items);
	const resolvedItems = sidebarConfig.items;

	const [isOpen, setIsOpen] = useState(true);
	const [active, setActive] = useState(activeId);
	const [isDiscussionsOpen, setIsDiscussionsOpen] = useState(() => {
		const currentItem = resolvedItems.find((item) => item.id === activeId);
		return currentItem?.title.toLowerCase() === "discussions";
	});
	const [activeDiscussionId, setActiveDiscussionId] = useState(0);

	useEffect(() => {
		setActive(activeId);
	}, [activeId]);

	useEffect(() => {
		const currentItem = resolvedItems.find((item) => item.id === activeId);
		setIsDiscussionsOpen(currentItem?.title.toLowerCase() === "discussions");
	}, [activeId, resolvedItems]);

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
		if (title.toLowerCase() === "discussions") {
			setActiveDiscussionId(0);
			setIsDiscussionsOpen(true);
			handleSelect(id);

			return;
		}

		handleSelect(id);
	};

	const handleCloseDiscussions = () => {
		setIsDiscussionsOpen(false);
		const discussionsId =
			resolvedItems.find((item) => item.title.toLowerCase() === "discussions")?.id ??
			active;
		handleSelect(discussionsId);
	};

	const handleDiscussionSelect = (id: number) => {
		setActiveDiscussionId(id);
	};

	const discussionsHref =
		resolvedItems.find((item) => item.title.toLowerCase() === "discussions")?.href ??
		"/discussion";
	const mappedDiscussionItems = discussionsSidebarItems.map((item) => ({
		...item,
		href: discussionsHref,
	}));

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
					items={mappedDiscussionItems}
					isOpen={isOpen}
					showBackToModule={showBackToModule}
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
									<Link
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
									</Link>
								</li>
							);
						})}
					</ul>
				</nav>
			)}
		</aside>
	);
}
