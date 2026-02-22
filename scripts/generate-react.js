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
  const shapeRegex = /<(path|rect|circle|ellipse|line|polygon|polyline)\s([^>]*?)\s*\/?>/gs;
  let m;
  while ((m = shapeRegex.exec(inner)) !== null) {
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
    return `React.createElement('${tag}', {${attrStr}})`;
  }).join(', ');

  const js = `import React from 'react';
export const ${componentName} = (props) => React.createElement('svg', Object.assign({viewBox: '0 0 24 24', width: '24', height: '24', fill: 'currentColor', xmlns: 'http://www.w3.org/2000/svg'}, props), ${shapeElements});
`;

  const dts = `import React from 'react';
export declare const ${componentName}: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
`;

  fs.writeFileSync(path.join(outDir, `${componentName}.js`), js);
  fs.writeFileSync(path.join(outDir, `${componentName}.d.ts`), dts);
  exportLines.push(`export * from './${componentName}';`);
}

fs.writeFileSync(path.join(outDir, 'index.js'), exportLines.join('\n') + '\n');
fs.writeFileSync(path.join(outDir, 'index.d.ts'), exportLines.join('\n') + '\n');

console.log(`Generated ${files.length} React components`);
