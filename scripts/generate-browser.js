#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const SVG_DIR = path.join(__dirname, '..', 'svg');
const OUT = path.join(__dirname, '..', 'icons.html');

const files = fs.readdirSync(SVG_DIR)
  .filter(f => f.endsWith('.svg'))
  .sort();
const icons = files.map(f => f.replace('.svg', ''));
const iconSvg = {};
for (const f of files) {
  const name = f.replace('.svg', '');
  const raw = fs.readFileSync(path.join(SVG_DIR, f), 'utf8');
  iconSvg[name] = raw
    .replace(/<\?xml[^?]*\?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\bwidth="\d+"/, '')
    .replace(/\bheight="\d+"/, '')
    .trim();
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pixelarticons Browser</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --icon-color: #222222;
      --icon-bg: #ffffff;
      --icon-size: 48px;
    }
    body { font-family: monospace; background: #f8f8f8; color: #222; padding: 24px; }
    header { margin-bottom: 24px; }
    h1 { font-size: 20px; margin-bottom: 12px; }
    .controls { display: flex; flex-wrap: wrap; gap: 16px; align-items: center; margin-top: 12px; }
    .control { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #555; }
    .control label { font-weight: bold; }
    #search { flex: 1; min-width: 200px; max-width: 400px; padding: 8px 12px; font-size: 14px; font-family: monospace; border: 1px solid #ccc; }
    .control select, .control input[type=color] { font-family: monospace; font-size: 12px; padding: 4px; border: 1px solid #ccc; background: #fff; }
    .control input[type=color] { width: 36px; height: 28px; padding: 2px; cursor: pointer; }
    .swatches { display: inline-flex; gap: 4px; }
    .swatch { width: 20px; height: 20px; border: 1px solid #ccc; cursor: pointer; padding: 0; }
    .swatch.active { outline: 2px solid #222; outline-offset: 1px; }
    #count { margin-top: 8px; font-size: 12px; color: #666; }
    #grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 8px; margin-top: 24px; }
    .icon {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 12px 8px;
      background: var(--icon-bg);
      border: 1px solid #e0e0e0;
      min-width: 0;
      cursor: default;
    }
    .icon .img {
      width: var(--icon-size);
      height: var(--icon-size);
      color: var(--icon-color);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .icon .img svg {
      width: 100%;
      height: 100%;
      display: block;
      image-rendering: pixelated;
    }
    .icon span {
      font-size: 9px; color: #555; text-align: center; line-height: 1.3;
      max-width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .icon:hover { border-color: #999; filter: brightness(0.96); }
    .hidden { display: none; }
  </style>
</head>
<body>
  <header>
    <h1>Pixelarticons — ${icons.length} icons</h1>
    <div class="controls">
      <input id="search" type="search" placeholder="Filter icons…" autofocus>
      <div class="control">
        <label for="size">Size</label>
        <select id="size">
          <option value="24">24px</option>
          <option value="48" selected>48px</option>
          <option value="72">72px</option>
          <option value="96">96px</option>
          <option value="120">120px</option>
        </select>
      </div>
      <div class="control">
        <label for="color">Color</label>
        <input id="color" type="color" value="#222222">
        <div class="swatches" id="color-swatches">
          <button class="swatch" style="background:#222222" data-color="#222222" title="Black"></button>
          <button class="swatch" style="background:#ffffff" data-color="#ffffff" title="White"></button>
          <button class="swatch" style="background:#e53935" data-color="#e53935" title="Red"></button>
          <button class="swatch" style="background:#1e88e5" data-color="#1e88e5" title="Blue"></button>
          <button class="swatch" style="background:#43a047" data-color="#43a047" title="Green"></button>
          <button class="swatch" style="background:#fb8c00" data-color="#fb8c00" title="Orange"></button>
        </div>
      </div>
      <div class="control">
        <label for="bg">Background</label>
        <input id="bg" type="color" value="#ffffff">
        <div class="swatches" id="bg-swatches">
          <button class="swatch" style="background:#ffffff" data-color="#ffffff" title="White"></button>
          <button class="swatch" style="background:#f8f8f8" data-color="#f8f8f8" title="Light gray"></button>
          <button class="swatch" style="background:#222222" data-color="#222222" title="Black"></button>
          <button class="swatch" style="background:#0a0a0a" data-color="#0a0a0a" title="Near black"></button>
        </div>
      </div>
    </div>
    <div id="count"></div>
  </header>
  <div id="grid"></div>
  <script>
    const icons = ${JSON.stringify(icons)};
    const iconSvg = ${JSON.stringify(iconSvg)};
    const grid = document.getElementById('grid');
    const search = document.getElementById('search');
    const count = document.getElementById('count');
    const sizeSel = document.getElementById('size');
    const colorInput = document.getElementById('color');
    const bgInput = document.getElementById('bg');
    const root = document.documentElement;

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
      div.title = name;
      div.innerHTML = \`<div class="img" role="img" aria-label="\${name}">\${iconSvg[name] || ''}</div><span>\${name}</span>\`;
      grid.appendChild(div);
    }

    sizeSel.addEventListener('change', e => root.style.setProperty('--icon-size', e.target.value + 'px'));
    colorInput.addEventListener('input', e => root.style.setProperty('--icon-color', e.target.value));
    bgInput.addEventListener('input', e => root.style.setProperty('--icon-bg', e.target.value));

    function wireSwatches(containerId, input, cssVar) {
      const container = document.getElementById(containerId);
      container.addEventListener('click', e => {
        const btn = e.target.closest('.swatch');
        if (!btn) return;
        const color = btn.dataset.color;
        input.value = color;
        root.style.setProperty(cssVar, color);
        for (const s of container.children) s.classList.toggle('active', s === btn);
      });
    }
    wireSwatches('color-swatches', colorInput, '--icon-color');
    wireSwatches('bg-swatches', bgInput, '--icon-bg');

    render('');
    search.addEventListener('input', e => render(e.target.value));
  </script>
</body>
</html>
`;

fs.writeFileSync(OUT, html);
console.log(`Generated icons.html with ${icons.length} icons.`);
