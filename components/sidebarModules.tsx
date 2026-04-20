"use client";

import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import { getModuleCardImage } from "@/utils/moduleCardImages";
import { setDiscussionSidebarContext } from "@/utils/sidebarContext";
import { api } from "@/utils/trpc/api";
import { FileText, MessageCircle, Menu, PlayCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

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

const moduleIcons = {
  0: PlayCircle,
  1: MessageCircle,
  2: FileText,
};

type SidebarModulesProps = {
  items?: SidebarNavItem[];
  activeId?: number;
  onSelect?: (id: number) => void;
  className?: string;
  renderItemLabel?: (
    item: SidebarNavItem,
    isActive: boolean,
  ) => React.ReactNode;
};

export default function SidebarModules({
  items,
  activeId = 0,
  onSelect,
  className,
  renderItemLabel,
}: SidebarModulesProps) {
  const resolvedItems = items ?? defaultSidebarItems;
  const router = useRouter();
  const cohortSlug =
    typeof router.query.cohort_slug === "string"
      ? router.query.cohort_slug
      : "";
  const moduleSlug =
    typeof router.query.modules_slug === "string"
      ? router.query.modules_slug
      : "";

  const [isOpen, setIsOpen] = useState(true);
  const [active, setActive] = useState(activeId);
  const moduleQuery = api.modules.bySlug.useQuery(
    { slug: moduleSlug, cohortSlug },
    { enabled: !!cohortSlug && !!moduleSlug },
  );

  useEffect(() => {
    setActive(activeId);
  }, [activeId]);

  const moduleCardImage = getModuleCardImage(moduleQuery.data?.module_index);

  return (
    <aside
      className={cn(
        "flex min-h-[calc(100vh-7rem)] self-stretch flex-col overflow-hidden border-r border-[var(--line-soft)] bg-[linear-gradient(180deg,#f8f4ee_0%,#fcfaf7_100%)] font-sans transition-[width] duration-200 ease-out",
        isOpen ? "w-[220px]" : "w-14",
        className,
      )}
    >
      <div className="px-4 pb-2 pt-[18px]">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="cursor-pointer text-[#514f55] transition hover:text-[var(--brand-teal)]"
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
          {moduleQuery.data && moduleCardImage && (
            <div className="px-4 pb-4 pt-2">
              <div className="overflow-hidden rounded-xl border border-[rgba(40,132,164,0.16)] bg-white shadow-[0_10px_24px_rgba(61,52,45,0.08)]">
                <div className="relative aspect-[1.3/1] w-full bg-[var(--surface-soft)]">
                  <Image
                    src={moduleCardImage.imageSrc}
                    alt={moduleQuery.data.title}
                    fill
                    sizes="188px"
                    className={cn(
                      "object-cover",
                      moduleCardImage.imageClassName,
                    )}
                    priority
                  />
                </div>
              </div>
            </div>
          )}
          <ul className="m-0 list-none p-0">
            {resolvedItems.map((item) => {
              const isActive = active === item.id;
              const Icon = moduleIcons[item.id as keyof typeof moduleIcons];

              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => {
                      setDiscussionSidebarContext("modules");
                      setActive(item.id);
                      onSelect?.(item.id);
                    }}
                    className={cn(
                      "relative block whitespace-nowrap px-4 pb-2.5 pt-[11px] text-[15px] tracking-[0.01em] transition-colors",
                      isActive
                        ? "rounded-r-xl bg-[rgba(40,132,164,0.09)] font-bold text-[#23485a]"
                        : "font-normal text-zinc-900 hover:bg-[rgba(40,132,164,0.05)]",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {Icon && (
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                      )}
                      <span>
                        {renderItemLabel
                          ? renderItemLabel(item, isActive)
                          : item.title}
                      </span>
                    </span>

                    {isActive && (
                      <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-t-[1px] bg-[var(--brand-teal)]" />
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
