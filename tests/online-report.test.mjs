import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateReport, metrics, totalYear, fleetSlots, batteryAging, chargingSummary } from '../rapport/report-core.mjs';
import { scenarioCatalogue, fleetLifecycle } from '../rapport/report-planning.mjs';
const fixture = JSON.parse(fs.readFileSync(new URL('../rapport/demo.json', import.meta.url), 'utf8'));

test('published demo has all eight scenario subjects and explicit vehicle sales', () => {
  const checks = scenarioCatalogue(fixture);
  assert.equal(checks.length, 16);
  assert.equal(new Set(checks.map(x => x.axis)).size, 8);
  assert.ok(checks.every(c => c.explorable));
  assert.ok(fleetLifecycle(fixture, fixture.variants[0]).some(r => r.events.some(e => e.kind === 'exit' && e.period === 0)));
});
test('the public demo is explicitly fictional and every plan reconciles', () => {
  validateReport(fixture);
  assert.equal(fixture.demo, true);
  assert.match(fixture.client.name, /voorbeeld/);
  assert.ok(fixture.variants.length >= 2);
  for (const variant of fixture.variants) {
    assert.ok(Math.abs(variant.kosten.reduce((s, x) => s + x.ncw, 0) - variant.ncw) < 1);
    for (let p = 0; p < variant.jaren.length; p++) {
      const active = fleetSlots(variant).flatMap(slot => slot.filter(x => x.actief[p]));
      assert.equal(active.length, variant.aantallen[p].diesel + variant.aantallen[p].elektrisch);
    }
    assert.equal(variant.per_jaar.length, fixture.settings.jaren);
    assert.ok(variant.per_jaar.every(x => Number.isFinite(totalYear(x))));
  }
  const m = metrics(fixture, fixture.variants[0]);
  assert.ok(m.ref && m.saving > 0);
});
test('battery aging shows shrinking range and charging summary totals the installed infrastructure', () => {
  const plan = fixture.variants[0];
  const rows = batteryAging(fixture, plan);
  assert.ok(rows.length >= 1);
  for (const r of rows) {
    assert.ok(r.rangeNew > 0 && r.years[0].range === r.rangeNew);
    assert.ok(r.years.at(-1).soh < 1 && r.years.at(-1).range < r.rangeNew, 'range krimpt over de looptijd');
    assert.ok(Math.abs(r.years[1].soh - Math.pow(1 - fixture.settings.accu_veroudering, 1)) < 1e-9);
    assert.ok(r.longestTrip > 0);
  }
  const infra = chargingSummary(fixture, plan);
  assert.ok(infra.pointsEnd >= 1 && infra.installedKw > 0 && infra.connectionEnd === plan.net_kw.at(-1));
});
test('report entry point is isolated, unindexed and free of analytics', () => {
  const html = fs.readFileSync(new URL('../rapport/index.html', import.meta.url), 'utf8');
  assert.match(html, /noindex,nofollow,noarchive/);
  assert.match(html, /name="referrer" content="no-referrer"/);
  assert.match(html, /Content-Security-Policy/);
  assert.doesNotMatch(html, /googletagmanager|adsbygoogle|gtag\(/);
  assert.doesNotMatch(JSON.stringify(fixture), /sb_secret_|service_role|p_publisher_key|DO-NOT-SHARE/);
});
