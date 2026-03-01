import React from "react";

type ModuleCardProps = {
    title: string;
    description: string;
    className?: string
};

export default function ModuleCard({
    title,
    description,
    className = "card",
}: ModuleCardProps) {
    return (
        <div className={"w-[500px] h-[280px] bg-gray-300 flex flex-col items-center justify-center p-6 ${className}"}>
            <h3 className="text-center text-black">{title}</h3>
            <p className="text-center text-black">{description}</p>
        </div>
    );
}