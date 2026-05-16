export const MODULE_ORDER = [
  "orientation",
  "board-governance",
  "program-design-management-evaluation",
  "strategic-planning",
  "fundraising-financial-management",
  "human-resources",
] as const;

export type ModuleOrderKey = (typeof MODULE_ORDER)[number];

type ModuleOrderInput = {
  module_index?: number | null;
  slug?: string | null;
  title?: string | null;
};

const MODULE_ORDER_ALIASES: Record<string, ModuleOrderKey> = {
  "module-1-introduction": "orientation",
  "module-1-orientation": "orientation",
  introduction: "orientation",
  orientation: "orientation",

  "module-2-board-governance": "board-governance",
  "module-3-governance": "board-governance",
  "board-governance": "board-governance",
  "governance-board": "board-governance",
  "governance-and-board": "board-governance",

  "module-3-program-design-management-evaluation":
    "program-design-management-evaluation",
  "module-5-programs": "program-design-management-evaluation",
  "program-design-management-and-evaluation":
    "program-design-management-evaluation",
  "program-design-management-evaluation":
    "program-design-management-evaluation",
  "program-design-and-measurement": "program-design-management-evaluation",
  "programs-impact": "program-design-management-evaluation",
  "programs-and-impact": "program-design-management-evaluation",

  "module-4-finance": "strategic-planning",
  "module-4-strategic-planning": "strategic-planning",
  "strategic-planning": "strategic-planning",

  "module-2-fundraising-basics": "fundraising-financial-management",
  "module-5-fundraising-financial-management":
    "fundraising-financial-management",
  "fundraising-basics": "fundraising-financial-management",
  "fundraising-and-financial-management":
    "fundraising-financial-management",
  "fundraising-financial-management": "fundraising-financial-management",

  "module-6-human-resources": "human-resources",
  "module-6-operations": "human-resources",
  "human-resources": "human-resources",
  "operations-hr": "human-resources",
  "operations-and-hr": "human-resources",
};

function normalizeModuleText(value?: string | null) {
  return (value ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getModuleOrderKey(
  module?: ModuleOrderInput | null,
): ModuleOrderKey | undefined {
  const slugKey = normalizeModuleText(module?.slug);
  if (slugKey && MODULE_ORDER_ALIASES[slugKey]) {
    return MODULE_ORDER_ALIASES[slugKey];
  }

  const titleKey = normalizeModuleText(module?.title);
  if (titleKey && MODULE_ORDER_ALIASES[titleKey]) {
    return MODULE_ORDER_ALIASES[titleKey];
  }

  if (titleKey.includes("orientation")) return "orientation";
  if (titleKey.includes("governance") || titleKey.includes("board")) {
    return "board-governance";
  }
  if (titleKey.includes("program")) {
    return "program-design-management-evaluation";
  }
  if (titleKey.includes("strategic")) return "strategic-planning";
  if (titleKey.includes("fundraising") || titleKey.includes("financial")) {
    return "fundraising-financial-management";
  }
  if (titleKey.includes("human") || titleKey.includes("hr")) {
    return "human-resources";
  }

  return undefined;
}

export function getModuleSortRank(module?: ModuleOrderInput | null) {
  const orderKey = getModuleOrderKey(module);
  if (orderKey) return MODULE_ORDER.indexOf(orderKey);
  return MODULE_ORDER.length + (module?.module_index ?? 0);
}

export function compareModulesByOrder<T extends ModuleOrderInput>(
  first: T,
  second: T,
) {
  const rankDiff = getModuleSortRank(first) - getModuleSortRank(second);
  if (rankDiff !== 0) return rankDiff;

  return (first.module_index ?? 0) - (second.module_index ?? 0);
}
