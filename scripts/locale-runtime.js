(()=>{
 const en=document.documentElement.lang==='en';
 const norm=s=>s.replace(/\u00ad/g,'').replace(/\s+/g,' ').trim();
 const keys=Object.keys(SOD_EN).sort((a,b)=>b.length-a.length),lower=new Map(keys.map(k=>[k.toLowerCase(),SOD_EN[k]]));
 const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const terms=new RegExp('(?<![\\p{L}])(?:'+keys.map(escape).join('|')+')(?![\\p{L}])','giu');
 const translate=s=>{
  if(!en||!s)return s;
  const n=norm(s);if(Object.hasOwn(SOD_EN,n))return s.replace(n,SOD_EN[n])===s?SOD_EN[n]:s.replace(n,SOD_EN[n]);
  const patterns=[
   [/^Past op een kleinverbruikaansluiting van (.+)\. Tel daar op wat je pand al gebruikt\. Moet je daarvoor verzwaren, dan komt ook die aanvraag in een congestiegebied op de wachtlijst\.$/,'Fits a small-business connection of $1. Add your building’s existing demand. If this requires an upgrade in a congested area, the application will join the waiting list.'],
   [/^Je hebt een grootverbruikaansluiting nodig, en in een congestiegebied kom je op de wachtlijst\.(.*)$/,'You need a large-business connection. In a congested area, you will join the waiting list.$1'],
   [/^Je dagrit past, met (.+) km over\.$/,'Your daily route fits, with $1 km to spare.'],
   [/^Je komt (.+) km tekort\. Laad onderweg zo'n (.+) kWh: ongeveer (.+) aan een snellader van 350 kW\.$/,'You are $1 km short. Add about $2 kWh en route: roughly $3 at a 350 kW fast charger.'],
   [/^Met slim laden rekenen we met (.+) per kWh minder: het verschil tussen de goedkope uren en het daggemiddelde op de stroombeurs\.$/,'Smart charging assumes $1 less per kWh: the difference between low-price hours and the daily wholesale average.'],
   [/^Over (.+) jaar betaal je (.+) rente(.*)\. Exclusief btw, onderhoud en verzekering\.$/,'Over $1 years you pay $2 in interest$3. Excludes VAT, maintenance and insurance.'],
   [/^Ongeveer (.+) volledige laadbeurten per jaar\. Een indicatie: chemie, temperatuur en software maken veel verschil\.$/,'About $1 full charge cycles per year. Indicative only: battery chemistry, temperature and software make a significant difference.'],
   [/^capaciteit na (.+) jaar · actieradius ± (.+) km in plaats van (.+) km$/,'capacity after $1 years · range about $2 km instead of $3 km'],
   [/^Met de diesel uit de check hieronder mag je er tot 1 januari (\d+) in\.$/,'The diesel checked below can enter until 1 January $1.'],
   [/^Voor een DC-laadpunt van 50 kW dat (.+) kost: een vast bedrag van (.+), maar maximaal (\d+)% van de kosten\.$/,'For a 50 kW DC charger costing $1: a fixed grant of $2, capped at $3% of costs.'],
   [/^Bij (.+) km per jaar en (.+) per geladen kWh op eigen terrein\.$/,'Based on $1 km a year and $2 per kWh charged at your depot.'],
   [/^Elektrisch is goedkoper vanaf dit aantal kilometers\. Nu rekent de calculator met (.+)\.$/,'Electric is cheaper above this annual mileage. Your current input is $1.'],
   [/^Elektrisch is goedkoper vanaf deze dieselprijs\. Nu rekent de calculator met (.+)\.$/,'Electric is cheaper above this diesel price. Your current input is $1.'],
   [/^Elektrisch is goedkoper tot deze stroomprijs\. Nu rekent de calculator met (.+)\.$/,'Electric is cheaper below this electricity price. Your current input is $1.'],
   [/^Elektrisch is goedkoper, ook als diesel gratis zou zijn\. Nu rekent de calculator met (.+)\.$/,'Electric is cheaper even with free diesel. Your current input is $1.'],
   [/^Elektrisch is niet goedkoper, zelfs niet bij gratis eigen stroom\. Nu (.+)\.$/,'Electric is not cheaper even with free depot electricity. Your current input is $1.'],
   [/^Elektrisch is bij elke afstand goedkoper\. Nu rekent de calculator met (.+)\.$/,'Electric is cheaper at any mileage. Your current input is $1.'],
   [/^Pas na de afschrijftermijn van (.+) jaar\.$/,'After your depreciation period of $1 years.'],
   [/^We vragen offertes op voor de (.+) en nemen contact met je op\.$/,'We will request quotes for the $1 and get in touch.'],
   [/^Het voorbeeld is de gemiddelde pompprijs van diesel volgens het CBS op (.+), zonder btw\.$/,'The example uses the Dutch CBS average diesel pump price on $1, excluding VAT.']
  ];
  for(const [re,t] of patterns)if(re.test(n))return n.replace(re,t).replace(/ Met (\d+) uur laden past het wel op 3×80 A\./,' Charging for $1 hours would fit within 3×80 A.').replace(/ Of een batterij van ongeveer (.+) kWh vangt de piek op\./,' Alternatively, a battery of about $1 kWh could cover the peak.').replace(/, en aan het eind (.+) slottermijn/,', plus a $1 final payment');
  const contextual={niet:'not',eigen:'own',nu:'now',van:'of'};
  let out=s.replace(/\u00ad/g,'').replace(/^tot (?=\d)/,'up to ').replace(terms,k=>contextual[k.toLowerCase()]??SOD_EN[k]??lower.get(k.toLowerCase()));
  out=out.replace(/STEP (\d+) (?:VAN|of|OF) (\d+)/gi,'Step $1 of $2')
   .replace(/(\d+) van (\d+) (?:gedaan|completed)/g,'$1 of $2 completed')
   .replace(/\b(?:In|in) (\d+) (?:jaar|years)\b/g,'over $1 years')
   .replace(/\bBij (?=[€\d])/g,'At ').replace(/\bwaarvan /g,'including ')
   .replace(/Tot 1 (?:januari|January) /g,'Until 1 January ')
   .replace(/\bna (\d+) (?:jaar|years)\b/g,'after $1 years')
   .replace(/\bPer rit van /g,'Per trip of ').replace(/\bWaarde na /g,'Value after ')
   .replace(/\buur aan een (.+) kW-lader/g,'hours at a $1 kW charger')
   .replace(/\bhours aan een (.+) kW-lader/g,'hours at a $1 kW charger')
   .replace(/Elektrisch is/g,'Electric is').replace(/Electric is/g,'Electric is')
   .replace(/(\d+) modellen gekozen/g,'$1 models selected').replace(/(\d+) modellen/g,'$1 models')
   .replace(/(\d+) model gekozen/g,'$1 model selected')
   .replace(/Vanafprijs voor/g,'Starting price for').replace(/Nederlandse catalogusprijs/g,'Dutch list price')
   .replace(/eventuele afleveringskosten/g,'any delivery costs').replace(/geen tijdelijke korting of subsidie afgetrokken/g,'no temporary discount or grant deducted')
   .replace(/Prijslijst:/g,'Price list:').replace(/Gecontroleerd op/g,'Checked on')
   .replace(/actuele online prijslijst/g,'current online price list').replace(/fabrikantbericht/g,'manufacturer announcement');
  return out;
 };
 window.sodText=translate;
 const seen=new WeakMap(),attrs=new WeakMap();
 const skip=e=>!e||e.closest('script,style,textarea,pre,code,[data-no-translate],.mbrand,.mcn,#mpN,.mpo b');
 const text=n=>{if(skip(n.parentElement)||seen.get(n)===n.data)return;const t=translate(n.data);if(t!==n.data)n.data=t;seen.set(n,n.data)};
 const attributes=e=>{if(skip(e))return;let prev=attrs.get(e)||{};const names=['aria-label','title','placeholder','data-tt','alt'];if(e.matches('meta[name=description],meta[property="og:title"],meta[property="og:description"]'))names.push('content');for(const a of names){const v=e.getAttribute(a);if(v&&prev[a]!==v){const t=translate(v);if(t!==v)e.setAttribute(a,t);prev[a]=t}}attrs.set(e,prev)};
 const visit=root=>{if(root.nodeType===3){text(root);return}if(root.nodeType!==1||skip(root))return;attributes(root);const w=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(n.nodeType===3)text(n);else attributes(n)}};
 if(en){
  visit(document.body);visit(document.querySelector('title'));document.querySelectorAll('meta').forEach(attributes);
  const observer=new MutationObserver(records=>{observer.disconnect();for(const r of records){if(r.type==='characterData')text(r.target);else if(r.type==='attributes')attributes(r.target);else r.addedNodes.forEach(visit)}observe()});
  const observe=()=>observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder','data-tt','alt','content']});observe();
 }
 document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===document.documentElement.lang)));
 document.addEventListener('click',e=>{const b=e.target.closest('[data-lang]');if(!b||b.dataset.lang===document.documentElement.lang)return;
  try{localStorage.setItem('sod-language',b.dataset.lang)}catch(err){}
  const url=new URL(shareURL());url.searchParams.set('lang',b.dataset.lang);url.hash=location.hash;
  if($('wz').open)url.searchParams.set('step',wzStep);
  location.assign(url.href);
 });
 if(window.SOD_STEP&&steps().some(s=>s[0]===window.SOD_STEP))openWz(window.SOD_STEP);
})();
