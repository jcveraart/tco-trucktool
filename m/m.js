// Klik uit een e-mail: log in Supabase (email_kliks) en stuur direct door.
// Alleen vaste bestemmingen (k), zodat dit nooit een open redirect is.
(function () {
  var DOEL = {
    calc: '/',
    uitgebreid: '/uitgebreid/',
    vloot: '/vlootanalyse/',
    gids: '/overstapgids/',
    heffing: '/overstapgids/heffing/',
    subsidie: '/overstapgids/subsidies/',
    ze: '/overstapgids/zero-emissiezones/',
    modellen: '/modellen/',
    kenteken: '/'
  };
  var SB = 'https://zarvyblveyomngypwvhw.supabase.co';
  var KEY = 'sb_publishable_srfj19l9xWDSkdirFz6RtQ_RperxnNH';
  var q = new URLSearchParams(location.search);
  var k = (q.get('k') || 'calc').toLowerCase();
  if (!DOEL[k]) k = 'calc';
  var c = q.get('c'), v = q.get('v'), t = q.get('t');
  var uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  var safe = function (s, n) { return s && new RegExp('^[a-z0-9-]{1,' + n + '}$').test(s) ? s : null; };
  c = safe(c, 30); v = safe(v, 20); t = t && uuid.test(t) ? t.toLowerCase() : null;

  var doel = DOEL[k];
  var p = new URLSearchParams();
  p.set('utm_source', 'email'); p.set('utm_medium', 'email');
  if (c) p.set('utm_campaign', c);
  if (v) p.set('utm_content', v + '-' + k);
  var naar = doel + (doel.indexOf('?') < 0 ? '?' : '&') + p.toString();

  var ua = navigator.userAgent || '';
  var bot = !!navigator.webdriver || /bot|crawl|spider|headless|preview|scan|safelinks|barracuda|proofpoint|mimecast|python|curl|wget/i.test(ua);
  var klaar = false;
  var ga = function () { if (!klaar) { klaar = true; location.replace(naar); } };
  document.addEventListener('DOMContentLoaded', function () { var a = document.getElementById('door'); if (a) a.href = naar; });
  try {
    fetch(SB + '/rest/v1/rpc/email_klik', {
      method: 'POST', keepalive: true,
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ t: t, c: c, v: v, k: k, ua: ua.slice(0, 300), bot: bot })
    }).then(ga, ga);
  } catch (e) { ga(); }
  setTimeout(ga, 900);
})();
