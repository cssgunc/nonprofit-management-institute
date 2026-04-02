"use client";

import { cn } from "@/utils/cn";
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
  isOpen?: boolean;
  showBackToModule?: boolean;
  onSelect?: (id: number) => void;
  onClose?: () => void;
  onPost?: () => void;
  className?: string;
};

export default function SidebarDiscussions({
  activeId = 0,
  items = discussionsSidebarItems,
  isOpen = true,
  showBackToModule = true,
  onSelect,
  onClose,
  onPost,
  className,
}: SidebarDiscussionsProps) {
  const handleSelect = (id: number) => {
    onSelect?.(id);
  };

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col bg-white",
        className,
      )}
    >
      {showBackToModule && (
        <div
          className={cn(
            "px-4 py-2.5 transition-opacity duration-150",
            isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer whitespace-nowrap text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900"
          >
            Back to module
          </button>
        </div>
      )}

      <nav
        className={cn(
          "min-h-0 flex-1 overflow-y-auto transition-opacity duration-150",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <ul className="m-0 list-none p-0">
          {items.map((item) => {
            const isActive = activeId === item.id;

            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => handleSelect(item.id)}
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

      <div
        className={cn(
          "shrink-0 bg-white px-4 pt-[8px] pb-[18px] transition-opacity duration-150",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <button
          type="button"
          onClick={onPost}
          className="w-full cursor-pointer rounded-full border-none bg-zinc-200 px-4 py-2.5 text-[15px] font-medium tracking-[0.02em] text-zinc-900 transition-colors hover:bg-zinc-300"
        >
          Create new post
        </button>
      </div>
    </div>
  );
}