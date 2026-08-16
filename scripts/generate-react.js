const fs = require('fs');
const path = require('path');

const svgDir = path.join(__dirname, '..', 'svg');
const outDir = path.join(__dirname, '..', 'react');

function toPascalCase(str) {
  const pascal = str.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  return /^\d/.test(pascal) ? `Icon${pascal}` : pascal;
}

function extractShapes(inner) {
  const results = [];
  // <defs> holds clip paths, masks and gradients. Their shapes define regions,
  // they never paint. Scraping them emits an extra filled rect on top of the
  // icon, which renders the whole component as a solid block.
  const painted = inner.replace(/<defs\b[\s\S]*?<\/defs>/g, '');
  const shapeRegex = /<(path|rect|circle|ellipse|line|polygon|polyline)\s([^>]*?)\s*\/?>/gs;
  let m;
  while ((m = shapeRegex.exec(painted)) !== null) {
    const tag = m[1];
    const attrs = {};
    const attrRegex = /([\w-]+)="([^"]*)"/g;
    let a;
    while ((a = attrRegex.exec(m[2])) !== null) {
      const key = a[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const value = (key === 'fill' && a[2] !== 'none') ? 'currentColor' : a[2];
      attrs[key] = value;
    }
    results.push({ tag, attrs });
  }
  return results;
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const files = fs.readdirSync(svgDir).filter((f) => f.endsWith('.svg')).sort();
const exportLines = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(svgDir, file), 'utf8');
  const baseName = path.basename(file, '.svg');
  const componentName = toPascalCase(baseName);

  const innerMatch = content.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
  if (!innerMatch) {
    console.warn(`Skipping ${file} — could not parse SVG`);
    continue;
  }

  const shapes = extractShapes(innerMatch[1]);
  const shapeElements = shapes.map(({ tag, attrs }) => {
    const attrStr = Object.entries(attrs).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ');
    return `h('${tag}', {${attrStr}})`;
  }).join(', ');

  // No "React" binding here: the react.svg brand icon exports a component
  // named React, which would collide with a default import.
  const js = `import { createElement as h } from 'react';
export const ${componentName} = (props) => h('svg', Object.assign({viewBox: '0 0 24 24', width: '24', height: '24', fill: 'currentColor', xmlns: 'http://www.w3.org/2000/svg'}, props), ${shapeElements});
`;

  const dts = `import type * as React_2 from 'react';
export declare const ${componentName}: (props: React_2.SVGProps<SVGSVGElement>) => React_2.JSX.Element;
`;

  fs.writeFileSync(path.join(outDir, `${componentName}.js`), js);
  fs.writeFileSync(path.join(outDir, `${componentName}.d.ts`), dts);
  // Explicit .js extension: Node's ESM resolver refuses extensionless paths,
  // so without it the entry only works through bundlers and breaks SSR.
  exportLines.push(`export * from './${componentName}.js';`);
}

fs.writeFileSync(path.join(outDir, 'index.js'), exportLines.join('\n') + '\n');
fs.writeFileSync(path.join(outDir, 'index.d.ts'), exportLines.join('\n') + '\n');
// The root package is CommonJS, so Node parses .js here as CJS without this marker.
fs.writeFileSync(path.join(outDir, 'package.json'), JSON.stringify({ type: 'module', sideEffects: false }, null, 2) + '\n');

console.log(`Generated ${files.length} React components`);
