#!/usr/bin/env python3
"""Publish every SOP screenshot with deterministic PII redaction."""

from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path

from PIL import Image, ImageDraw


REPO = Path(__file__).resolve().parents[1]
REVIEW = Path(__file__).resolve().parent / ".image-review"
PUBLIC = REPO / "public" / "assets" / "sop"

EMAIL_OR_DOMAIN = re.compile(
    r"(?:[\w.+-]+@[\w.-]+\.[a-z]{2,}|"
    r"(?:boscoh\.space|incorp\.asia|incorp\.international|"
    r"incorpasia\.onmicrosoft\.com))",
    re.I,
)
SIX_DIGIT_CODE = re.compile(r"(?<!\d)\d{6}(?!\d)")
PHONE_CANDIDATE = re.compile(r"(?<!\d)\+?\d[\d ()-]{6,}\d(?!\d)")
PASSWORD = re.compile(r"sg0065", re.I)
PERSON_OR_ACCOUNT = re.compile(
    r"\b(?:"
    r"bosco(?:\s+huang)?|huang\s+bosco|haiting(?:\s+wang)?|"
    r"alex(?:\s+wilber)?|diego(?:\s+siciliani)?|adele\s+v|"
    r"sara(?:\s+davis)?|vadmin|admin@|nb@"
    r")\b",
    re.I,
)
MANUAL_REGIONS = {
    # The address-book list contains internal people and group names; the
    # surrounding controls and arrows remain visible for the instruction.
    ("5. Outlook使用指引.docx", 6): [
        (0.58, 0.275, 0.985, 0.835)
    ],
    # QR enrollment secret and the matching number shown during Authenticator setup.
    ("4.添加账号验证方式及修改密码（优化版）.docx", 7): [
        (0.332, 0.365, 0.418, 0.545)
    ],
    ("4.添加账号验证方式及修改密码（优化版）.docx", 8): [
        (0.465, 0.375, 0.495, 0.435)
    ],
}


def should_redact(kind: str, text: str) -> bool:
    if kind == "barcode":
        return True
    normalized = text.strip()
    if any(pattern.search(normalized) for pattern in (EMAIL_OR_DOMAIN, PASSWORD, PERSON_OR_ACCOUNT)):
        return True
    if SIX_DIGIT_CODE.search(normalized):
        return True
    # Long numeric strings are phone/account numbers. Requiring at least nine
    # digits avoids hiding ordinary ISO dates such as 2025-05-30.
    return any(
        len(re.sub(r"\D", "", match.group(0))) >= 9
        for match in PHONE_CANDIDATE.finditer(normalized)
    )


def box_to_pixels(observation: dict, width: int, height: int) -> tuple[int, int, int, int]:
    # Vision uses a bottom-left normalized origin; Pillow uses top-left pixels.
    x1 = observation["x"] * width
    y1 = (1 - observation["y"] - observation["height"]) * height
    x2 = (observation["x"] + observation["width"]) * width
    y2 = (1 - observation["y"]) * height
    pad_x = max(5, int((x2 - x1) * 0.12))
    pad_y = max(4, int((y2 - y1) * 0.22))
    return (
        max(0, int(x1) - pad_x),
        max(0, int(y1) - pad_y),
        min(width, int(x2) + pad_x),
        min(height, int(y2) + pad_y),
    )


def main() -> None:
    manifest = json.loads((REVIEW / "manifest.json").read_text(encoding="utf-8"))
    ocr_entries = json.loads((REVIEW / "ocr.json").read_text(encoding="utf-8"))
    ocr_by_path = {entry["path"]: entry for entry in ocr_entries}
    output_manifest: list[dict] = []
    match_counter: Counter[str] = Counter()

    for record in manifest:
        source = Path(record["review_path"])
        image = Image.open(source).convert("RGB")
        draw = ImageDraw.Draw(image)
        redactions: list[dict] = []
        entry = ocr_by_path.get(str(source), {})
        for observation in entry.get("observations", []):
            if not should_redact(observation["kind"], observation.get("text", "")):
                continue
            box = box_to_pixels(observation, image.width, image.height)
            # A neutral opaque block is safer and more legible than blur/pixelation.
            draw.rounded_rectangle(box, radius=max(2, min(8, image.height // 100)), fill="#3f4752")
            redactions.append(
                {
                    "kind": observation["kind"],
                    "detected": observation.get("text", ""),
                    "box": box,
                }
            )
            match_counter[observation["kind"]] += 1

        for normalized_box in MANUAL_REGIONS.get(
            (record["document"], record["sequence"]), []
        ):
            x1, y1, x2, y2 = normalized_box
            box = (
                int(x1 * image.width),
                int(y1 * image.height),
                int(x2 * image.width),
                int(y2 * image.height),
            )
            draw.rounded_rectangle(box, radius=max(2, min(8, image.height // 100)), fill="#3f4752")
            redactions.append({"kind": "manual", "detected": "QR/code", "box": box})
            match_counter["manual"] += 1

        doc_key = source.parent.name
        destination_dir = PUBLIC / record["slug"]
        destination_dir.mkdir(parents=True, exist_ok=True)
        destination = destination_dir / f"{doc_key}-{record['sequence']:02d}.webp"
        image.save(destination, "WEBP", quality=94, method=6)
        output_manifest.append(
            {
                **record,
                "public_path": f"/assets/sop/{record['slug']}/{destination.name}",
                "redactions": redactions,
            }
        )

    (REVIEW / "published-manifest.json").write_text(
        json.dumps(output_manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"Published {len(output_manifest)} images")
    print(f"Redacted {sum(match_counter.values())} regions: {dict(match_counter)}")
    for record in output_manifest:
        if record["redactions"]:
            found = " | ".join(item["detected"] for item in record["redactions"])
            print(f'{record["document"]} #{record["sequence"]:02d}: {found}')


if __name__ == "__main__":
    main()
