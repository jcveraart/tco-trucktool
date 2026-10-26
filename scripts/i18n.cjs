// Keep the standalone website and its reviewed English dictionary in sync.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const file = path.join(root, 'index.html');
const dictionary = JSON.parse(fs.readFileSync(path.join(root, 'data/translations.en.json'), 'utf8'));
const runtime = fs.readFileSync(path.join(root, 'scripts/locale-runtime.js'), 'utf8');
// Dutch pages skip the English dictionary; English pages load it from assets/i18n.en.js (see seo.mjs).
const block = '<script id="sod-i18n">\nconst SOD_EN=window.SOD_EN||{};\n' + runtime + '\n</script>';
fs.writeFileSync(path.join(root, 'assets/i18n.en.js'), 'window.SOD_EN=' + JSON.stringify(dictionary).replace(/</g, '\\u003c') + ';\n');
const html = fs.readFileSync(file, 'utf8');
if (!html.includes('<script id="sod-i18n">')) throw new Error('Missing language script');
fs.writeFileSync(file, html.replace(/<script id="sod-i18n">[\s\S]*?<\/script>/, () => block));
console.log('Language runtime embedded in index.html, English dictionary written to assets/i18n.en.js');
