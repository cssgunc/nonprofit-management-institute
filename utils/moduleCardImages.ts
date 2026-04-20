export const MODULE_CARD_IMAGES: Array<{
  moduleIndex: number;
  imageSrc: string;
  imageClassName?: string;
}> = [
  {
    moduleIndex: 1,
    imageSrc: "/assets/orientation.png",
    imageClassName: "scale-[1.03]",
  },
  {
    moduleIndex: 2,
    imageSrc: "/assets/fundraising.png",
  },
  {
    moduleIndex: 3,
    imageSrc: "/assets/board_governance.png",
    imageClassName: "scale-[1.03]",
  },
  {
    moduleIndex: 4,
    imageSrc: "/assets/strategic_planning.png",
    imageClassName: "translate-y-3 scale-[1.12]",
  },
  {
    moduleIndex: 5,
    imageSrc: "/assets/program_design.png",
  },
  {
    moduleIndex: 6,
    imageSrc: "/assets/human_resources.png",
    imageClassName: "translate-y-5 scale-[1.12]",
  },
];

export function getModuleCardImage(moduleIndex?: number | null) {
  return MODULE_CARD_IMAGES.find((image) => image.moduleIndex === moduleIndex);
}
