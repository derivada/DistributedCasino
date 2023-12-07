const fs = require('fs-extra');
const path = require('path');

const sourceDirectory =  path.join('..', 'build', 'contracts');
const destinationDirectory = path.join('..', 'distributed-casino', 'src', 'Contracts');
// Ensure the destination directory exists
fs.ensureDirSync(destinationDirectory);

// Copy the JSON artifacts
fs.readdirSync(sourceDirectory).forEach(file => {
  const sourcePath = path.join(sourceDirectory, file);
  const destinationPath = path.join(destinationDirectory, file);
  fs.copyFileSync(sourcePath, destinationPath);
});

console.log('JSON artifacts copied to another folder.');