#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const SVG_DIR = path.join(__dirname, '..', 'svg');
const files = fs.readdirSync(SVG_DIR).filter(f => f.endsWith('.svg')).sort();

const FORBIDDEN_ELEMENTS = /(<|<\/)(rect|circle|ellipse|line|polygon|polyline|g)\b/;

let violations = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(SVG_DIR, file), 'utf8');
  const errors = [];

  if (!content.includes('viewBox="0 0 24 24"')) {
    errors.push('missing viewBox="0 0 24 24"');
  }

  if (FORBIDDEN_ELEMENTS.test(content)) {
    const matches = content.match(FORBIDDEN_ELEMENTS);
    errors.push(`forbidden element: ${matches[2]}`);
  }

  if (!content.includes('fill="currentColor"')) {
    errors.push('missing fill="currentColor"');
  }

  if (errors.length > 0) {
    violations.push({ file, errors });
  }
}

if (violations.length === 0) {
  console.log(`✓ All ${files.length} icons passed validation.`);
  process.exit(0);
} else {
  console.log(`Validation failed: ${violations.length} of ${files.length} icons have issues.\n`);
  for (const { file, errors } of violations) {
    console.log(`  ${file}`);
    for (const err of errors) {
      console.log(`    - ${err}`);
    }
  }
  process.exit(1);
}
