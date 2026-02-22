![Pixelarticons Cover](cover.jpg "Pixelarticons Cover")

# Pixelarticons

[![npm version](https://img.shields.io/npm/v/pixelarticons.svg?color=black&label=npm&style=flat-square)](https://www.npmjs.com/package/pixelarticons)
[![npm downloads](https://img.shields.io/npm/dt/pixelarticons.svg?color=black&style=flat-square)](https://www.npmjs.com/package/pixelarticons)
[![License: MIT](https://img.shields.io/badge/license-MIT-black.svg?style=flat-square)](LICENSE)

**800 handcrafted pixel art icons** — drawn on a strict 24×24 grid, no anti-aliasing, pure `<path>` elements, `fill="currentColor"`. Works with React, as raw SVGs, via CDN, or as a webfont.

- [🌐 Browse all icons](https://pixelarticons.com)
- [🎨 Figma community file](https://www.figma.com/community/file/952542622393317653/Pixelarticons)

---

## Installation

```bash
npm install pixelarticons
```

---

## Usage

### React

Every icon ships as a ready-to-use React component with full TypeScript types.

```jsx
import { Heart, Home, Bell, Mail, Lock } from 'pixelarticons/react'

export default function App() {
  return (
    <div>
      <Heart width={48} height={48} />
      <Home className="text-blue-500" />
      <Bell style={{ color: 'red' }} />
    </div>
  )
}
```

Components accept all standard SVG props (`width`, `height`, `className`, `style`, `onClick`, …). The default size is `24×24`. For the sharpest rendering use multiples of 24: **24px, 48px, 72px, 96px**.

**Tree-shakeable per-icon imports** keep bundles small:

```jsx
import { Heart } from 'pixelarticons/react/Heart'
```

Icon names follow **PascalCase** matching their SVG filename (`alarm-clock.svg` → `AlarmClock`). Icons whose names start with a digit are prefixed with `Icon` (e.g. `4g.svg` → `Icon4G`).

---

### Raw SVG

The `svg/` directory contains every icon as a standalone file — drop them directly into any project:

```html
<img src="node_modules/pixelarticons/svg/heart.svg" width="48" height="48" />
```

Or inline them for CSS color control:

```html
<svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
  <!-- paste path data from svg/heart.svg -->
</svg>
```

---

### CDN (no install)

Use any icon directly via [unpkg](https://unpkg.com) without installing anything:

```html
<img src="https://unpkg.com/pixelarticons@latest/svg/heart.svg" width="48" />
```

Replace `heart` with any icon name (kebab-case, e.g. `home`, `bell`, `alarm-clock`).

---

### Webfont

Generate `.ttf`, `.woff`, `.woff2`, `.eot`, `.svg` fonts plus CSS/SCSS stylesheets into `./fonts/`:

```bash
npm run font
```

Link the generated CSS and use icon classes in HTML:

```html
<link rel="stylesheet" href="fonts/pixelarticons.css" />
<i class="pixel-heart"></i>
```

---

## Unlock all 2000+ icons

The free package includes 800 icons. If you purchased a license, run the upgrade command to unlock the full icon set:

```bash
npx pixelarticons upgrade --key=YOUR_LICENSE_KEY
```

This verifies your license, downloads all icons into your local `svg/` directory, and automatically regenerates the React components — no extra setup needed.

You can find your license key in your **Gumroad library** or in the **purchase confirmation email** you received from Gumroad.

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for the full design rules and naming conventions. The short version:

- `viewBox="0 0 24 24"`, `<path>` elements only, `fill="currentColor"`
- Paths must align to the pixel grid — no sub-pixel coordinates
- Filenames use kebab-case describing function, not appearance

**Useful commands:**

```bash
npm run validate   # check all SVGs against design rules
npm run browser    # preview all icons in a local HTML file
```

---

## Links

- [Website](https://pixelarticons.com)
- [Instagram](https://www.instagram.com/pixelarticons/)
- [NPM](https://www.npmjs.com/package/pixelarticons)
- [GitHub Issues](https://github.com/halfmage/pixelarticons/issues)

---

MIT © [Gerrit Halfmann](https://github.com/halfmage)
