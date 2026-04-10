import React from "react";
import Link from "next/link";

type ModuleCardProps = {
  title: string;
  description: string;
  slug: string;
  cohortSlug: string;
  isActive?: boolean;
  isAdmin?: boolean;
  onToggleStatus?: (slug: string, isActive: boolean) => void;
  isToggling?: boolean;
  className?: string;
};

export default function ModuleCard({
  title,
  description,
  slug,
  cohortSlug,
  isActive = true,
  isAdmin = false,
  onToggleStatus,
  isToggling = false,
  className = "card",
}: ModuleCardProps) {
  const href = `/cohorts/${cohortSlug}/modules/${slug}`;

  return (
    <div className="relative">
      {isAdmin && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isActive ? "bg-green-600" : "bg-gray-400"
            }`}
          />
          <span className="text-sm font-medium text-black">
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
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isActive ? "bg-green-500" : "bg-gray-300"
            } ${isToggling ? "opacity-50" : ""}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                isActive ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      )}
      <Link href={href}>
        <div
          className={`w-full h-[280px] bg-gray-300 flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-gray-400 transition ${className}`}
        >
          <h3 className="text-center text-black">{title}</h3>
          <p className="text-center text-black">{description}</p>
        </div>
      </Link>
    </div>
  );
}
