#!/usr/bin/env node

'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const VERIFY_URL = 'https://pixelarticons.com/.netlify/functions/verify-license';

// Parse --key=VALUE from argv
const keyArg = process.argv.slice(2).find((a) => a.startsWith('--key='));

if (!keyArg) {
  console.error('Usage: npx pixelarticons pull --key=YOUR_LICENSE_KEY');
  process.exit(1);
}

const licenseKey = keyArg.slice('--key='.length).trim();

if (!licenseKey) {
  console.error('Usage: npx pixelarticons pull --key=YOUR_LICENSE_KEY');
  process.exit(1);
}

const svgDir = path.join(__dirname, '..', 'svg');

if (!fs.existsSync(svgDir)) {
  console.error(
    `Error: svg/ directory not found at ${svgDir}\n` +
    'Make sure you are running this inside a project with pixelarticons installed.'
  );
  process.exit(1);
}

// Check unzip is available
try {
  execSync('unzip -v', { stdio: 'ignore' });
} catch {
  console.error(
    'Error: unzip is not installed.\n' +
    'Install it (e.g. "brew install unzip" on macOS or via your package manager) and try again.'
  );
  process.exit(1);
}

console.log('Verifying license...');

postJSON(VERIFY_URL, { licenseKey })
  .then(({ statusCode, body }) => {
    if (statusCode !== 200) {
      console.error('Invalid license key.');
      process.exit(1);
    }

    const { downloadUrl } = JSON.parse(body);
    const tmpFile = path.join(os.tmpdir(), 'pixelarticons-v2.zip');

    console.log('Downloading icons...');

    return downloadFile(downloadUrl, tmpFile).then(() => tmpFile);
  })
  .then((tmpFile) => {
    console.log('Extracting...');

    execSync(`unzip -o "${tmpFile}" -d "${svgDir}"`, { stdio: 'ignore' });
    fs.unlinkSync(tmpFile);

    console.log('Done! V2 icons are now available in ' + svgDir);
  })
  .catch((err) => {
    console.error('Error:', err.message);
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
