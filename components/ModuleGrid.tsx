import React from "react";
import ModuleCard from "@/components/ModuleCard";
import { api } from "@/utils/trpc/api";

type ModuleGridProps = {
  className?: string;
  cohortSlug?: string;
};

export default function ModuleGrid({
  className = "grid",
  cohortSlug = "",
}: ModuleGridProps) {
  const { data: modules } = api.modules.list.useQuery();

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 gap-14 m-14 ${className}`}>
      {(modules ?? []).map((module) => (
        <ModuleCard
          key={module.id}
          title={module.title}
          description={module.description || "No description available."}
          slug={module.slug}
          cohortSlug={cohortSlug}
          className="card"
        />
      ))}
    </div>
  );
}
