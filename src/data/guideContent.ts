import siteConfig from "./site-config.json";

export type GuideImage = {
  src: string;
  alt: string;
  caption: string;
};

export type StepBlock = {
  id: string;
  type: "step";
  number: string;
  title: string;
  body: string;
  note?: string;
  warning?: string;
  images: GuideImage[];
};

export type PointBlock = {
  id: string;
  type: "point";
  text: string;
  images: GuideImage[];
};

export type DetailsBlock = {
  id: string;
  type: "details";
  title: string;
  body: string;
};

export type CalloutBlock = {
  id: string;
  type: "callout";
  tone: "info" | "success" | "warning";
  title: string;
  body: string;
};

export type GuideBlock = StepBlock | PointBlock | DetailsBlock | CalloutBlock;

export type GuideSection = {
  id: string;
  kicker: string;
  title: string;
  intro?: string;
  blocks: GuideBlock[];
};

export type Guide = {
  slug: string;
  title: string;
  subtitle: string;
  category:
    | "账号与安全"
    | "Office 应用"
    | "Outlook 邮箱"
    | "Teams"
    | "OneDrive 与 SharePoint"
    | "设备与工具";
  description: string;
  duration: string;
  device: string;
  keywords: string[];
  completion: string;
  prepare: { label: string; text: string }[];
  sections: GuideSection[];
};

const modules = import.meta.glob("./guides-json/*.json", {
  eager: true,
  import: "default",
});

const slugOrder = [
  "first-sign-in",
  "security-info",
  "install-m365",
  "office-sign-in",
  "outlook",
  "teams",
  "onedrive",
  "sharepoint",
  "autopilot-new-pc",
  "scan-documents",
  "password-reset",
];

const defaultCategoryOrder: Guide["category"][] = [
  "账号与安全",
  "Office 应用",
  "Outlook 邮箱",
  "Teams",
  "OneDrive 与 SharePoint",
  "设备与工具",
];

export const categoryOrder = [
  ...(siteConfig.categoryOrder as Guide["category"][]).filter((category) =>
    defaultCategoryOrder.includes(category),
  ),
  ...defaultCategoryOrder.filter(
    (category) => !siteConfig.categoryOrder.includes(category),
  ),
];

export const guides = (Object.values(modules) as Guide[]).sort((a, b) => {
  const aKnown = slugOrder.indexOf(a.slug);
  const bKnown = slugOrder.indexOf(b.slug);
  if (aKnown >= 0 && bKnown >= 0) return aKnown - bKnown;
  if (aKnown >= 0) return -1;
  if (bKnown >= 0) return 1;

  const categoryDifference =
    categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
  return categoryDifference || a.title.localeCompare(b.title, "zh-CN");
});
