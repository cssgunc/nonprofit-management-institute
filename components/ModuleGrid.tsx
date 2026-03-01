import React from "react";
import ModuleCard from "@/components/ModuleCard";
import { mockModules } from "@/server/mock/data";

type ModuleGridProps = {
	className?: string;
	cohortSlug?: string;
};

export default function ModuleGrid({
	className = "grid",
	cohortSlug = "",
}: ModuleGridProps) {
	return (
        <div className={`grid grid-cols-2 md:grid-cols-3 gap-14 m-14 ${className}`}>
            {mockModules.map((module) => (
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
    )
}
