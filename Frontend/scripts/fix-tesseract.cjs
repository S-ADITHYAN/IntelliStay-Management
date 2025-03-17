const fs = require('fs');
const path = require('path');

const tesseractPackageJsonPath = path.resolve(__dirname, '../node_modules/tesseract.js/package.json');

try {
  const packageJson = require(tesseractPackageJsonPath);
  packageJson.type = 'module';
  fs.writeFileSync(tesseractPackageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('Successfully fixed tesseract.js package.json');
} catch (error) {
  console.error('Error fixing tesseract.js package.json:', error);
} 