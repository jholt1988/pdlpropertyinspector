const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist');
function rimrafSync(p) {
  if (!fs.existsSync(p)) return;
  const stat = fs.lstatSync(p);
  if (stat.isDirectory()) {
    for (const f of fs.readdirSync(p)) {
      rimrafSync(path.join(p, f));
    }
    fs.rmdirSync(p);
  } else {
    fs.unlinkSync(p);
  }
}

try {
  if (fs.existsSync(dist)) {
    console.log('Removing existing dist directory...');
    rimrafSync(dist);
  }
} catch (err) {
  console.warn('Failed to clean dist:', err.message);
}

process.exit(0);
