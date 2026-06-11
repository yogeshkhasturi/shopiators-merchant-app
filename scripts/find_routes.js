const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, 'bundle.js');
const content = fs.readFileSync(bundlePath, 'utf8');

const regexes = [
  /path\s*:\s*["']([^"']+)["']/g,
  /\/admin\/[a-zA-Z0-9_-]+/g
];

const matches = new Set();
for (const regex of regexes) {
  let match;
  while ((match = regex.exec(content)) !== null) {
    matches.add(match[0]);
  }
}

console.log(JSON.stringify(Array.from(matches), null, 2));
