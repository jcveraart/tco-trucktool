const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SOURCE = fs.readFileSync(path.join(__dirname, '..', '_src', 'index.html'), 'utf8');

function makeCalc(values) {
  const cat = SOURCE.slice(SOURCE.indexOf('const CAT='), SOURCE.indexOf('function calc('));
  const fn = SOURCE.slice(SOURCE.indexOf('function calc('), SOURCE.indexOf('const CATX='));
  const ctx = {
    v: k => values[k], ck: () => false, $: () => ({ value: 'n' }),
    T: () => ({ truck: true }), spNet: g => g('sp'), subsidy: () => 0,
    leaseYear: () => 0, CO2D: 3.27, CO2E: .48, Math,
  };
  vm.createContext(ctx);
  vm.runInContext(cat + '\n' + fn, ctx);
  return ctx.calc;
}

const base = {
  jr: 5, km: 50000, kmH: 0, rw: 20, rwE: 20, pD: 100000, pE: 200000,
  ld: 25, dp: 2, le: 100, sp: .25, ere: 0, oD: .1, oE: .06,
  vD: 4000, vE: 5000, wD: 800, wE: 600, tD: .2, tE: .04, lsD: 0, lsE: 0,
};

test('wegenbelasting is een eigen kostenpost en telt mee in beide jaartotalen', () => {
  const calc = makeCalc(base);
  const r = calc();
  assert.equal(r.D.bel, 800);
  assert.equal(r.E.bel, 600);
  const zonder = makeCalc({ ...base, wD: 0, wE: 0 })();
  assert.equal(Math.round(r.td - zonder.td), 800);
  assert.equal(Math.round(r.te - zonder.te), 600);
});

test('lease-schatting neemt wegenbelasting mee als hij in de leaseprijs zit, zonder 7% opslag', () => {
  const fn = SOURCE.slice(SOURCE.indexOf('function leaseEst'), SOURCE.indexOf('function leaseYear'));
  const values = { jr: 5, xri: 6, pE: 50000, rwE: 20, km: 30000, oE: .04, vE: 1200, wE: 600 };
  const ctx = { v: k => values[k], ck: k => new Set(['loE', 'lvE', 'lwE']).has(k), Math };
  vm.createContext(ctx);
  vm.runInContext('const LEASE_OPSLAG=.07;\n' + fn, ctx);
  const i = 6 / 1200, N = 60, fin = (50000 - 10000 / Math.pow(1 + i, N)) * i / (1 - Math.pow(1 + i, -N));
  const expected = fin * 1.07 + 30000 * .04 / 12 + 1200 / 12 + 600 / 12;
  assert.ok(Math.abs(ctx.leaseEst('E', {}, 0) - expected) < 1, `got ${ctx.leaseEst('E', {}, 0)}, want ${expected}`);
});

test('kentekenlookup schat wegenbelasting uit RDW-gewicht per voertuigsoort', () => {
  const blok = SOURCE.slice(SOURCE.indexOf('const MRB='), SOURCE.indexOf('/* Waardeverloop'));
  const ctx = {};
  vm.createContext(ctx);
  const mrbJaar = vm.runInContext(blok + '\nmrbJaar;', ctx);
  ctx.mrbJaar = mrbJaar;
  assert.equal(ctx.mrbJaar('bestel', 1850, 2800, false), 475); // ledig gewicht telt, grijs kenteken
  assert.equal(ctx.mrbJaar('bestel', 1850, 2800, true), 330);
  assert.equal(ctx.mrbJaar('bestel', 0, 2800, false), 0); // geen ledig gewicht: niet overschrijven
  assert.equal(ctx.mrbJaar('bakwagen', 0, 16000, false), 800);
  assert.equal(ctx.mrbJaar('trekker', 0, 40000, false), 1100);
  assert.equal(ctx.mrbJaar('trekker', 0, 40000, true), 1000);
  assert.equal(ctx.mrbJaar('bus', 0, 19000, false), 1200);
  assert.match(SOURCE, /mrbJaar\(i\.vt,i\.ledig,i\.mass,false\)/);
  assert.match(SOURCE, /mrbJaar\(i\.vt,i\.ledig,i\.mass,true\)/);
  assert.match(SOURCE, /ledig:num\(r\.massa_ledig_voertuig\)/);
});

test('elektrische modellen nemen hun wegenbelasting uit de database mee', () => {
  assert.match(SOURCE, /r\.roadtax_annual_eur != null\) m\.bel = parseFloat\(r\.roadtax_annual_eur\)/);
  assert.match(SOURCE, /if\(m\.bel\)setNum\(\$\('wE'\),m\.bel\)/);
});

test('wegenbelasting staat in velden, voorbeeldwaarden, stappen en terugverdientijd', () => {
  assert.match(SOURCE, /\['wD','Wegenbelasting'/);
  assert.match(SOURCE, /\['wE','Wegenbelasting'/);
  for (const type of ['trekker', 'bakwagen', 'bestel', 'bus']) assert.match(SOURCE, new RegExp(`${type}:\\{[^}]*wD:`), type);
  assert.match(SOURCE, /slider\('wD'\)/);
  assert.match(SOURCE, /slider\('wE'\)/);
  assert.match(SOURCE, /\['bel','Wegenbelasting'\]/);
  assert.match(SOURCE, /o\.ver\+o\.bel\+o\.hef/);
  assert.match(SOURCE, /id="lw\$\{s\}" checked>Wegenbelasting/);
  assert.match(SOURCE, /id="lcW" checked>Wegenbelasting/);
});
