"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";
import { setDiscussionSidebarContext } from "@/utils/sidebarContext";
import { Menu } from "lucide-react";
import Link from "next/link";

export type DiscussionNavItem = {
  id: number;
  title: string;
  href: string;
  moduleSlug?: string;
};

export const discussionsSidebarItems: DiscussionNavItem[] = [
  { id: 0, title: "General", href: "/discussion" },
  { id: 1, title: "Discussion 1", href: "/discussion", moduleSlug: "module-1" },
  { id: 2, title: "Discussion 2", href: "/discussion", moduleSlug: "module-2" },
  { id: 3, title: "Discussion 3", href: "/discussion", moduleSlug: "module-3" },
  { id: 4, title: "Discussion 4", href: "/discussion", moduleSlug: "module-4" },
  { id: 5, title: "Discussion 5", href: "/discussion", moduleSlug: "module-5" },
  { id: 6, title: "Discussion 6", href: "/discussion", moduleSlug: "module-6" },
];

type SidebarDiscussionsProps = {
  activeId?: number;
  items?: DiscussionNavItem[];
  onSelect?: (id: number) => void;
  className?: string;
};

export default function SidebarDiscussions({
  activeId = 0,
  items = discussionsSidebarItems,
  onSelect,
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
        <nav className="min-h-0 flex-1 overflow-y-auto">
          <ul className="m-0 list-none p-0">
            {items.map((item) => {
              const isActive = activeId === item.id;

              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => {
                      setDiscussionSidebarContext("discussions");
                      onSelect?.(item.id);
                    }}
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
      </div>
    </aside>
  );
}
