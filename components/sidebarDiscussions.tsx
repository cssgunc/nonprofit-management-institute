"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";
import { setDiscussionSidebarContext } from "@/utils/sidebarContext";
import { Lock, Menu } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export type DiscussionNavItem = {
  id: number;
  title: string;
  href: string;
  moduleSlug?: string;
  isLocked?: boolean;
};

type SidebarDiscussionsProps = {
  activeId?: number;
  items?: DiscussionNavItem[];
  onSelect?: (id: number) => void;
  className?: string;
  canAccessLocked?: boolean;
};

export default function SidebarDiscussions({
  activeId = 0,
  items = [],
  onSelect,
  className,
  canAccessLocked = false,
}: SidebarDiscussionsProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside
      className={cn(
        "flex min-h-[calc(100vh-7rem)] shrink-0 self-stretch flex-col overflow-hidden border-r border-zinc-200 bg-white font-sans transition-[width] duration-200 ease-out",
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
          "flex min-h-0 flex-1 flex-col transition-opacity duration-150",
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      >
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ul className="m-0 list-none p-0">
            {items.map((item) => {
              const isActive = activeId === item.id;
              const isLocked = item.isLocked === true;
              const isDisabled = isLocked && !canAccessLocked;

              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    aria-disabled={isDisabled ? "true" : undefined}
                    onClick={(e) => {
                      if (isDisabled) {
                        e.preventDefault();
                        toast.error("This module is locked.");
                        return;
                      }

                      setDiscussionSidebarContext("discussions");
                      onSelect?.(item.id);
                    }}
                    className={cn(
                      "relative flex items-center justify-between gap-2 whitespace-nowrap px-4 py-2.5 text-[15px] tracking-[0.01em] transition-colors",
                      isActive && !isDisabled
                        ? "font-bold text-zinc-900"
                        : isDisabled
                          ? "cursor-not-allowed text-zinc-400"
                          : "font-normal text-zinc-900 hover:bg-zinc-100",
                    )}
                  >
                    <span className="truncate">{item.title}</span>
                    {isLocked && (
                      <Lock className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    )}
                    {isActive && !isDisabled && (
                      <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-t-[1px] bg-zinc-900" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </aside>
  );
}
