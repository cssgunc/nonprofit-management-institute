"use client";

import { cn } from "@/utils/cn";

export type DiscussionNavItem = {
  id: number;
  title: string;
  href: string;
};

export const discussionsSidebarItems: DiscussionNavItem[] = [
  { id: 0, title: "General", href: "#general" },
  { id: 1, title: "Session 1", href: "#session-1" },
  { id: 2, title: "Session 2", href: "#session-2" },
  { id: 3, title: "Session 3", href: "#session-3" },
  { id: 4, title: "Session 4", href: "#session-4" },
  { id: 5, title: "Session 5", href: "#session-5" },
  { id: 6, title: "Session 6", href: "#session-6" },
];

type SidebarDiscussionsProps = {
  activeId?: number;
  items?: DiscussionNavItem[];
  isOpen?: boolean;
  onSelect?: (id: number) => void;
  onClose?: () => void;
  onPost?: () => void;
  className?: string;
};

/**
 * Renders discussion navigation UI that can sit on top of the base sidebar.
 */
export default function SidebarDiscussions({
  activeId = 0,
  items = discussionsSidebarItems,
  isOpen = true,
  onSelect,
  onClose,
  onPost,
  className,
}: SidebarDiscussionsProps) {
  const handleSelect = (
    event: React.MouseEvent<HTMLAnchorElement>,
    id: number,
  ) => {
    event.preventDefault();
    onSelect?.(id);
  };

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col bg-white",
        className,
      )}
    >
      {/* <div className="px-4 pb-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900"
        >
          Back to modules
        </button>
      </div> */}

      <nav
        className={cn(
          "flex-1 pt-1 transition-opacity duration-150",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <ul className="m-0 list-none p-0">
          {items.map((item) => {
            const isActive = activeId === item.id;

            return (
              <li key={item.id}>
                <div className="mx-4 h-px bg-zinc-200" />
                <a
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={(event) => handleSelect(event, item.id)}
                  className={cn(
                    "relative block whitespace-nowrap px-4 pb-2.5 pt-[11px] text-[15px] tracking-[0.01em] text-zinc-900 transition-colors",
                    isActive ? "font-bold" : "font-normal hover:bg-zinc-100",
                  )}
                >
                  {item.title}
                  {isActive && (
                    <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-t-[1px] bg-zinc-900" />
                  )}
                </a>
              </li>
            );
          })}

          <li>
            <div className="mx-4 h-px bg-zinc-200" />
          </li>
        </ul>
      </nav>

      <div
        className={cn(
          "p-4 transition-opacity duration-150",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <button
          type="button"
          onClick={onPost}
          className="w-full cursor-pointer rounded-full border-none bg-zinc-200 py-[13px] text-[15px] font-medium tracking-[0.02em] text-zinc-900 transition-colors hover:bg-zinc-300"
        >
          Post
        </button>
      </div>
    </div>
  );
}