import fs from 'fs';
import path from 'path';
import { POWERSHELL_SCRIPT, BATCH_SCRIPT } from '../src/script';

const releaseDir = path.join(process.cwd(), 'release');

if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

fs.writeFileSync(path.join(releaseDir, 'jdk.ps1'), POWERSHELL_SCRIPT);
fs.writeFileSync(path.join(releaseDir, 'jdk.bat'), BATCH_SCRIPT);

console.log('Release files generated in ./release');
