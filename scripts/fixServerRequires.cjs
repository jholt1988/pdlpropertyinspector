const fs = require('fs');
const path = require('path');

const serverDist = path.join(__dirname, '..', 'dist', 'server');
if (!fs.existsSync(serverDist)) {
  console.warn('dist/server not found, skipping fixServerRequires');
  process.exit(0);
}

function rewriteFile(filePath) {
  let s = fs.readFileSync(filePath, 'utf8');
  // Replace require("../src/...") with require("./src/...")
  s = s.replace(/require\((['"])\.\.\/src\//g, 'require($1./src/');
  // Also fix import statements that may have "../src/"
  s = s.replace(/from (['"])\.\.\/src\//g, 'from $1./src/');
  fs.writeFileSync(filePath, s, 'utf8');
}

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.lstatSync(p);
    if (st.isDirectory()) walk(p);
    else if (p.endsWith('.js')) rewriteFile(p);
  }
}

try {
  walk(serverDist);
  console.log('Rewrote server JS requires/imports to use ./src/*');
} catch (err) {
  console.warn('fixServerRequires failed:', err.message);
}

process.exit(0);
