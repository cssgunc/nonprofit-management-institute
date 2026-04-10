import React from "react";
import type { StaticImageData } from "next/image";
import ModuleCard from "@/components/moduleCard";
import { api } from "@/utils/trpc/api";
import boardGovernanceImage from "@/assets/board_governance.png";
import fundraisingImage from "@/assets/fundraising.png";
import humanResourcesImage from "@/assets/human_resources.png";
import orientationImage from "@/assets/orientation.png";
import programDesignImage from "@/assets/program_design.png";
import strategicPlanningImage from "@/assets/strategic_planning.png";

type ModuleGridProps = {
  className?: string;
  cohortSlug?: string;
  isAdmin?: boolean;
  onToggleStatus?: (slug: string, isActive: boolean) => void;
  isToggling?: boolean;
};

const MODULE_CARD_IMAGES: Array<{
  moduleIndex: number;
  imageSrc: StaticImageData;
  imageClassName?: string;
}> = [
  {
    moduleIndex: 1,
    imageSrc: orientationImage,
    imageClassName: "scale-[1.03]",
  },
  {
    moduleIndex: 2,
    imageSrc: fundraisingImage,
  },
  {
    moduleIndex: 3,
    imageSrc: boardGovernanceImage,
    imageClassName: "scale-[1.03]",
  },
  {
    moduleIndex: 4,
    imageSrc: strategicPlanningImage,
  },
  {
    moduleIndex: 5,
    imageSrc: programDesignImage,
  },
  {
    moduleIndex: 6,
    imageSrc: humanResourcesImage,
  },
];

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
      className={`grid grid-cols-1 justify-items-center gap-x-6 gap-y-8 pt-6 pb-2 md:grid-cols-2 xl:grid-cols-3 ${className}`}
    >
      {(modules ?? []).map((module) => {
        const cardImage = MODULE_CARD_IMAGES.find(
          (image) => image.moduleIndex === module.module_index,
        );

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
