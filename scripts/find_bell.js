const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, 'bundle.js');
const content = fs.readFileSync(bundlePath, 'utf8');

// Find occurrences of classes or strings containing bell or notification
const matches = [];
const regex = /[a-zA-Z0-9_-]*(?:bell|notification)[a-zA-Z0-9_-]*/gi;

let match;
while ((match = regex.exec(content)) !== null) {
  matches.push(match[0]);
}

console.log('Unique matches:', Array.from(new Set(matches)));
