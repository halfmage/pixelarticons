# Contributing to Pixelarticons

## Design Rules

Every icon must follow these strict rules:

1. **24×24 viewBox** — the root `<svg>` must have `viewBox="0 0 24 24"`
2. **Path elements only** — use only `<path>` elements; no `<rect>`, `<circle>`, `<ellipse>`, `<line>`, `<polygon>`, `<polyline>`, `<g>`, or other shapes
3. **`fill="currentColor"`** — the fill must be set to `currentColor` (on the root element or on individual paths) so icons inherit color from CSS
4. **No anti-aliasing** — paths must align to the pixel grid; avoid sub-pixel coordinates or diagonal edges that blur at small sizes
5. **Recommended display sizes** — 24px, 48px, 72px, or 96px (multiples of 24)

## Naming Convention

- Filenames use **kebab-case**: `icon-name.svg`
- Names should describe the icon's **function**, not its appearance
- Examples: `add-box.svg`, `arrow-left.svg`, `chevron-right.svg`

## Adding an Icon

1. Create your SVG file following the design rules above
2. Place it in the `svg/` directory with a kebab-case name
3. Run the validator to confirm it passes:
   ```
   npm run validate
   ```
4. Preview it alongside all other icons:
   ```
   npm run browser
   ```

## Previewing Icons Locally

```
npm run browser
```

This generates `icons.html` (a static file, gitignored) and opens it in your browser. It shows all icons in a searchable grid loaded directly from `svg/`.

## Validator

```
npm run validate
```

Checks every `.svg` in `svg/` against the three rules above. Exits with code 1 and lists failures if any rule is violated.

