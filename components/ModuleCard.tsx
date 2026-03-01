import React from "react";
import Link from "next/link";

type ModuleCardProps = {
    title: string;
    description: string;
    slug: string;
    cohortSlug: string;
    className?: string
};

export default function ModuleCard({
    title,
    description,
    slug,
    cohortSlug,
    className = "card",
}: ModuleCardProps) {
    const href = `/cohorts/${cohortSlug}/modules/${slug}`;

    return (
        <Link href={href}>
            <div className={`w-full h-[280px] bg-gray-300 flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-gray-400 transition ${className}`}>
                <h3 className="text-center text-black">{title}</h3>
                <p className="text-center text-black">{description}</p>
            </div>
        </Link>
    );
}