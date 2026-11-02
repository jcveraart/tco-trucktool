const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SOURCE = fs.readFileSync(path.join(__dirname, '..', '_src', 'index.html'), 'utf8');

function leaseEstimator(values, included) {
  const fn = SOURCE.slice(SOURCE.indexOf('function leaseEst'), SOURCE.indexOf('function leaseYear'));
  const ctx = { v: k => values[k], ck: k => included.has(k), Math };
  vm.createContext(ctx);
  vm.runInContext('const LEASE_OPSLAG=.07;\n' + fn, ctx);
  return ctx.leaseEst;
}

test('estimated lease charges the 7% markup only on financing, not on maintenance and insurance', () => {
  const values = { jr: 5, xri: 6, pE: 50000, rwE: 20, km: 30000, oE: .04, vE: 1200 };
  const est = leaseEstimator(values, new Set(['loE', 'lvE']));
  const i = 6 / 1200, N = 60, fin = (50000 - 10000 / Math.pow(1 + i, N)) * i / (1 - Math.pow(1 + i, -N));
  const expected = fin * 1.07 + 30000 * .04 / 12 + 1200 / 12;
  assert.ok(Math.abs(est('E', {}, 0) - expected) < 1, `got ${est('E', {}, 0)}, want ${expected}`);
});

test('the new-lease form includes insurance by default, like market operational lease', () => {
  assert.match(SOURCE, /id="lv\$\{s\}" checked>Verzekering/);
});
