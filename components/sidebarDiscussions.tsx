"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";
import { setDiscussionSidebarContext } from "@/utils/sidebarContext";
import { Hash, Lock, Menu, MessageCircle } from "lucide-react";
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
        "relative flex min-h-[calc(100vh-7rem)] shrink-0 self-stretch flex-col overflow-hidden border-r border-[rgba(125,50,140,0.14)] bg-[linear-gradient(180deg,rgba(255,252,248,0.86)_0%,rgba(247,241,233,0.92)_100%)] font-sans shadow-[12px_0_34px_rgba(61,52,45,0.06)] backdrop-blur-md transition-[width] duration-200 ease-out",
        isOpen ? "w-[220px]" : "w-14",
        className,
      )}
    >
      <div className="absolute inset-y-0 right-0 w-px bg-[linear-gradient(180deg,rgba(125,50,140,0.22),rgba(40,132,164,0.12),rgba(162,122,74,0.2))]" />
      <div className="relative px-4 pb-3 pt-[18px]">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="cursor-pointer text-[#60456a] transition hover:text-[var(--brand-plum)]"
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
          <div className="px-4 pb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a6d80]">
              Discussion Spaces
            </p>
          </div>
          <ul className="m-0 list-none p-0 pb-4">
            {items.map((item) => {
              const isActive = activeId === item.id;
              const isLocked = item.isLocked === true;
              const isDisabled = isLocked && !canAccessLocked;
              const Icon = item.id === 0 ? MessageCircle : Hash;

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
                      "relative block whitespace-nowrap px-4 pb-2.5 pt-[11px] text-[15px] tracking-[0.01em] transition-colors",
                      isActive && !isDisabled
                        ? "font-bold text-[#5f2d69]"
                        : isDisabled
                          ? "cursor-not-allowed text-zinc-400"
                          : "font-normal text-zinc-900 hover:bg-[rgba(125,50,140,0.05)]",
                      )}
                  >
                    <span className="flex items-center gap-2">
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive && !isDisabled
                            ? "text-[#6b3476]"
                            : isDisabled
                              ? "text-zinc-400"
                              : "text-[#6b4a72]",
                        )}
                        strokeWidth={1.8}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {item.title}
                      </span>
                      {isLocked && (
                        <Lock className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      )}
                    </span>
                    {isActive && !isDisabled && (
                      <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-t-[1px] bg-[var(--brand-plum)]" />
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
