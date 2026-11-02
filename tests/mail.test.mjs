import test from 'node:test';
import assert from 'node:assert/strict';
import { splitVariant, trackedUrl, unsubscribeUrl, renderText, buildEmail, LINKS, templateVariables, emailLabel } from '../scripts/mail/core.mjs';

const contact = { token: '123e4567-e89b-12d3-a456-426614174000', bedrijf: 'Jansen Transport', naam: 'Piet Jansen' };

test('A/B split is stable per recipient and roughly even', () => {
  assert.equal(splitVariant(contact.token), splitVariant(contact.token));
  let a = 0;
  for (let i = 0; i < 200; i++) if (splitVariant(`00000000-0000-4000-8000-${String(i).padStart(12, '0')}`) === 'a') a++;
  assert.ok(a > 70 && a < 130, `scheve verdeling: ${a}/200 in a`);
});

test('tracked urls only use known destinations and carry campaign, variant and token', () => {
  const u = trackedUrl({ token: contact.token, campagne: 'introductie', variant: 'a', link: 'calc' });
  assert.match(u, /^https:\/\/stekkerofdiesel\.nl\/m\/\?k=calc&c=introductie&v=a&t=123e4567-/);
  assert.throws(() => trackedUrl({ token: contact.token, campagne: 'x', variant: 'a', link: 'evil' }), /Onbekende linkbestemming/);
  for (const l of LINKS) assert.ok(trackedUrl({ token: contact.token, campagne: 'x', variant: 'b', link: l }).includes('k=' + l));
  assert.match(unsubscribeUrl({ token: contact.token, campagne: 'introductie' }), /afmelden\/\?t=123e4567-.*&c=introductie/);
});

test('email renders personalisation, tracked buttons and unsubscribe', () => {
  const mail = { subject: 'Voor {{bedrijf}}', heading: 'Hallo {{voornaam}}', paragraphs: ['Tekst voor {{naam}}.'], ctas: [{ link: 'vloot', label: 'Bekijk het advies' }] };
  const out = buildEmail({ campagne: 'introductie', variant: 'b', contact, mail });
  assert.equal(out.subject, 'Voor Jansen Transport');
  assert.match(out.html, /Hallo Piet/);
  assert.match(out.html, /stekkerofdiesel\.nl\/m\/\?k=vloot&c=introductie&v=b/);
  assert.match(out.html, /afmelden\/\?t=123e4567-/);
  assert.doesNotMatch(out.html, /\{\{/);
});

test('mailteksten zeggen bedrijfswagen, nooit bestelwagen', () => {
  const mail = { subject: 'Uw bestelwagen', heading: 'Bestelwagens vergelijken', paragraphs: ['Is een bestelwagen nog rendabel?'], ctas: [{ link: 'calc', label: 'Check je bestelwagens' }] };
  const out = buildEmail({ campagne: 'introductie', variant: 'a', contact, mail });
  assert.equal(out.subject, 'Uw bedrijfswagen');
  assert.match(out.html, /Bedrijfswagens vergelijken/);
  assert.match(out.html, /Is een bedrijfswagen nog rendabel\?/);
  assert.match(out.html, /Check je bedrijfswagens/);
  assert.doesNotMatch(out.subject + out.html, /[Bb]estelwagen/);
});

test('email also has a plain-text version with links and unsubscribe', () => {
  const mail = { subject: 'Hoi', heading: 'Kop', paragraphs: ['Alinea over je bestelwagen.'], ctas: [{ link: 'calc', label: 'Bereken het' }] };
  const out = buildEmail({ campagne: 'introductie', variant: 'a', contact, mail });
  assert.match(out.text, /Kop\n\nAlinea over je bedrijfswagen\./);
  assert.match(out.text, /Bereken het: https:\/\/stekkerofdiesel\.nl\/m\/\?k=calc/);
  assert.match(out.text, /Meld je hier af: https:\/\/stekkerofdiesel\.nl\/afmelden\/\?t=/);
  assert.doesNotMatch(out.text, /<[^>]+>|[Bb]estelwagen/);
});

test('email labels are specific: campagne-1 + a = 1a', () => {
  assert.equal(emailLabel('campagne-1', 'a'), '1a');
  assert.equal(emailLabel('campagne-1', 'b'), '1b');
  assert.equal(emailLabel('campagne-12', 'b'), '12b');
  assert.equal(emailLabel('introductie', 'a'), 'introductie-a');
  assert.equal(emailLabel('campagne-1', ''), '');
});

test('resend template variables are filled per customer, never bestelwagen', () => {
  const v = templateVariables({ ...contact, email: 'piet@jansen.nl', segment: 'bestel' }, 'campagne-1');
  assert.equal(v.NAAM, 'Piet');
  assert.equal(v.BEDRIJF, 'Jansen Transport');
  assert.equal(v.EMAIL, 'piet@jansen.nl');
  assert.equal(v.CAMPAGNE, 'campagne-1');
  assert.equal(v.TOKEN, contact.token);
  assert.equal(v.VOERTUIG, 'bedrijfswagen');
  assert.equal(templateVariables({ ...contact, segment: 'trekker' }, 'campagne-1').VOERTUIG, 'vrachtwagen');
  assert.equal(templateVariables({ token: contact.token, email: 'x@y.nl' }, 'campagne-1').NAAM, 'relatie');
});
