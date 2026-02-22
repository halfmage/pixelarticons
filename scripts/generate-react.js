const fs = require('fs');
const path = require('path');

const svgDir = path.join(__dirname, '..', 'svg');
const outDir = path.join(__dirname, '..', 'fonts', 'react');

function toPascalCase(str) {
  const pascal = str.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  return /^\d/.test(pascal) ? `Icon${pascal}` : pascal;
}

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

  const inner = innerMatch[1].trim();

  const js = `import React from 'react';
export const ${componentName} = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>${inner}</svg>
);
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
