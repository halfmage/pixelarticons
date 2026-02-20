#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const SVG_DIR = path.join(__dirname, '..', 'svg');
const OUT = path.join(__dirname, '..', 'icons.html');

const icons = fs.readdirSync(SVG_DIR)
  .filter(f => f.endsWith('.svg'))
  .sort()
  .map(f => f.replace('.svg', ''));

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pixelarticons Browser</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: monospace; background: #f8f8f8; color: #222; padding: 24px; }
    header { margin-bottom: 24px; }
    h1 { font-size: 20px; margin-bottom: 12px; }
    #search { width: 100%; max-width: 400px; padding: 8px 12px; font-size: 14px; font-family: monospace; border: 1px solid #ccc; }
    #count { margin-top: 8px; font-size: 12px; color: #666; }
    #grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 24px; }
    .icon { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 8px; background: #fff; border: 1px solid #e0e0e0; width: 88px; cursor: default; }
    .icon img { width: 48px; height: 48px; image-rendering: pixelated; }
    .icon span { font-size: 9px; color: #555; text-align: center; word-break: break-all; line-height: 1.3; }
    .icon:hover { border-color: #999; background: #f0f0f0; }
    .hidden { display: none; }
  </style>
</head>
<body>
  <header>
    <h1>Pixelarticons — ${icons.length} icons</h1>
    <input id="search" type="search" placeholder="Filter icons…" autofocus>
    <div id="count"></div>
  </header>
  <div id="grid"></div>
  <script>
    const icons = ${JSON.stringify(icons)};
    const grid = document.getElementById('grid');
    const search = document.getElementById('search');
    const count = document.getElementById('count');

    function render(filter) {
      const q = filter.toLowerCase().trim();
      let visible = 0;
      for (const el of grid.children) {
        const name = el.dataset.name;
        const show = !q || name.includes(q);
        el.classList.toggle('hidden', !show);
        if (show) visible++;
      }
      count.textContent = q ? \`Showing \${visible} of \${icons.length}\` : \`\${icons.length} icons\`;
    }

    for (const name of icons) {
      const div = document.createElement('div');
      div.className = 'icon';
      div.dataset.name = name;
      div.innerHTML = \`<img src="svg/\${name}.svg" alt="\${name}" loading="lazy"><span>\${name}</span>\`;
      grid.appendChild(div);
    }

    render('');
    search.addEventListener('input', e => render(e.target.value));
  </script>
</body>
</html>
`;

fs.writeFileSync(OUT, html);
console.log(`Generated icons.html with ${icons.length} icons.`);
