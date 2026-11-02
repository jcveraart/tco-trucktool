import { test } from 'node:test';
import assert from 'node:assert/strict';
import { practicalDay } from '../rapport/report-practical.mjs';
const report = { settings: { soc_min: .1 }, trips: [{ id: 'r', km: 100 }] };
const trip = (id, vehicle, kind = 'electric') => ({ rit_id: id, rit: id, voertuig_id: vehicle, voertuig: vehicle, aandrijving: kind });
const profile = (id, extras = {}) => ({ id, depot: [10, 0, 0, 0], thuis: [0, 0, 0, 0], onderweg: [0, 0, 0, 0], ritten_onderweg: [], ...extras });
const plan = day => ({ tijdas: [0, 420, 600, 1020, 1440], dagen: [day] });
test('whole vehicle day categories include growth and charter in the denominator', () => {
  const s = practicalDay(report, plan({ toewijzing: [trip('r', 'A'), trip('r~1', 'A'), trip('r', 'B'), trip('r', null, 'charter')],
    laadprofielen: [profile('A', { onderweg: [0, 20, 0, 0], ritten_onderweg: ['r'] }), profile('B')] }), 0);
  assert.equal(s.total, 4); assert.equal(s.electric, 3);
  assert.equal(s.counts.onderweg, 2); assert.equal(s.counts.nacht, 1); assert.equal(s.counts.charter, 1);
  assert.match(s.summaries[3][1], /300 van 400 km/);
  assert.ok(s.examples.some(x => x.includes('60 kWh')));
});
test('old reports retain EV totals without inventing charge detail', () => {
  const s = practicalDay(report, plan({ toewijzing: [trip('r', 'A')] }), 0);
  assert.equal(s.counts.onbekend, 1); assert.equal(s.counts.nacht, 0);
  assert.ok(s.notes.some(x => x.includes('Bereken opnieuw')));
});
test('day charging at a boundary and home take precedence over overnight depot', () => {
  const s = practicalDay(report, plan({ toewijzing: [trip('r', 'A'), trip('r', 'B')], laadprofielen: [
    profile('A', { depot: [10, 1, 0, 0] }), profile('B', { thuis: [0, 0, 2, 0] })] }), 0);
  assert.equal(s.counts.overdag, 1); assert.equal(s.counts.thuis, 1);
});
test('battery margin uses individual reserve and ignores unused vehicles', () => {
  const s = practicalDay(report, plan({ toewijzing: [trip('r', 'A')], accu: [
    { id: 'A', voertuig: 'A', capaciteit: 100, kwh: [80, 22, 30], reserve_pct: .2 },
    { id: 'idle', capaciteit: 100, kwh: [1] }], net: [10, 45], grens: 50 }), 0);
  assert.match(s.summaries[4][1], /22%/); assert.match(s.summaries[5][1], /2 procentpunt/);
  assert.match(s.summaries[6][1], /5 kW/);
  assert.ok(s.examples.some(x => x.includes('minder dan 5 procentpunt')));
});
test('empty or incomplete day never reports full coverage or invented kilometres', () => {
  const s = practicalDay(report, plan({}), 0);
  assert.equal(s.total, 0); assert.match(s.summaries[1][1], /—/);
  const missing = practicalDay(report, plan({ toewijzing: [trip('missing', 'A')] }), 0);
  assert.equal(missing.summaries[3][1], 'Onvoldoende afstandsgegevens');
});
