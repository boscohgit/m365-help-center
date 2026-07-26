import { guideImagesBySlug, type GuideImage } from "./guideImages";

type SectionRanges = Record<string, [number, number]>;

const rangesByGuide: Record<string, SectionRanges> = {
  "first-sign-in": {
    "sign-in": [1, 1],
    authenticator: [2, 10],
  },
  "install-m365": {
    download: [1, 2],
    install: [3, 4],
    "teams-startup": [5, 8],
  },
  "office-sign-in": {
    open: [1, 1],
    "sign-in": [2, 2],
  },
  outlook: {
    setup: [1, 5],
    "shared-mailbox": [6, 10],
    compose: [11, 12],
    inbox: [13, 13],
    calendar: [14, 15],
    recall: [16, 17],
    contacts: [18, 18],
  },
  teams: {
    "sign-in": [1, 1],
    chat: [2, 13],
    "teams-channels": [14, 15],
    meetings: [16, 21],
  },
  onedrive: {
    "sign-in": [1, 1],
    upload: [2, 3],
    share: [4, 5],
    status: [6, 6],
    "shared-save": [7, 8],
  },
  sharepoint: {
    visit: [1, 1],
    sync: [2, 3],
    collaborate: [4, 7],
  },
  "scan-documents": {
    huawei: [1, 1],
  },
  "password-reset": {
    open: [1, 3],
    verify: [4, 4],
  },
  "security-info": {
    start: [1, 1],
    phone: [2, 4],
    iphone: [5, 10],
    android: [11, 16],
    password: [17, 18],
  },
};

export function getGuideSectionImages(slug: string, sectionId: string): GuideImage[] {
  const range = rangesByGuide[slug]?.[sectionId];
  if (!range) return [];
  const [start, end] = range;
  return (guideImagesBySlug[slug] ?? []).slice(start - 1, end);
}

export function countPlacedImages(slug: string): number {
  return Object.keys(rangesByGuide[slug] ?? {}).reduce(
    (total, sectionId) => total + getGuideSectionImages(slug, sectionId).length,
    0,
  );
}
