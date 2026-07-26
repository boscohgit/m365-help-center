import { guideImagesBySlug, type GuideImage } from "./guideImages";

export type InstructionKind = "step" | "point";

type Placement = {
  kind: InstructionKind;
  index: number;
  images: number[];
};

type GuidePlacements = Record<string, Placement[]>;

const placementsByGuide: Record<string, GuidePlacements> = {
  "first-sign-in": {
    "sign-in": [
      { kind: "step", index: 1, images: [1] },
    ],
    authenticator: [
      { kind: "step", index: 0, images: [3, 4, 5, 6, 7] },
      { kind: "step", index: 1, images: [2, 8, 9, 10] },
    ],
  },
  "install-m365": {
    download: [
      { kind: "step", index: 0, images: [1] },
      { kind: "step", index: 1, images: [2] },
    ],
    install: [
      { kind: "step", index: 1, images: [3, 4] },
    ],
    "teams-startup": [
      { kind: "step", index: 0, images: [5] },
      { kind: "step", index: 1, images: [6, 7] },
      { kind: "step", index: 2, images: [8] },
    ],
  },
  "office-sign-in": {
    open: [
      { kind: "step", index: 0, images: [1] },
    ],
    "sign-in": [
      { kind: "step", index: 0, images: [2] },
    ],
  },
  outlook: {
    setup: [
      { kind: "step", index: 0, images: [1] },
      { kind: "step", index: 1, images: [2, 4] },
      { kind: "step", index: 2, images: [3] },
      { kind: "step", index: 3, images: [5] },
    ],
    "shared-mailbox": [
      { kind: "point", index: 2, images: [6, 7] },
      { kind: "point", index: 3, images: [8, 9, 10] },
    ],
    compose: [
      { kind: "point", index: 1, images: [11] },
      { kind: "point", index: 2, images: [12] },
    ],
    inbox: [
      { kind: "point", index: 1, images: [13] },
    ],
    calendar: [
      { kind: "point", index: 0, images: [14] },
      { kind: "point", index: 2, images: [15] },
    ],
    recall: [
      { kind: "step", index: 0, images: [16] },
      { kind: "step", index: 1, images: [17] },
    ],
    contacts: [
      { kind: "point", index: 1, images: [18] },
    ],
  },
  teams: {
    "sign-in": [
      { kind: "step", index: 2, images: [1] },
    ],
    chat: [
      { kind: "point", index: 0, images: [2, 3] },
      { kind: "point", index: 1, images: [6, 7] },
      { kind: "point", index: 2, images: [4] },
      { kind: "point", index: 3, images: [5] },
      { kind: "point", index: 4, images: [12, 13] },
      { kind: "point", index: 5, images: [8, 9, 10, 11] },
    ],
    "teams-channels": [
      { kind: "point", index: 0, images: [14] },
      { kind: "point", index: 2, images: [15] },
    ],
    meetings: [
      { kind: "point", index: 0, images: [16, 17] },
      { kind: "point", index: 1, images: [18, 19] },
      { kind: "point", index: 2, images: [20, 21] },
    ],
  },
  onedrive: {
    "sign-in": [
      { kind: "point", index: 2, images: [1] },
    ],
    upload: [
      { kind: "point", index: 1, images: [2] },
      { kind: "point", index: 3, images: [3] },
    ],
    share: [
      { kind: "step", index: 1, images: [4] },
      { kind: "step", index: 3, images: [5] },
    ],
    status: [
      { kind: "point", index: 3, images: [6] },
    ],
    "shared-save": [
      { kind: "step", index: 0, images: [7] },
      { kind: "step", index: 1, images: [8] },
    ],
  },
  sharepoint: {
    visit: [
      { kind: "step", index: 1, images: [1] },
    ],
    sync: [
      { kind: "step", index: 1, images: [2] },
      { kind: "step", index: 2, images: [3] },
    ],
    collaborate: [
      { kind: "point", index: 2, images: [4, 5, 6, 7] },
    ],
  },
  "scan-documents": {
    huawei: [
      { kind: "point", index: 1, images: [1] },
    ],
  },
  "password-reset": {
    open: [
      { kind: "step", index: 0, images: [1, 2] },
      { kind: "step", index: 1, images: [3] },
    ],
    verify: [
      { kind: "point", index: 3, images: [4] },
    ],
  },
  "security-info": {
    start: [
      { kind: "step", index: 1, images: [1] },
    ],
    phone: [
      { kind: "step", index: 0, images: [2] },
      { kind: "step", index: 1, images: [3] },
      { kind: "step", index: 3, images: [4] },
    ],
    iphone: [
      { kind: "step", index: 0, images: [5] },
      { kind: "step", index: 1, images: [6] },
      { kind: "step", index: 2, images: [7] },
      { kind: "step", index: 3, images: [8, 9, 10] },
    ],
    android: [
      { kind: "step", index: 1, images: [11, 12] },
      { kind: "step", index: 2, images: [13, 14] },
      { kind: "step", index: 3, images: [15, 16] },
    ],
    password: [
      { kind: "step", index: 0, images: [17] },
      { kind: "step", index: 1, images: [18] },
    ],
  },
};

export function getInstructionImages(
  slug: string,
  sectionId: string,
  kind: InstructionKind,
  index: number,
): GuideImage[] {
  const placement = placementsByGuide[slug]?.[sectionId]?.find(
    (item) => item.kind === kind && item.index === index,
  );
  const allImages = guideImagesBySlug[slug] ?? [];
  return (placement?.images ?? []).map((imageNumber) => allImages[imageNumber - 1]);
}

export function getPlacedImageNumbers(slug: string): number[] {
  return Object.values(placementsByGuide[slug] ?? {})
    .flatMap((placements) => placements)
    .flatMap((placement) => placement.images);
}
