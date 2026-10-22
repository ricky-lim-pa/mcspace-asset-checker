# Mobile Asset Checker & Renamer

Internal single-page tool for checking FreePrints mobile creative dimensions and preparing McSpace S3 pickup filenames. All processing happens in the browser. Files are not uploaded to a server.

## Use

Open the GitHub Pages site, or open `index.html` locally.

1. Drop creative files or folders.
2. Review size checks and inspect the artwork.
3. Enter the app, region, year, campaign, and month.
4. Review the new filenames and download your ZIP.

## Checks

Completeness is scored per app, region, version, and asset pack. A PCU drop is not scored as a missing McSpace set.

McSpace: 1080×624, 1242×669, 1242×810, 1440×963, 1536×686, 1668×761, 2160×700, plus 1029×619 order confirmation and 1120×1560 McPO.

FG home hero: 994×1024.

FG PCU uses the app slot names: 750×1334 normal, 1125×2436 iphone_x, 1440×3200 aspect, 1536×2048 ipad, 1856×2200 android_folded. These are not the McSpace device sizes.

Expiry variants such as tomorrow, tonight, soon, and 2day are grouped separately. Same size in the same version is a duplicate.

## Naming

McSpace device files:

`{app}_{region}_{year}_{campaign}_{month}_{device}{optional_suffix}.{original_extension}`

Example: `FP_US_2026_bigcanvas_oct_android_normal.jpg`

McPO, FG home hero, and PCU filenames stay unchanged. Order confirmation stays unchanged unless you opt in to rename it with the `order_confirm` suffix.

## Live site

https://ricky-lim-pa.github.io/mcspace-asset-checker/

Pushes to `main` publish via GitHub Pages.
