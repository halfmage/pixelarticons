# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Generate webfont files (outputs to ./fonts/)
npm run font

# Publish a new version (uses np)
npm run np
```

There are no build, lint, or test commands — this is a static SVG icon library with a single font-generation step.

## Architecture

This is a pixel art icon library with 800 hand-crafted SVG icons.

**Source icons** live in `svg/` as individual `.svg` files. Each icon is a 24×24 viewBox SVG using `fill="currentColor"` and composed entirely of `<path>` elements (no other shapes), following a strict pixel-grid aesthetic without anti-aliasing.

**Font generation** (`npm run font`) runs `svgtofont` using the config in `.svgtofontrc`, which reads from `svg/` and outputs to `fonts/`. The `fonts/` directory contains:
- Web font files: `.ttf`, `.woff`, `.woff2`, `.eot`, `.svg`
- CSS/preprocessor stylesheets: `.css`, `.less`, `.scss`, `.styl`
- A `react/` subdirectory with generated React components (`.js` + `.d.ts`) for every icon

The `fonts/` directory is gitignored (generated artifact). The npm package publishes `svg/`, `fonts/`, and `index.js` but excludes `index.html` and `.svgtofontrc`.

**Icon naming convention:** SVG filenames use kebab-case (e.g., `add-box.svg`), which maps to PascalCase React components (e.g., `AddBox.js`) and CSS class names using the font name prefix.

**Recommended usage sizes:** 24px, 48px, 72px, or 96px (multiples of 24) — other sizes cause blurriness due to the pixel-grid design.
