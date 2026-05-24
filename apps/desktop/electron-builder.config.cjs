/** @type {import('electron-builder').Configuration} */
const path = require('path');

const repoRoot = path.join(__dirname, '../..');
const envFile = path.join(repoRoot, '.env');

module.exports = {
  appId: 'com.docuforge.app',
  productName: 'DocuForge',
  copyright: 'Copyright © DocuForge',
  directories: {
    app: repoRoot,
    output: path.join(repoRoot, 'release'),
    buildResources: path.join(__dirname, 'build'),
  },
  extraMetadata: {
    main: 'apps/desktop/dist-electron/main.js',
    name: 'DocuForge',
    description: 'DocuForge — documentary video production studio',
  },
  files: [
    'package.json',
    'scripts/setup.mjs',
    '.env.example',
    'apps/desktop/dist-electron/**/*',
    'apps/web/dist/**/*',
    'apps/api/**/*',
    'packages/**/*',
    'node_modules/**/*',
    '!**/.git',
    '!**/.github/**',
    '!**/.agents/**',
    '!**/projects/**',
    '!**/exports/**',
    '!**/cache/**',
    '!**/release/**',
    '!apps/web/src/**',
    '!apps/api/**/*.mp4',
    '!apps/api/moviepy-output*',
    '!**/*.map',
    '!**/node_modules/*/{CHANGELOG.md,README.md,readme.md,README,readme}',
    '!**/node_modules/**/{test,tests,__tests__,docs,doc,example,examples}/**',
  ],
  // Unpacked app dir — reliable Node ESM + forked API + native modules (ffmpeg, remotion)
  asar: false,
  npmRebuild: false,
  extraResources: [{ from: envFile, to: '.env' }],
  win: {
    target: [
      { target: 'portable', arch: ['x64'] },
      { target: 'nsis', arch: ['x64'] },
    ],
    artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    shortcutName: 'DocuForge',
    runAfterFinish: true,
    include: path.join(__dirname, 'build', 'installer.nsh'),
  },
  portable: {
    artifactName: '${productName}-${version}-portable.${ext}',
  },
};
