import React from "react";
import Link from "next/link";
import Image, { type StaticImageData } from "next/image";

type ModuleCardProps = {
  title: string;
  slug: string;
  cohortSlug: string;
  isActive?: boolean;
  isAdmin?: boolean;
  onToggleStatus?: (slug: string, isActive: boolean) => void;
  isToggling?: boolean;
  imageSrc: StaticImageData;
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
  const cardClassName = `block h-[260px] w-full max-w-[470px] overflow-hidden rounded-lg transition-transform hover:scale-[1.02] ${className} ${
    !isActive && isAdmin ? "opacity-70" : ""
  }`;
  const image = (
    <Image
      src={imageSrc}
      alt={title}
      className={`h-full w-full object-cover transition-transform ${imageClassName}`}
      placeholder="blur"
      priority
    />
  );

  return (
    <div className="relative">
      {isAdmin && (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-white/90 px-2 py-1 shadow-sm">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isActive ? "bg-green-600" : "bg-gray-400"
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
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isActive ? "bg-green-500" : "bg-gray-300"
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
        >
          {image}
        </Link>
      ) : (
        <div className={cardClassName}>{image}</div>
      )}
    </div>
  );
}
