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
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[rgba(125,50,140,0.14)] bg-[rgba(255,255,255,0.62)] text-[#60456a] shadow-sm transition hover:bg-white"
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
          <ul className="m-0 flex list-none flex-col gap-1 px-3 pb-4">
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
                      "relative flex items-center gap-2.5 whitespace-nowrap rounded-xl px-2.5 py-2.5 text-[15px] tracking-[0.01em] transition-colors",
                      isActive && !isDisabled
                        ? "bg-[rgba(125,50,140,0.11)] font-bold text-[#5f2d69] shadow-[inset_0_0_0_1px_rgba(125,50,140,0.12)]"
                        : isDisabled
                          ? "cursor-not-allowed text-zinc-400"
                          : "font-normal text-zinc-900 hover:bg-[rgba(255,255,255,0.58)]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                        isActive && !isDisabled
                          ? "border-[rgba(125,50,140,0.2)] bg-white text-[#6b3476]"
                          : isDisabled
                            ? "border-transparent bg-zinc-100 text-zinc-400"
                            : "border-transparent bg-[rgba(125,50,140,0.07)] text-[#6b4a72]",
                      )}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {item.title}
                    </span>
                    {isLocked && (
                      <Lock className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    )}
                    {isActive && !isDisabled && (
                      <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-[var(--brand-plum)]" />
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
