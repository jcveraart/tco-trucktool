// Afmelden met de token uit de mail (?t=) of met een e-mailadres. Schrijft via email_afmelden in Supabase.
(function () {
  var SB = 'https://zarvyblveyomngypwvhw.supabase.co';
  var KEY = 'sb_publishable_srfj19l9xWDSkdirFz6RtQ_RperxnNH';
  var q = new URLSearchParams(location.search);
  var t = q.get('t'), c = q.get('c');
  if (!(t && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t))) t = null;
  if (!(c && /^[a-z0-9-]{1,30}$/.test(c))) c = null;
  var $ = function (id) { return document.getElementById(id); };
  if (t) { $('adresveld').hidden = true; }
  $('f').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var e = t ? null : ($('e').value || '').trim();
    if (!t && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { $('e').focus(); return; }
    $('knop').disabled = true; $('fout').classList.remove('zie');
    fetch(SB + '/rest/v1/rpc/email_afmelden', {
      method: 'POST',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ t: t, e: e, c: c })
    }).then(function (r) { return r.ok ? r.json() : false; })
      .then(function (ok) {
        if (ok === true) { $('app').classList.add('klaar'); }
        else { $('fout').classList.add('zie'); $('knop').disabled = false; }
      }, function () { $('fout').classList.add('zie'); $('knop').disabled = false; });
  });
})();
