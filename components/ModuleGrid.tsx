import React from "react";
import ModuleCard from "@/components/ModuleCard";
import { getModuleCardImage } from "@/utils/moduleCardImages";
import { api } from "@/utils/trpc/api";

type ModuleGridProps = {
  className?: string;
  cohortSlug?: string;
  isAdmin?: boolean;
  onToggleStatus?: (slug: string, isActive: boolean) => void;
  isToggling?: boolean;
};

export default function ModuleGrid({
  className = "grid",
  cohortSlug = "",
  isAdmin = false,
  onToggleStatus,
  isToggling = false,
}: ModuleGridProps) {
  const { data: modules } = api.modules.list.useQuery(
    { cohortSlug },
    { enabled: !!cohortSlug },
  );

  return (
    <div
      className={`grid grid-cols-1 justify-items-center gap-x-4 gap-y-5 pt-3 pb-1 md:grid-cols-2 xl:grid-cols-3 ${className}`}
    >
      {(modules ?? []).map((module) => {
        const cardImage = getModuleCardImage(module.module_index);

        if (!cardImage) {
          return null;
        }

        return (
          <ModuleCard
            key={module.id}
            title={module.title}
            slug={module.slug}
            cohortSlug={cohortSlug}
            isActive={module.is_active}
            isAdmin={isAdmin}
            onToggleStatus={onToggleStatus}
            isToggling={isToggling}
            imageSrc={cardImage.imageSrc}
            imageClassName={cardImage.imageClassName}
            className="card"
          />
        );
      })}
    </div>
  );
}
