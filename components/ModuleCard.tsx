import React from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

type ModuleCardProps = {
  title: string;
  slug: string;
  cohortSlug: string;
  isActive?: boolean;
  isAdmin?: boolean;
  onToggleStatus?: (slug: string, isActive: boolean) => void;
  isToggling?: boolean;
  imageSrc: string;
  imageClassName?: string;
  className?: string;
};

export default function ModuleCard({
  title,
  slug,
  cohortSlug,
  isActive = true,
  isAdmin = false,
  onToggleStatus,
  isToggling = false,
  imageSrc,
  imageClassName = "",
  className = "card",
}: ModuleCardProps) {
  const href = cohortSlug ? `/cohorts/${cohortSlug}/${slug}/module` : null;
  const isInactive = isActive !== true;
  const isLockedForViewer = isInactive && !isAdmin;
  const cardClassName = `block h-[205px] w-full overflow-hidden rounded-[0.85rem] border border-[rgba(40,132,164,0.14)] bg-white shadow-[0_12px_24px_rgba(61,52,45,0.08)] transition-transform duration-300 hover:scale-[1.025] hover:shadow-[0_18px_36px_rgba(40,132,164,0.14)] md:h-[218px] xl:h-[230px] ${className} ${
    isInactive ? "opacity-45" : ""
  } ${isLockedForViewer ? "cursor-not-allowed" : ""}`;
  const image = (
    <Image
      src={imageSrc}
      alt={title}
      width={500}
      height={240}
      className={`h-full w-full scale-[1.08] bg-white object-contain transition-transform duration-300 hover:scale-[1.095] ${
        isInactive ? "grayscale brightness-90 contrast-90" : ""
      } ${imageClassName}`}
      priority
    />
  );

  return (
    <div className="motion-rise relative w-full">
      {isAdmin === true && (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-[rgba(255,250,244,0.94)] px-2 py-1 shadow-sm">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isActive ? "bg-[var(--brand-teal)]" : "bg-gray-400"
            }`}
          />
          <span className="text-xs font-medium text-black">
            {isActive ? "Active" : "Inactive"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            aria-label={`Toggle active status for ${title}`}
            disabled={isToggling}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleStatus?.(slug, !isActive);
            }}
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-teal)] focus:ring-offset-2 ${
              isActive ? "bg-[rgba(40,132,164,0.78)]" : "bg-gray-300"
            } ${isToggling ? "opacity-50" : ""}`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                isActive ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      )}
      {href ? (
        <Link
          href={href}
          aria-label={`Open ${title} module`}
          className={cardClassName}
          onClick={(e) => {
            if (!isLockedForViewer) return;
            e.preventDefault();
            toast.error("This module is locked.");
          }}
        >
          {image}
        </Link>
      ) : (
        <div className={cardClassName}>{image}</div>
      )}
    </div>
  );
}
