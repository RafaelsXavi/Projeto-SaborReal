const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

const renameMap = [
  ['apps/api/src/routes/v1/courier', 'apps/api/src/routes/v1/motoboy'],
  [
    'apps/api/src/modules/orders/orders.courier.controller.ts',
    'apps/api/src/modules/orders/orders.motoboy.controller.ts',
  ],
  ['apps/web/src/pages/courier', 'apps/web/src/pages/motoboy'],
  ['apps/web/src/pages/CourierPage.tsx', 'apps/web/src/pages/MotoboyPage.tsx'],
  [
    'apps/web/src/hooks/useCourierOrders.ts',
    'apps/web/src/hooks/useMotoboyOrders.ts',
  ],
  [
    'apps/web/src/test/useCourierOrders.test.tsx',
    'apps/web/src/test/useMotoboyOrders.test.tsx',
  ],
  [
    'apps/web/src/pages/motoboy/CourierHeader.tsx',
    'apps/web/src/pages/motoboy/MotoboyHeader.tsx',
  ],
  [
    'apps/web/src/pages/motoboy/CourierLists.tsx',
    'apps/web/src/pages/motoboy/MotoboyLists.tsx',
  ],
];

// 1. Rename files/folders
for (const [oldPath, newPath] of renameMap) {
  const fullOld = path.join(root, oldPath);
  const fullNew = path.join(root, newPath);

  // if old exists, rename it. But handle the case where we rename a folder first and then files inside it.
  // Wait, I should rename the folder first, then the files inside the NEW folder.
  // I did: apps/web/src/pages/courier -> apps/web/src/pages/motoboy, then inside it CourierHeader -> MotoboyHeader

  if (fs.existsSync(fullOld)) {
    fs.renameSync(fullOld, fullNew);
    console.log(`Renamed ${oldPath} to ${newPath}`);
  }
}

// 2. Replace content in all files inside apps and packages (excluding node_modules, dist, etc)
function replaceInDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (
      entry.name === 'node_modules' ||
      entry.name === 'dist' ||
      entry.name === '.git' ||
      entry.name === 'scripts' ||
      entry.name === '.next'
    ) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      replaceInDir(fullPath);
    } else if (
      entry.isFile() &&
      (fullPath.endsWith('.ts') ||
        fullPath.endsWith('.tsx') ||
        fullPath.endsWith('.mjs') ||
        fullPath.endsWith('.sql') ||
        fullPath.endsWith('.md'))
    ) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const newContent = content
        .replace(/courier/g, 'motoboy')
        .replace(/Courier/g, 'Motoboy')
        .replace(/COURIER/g, 'MOTOBOY');

      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Updated content in ${fullPath}`);
      }
    }
  }
}

replaceInDir(path.join(root, 'apps'));
replaceInDir(path.join(root, 'packages'));
replaceInDir(path.join(root, 'README.md'));
replaceInDir(path.join(root, 'README-RENDER.md'));
replaceInDir(path.join(root, 'CLAUDE.md'));

console.log('Done replacing.');
