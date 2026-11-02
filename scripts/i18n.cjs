// Keep the standalone website and its reviewed English dictionary in sync.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const file = path.join(root, '_src/index.html');
const dictionary = JSON.parse(fs.readFileSync(path.join(root, 'data/translations.en.json'), 'utf8'));
const runtime = fs.readFileSync(path.join(root, 'scripts/locale-runtime.js'), 'utf8').replace(/\r\n/g, '\n');
const block = '<script id="sod-i18n">\nconst SOD_EN=' + JSON.stringify(dictionary).replace(/</g, '\\u003c') + ';\n' + runtime + '\n</script>';
const html = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
if (!html.includes('<script id="sod-i18n">')) throw new Error('Missing language script');
fs.writeFileSync(file, html.replace(/<script id="sod-i18n">[\s\S]*?<\/script>/, () => block));
console.log('English translations embedded in _src/index.html');
