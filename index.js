'use strict';

// The package entry point declared as "main" in package.json.
//
// There is no framework-agnostic way to export 4400 icons as values, so this
// module exposes the icon files instead: where they are, which ones exist, and
// how to read one. It reads from disk on every call, so it also reflects the
// Pro icons that `pixelarticons upgrade` adds to svg/ after installation.
//
// React users want ./react instead: import { Heart } from 'pixelarticons/react'

const fs = require('fs');
const path = require('path');

const svgDir = path.join(__dirname, 'svg');

/**
 * Every installed icon name, kebab-case and without the .svg extension.
 * Style variants appear as their own names: heart, heart-sharp, heart-solid.
 * @returns {string[]}
 */
function listIcons() {
  return fs
    .readdirSync(svgDir)
    .filter((file) => file.endsWith('.svg'))
    .map((file) => file.slice(0, -4))
    .sort();
}

/**
 * Absolute path to one icon file. Does not check that the file exists.
 * @param {string} name Icon name in kebab-case, e.g. "alarm-clock".
 * @returns {string}
 */
function getIconPath(name) {
  return path.join(svgDir, `${name}.svg`);
}

/**
 * Source of one icon, or null when the icon is not installed. An icon that is
 * missing from the free set returns null until the Pro set is unlocked.
 * @param {string} name Icon name in kebab-case, e.g. "alarm-clock".
 * @returns {string|null}
 */
function getIconSvg(name) {
  try {
    return fs.readFileSync(getIconPath(name), 'utf8');
  } catch {
    return null;
  }
}

module.exports = { svgDir, listIcons, getIconPath, getIconSvg };
