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
  console.error('Usage: npx pixelarticons pull --key=YOUR_LICENSE_KEY');
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
    s2.succeed('Upgraded — All icons are now available!\n');
  })
  .catch((err) => {
    process.stderr.write(`\r${RED}✗${RESET} ${err.message}\n`);
    process.exit(1);
  });

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
