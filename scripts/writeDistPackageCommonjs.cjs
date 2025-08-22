const fs = require('fs');
const path = require('path');

const distRoot = path.join(__dirname, '..', 'dist');
const serverDir = path.join(distRoot, 'server');

// remove stray dist/src if present to avoid mixing ESM compiled files
const straySrc = path.join(distRoot, 'src');
if (fs.existsSync(straySrc)) {
  try {
    const rimraf = (p) => {
      if (!fs.existsSync(p)) return;
      const stat = fs.lstatSync(p);
      if (stat.isDirectory()) {
        for (const f of fs.readdirSync(p)) rimraf(path.join(p, f));
        fs.rmdirSync(p);
      } else fs.unlinkSync(p);
    };
    rimraf(straySrc);
    console.log('Removed stray dist/src to avoid mixed module formats');
  } catch (e) {
    console.warn('Failed to remove dist/src:', e.message);
  }
}

const pkg = { type: 'commonjs' };
try {
  if (fs.existsSync(serverDir)) {
    fs.writeFileSync(path.join(serverDir, 'package.json'), JSON.stringify(pkg, null, 2));
    console.log('Wrote dist/server/package.json with type commonjs');
  }
  // also write dist/package.json to ensure node treats dist as commonjs boundary
  fs.writeFileSync(path.join(distRoot, 'package.json'), JSON.stringify(pkg, null, 2));
  console.log('Wrote dist/package.json with type commonjs');
} catch (err) {
  console.warn('Failed to write package.json in dist:', err.message);
}

// If TypeScript emitted files under dist/src, move them into dist/server/src
const emittedSrc = path.join(distRoot, 'src');
if (fs.existsSync(emittedSrc)) {
  const target = path.join(serverDir, 'src');
  const copyRecursive = (src, dest) => {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      const s = path.join(src, name);
      const d = path.join(dest, name);
      const st = fs.lstatSync(s);
      if (st.isDirectory()) {
        copyRecursive(s, d);
      } else {
        fs.copyFileSync(s, d);
      }
    }
  };
  try {
    copyRecursive(emittedSrc, target);
    // remove original emitted src to avoid confusion
    const rimraf = (p) => {
      if (!fs.existsSync(p)) return;
      const stat = fs.lstatSync(p);
      if (stat.isDirectory()) {
        for (const f of fs.readdirSync(p)) rimraf(path.join(p, f));
        fs.rmdirSync(p);
      } else fs.unlinkSync(p);
    };
    rimraf(emittedSrc);
    console.log('Moved emitted dist/src into dist/server/src');
  } catch (e) {
    console.warn('Failed to relocate emitted src into server dist:', e.message);
  }
}
