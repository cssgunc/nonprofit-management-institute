"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";
import { Menu } from "lucide-react";
import Link from "next/link";

export type DiscussionNavItem = {
  id: number;
  title: string;
  href: string;
};

export const discussionsSidebarItems: DiscussionNavItem[] = [
  { id: 0, title: "General", href: "/discussion" },
  { id: 1, title: "Session 1", href: "/discussion" },
  { id: 2, title: "Session 2", href: "/discussion" },
  { id: 3, title: "Session 3", href: "/discussion" },
  { id: 4, title: "Session 4", href: "/discussion" },
  { id: 5, title: "Session 5", href: "/discussion" },
  { id: 6, title: "Session 6", href: "/discussion" },
];

type SidebarDiscussionsProps = {
  activeId?: number;
  items?: DiscussionNavItem[];
  showBackToModule?: boolean;
  onSelect?: (id: number) => void;
  onBack?: () => void;
  onPost?: () => void;
  className?: string;
};

export default function SidebarDiscussions({
  activeId = 0,
  items = discussionsSidebarItems,
  showBackToModule = false,
  onSelect,
  onBack,
  onPost,
  className,
}: SidebarDiscussionsProps) {
  const [isOpen, setIsOpen] = useState(true);

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

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col transition-opacity duration-150",
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      >
        {showBackToModule && (
          <div className="px-4 py-2.5">
            <button
              type="button"
              onClick={onBack}
              className="cursor-pointer whitespace-nowrap text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900"
            >
              Back to module
            </button>
          </div>
        )}

        <nav className="min-h-0 flex-1 overflow-y-auto">
          <ul className="m-0 list-none p-0">
            {items.map((item) => {
              const isActive = activeId === item.id;

              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => onSelect?.(item.id)}
                    className={cn(
                      "relative block whitespace-nowrap px-4 py-2.5 text-[15px] tracking-[0.01em] text-zinc-900 transition-colors",
                      isActive ? "font-bold" : "font-normal hover:bg-zinc-100",
                    )}
                  >
                    {item.title}
                    {isActive && (
                      <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-t-[1px] bg-zinc-900" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="shrink-0 bg-white px-4 pb-[18px] pt-[8px]">
          <button
            type="button"
            onClick={onPost}
            className="w-full cursor-pointer rounded-full border-none bg-zinc-200 px-4 py-2.5 text-[15px] font-medium tracking-[0.02em] text-zinc-900 transition-colors hover:bg-zinc-300"
          >
            Create new post
          </button>
        </div>
      </div>
    </aside>
  );
}
