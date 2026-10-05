# McSpace Asset Checker & Renamer

Internal single-page tool for checking McSpace creative dimensions and preparing S3 pickup filenames. All processing happens in the browser. Files are not uploaded to a server.

## Use

Open the GitHub Pages site, or open `index.html` locally.

1. Drop creative files or folders.
2. Review size checks and inspect the artwork.
3. Enter the app, region, year, campaign, and month.
4. Review the new filenames and download your ZIP.

## Naming

Device files:

`{app}_{region}_{year}_{campaign}_{month}_{device}{optional_suffix}.{original_extension}`

Example: `FP_US_2026_bigcanvas_oct_android_normal.jpg`

McPO filenames stay unchanged. Order confirmation stays unchanged unless you opt in to rename it with the `order_confirm` suffix.

## Live site

https://ricky-lim-pa.github.io/mcspace-asset-checker/

Pushes to `main` publish via GitHub Pages.
