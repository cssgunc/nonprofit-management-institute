import React from "react";
import ModuleCard from "@/components/ModuleCard";
import { mockModules } from "@/server/mock/data";

type ModuleGridProps = {
	className?: string;
};

export default function ModuleGrid({
	className = "",
}: ModuleGridProps) {
	return (
        <div className={`grid grid-cols-2 lg:grid-cols-3 gap-16 ${className}`}>
            {mockModules.map((module) => (
                <ModuleCard
                    key={module.id}
                    title={module.title}
                    description={module.description || "No description available."}
                    className="card"
                />
            ))}
        </div>
    )
}
