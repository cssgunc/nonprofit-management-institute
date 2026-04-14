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
  },
  {
    moduleIndex: 5,
    imageSrc: "/assets/program_design.png",
  },
  {
    moduleIndex: 6,
    imageSrc: "/assets/human_resources.png",
  },
];

export function getModuleCardImage(moduleIndex?: number | null) {
  return MODULE_CARD_IMAGES.find((image) => image.moduleIndex === moduleIndex);
}
