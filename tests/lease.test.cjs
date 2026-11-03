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

function finance(values) {
  const fn = SOURCE.slice(SOURCE.indexOf('function flLoan'), SOURCE.indexOf('/* Meerkosten voor STour'));
  const ctx = { v: k => values[k], Math };
  vm.createContext(ctx);
  vm.runInContext(fn, ctx);
  return ctx;
}

test('financial lease pays off the price after grant with the residual value as balloon payment', () => {
  const f = finance({ jr: 6, xri: 6, xfs: 80, xre: 4 });
  const q = f.flLoan(285000, .2, {}, 59850);
  const P = (285000 - 59850) * .8, S = 57000, i = .005, n = 72;
  const pm = (P - S / Math.pow(1 + i, n)) * i / (1 - Math.pow(1 + i, -n));
  assert.ok(Math.abs(q.P - P) < .01 && q.S === S && Math.abs(q.pm - pm) < .01);
  const own = ((285000 - 59850 - P) + 0) / 2 * .04;
  assert.ok(Math.abs(f.finY(285000, .2, {}, 59850) - ((pm * n + S - P) / 6 + own)) < .01);
});

test('without a loan the capital cost is the return on the average of value now and residual value', () => {
  const f = finance({ jr: 6, xri: 6, xfs: 0, xre: 4 });
  assert.ok(Math.abs(f.finY(60000, .2) - .04 * (60000 + 12000) / 2) < .01);
});

test('MIA never lowers an operating lease price; trucks default to financial lease', () => {
  assert.match(SOURCE, /const lsSub=p=>reg\(\)\.startsWith\('mia'\)\?0:subsidy\(p\);/);
  assert.doesNotMatch(SOURCE, /leaseEst\(s,\{\},s==='E'\?subsidy\(/);
  assert.match(SOURCE, /trekker:\{[^}]*fl:1,/);
  assert.match(SOURCE, /bakwagen:\{[^}]*fl:1,/);
});
