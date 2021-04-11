#!/usr/bin/node
const fs = require('fs');
const content = fs.readFileSync('package-lock.json', 'utf8');
const regexp = new RegExp(/git\+ssh\:\/\/git\@/, 'g');
const fixedContent = content.replace(regexp, 'git://');
fs.writeFileSync('package-lock.json', fixedContent);
