import {
  getModuleOrderKey,
  type ModuleOrderKey,
} from "@/utils/moduleOrder";

export const MODULE_CARD_IMAGES: Array<{
  moduleKey: ModuleOrderKey;
  imageSrc: string;
  imageClassName?: string;
}> = [
  {
    moduleKey: "orientation",
    imageSrc: "/assets/orientation.png",
    imageClassName: "scale-[1.03]",
  },
  {
    moduleKey: "board-governance",
    imageSrc: "/assets/board_governance.png",
    imageClassName: "scale-[1.03]",
  },
  {
    moduleKey: "program-design-management-evaluation",
    imageSrc: "/assets/program_design.png",
  },
  {
    moduleKey: "strategic-planning",
    imageSrc: "/assets/strategic_planning.png",
    imageClassName: "translate-y-3 scale-[1.12]",
  },
  {
    moduleKey: "fundraising-financial-management",
    imageSrc: "/assets/fundraising.png",
  },
  {
    moduleKey: "human-resources",
    imageSrc: "/assets/human_resources.png",
    imageClassName: "translate-y-5 scale-[1.12]",
  },
];

type ModuleCardImageInput = {
  module_index?: number | null;
  slug?: string | null;
  title?: string | null;
};

export function getModuleCardImage(module?: ModuleCardImageInput | null) {
  const moduleKey = getModuleOrderKey(module);
  return MODULE_CARD_IMAGES.find((image) => image.moduleKey === moduleKey);
}
