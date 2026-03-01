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
        <div className={` ${className}`}>
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    );
}