const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'dist', 'server');
if (!fs.existsSync(dir)) {
  console.warn('dist/server not found, skipping proxy generation');
  process.exit(0);
}

const entries = fs.readdirSync(dir, { withFileTypes: true });
for (const entry of entries) {
  if (entry.isFile() && entry.name.endsWith('.cjs')) {
    const base = entry.name.replace(/\.cjs$/, '');
    const jsPath = path.join(dir, base + '.js');
    const target = './' + base + '.cjs';
    const content = `module.exports = require('${target}');\n`;
    fs.writeFileSync(jsPath, content);
  }
}
console.log('Wrote JS proxy files for .cjs modules in', dir);
