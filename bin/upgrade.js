#!/usr/bin/env node

'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const VERIFY_URL = 'https://pixelarticons.com/.netlify/functions/verify-license';

const LOGO = [
  '█▀█ █ ▀▄▀ █▀▀ █   ▄▀█ █▀█ ▀█▀ █ █▀▀ █▀█ █▄ █ █▀',
  '█▀▀ █ ▄▀▄ ██▄ █▄▄ █▀█ █▀▄  █  █ █▄▄ █▄█ █ ▀█ ▄█',
].join('\n');

const DIM    = '\x1b[2m';
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[93m';
const RESET  = '\x1b[0m';
const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

function spinner(text) {
  let i = 0;
  const id = setInterval(() => {
    process.stdout.write(`\r${DIM}${FRAMES[i++ % FRAMES.length]}${RESET} ${text}`);
  }, 80);
  return {
    succeed(msg) {
      clearInterval(id);
      process.stdout.write(`\r\x1b[2K${YELLOW}✓${RESET} ${msg}\n`);
    },
    fail(msg) {
      clearInterval(id);
      process.stdout.write(`\r\x1b[2K${RED}✗${RESET} ${msg}\n`);
      process.exit(1);
    },
  };
}

// --- main ---

const keyArg = process.argv.slice(2).find((a) => a.startsWith('--key='));

if (!keyArg || !keyArg.slice('--key='.length).trim()) {
  console.error('Usage: npx pixelarticons upgrade --key=YOUR_LICENSE_KEY');
  process.exit(1);
}

const licenseKey = keyArg.slice('--key='.length).trim();
const svgDir = path.join(__dirname, '..', 'svg');

if (!fs.existsSync(svgDir)) {
  console.error(
    `Error: svg/ directory not found at ${svgDir}\n` +
    'Make sure pixelarticons is installed in your project.'
  );
  process.exit(1);
}

try {
  execSync('unzip -v', { stdio: 'ignore' });
} catch {
  console.error(
    'Error: unzip is not installed.\n' +
    'Install it (e.g. "brew install unzip") and try again.'
  );
  process.exit(1);
}

console.log('\n' + YELLOW + LOGO + RESET + '\n');

const s1 = spinner('Verifying license...');

postJSON(VERIFY_URL, { licenseKey })
  .then(({ statusCode, body }) => {
    if (statusCode !== 200) {
      s1.fail('Invalid license key.');
    }

    s1.succeed('License verified');

    const { downloadUrl } = JSON.parse(body);
    const tmpFile = path.join(os.tmpdir(), 'pixelarticons-v2.zip');
    const s2 = spinner('Upgrading to v2...');

    return downloadFile(downloadUrl, tmpFile).then(() => ({ tmpFile, s2 }));
  })
  .then(({ tmpFile, s2 }) => {
    execSync(`unzip -o "${tmpFile}" -d "${svgDir}"`, { stdio: 'ignore' });
    fs.unlinkSync(tmpFile);
    s2.succeed('Icons downloaded');

    const root = path.join(__dirname, '..');
    const reactDir = path.join(root, 'react');
    const s3 = spinner('Generating React components...');
    generateReact(svgDir, reactDir);
    s3.succeed('Done — All 2000+ icons are now available as SVGs and React components!\n');
  })
  .catch((err) => {
    process.stderr.write(`\r${RED}✗${RESET} ${err.message}\n`);
    process.exit(1);
  });

// --- react generator ---

function generateReact(svgDir, outDir) {
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
    const componentName = toPascalCase(path.basename(file, '.svg'));
    const innerMatch = content.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
    if (!innerMatch) continue;

    const shapes = extractShapes(innerMatch[1]);
    const shapeElements = shapes.map(({ tag, attrs }) => {
      const attrStr = Object.entries(attrs).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ');
      return `React.createElement('${tag}', {${attrStr}})`;
    }).join(', ');

    fs.writeFileSync(path.join(outDir, `${componentName}.js`),
      `import React from 'react';\nexport const ${componentName} = (props) => React.createElement('svg', Object.assign({viewBox: '0 0 24 24', width: '24', height: '24', fill: 'currentColor', xmlns: 'http://www.w3.org/2000/svg'}, props), ${shapeElements});\n`
    );
    fs.writeFileSync(path.join(outDir, `${componentName}.d.ts`),
      `import React from 'react';\nexport declare const ${componentName}: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;\n`
    );
    exportLines.push(`export * from './${componentName}';`);
  }

  fs.writeFileSync(path.join(outDir, 'index.js'), exportLines.join('\n') + '\n');
  fs.writeFileSync(path.join(outDir, 'index.d.ts'), exportLines.join('\n') + '\n');
}

// --- helpers ---

function postJSON(url, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const parsed = new URL(url);

    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const follow = (currentUrl) => {
      https.get(currentUrl, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          follow(res.headers.location);
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`Download failed with status ${res.statusCode}`));
          return;
        }

        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
        file.on('error', (err) => {
          fs.unlink(dest, () => {});
          reject(err);
        });
      }).on('error', reject);
    };

    follow(url);
  });
}
