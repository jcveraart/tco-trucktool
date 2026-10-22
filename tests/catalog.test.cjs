const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const fields = script.slice(script.indexOf('const FIELDS='), script.indexOf('const TOLC='));
const formatters = script.slice(script.indexOf('const $=id=>'), script.indexOf('const reduced='));
const records = script.slice(script.indexOf('const MODELS=['), script.indexOf('let mCat='));
const functions = script.slice(script.indexOf('const mU='), script.indexOf('const mStat='));
const catalog = vm.runInNewContext(`${fields}\nconst F={};FIELDS.forEach(f=>F[f[0]]=f);\n${formatters}\n${records}\n${functions}\n({MODELS,F,mU,mAcc,mEnergy,mCapText,mAssumption,mRange})`);
const { MODELS, F, mU, mAcc, mEnergy, mCapText, mAssumption, mRange } = catalog;

test('the complete single-file application has valid JavaScript', () => {
  assert.doesNotThrow(() => new vm.Script(script));
  assert.equal((html.match(/<script>/g) || []).length, 1);
});

test('coverage and normalized model identifiers remain usable', () => {
  const counts = MODELS.reduce((out, m) => (out[m.c] = (out[m.c] || 0) + 1, out), {});
  assert.ok(MODELS.length >= 60);
  assert.ok(counts.bestel >= 30 && counts.bakwagen >= 12 && counts.trekker >= 10 && counts.bus >= 10);
  assert.equal(new Set(MODELS.map(m => m.id)).size, MODELS.length);
  MODELS.forEach(m => assert.match(m.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/));
  assert.ok(MODELS.some(m => m.id === 'citroen-e-berlingo-van'));
  assert.ok(MODELS.some(m => m.id === 'fiat-e-doblo'));
});

test('every model has a coherent capacity, range, status and source', () => {
  for (const m of MODELS) {
    assert.ok(['trekker', 'bakwagen', 'bestel', 'bus'].includes(m.c), m.id);
    assert.ok(m.b && m.m && m.n, m.id);
    assert.ok(Number.isFinite(m.r) && m.r > 0, m.id);
    assert.ok([m.u, m.ue, m.g, m.a].some(n => Number.isFinite(n) && n > 0), m.id);
    if (m.u && m.g) assert.ok(m.u <= m.g, m.id);
    if (m.a) assert.ok(!m.g && !m.u && !m.ue, `${m.id}: ambiguous capacity must not be declared gross/net`);
    for (const field of ['dc','mcs','consumption','price']) {
      if (field in m) assert.ok(Number.isFinite(m[field]) && m[field] > 0, `${m.id}: ${field}`);
    }
    assert.ok(['nu','komt'].includes(m.st), m.id);
    if (m.st === 'komt') assert.ok(Number.isInteger(m.y) && m.y >= 2026, m.id);
    assert.ok(m.s[0] && new URL(m.s[1]).protocol === 'https:', m.id);
    if (m.c === 'bestel' && m.gvw) assert.ok(m.gvw <= 3500, `${m.id}: N1 preset`);
  }
});

test('all presets fit the actual calculator controls without losing small-van consumption', () => {
  for (const m of MODELS) {
    const energy = m.consumption || mAcc(m) / m.r * 100;
    assert.ok(energy >= F.le[2] && energy <= F.le[3], `${m.id}: consumption would be clamped`);
    assert.ok(Number.isFinite(mU(m)) && mU(m) > 0, m.id);
    assert.ok(mAcc(m) >= F.acc[2] && mAcc(m) <= F.acc[3], m.id);
    assert.ok(mEnergy(m) >= F.le[2] && mEnergy(m) <= F.le[3], m.id);
    if (m.price) {
      assert.ok(m.price >= F.pE[2] && m.price <= F.pE[3], m.id);
      assert.equal((m.price - F.pE[2]) % F.pE[4], 0, `${m.id}: price would be rounded by the input`);
    }
    if (m.pD) {
      assert.ok(m.pD >= F.pD[2] && m.pD <= F.pD[3] && m.pDm && m.pDs, `${m.id}: diesel twin needs price, name and source`);
    }
    if (m.ld) assert.ok(m.ld >= F.ld[2] && m.ld <= F.ld[3], m.id);
  }
  const townstar = MODELS.find(m => m.id === 'nissan-townstar-ev-van');
  assert.equal(mEnergy(townstar), 18.6); // official WLTP value, not derived from range
  const fiat = MODELS.find(m => m.id === 'fiat-e-ducato');
  assert.equal(mEnergy(fiat), 29.4);
  assert.equal(mAcc(fiat), 97.8);
  assert.equal(fiat.price, 53700);
  const fm = MODELS.find(m => m.id === 'volvo-fm-electric');
  assert.equal(mCapText(fm), '460'); // Never label the gross 360–540 range as usable.
});

test('uncertainty, cycles and future availability remain explicit', () => {
  const townstar = MODELS.find(m => m.id === 'nissan-townstar-ev-van');
  assert.match(mAssumption(townstar), /bruto\/netto onbekend/);
  const solaris = MODELS.find(m => m.id === 'solaris-urbino-12-electric-modulair');
  assert.equal(mCapText(solaris), '> 600');
  assert.match(mRange(solaris), /SORT 2/);
  const futureMAN = MODELS.find(m => m.id === 'man-etgx-nieuwe-generatie-2027');
  assert.equal(futureMAN.st, 'komt');
  assert.equal(futureMAN.y, 2027);
  const scania = MODELS.find(m => m.id === 'scania-r-serie-elektrisch');
  assert.equal(scania.u, 560);
  assert.equal(scania.r, 515); // Do not combine the extra-battery 720 km claim with this pack.
  const fuso = MODELS.find(m => m.id === 'fuso-ecanter-9c18e-l');
  assert.equal(fuso.vc, 'n2');
  assert.ok(fuso.gvw < 10000);
});
