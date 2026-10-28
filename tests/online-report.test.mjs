import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateReport, metrics, totalYear, fleetSlots } from '../rapport/report-core.mjs';
const fixture = JSON.parse(fs.readFileSync(new URL('../rapport/demo.json', import.meta.url), 'utf8'));
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
test('report entry point is isolated, unindexed and free of analytics', () => {
  const html = fs.readFileSync(new URL('../rapport/index.html', import.meta.url), 'utf8');
  assert.match(html, /noindex,nofollow,noarchive/);
  assert.match(html, /name="referrer" content="no-referrer"/);
  assert.match(html, /Content-Security-Policy/);
  assert.doesNotMatch(html, /googletagmanager|adsbygoogle|gtag\(/);
  assert.doesNotMatch(JSON.stringify(fixture), /sb_secret_|service_role|p_publisher_key|DO-NOT-SHARE/);
});
