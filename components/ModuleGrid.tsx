import React from "react";
import ModuleCard from "@/components/moduleCard";
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
    <div className={`grid grid-cols-2 md:grid-cols-3 gap-14 m-14 ${className}`}>
      {(modules ?? []).map((module) => (
        <ModuleCard
          key={module.id}
          title={module.title}
          description={module.description || "No description available."}
          slug={module.slug}
          cohortSlug={cohortSlug}
          isActive={module.is_active}
          isAdmin={isAdmin}
          onToggleStatus={onToggleStatus}
          isToggling={isToggling}
          className="card"
        />
      ))}
    </div>
  );
}
