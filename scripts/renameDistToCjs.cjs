const fs = require('fs');
const path = require('path');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && full.endsWith('.js')) {
      const target = full.replace(/\.js$/, '.cjs');
      fs.renameSync(full, target);
    }
  }
}

const dist = path.join(__dirname, '..', 'dist', 'server');
if (fs.existsSync(dist)) {
  walk(dist);
  console.log('Renamed .js -> .cjs in', dist);
} else {
  console.warn('dist/server not found, skipping rename');
}
