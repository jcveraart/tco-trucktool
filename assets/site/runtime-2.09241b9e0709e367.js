if(document.documentElement.dataset.staticLang==='en'){window.SOD_STATIC_TEXT=new WeakMap();window.SOD_STATIC_ATTR=new WeakMap();const w=document.createTreeWalker(document.documentElement,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(n.nodeType===3)window.SOD_STATIC_TEXT.set(n,n.data);else{const v={};for(const a of ['aria-label','title','placeholder','data-tt','alt','content'])if(n.hasAttribute(a))v[a]=n.getAttribute(a);window.SOD_STATIC_ATTR.set(n,v)}}}

const BRAND='Stekker of Diesel';
/* Widget: ?embed=1 toont alleen de calculator, voor op andere sites */
const EMBED=new URLSearchParams(location.search).has('embed');if(EMBED)document.documentElement.classList.add('embed');
/* Alle invoer als schuif met typbare waarde: [id, label, min, max, stap, eenheid, standaard] */
const FIELDS=[
 ['km','Kilometers per jaar',5000,250000,1000,'km',100000],['kmH','Waarvan met heffing of tol',0,250000,1000,'km',75000],['wd','Rijdagen per jaar',100,365,5,'dagen',250],
 ['jr','Afschrijftermijn',3,12,1,'jaar',6],['rw','Restwaarde',0,70,1,'%',20],['rwE','Restwaarde',0,60,1,'%',20],['eag','Leeftijd',1,12,1,'jaar',3],['dag','Leeftijd',1,20,1,'jaar',6],
 ['pD','Aanschafprijs',1000,400000,100,'€',130000],['pE','Aanschafprijs',20000,1000000,1,'€',285000],['subX','Subsidiebedrag',0,200000,500,'€',0],
 ['ld','Verbruik',5,60,0.1,'l/100 km',30],['dp','Dieselprijs excl. btw',1,3,0.01,'€/L',2],
 ['le','Verbruik',5,200,0.1,'kWh/100 km',115],['sp','Stroomprijs eigen terrein',0.05,0.8,0.01,'€/kWh',0.25],['acc','Bruikbare accu',30,900,0.1,'kWh',540],['ere','ERE-opbrengst',0,0.3,0.01,'€/kWh',0.1],
 ['oD','Onderhoud',0,0.5,0.01,'€/km',0.12],['oE','Onderhoud',0,0.5,0.01,'€/km',0.08],['vD','Verzekering',0,25000,100,'€/jaar',7000],['vE','Verzekering',0,25000,100,'€/jaar',9500],
 ['tD','Tarief',0,0.4,0.001,'€/km',0.201],['tE','Tarief',0,0.4,0.001,'€/km',0.038],
 ['lpD','Leaseprijs',100,20000,10,'€/maand',900],['lpE','Leaseprijs',100,20000,10,'€/maand',1100],['lpC','Leaseprijs',100,20000,10,'€/maand',900],['lrC','Resterende looptijd',0,120,1,'maanden',36],['lkD','Contractkilometers',1000,250000,1000,'km per jaar',30000],['lkE','Contractkilometers',1000,250000,1000,'km per jaar',30000],['lmD','Meerkilometerprijs',0,0.5,0.01,'€/km',0.07],['lmE','Meerkilometerprijs',0,0.5,0.01,'€/km',0.07],
 ['xfs','Gefinancierd deel',0,100,5,'%',80],['xri','Rente lening',0,12,0.1,'%',6],['xre','Rendement eigen geld',0,12,0.1,'%',4],
 ['xl0','Investering laadpaal',0,100000,100,'€',15200],['xla','Netaansluiting en voorbereiding',0,100000,500,'€',5000],['xlo','Onderhoud en beheer',0,5000,50,'€/jaar',400],['xln','Vaste netkosten',0,10000,50,'€/jaar',600],
 ['xos','Aandeel onderweg geladen',0,80,5,'%',20],['xop','Prijs openbaar laden',0.2,1.2,0.01,'€/kWh',0.55],['xot','Tijdverlies per 100 km',0,30,1,'min',6],['xoh','Kosten stilstand',0,200,5,'€/uur',60],
 ['xzk','Vermogen zonnepanelen',5,1000,5,'kWp',100],['xzs','Deel voor je voertuigen',0,100,5,'%',40]];
const TOLC={vl:'B',wa:'B',fr:'F',de:'D',it:'I',pl:'PL',at:'A'},tolSel=new Set();
const TOL=[['vl','Vlaanderen',0.038,0.286,'Diesel: Euro VI boven 32 ton, met CO₂-toeslag sinds 1 juli 2026. Het tarief voor elektrisch is een schatting'],['wa','Wallonië',0.205,0.205,'Elektrisch betaalt hetzelfde als Euro VI. Indicatief tarief'],['fr','Frankrijk',0.30,0.30,'Tolwegen in concessie, gemiddeld tarief'],['de','Duitsland',0,0.348,'Vrijstelling voor elektrisch loopt tot 1 juli 2031'],['it','Italië',0.20,0.20,'Tolwegen in concessie, gemiddeld tarief'],['pl','Polen',0.13,0.13,'Gemiddeld tarief'],['at','Oostenrijk',0.119,0.572,'Tarieven 2026, 4 of meer assen']];
const F={};FIELDS.forEach(f=>F[f[0]]=f);TOL.forEach(c=>F['k_'+c[0]]=['k_'+c[0],'Kilometers per jaar in '+c[1],0,250000,1000,'km',0]);
/* Voertuigen met indicatieve voorbeeldcijfers. Kilometerheffing en AanZET gelden alleen voor vrachtwagens.
   Restwaarde: standaard 20% voor diesel en elektrisch, nieuw en gebruikt. Zo bedacht: eerst stond nieuw op 10% en volgde gebruikt de
   waardecurve (vaak 30 tot 40%). Dan vergelijk je een gebruikte elektrische met een hoge restwaarde met een nieuwe diesel met een lage,
   en dat scheelt al snel duizenden euro's per jaar. Eén vast percentage voor beide kanten is eerlijk en makkelijk na te rekenen;
   20% ligt tussen de voorzichtige 10% en de optimistische curve. Je past het zelf aan met je eigen inschatting of offerte. */
const VT={
 trekker:{n:'Trekker',w:'trekker',sub:'N3 · met oplegger',truck:1,reg:'az',q:[60000,80000,100000,120000,150000],
  p:{km:100000,kmH:75000,wd:250,jr:6,rw:20,rwE:20,pD:130000,pE:285000,dp:2,sp:.25,ld:30,le:115,acc:540,ere:.1,vD:7000,vE:9500,oD:.12,oE:.08,tD:.201,tE:.038,lmD:.05,lmE:.05}},
 bakwagen:{n:'Bakwagen',w:'bakwagen',sub:'N2 of N3 · distributie',truck:1,reg:'az',q:[30000,40000,50000,60000,80000],
  p:{km:50000,kmH:40000,wd:250,jr:7,rw:20,rwE:20,pD:95000,pE:240000,dp:2,sp:.25,ld:25,le:100,acc:300,ere:.1,vD:4500,vE:6500,oD:.10,oE:.06,tD:.182,tE:.037,lmD:.05,lmE:.05}},
 bestel:{n:'Bestelbus',w:'bestelbus',sub:'N1 · tot 3.500 kg',truck:0,reg:'geen',q:[15000,20000,30000,40000,50000],
  p:{km:30000,kmH:0,wd:230,jr:5,rw:20,rwE:20,pD:45000,pE:60000,dp:2,sp:.25,ld:9,le:25,acc:70,ere:.1,vD:2000,vE:2500,oD:.06,oE:.04,tD:0,tE:0,lmD:.07,lmE:.07}},
 bus:{n:'Bus',w:'bus',sub:'M3 · streek of touring',truck:0,reg:'geen',q:[40000,60000,70000,90000,120000],
  p:{km:70000,kmH:0,wd:300,jr:10,rw:20,rwE:20,pD:280000,pE:520000,dp:2,sp:.25,ld:32,le:120,acc:450,ere:.1,vD:8000,vE:10000,oD:.20,oE:.14,tD:0,tE:0,lmD:.06,lmE:.06}}};
const VICON={
 trekker:'<svg viewBox="0 0 64 28" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M2 4h35v13H2z"/><path d="M33 19.5h10"/><path d="M42 21V7a2 2 0 0 1 2-2h7l5 7.5h2.5a1.5 1.5 0 0 1 1.5 1.5V21z"/><path d="M45 12.5h7"/><circle cx="9" cy="22" r="3" fill="var(--card)"/><circle cx="16" cy="22" r="3" fill="var(--card)"/><circle cx="38" cy="22" r="3" fill="var(--card)"/><circle cx="53" cy="22" r="3" fill="var(--card)"/></svg>',
 bakwagen:'<svg viewBox="0 0 64 28" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h36v17H4z"/><path d="M40 9h10l6 7v5H40"/><circle cx="13" cy="22" r="3" fill="var(--card)"/><circle cx="48" cy="22" r="3" fill="var(--card)"/></svg>',
 bestel:'<svg viewBox="0 0 64 28" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M8 21V9a3 3 0 0 1 3-3h26l10 8h6a3 3 0 0 1 3 3v4z"/><circle cx="18" cy="22" r="3" fill="var(--card)"/><circle cx="47" cy="22" r="3" fill="var(--card)"/></svg>',
 bus:'<svg viewBox="0 0 64 28" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M3 5h54a3 3 0 0 1 3 3v13H3z"/><path d="M3 12h57"/><circle cx="13" cy="22" r="3" fill="var(--card)"/><circle cx="49" cy="22" r="3" fill="var(--card)"/></svg>'};
/* AanZET 2026: [naam, percentage, maximum] per bedrijfsgrootte (0 groot, 1 middelgroot, 2 klein) */
const AZT={N3:[['Groot',.111,43900],['Middelgroot',.21,83200],['Klein of non-profit',.29,115200]],N2:[['Groot',.061,15200],['Middelgroot',.12,29900],['Klein of non-profit',.148,36900]]};
const SZD=[['Groot','≥ 250','> € 50 miljoen','of'],['Middelgroot','< 250','< € 50 miljoen','en'],['Klein of non-profit','< 50','< € 10 miljoen','en']];
/* Live cijfers uit Supabase (tabel live_prices); zonder verbinding gelden deze terugvallers */
const LIVE={slim:.03};
const spNet=g=>g('sp')-(ck('aSlim')?LIVE.slim:0);
/* Zonnepanelen: gemiddelde opbrengst in Nederland per kWp per jaar (PVGIS) en kostprijs van eigen zonnestroom */
const ZON_KWH=900,ZON_PRIJS=.06;
/* CO₂ van bron tot wiel (CO2emissiefactoren.nl 2026): diesel B7 per liter, grijze stroom per kWh */
const CO2D=3.27,CO2E=.48;
/* SPRILA 2026: vast bedrag voor een DC-laadpunt van 50 kW (mkb, groot), begrensd op 40% of 20% van de kosten, minimaal € 2.500 */
const sprila=(inv,big)=>Math.min(big?4880:9760,inv*(big?.2:.4));
let kmShare=null,kmScale=false;/* aandeel kilometers met heffing blijft gelijk als je de kilometers per jaar verandert */
document.addEventListener('input',e=>{if(e.target.id!=='km'||kmShare===null)return;const k=$('kmH');k.max=v('km');k.value=Math.round(kmShare*v('km')/1000)*1000;kmScale=true},true);
document.addEventListener('input',e=>{const id=e.target.id;if(!id)return;
 if(id==='rw'&&$('nw').value!=='g'&&$('dw').value!=='h'){const w=$('rwE');if(+w.value===+e.target.dataset.prev)setNum(w,+e.target.value)}
 if((id==='eag'||id==='jr'||id==='km'||id==='le'||id==='pE')&&$('nw').value==='g')usedAuto(false);
 if((id==='dag'||id==='jr'||id==='pD')&&$('dw').value==='h')dieselAuto(false)},true);
let autoPD=null,autoOD=null,autoVD=null;/* automatisch ingevulde waarden voor de huidige diesel */
let unit='km',touched=false,view='b',page=null,vtype='trekker',wzStep='use';
const $=id=>document.getElementById(id),NFC={},nf=(n,d=0)=>{const l=document.documentElement.lang==='en'?'en-GB':'nl-NL',k=l+d;return(NFC[k]||(NFC[k]=new Intl.NumberFormat(l,{minimumFractionDigits:d,maximumFractionDigits:d}))).format(n)},eur=(n,d=0)=>(n<0?'-':'')+'€ '+nf(Math.abs(n),d);
const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
/* Alleen opnieuw tekenen wat echt verandert, zodat een klik op een onderdeel niet verloren gaat */
const setH=(el,h)=>{if(el._h!==h){el._h=h;el.innerHTML=h}};
const T=()=>VT[vtype],reg=()=>$('reg').value,clsOf=()=>vtype==='bakwagen'?$('cls').value:'N3',azRow=()=>AZT[clsOf()][Math.round(v('gr'))]||AZT.N3[1];
const miaCalc=pE=>{const grond=pE*0.9,aftrek=grond*0.36,rate=reg()==='mia2'?0.258:0.19;return{grond,aftrek,rate,voordeel:aftrek*rate}};
/* Operational lease: één prijs per maand in plaats van aanschaf, restwaarde, subsidie en rente. s is 'D' of 'E'.
   Zonder eigen offerte schatten we de leaseprijs uit de aanschaf: afschrijven tot de restwaarde en rente over het uitstaande bedrag,
   plus onderhoud en verzekering als die erin zitten, plus 7% voor beheer, risico en marge. Een subsidie vraagt de leasemaatschappij aan. */
const LEASE_OPSLAG=.07;
const lsOn=s=>$('ls'+s).value==='1',lqOn=s=>$('lq'+s).value==='1';
function leaseEst(s,o={},sub=0){
 const g=k=>k in o?o[k]:v(k),on=k=>k in o?!!o[k]:ck(k);
 const L=Math.max(1,Math.round(g('jr'))),N=L*12,i=g('xri')/1200,p=g('p'+s),P=p-(s==='E'?sub:0),rv=p*g(s==='D'?'rw':'rwE')/100;
 const fin=i?(P-rv/Math.pow(1+i,N))*i/(1-Math.pow(1+i,-N)):(P-rv)/N;
 const ond=on('lo'+s)?Math.max(1,g('km'))*g('o'+s)/12:0,ver=on('lv'+s)?g('v'+s)/12:0;
 return Math.max(0,(fin+ond+ver)*(1+LEASE_OPSLAG));
}
/* Leasekosten per jaar. Met een offerte geldt het contract: meer kilometers kosten de meerkilometerprijs, minder krijg je voor de helft terug */
function leaseYear(s,o={},sub=0){
 const g=k=>k in o?o[k]:v(k);
 if(!g('lq'+s))return 12*('lp'+s in o?o['lp'+s]:Math.round(leaseEst(s,o,sub)/10)*10);
 const dk=g('km')-g('lk'+s),m=g('lm'+s);return 12*g('lp'+s)+(dk>0?dk*m:dk*m/2);
}
/* Rente over het geleende deel en een rendementseis op het eigen geld, per jaar.
   Een subsidie (AanZET, MIA of eigen bedrag) verlaagt wat je moet financieren; de restwaarde blijft een deel van de volle prijs.
   Zo bedacht: eerst financierden we de volle prijs. Maar de subsidie komt binnen en lost dat deel af, dus je hoeft het niet blijvend
   te lenen of met eigen geld vast te zetten. Het eigen geld zit gemiddeld half aan het begin (prijs na subsidie) en half aan het
   eind (de restwaarde) vast, daarom het gemiddelde van die twee. De restwaarde is de marktwaarde en hangt niet af van subsidie. */
function finY(p,w,o={},sub=0){
 const g=k=>k in o?o[k]:v(k),L=Math.max(1,Math.round(g('jr'))),sh=g('xfs')/100,r=g('xri')/100,re=g('xre')/100,N=Math.max(0,p-sub),P=N*sh;
 const rente=P<=0||r===0?0:(P*r/(1-Math.pow(1+r,-L))*L-P)/L;
 return rente+(1-sh)*re*(N+p*w)/2;
}
function subsidy(pE){const r=reg(),nieuw=$('nw').value!=='g';if(r==='az'&&T().truck&&nieuw){const a=azRow();return Math.min(pE*a[1],a[2])}if(r.startsWith('mia')&&T().truck&&nieuw)return miaCalc(pE).voordeel;if(r==='eigen')return v('subX');return 0}

/* Uitleg op aanvraag: het vraagteken naast een veld opent een klein venster met uitleg en een link naar de bron */
const TIPS={
 /* Zo bedacht: tol buitenland haalt zijn kilometers uit deze schuif (calcX), dus buitenlandse tolkilometers horen hier al in.
    Dat stond alleen bij Tol buitenland; nu zegt de schuif het zelf ('heffing of tol') en de uitleg ook. */
 kmH:{t:'Kilometerheffing',b:['Sinds 1 juli 2026 betalen vrachtwagens (N2 en N3) boven 3.500 kg per kilometer op wegen met heffing: bijna alle snelwegen en een deel van de provinciale en gemeentelijke wegen.','Vul hier in hoeveel van je kilometers over die wegen gaan. Elektrisch betaalt een lager tarief.','Rijd je ook op tolwegen in het buitenland, tel die kilometers hier mee. Bij Tol buitenland geef je aan welk deel daarvan buiten Nederland ligt; dat deel rekenen we tegen het tarief van dat land.'],l:[['Tarieven vrachtwagenheffing (Staatscourant)','https://zoek.officielebekendmakingen.nl/stcrt-2026-18058.html']]},
 wd:{t:'Rijdagen per jaar',b:['Hiermee berekenen we je gemiddelde dagrit: kilometers per jaar gedeeld door rijdagen. Die vergelijken we met de actieradius.','Rijdt het voertuig in ploegen of op wisselende dagen, tel dan de dagen dat het echt rijdt.']},
 lpD:{t:'Leaseprijs',b:['Operational lease: je betaalt een vast bedrag per maand, excl. btw. Aanschaf, restwaarde en rente zitten erin. Brandstof en heffing betaal je zelf.','Zonder offerte schatten we de prijs uit de aanschafprijs en restwaarde van de koopvariant, met 7% voor beheer, risico en marge. Vul je je eigen offerte in, dan geldt het contract.'],l:[['Kopen, leasen of huren','/overstapgids/financiering/']]},
 lpE:{t:'Leaseprijs',b:['Operational lease: je betaalt een vast bedrag per maand, excl. btw. Aanschaf, restwaarde, rente en de subsidie zitten erin. De leasemaatschappij vraagt AanZET aan; dat kun je bij operational lease niet zelf. Stroom en heffing betaal je zelf.','Zonder offerte schatten we de prijs uit de aanschafprijs en restwaarde van de koopvariant, met 7% voor beheer, risico en marge. Vul je je eigen offerte in, dan geldt het contract.'],l:[['AanZET bij operational lease','https://www.rvo.nl/subsidies-financiering/aanzet/veelgestelde-vragen'],['Kopen, leasen of huren','/overstapgids/financiering/']]},
 lkD:{t:'Contractkilometers',b:['De kilometers per jaar waarvoor je offerte geldt. Rijd je meer, dan betaal je de meerkilometerprijs. Rijd je minder, dan krijg je meestal ongeveer de helft daarvan terug; zo rekenen we ook.']},
 lmD:{t:'Meerkilometerprijs',b:['Staat in je offerte, excl. btw. Voor bestelbussen meestal 5 tot 10 cent per kilometer, voor vrachtwagens 3 tot 8 cent.','Minder kilometers rekenen we tegen de helft van dit bedrag terug.']},
 rw:{t:'Restwaarde',b:['Wat het voertuig na de afschrijftermijn nog waard is, als percentage van de aanschafprijs.','Voor elektrische voertuigen is de tweedehandsmarkt nog jong; reken voorzichtig. De conditie van de accu bepaalt een groot deel van de waarde, dus vraag naar een uitleesbare accugezondheid.']},
 pE:{t:'Aanschafprijs elektrisch',b:['Vraag een offerte inclusief accu en let op levertijd, accugarantie (looptijd en minimale restcapaciteit) en wat er bij service en software-updates is inbegrepen.','AanZET rekent met de prijs van het chassis zonder opbouw en zonder btw.'],l:[['Voorwaarden AanZET','https://www.rvo.nl/subsidies-financiering/aanzet/voorwaarden']]},
 reg:{t:'Subsidie of regeling',b:['AanZET: subsidie voor een nieuwe zero-emissie vrachtwagen, N3 of N2 vanaf 10.000 kg, als percentage van de chassisprijs. Werkt met aanvraagrondes; de ronde van najaar 2026 is gesloten, de volgende wordt rond maart 2027 verwacht. Ook met financial lease kun je aanvragen.','MIA: extra aftrek van de winst voor investeringen op de Milieulijst. AanZET en MIA gaan niet samen.'],l:[['AanZET bij RVO','https://www.rvo.nl/subsidies-financiering/aanzet'],['MIA\\Vamil voor vervoersmiddelen','https://www.rvo.nl/subsidies-financiering/mia-vamil/ondernemers/mobiliteit'],['Welke regelingen gelden voor jou?','/overstapgids/subsidies/']]},
 cls:{t:'N2 of N3',b:['N2 is een vrachtwagen van 3,5 tot 12 ton, N3 is zwaarder dan 12 ton. Het staat op je kentekenbewijs.','AanZET geldt voor N3 en voor N2 vanaf 10.000 kg, met lagere bedragen voor N2.'],l:[['AanZET bij RVO','https://www.rvo.nl/subsidies-financiering/aanzet'],['Subsidies per voertuig','/overstapgids/subsidies/']]},
 le:{t:'Verbruik elektrisch',b:['In kWh per 100 km. Het hangt sterk af van gewicht, snelheid, temperatuur en rijstijl.','Vraag de dealer naar het verbruik op een rit die lijkt op jouw inzet, en reken in de winter met een hoger verbruik.']},
 sp:{t:'Stroomprijs eigen terrein',b:['De prijs per kWh die je op je eigen terrein betaalt, inclusief netbeheerkosten en energiebelasting, zonder btw.','Met eigen zonnepanelen of slim laden op goedkope uren ligt hij lager. Laden onderweg is duurder; zet dat aan bij Extra kosten.']},
 acc:{t:'Bruikbare accu',b:['Het deel van de accu dat je echt gebruikt. Fabrikanten noemen vaak de bruto capaciteit; de bruikbare capaciteit is lager, en je laadt meestal niet tot 100% en rijdt hem niet helemaal leeg.','Actieradius is bruikbare accu gedeeld door verbruik. In de winter ligt hij lager.','Bij een gebruikte elektrische verlagen we de accu met de geschatte slijtage over de jaren die hij al gereden heeft.'],l:[['Actieradius op een winterdag','/overstapgids/actieradius/']]},
 ere:{t:'ERE-opbrengst',b:['Voor stroom die je in je eigen elektrische voertuigen laadt, kun je emissiereductie-eenheden (ERE\'s) laten inboeken en verkopen. Meestal regelt een inboekdienstverlener dat en betaalt hij je per kWh een vergoeding. In oktober 2026 was dat bruto ongeveer € 0,12 per kWh; na zijn commissie houd je zo\'n € 0,10 over.','Je laadpunt heeft daarvoor een geijkte meter nodig.'],l:[['Verdienen met laden (RVO)','https://www.rvo.nl/nieuws/brandstoftransitieverplichting-verdien-met-laden'],['Laden en ERE\'s','/overstapgids/laden/']]},
 oE:{t:'Onderhoud elektrisch',b:['Een elektrische aandrijving heeft geen motorolie, filters, koppeling of uitlaatsysteem, en de remmen slijten minder doordat de motor afremt en energie terugwint.','Banden slijten vaak wat sneller door het gewicht. Vraag naar een onderhoudscontract en waar de dichtstbijzijnde werkplaats voor elektrische voertuigen zit.']},
 vE:{t:'Verzekering elektrisch',b:['Vaak hoger door de hogere aanschafwaarde en duurdere reparaties aan accu en elektronica.','Vraag meerdere verzekeraars en vraag uitdrukkelijk naar dekking van de accu.']},
 tE:{t:'Tarief kilometerheffing',b:['Het tarief hangt af van het gewicht, de CO₂-emissieklasse en de euroklasse. Elektrische vrachtwagens vallen in de laagste CO₂-klasse en betalen het minst.','Van 1 september tot en met 31 december 2026 liggen alle tarieven 22,3% lager.'],l:[['Tarieven vrachtwagenheffing (Staatscourant)','https://zoek.officielebekendmakingen.nl/stcrt-2026-18058.html'],['Kilometerheffing en tol','/overstapgids/heffing/']]},
 xfs:{t:'Financiering',b:['Over het geleende deel betaal je rente; over je eigen geld rekenen we een rendementseis, omdat je dat ook anders had kunnen inzetten.','Financial lease reken je hier: je bent economisch eigenaar en kunt AanZET aanvragen. Operational lease kies je bij Aanschaf.'],l:[['Voorwaarden AanZET','https://www.rvo.nl/subsidies-financiering/aanzet/voorwaarden'],['Kopen, leasen of huren','/overstapgids/financiering/']]},
 xl0:{t:'Laadpaal',b:['Een laadpaal van 50 kW laadt een accu van 540 kWh in ongeveer elf uur: genoeg voor een nacht. Snelladers van 150 kW of meer laden in een pauze, maar kosten meer en vragen een zwaardere aansluiting.','Slim laden spreidt het laden over goedkope uren en de ruimte op je aansluiting.'],l:[['Hoeveel vermogen heb je nodig?','/overstapgids/netcongestie/']]},
 xla:{t:'Netaansluiting',b:['Laden vraagt vaak een zwaardere aansluiting. In veel regio\'s is er netcongestie en een wachtlijst; begin daarom vroeg.','Kijk op de capaciteitskaart van Netbeheer Nederland, neem contact op met je netbeheerder en vraag naar oplossingen zoals een batterij, slim laden of een flexibel contract.'],l:[['Netcongestie: kaart en vermogenscheck','/overstapgids/netcongestie/'],['Netcongestie op jouw adres (capaciteitskaart)','https://capaciteitskaart.netbeheernederland.nl/'],['Oplossingen voor netcongestie (RVO)','https://rvo.nl/sites/default/files/2024-07/Factsheets-oplossingen-netcongestie-bedrijven-versie-2.pdf']]},
 xSp:{t:'SPRILA',b:['Subsidie voor laadpunten op eigen terrein voor je voertuigen. Aanvragen kan in 2026 tot en met 18 december, met eHerkenning niveau 3.','Voor openbaar toegankelijke laadplekken voor zwaar vervoer is er een aparte regeling, SPULA.'],l:[['SPRILA op Ondernemersplein','https://ondernemersplein.overheid.nl/subsidies-en-regelingen/sprila/'],['Laden op eigen terrein','/overstapgids/laden/']]},
 xop:{t:'Openbaar laden',b:['Snelladen langs de weg kost per kWh meer dan laden op eigen terrein, en de ERE-opbrengst gaat naar de exploitant.','Voor vrachtwagens komen er steeds meer laadpleinen langs de corridors. Veel exploitanten bieden zakelijke contracten met lagere tarieven.'],l:[['Laden onderweg en laadtijden','/overstapgids/laden/']]},
 xot:{t:'Tijdverlies bij laden',b:['De tijd dat het voertuig stilstaat om te laden, per 100 km die je onderweg laadt.','Laad je tijdens de verplichte pauze van de chauffeur (45 minuten na 4,5 uur rijden), dan is het tijdverlies klein. Zet het dan lager.'],l:[['Laadtijd per lader','/overstapgids/laden/']]},
 dp:{t:'Dieselprijs',b:['De prijs per liter zonder btw. Het voorbeeld rekent met € 2,00 per liter. De actuele gemiddelde pompprijs vind je bij het CBS.','Tank je met een tankpas of op een eigen tank, dan betaal je vaak minder. Vul dan je eigen prijs in.'],l:[['Pompprijzen motorbrandstoffen (CBS)','https://opendata.cbs.nl/#/CBS/nl/dataset/80416ned/table']]},
 aSlim:{t:'Slim laden',b:['Met een dynamisch energiecontract laad je op de uren dat stroom het goedkoopst is, meestal \'s nachts. Je stroomprijs daalt dan met het verschil tussen die uren en het daggemiddelde.','We rekenen met het gemiddelde verschil op de stroombeurs over de afgelopen dertig dagen.']},
 xZon:{t:'Zonnepanelen',b:['Een kWp aan panelen levert in Nederland gemiddeld zo\'n 900 kWh per jaar. Het deel dat in je voertuigen gaat, kost je ongeveer € 0,06 per kWh in plaats van je stroomprijs.','Zon en laden vallen niet altijd samen. Laad je vooral \'s nachts, dan gaat er zonder buurtbatterij minder direct in je voertuig.'],l:[['Opbrengst per locatie (PVGIS)','https://re.jrc.ec.europa.eu/pvg_tools/nl/']]},
 dag:{t:'Leeftijd van je diesel',b:['Met je huidige diesel rekenen we vanaf de waarde nu, niet vanaf de nieuwprijs. De restwaarde is wat er aan het eind van de afschrijftermijn van die waarde over is. Het onderhoud stijgt met de leeftijd en de verzekering daalt mee met de waarde.','Vul je het kenteken in, dan nemen we de leeftijd en de waarde daarvan over.'],l:[['Zero-emissiezones','/overstapgids/zero-emissiezones/']]},
 rwE:{t:'Restwaarde elektrisch',b:['De tweedehandsmarkt voor elektrische voertuigen is nog jong. De conditie van de accu bepaalt een groot deel van de waarde.','Onder de schuif zie je hoeveel capaciteit de accu aan het eind van je afschrijftermijn ongeveer nog heeft.'],l:[['Accu, garantie en restwaarde','/overstapgids/accu/']]},
 'i-pb':{t:'Terugverdientijd',b:['Hoe lang het duurt voordat de extra investering in elektrisch is terugverdiend met lagere gebruikskosten: energie, onderhoud, verzekering en heffing.','De restwaarde telt hier niet mee, want die ontvang je pas bij verkoop.']},
 'i-km':{t:'Goedkoper vanaf',b:['Het aantal kilometers per jaar waarbij elektrisch per jaar goedkoper wordt dan diesel, met al je andere cijfers gelijk.','Hoe meer je rijdt, hoe zwaarder de lagere kosten per kilometer tegen de hogere aanschaf opwegen.']},
 'i-range':{t:'Actieradius',b:['Bruikbare accu gedeeld door het verbruik. De balk laat zien hoe je gemiddelde dagrit zich daartoe verhoudt.','Is de dagrit langer dan de actieradius, dan moet je onderweg laden. Zet dan Laden onderweg aan bij Extra kosten.'],l:[['Actieradius en planning','/overstapgids/actieradius/']]},
 'i-co2':{t:'CO₂-besparing',b:['Het verschil in uitstoot per jaar, van bron tot wiel: 3,27 kg CO₂ per liter diesel tegenover 0,48 kg per kWh grijze stroom (CO2emissiefactoren.nl, 2026).','Met groene stroom of eigen zonnepanelen is de besparing groter.']}};
TIPS.lkE=TIPS.lkD;TIPS.lmE=TIPS.lmD;
TIPS.lpC={t:'Leaseprijs van je huidige diesel',b:['Het bedrag per maand uit je lopende leasecontract, excl. btw. Aanschaf, restwaarde en rente zitten erin; die heb je dus niet apart.','Brandstof, heffing en wat niet in je contract zit, rekenen we los zoals je invult.']};
TIPS.lrC={t:'Resterende looptijd',b:['Hoeveel maanden je contract nog loopt. Daarna rekenen we door met hetzelfde maandbedrag, alsof je het contract verlengt tegen hetzelfde tarief. Zo blijft de vergelijking over de hele afschrijftermijn eerlijk.','Eindigt je contract eerder en stap je dan over, kies dan een afschrijftermijn die daarbij past.']};
const tipBtn=k=>TIPS[k]?`<button type="button" class="qi" data-tip="${k}" aria-expanded="false" aria-label="Uitleg: ${TIPS[k].t}">?</button>`:'';

/* Gevoeligheid: de belangrijkste aannames iets lager en hoger, de rest gelijk. [naam, 'p' relatief of 'a' absoluut, stap] */
const SENS={km:['Kilometers per jaar','p',.2],dp:['Dieselprijs','p',.2],sp:['Stroomprijs','p',.2],pD:['Aanschafprijs diesel','p',.1],pE:['Aanschafprijs elektrisch','p',.1],ld:['Verbruik diesel','p',.15],le:['Verbruik elektrisch','p',.15],rw:['Restwaarde diesel','a',10],rwE:['Restwaarde elektrisch','a',10],jr:['Afschrijftermijn','a',2],lpD:['Leaseprijs diesel','p',.1],lpE:['Leaseprijs elektrisch','p',.1]};
const SR={};/* gekozen bandbreedte per schuif: afstand onder en boven de waarde */
const fmtV=(id,x)=>{const f=F[id],d=decs(f[4]),u=f[5];return u[0]==='€'?'€ '+nf(x,d)+u.slice(1):nf(x,d)+' '+u};
const srLim=id=>{const e=$(id),x=+e.value,r=SR[id];return[Math.max(+e.min,x-r[0]),Math.min(+e.max,x+r[1])]};
/* Bandbreedte: alle hoeken van de gekozen bandbreedtes doorgerekend. BX is null zolang er geen bandbreedte aan staat. */
let BX=null;
function bandScen(){
 const ids=Object.keys(SR);if(!ids.length)return null;
 const lim=ids.map(srLim),km0=v('km'),out=[{}];
 for(let m=0;m<1<<ids.length;m++){const o={};ids.forEach((id,i)=>{o[id]=lim[i][m>>i&1]});if('km' in o)o.kmH=km0?v('kmH')*o.km/km0:0;out.push(o)}
 return out.map(o=>{const r=calcX(o);return{o,r}});
}
const mm=a=>[Math.min(...a),Math.max(...a)];
const band=()=>BX&&mm(BX.map(q=>q.r.td-q.r.te));
const spanTxt=(a,f,z)=>{const[l,h]=mm(a);return h-l>z?`${f(l)} tot ${f(h)}`:''};
const bandTxt=bd=>`${sg(Math.round(bd[0]/100)*100)} tot ${sg(Math.round(bd[1]/100)*100)}`;
function srPaint(){
 Object.keys(SENS).forEach(id=>{const e=$(id);if(!e)return;const sl=e.closest('.sl'),on=id in SR;sl.classList.toggle('rng',on);const qs=sl.querySelector('.qs');qs.setAttribute('aria-pressed',on);qs.dataset.tt=on?'Bandbreedte aanpassen':'Niet zeker? Kies een bandbreedte';qs.textContent=on?(SR[id][2]?`± ${nf(SR[id][2],SR[id][2]%1?1:0)}%`:'± eigen'):'±';sl.querySelector('.rxp').classList.toggle('open',srOpen===id);if(!on)return;
  const[a,b]=srLim(id),mn=+e.min,mx=+e.max,f=n=>mx>mn?(n-mn)/(mx-mn):0,w=sl.querySelector('.srg').clientWidth;
  sl.style.setProperty('--a',f(a));sl.style.setProperty('--b',f(b));
  sl.querySelectorAll('.rx').forEach(r=>{r.min=mn;r.max=mx;r.step=e.step;r.value=r.dataset.x==='lo'?a:b});
  const pc=SR[id][2];
  sl.querySelectorAll('[data-rp]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.rp===pc));
  const ps=[...sl.querySelectorAll('.rxl')].map(l=>{const lo=l.dataset.x==='lo';l.textContent=fmtV(id,lo?a:b);const c=f(lo?a:b)*(w-24)+12,lw=l.offsetWidth;return{l,lo,lw,x:Math.min(w-lw,Math.max(0,lo?c-lw+6:c-6))}});
  /* Liggen de twee waarden te dicht bij elkaar, dan schuiven ze uit elkaar zodat ze niet over elkaar heen vallen */
  const L=ps.find(q=>q.lo),R=ps.find(q=>!q.lo);if(L&&R){const o=L.x+L.lw+10-R.x;if(o>0){L.x-=o/2;R.x+=o/2;if(L.x<0){R.x-=L.x;L.x=0}if(R.x+R.lw>w){L.x-=R.x+R.lw-w;R.x=w-R.lw}L.x=Math.max(0,L.x)}}
  ps.forEach(q=>q.l.style.left=q.x+'px')});
}

/* ===== Bouwstenen voor invoer ===== */
const decs=s=>(String(s).split('.')[1]||'').length;
const slider=(id,lab)=>{const f=F[id],d=decs(f[4]),eu=f[5][0]==='€',su=eu?f[5].slice(1):f[5];return`<div class="sl"><div class="slh"><span class="slb"><label for="${id}">${lab||f[1]}</label>${tipBtn(id)}${SENS[id]?`<button type="button" class="qs" data-sens="${id}" aria-pressed="false" data-tt="Niet zeker? Kies een bandbreedte" aria-label="Niet zeker van ${SENS[id][0].toLowerCase()}? Kies een bandbreedte">±</button><div class="rxp" role="group" aria-label="Bandbreedte ${SENS[id][0].toLowerCase()}">${[2.5,5,10,20].map(p=>`<button type="button" data-rp="${p}" data-for="${id}" aria-pressed="false">${nf(p,p%1?1:0)}%</button>`).join('')}<button type="button" class="rxo" data-rp="0" data-for="${id}" aria-label="Bandbreedte uit">uit</button></div>`:''}</span><span class="slv">${eu?'<span class="un">€</span>':''}<input class="slin" id="${id}_v" data-for="${id}" type="text" inputmode="${d?'decimal':'numeric'}" autocomplete="off" size="${nf(f[3],d).length}" aria-label="${f[1]}${f[5]?' in '+f[5]:''}">${su?`<span class="un">${su}</span>`:''}</span></div>${SENS[id]?'<div class="srg">':''}<input id="${id}" type="range" min="${f[2]}" max="${f[3]}" data-mx="${f[3]}" step="${f[4]}" value="${f[6]}">${SENS[id]?['lo','hi'].map(x=>`<input class="rx" type="range" data-for="${id}" data-x="${x}" aria-label="${x==='lo'?'Ondergrens':'Bovengrens'} ${SENS[id][0].toLowerCase()}"><span class="rxl" data-x="${x}"></span>`).join('')+`</div>`:''}</div>`};
const sw=(id,t,on)=>`<label class="sw2 ln"><input id="${id}" type="checkbox"${on?' checked':''}><span>${t}</span></label>`;
const vcards=()=>`<div class="vts" role="radiogroup" aria-label="Voertuig">${Object.entries(VT).map(([k,q])=>`<button type="button" class="vt" role="radio" data-vt="${k}" aria-checked="false">${VICON[k]}<b>${q.n}</b><small>${q.sub}</small></button>`).join('')}</div>`;
const dex=(a,b)=>`<div class="dex" data-tab="0"><div class="dxt seg sm" role="tablist" aria-label="Diesel of elektrisch"><button type="button" role="tab" data-dxt="0" aria-selected="true"><i class="d"></i>Diesel</button><button type="button" role="tab" data-dxt="1" aria-selected="false"><i class="e"></i>Elektrisch</button></div><div class="dexc cd"><p class="dexh"><i class="d"></i>Diesel</p>${a}</div><div class="dexc ce"><p class="dexh"><i class="e"></i>Elektrisch</p>${b}</div></div>`;
const tr=n=>eur(n,Math.round(n*1000)%10?3:2);
const tolTxt=c=>(c[2]===c[3]?`Diesel en elektrisch ${tr(c[3])} per km`:c[2]===0?`Elektrisch geen tol · diesel ${tr(c[3])} per km`:`Elektrisch ${tr(c[2])} · diesel ${tr(c[3])} per km`)+(c[4]?` · ${c[4]}`:'');
const sg=n=>(n>0.5?'+ ':n<-0.5?'− ':'')+'€ '+nf(Math.abs(n));

/* ===== Stappen: eerst de vaste stappen, daarna optionele kosten die je zelf aanzet ===== */
const STEPS=[['use','Gebruik'],['buy','Aanschaf'],['sub','Subsidie'],['en','Energie en actieradius'],['up','Onderhoud en verzekering'],['hef','Kilometerheffing','truck'],
 ['fin','Financiering','opt'],['lad','Laadpaal','opt'],['ow','Laden onderweg','opt'],['zon','Zonnepanelen','opt'],['tol','Tol buitenland','optt']];
const coreSteps=()=>STEPS.filter(s=>!s[2]||(s[2]==='truck'&&T().truck));
const optSteps=()=>STEPS.filter(s=>s[2]==='opt'||(s[2]==='optt'&&T().truck));
const steps=()=>[...coreSteps(),...optSteps()];
const isOpt=k=>optSteps().some(s=>s[0]===k);
/* Optionele kosten: welke schakelaar hoort erbij, en staat hij aan? */
const OPTSW={fin:'xFin',lad:'xLad',ow:'xOw',zon:'xZon'};
const optOn=k=>k==='tol'?tolSel.size>0:k==='fin'?finOn():ck(OPTSW[k]);
/* Financiering hoort bij de kant die je koopt; bij lease zit de rente in de leaseprijs */
const finOn=()=>ck('xFin')&&!(lsOn('D')&&lsOn('E'));
let finAuto=false;
const chev='<svg class="mchev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
const mpick=()=>`<p class="mpint">Kies het elektrische voertuig dat je op het oog hebt.</p><div class="mpk" id="mpk"><input type="hidden" id="calcModel" value=""><button type="button" class="mpb" id="mpB" aria-haspopup="listbox" aria-expanded="false" aria-controls="mpP"><i aria-hidden="true"></i><span><small>Elektrisch voertuig</small><b id="mpN">Geen specifiek voertuig</b></span>${chev}</button><div class="mpp" id="mpP" hidden><input type="search" id="mpQ" placeholder="Zoek merk of voertuig" aria-label="Zoek een voertuig" autocomplete="off"><div class="mpl" id="mpL" role="listbox" aria-label="Elektrisch voertuig"></div></div><p class="hint" id="mpH" hidden></p></div>`;
/* Leasen: in plaats van aanschaf en restwaarde een leaseprijs per maand, wat erin zit, en bij een eigen offerte het contract */
const leaseBody=s=>`<input type="hidden" id="ls${s}" value="0"><input type="hidden" id="lq${s}" value="0"><div class="lsw" id="ls${s}W" hidden>${slider('lp'+s)}<p class="hint" id="lp${s}h"></p><div class="qk lin" role="group" aria-label="In de leaseprijs"><span>In de leaseprijs</span><label><input type="checkbox" id="lo${s}" checked>Onderhoud</label><label><input type="checkbox" id="lv${s}">Verzekering</label></div><div class="lqw" id="lq${s}W" hidden>${slider('lk'+s)}${slider('lm'+s)}</div></div>`;
const inLease=(id,t)=>`<div class="sl lnote" id="${id}L" hidden><div class="slh"><span class="slb">${t}</span><span class="lnv">In de leaseprijs</span></div></div>`;
const STEPBODY={
 use:()=>`<div class="wsec">${slider('km')}<div class="qk" id="qk-km" role="group" aria-label="Veelgekozen"></div></div><div class="wsec" id="kmHW">${slider('kmH')}<div class="qk" role="group" aria-label="Snelkeuze"><button type="button" data-kmh="1">Alles</button><button type="button" data-kmh=".75">75%</button><button type="button" data-kmh=".5">De helft</button><button type="button" data-kmh="0">Geen</button></div></div><div class="wsec">${slider('wd')}</div><div class="wsec">${slider('jr')}</div>`,
 buy:()=>`${mpick()}${dex(`<div class="seg sm nwg" role="group" aria-label="Dieselvoertuig"><button type="button" data-dw="n">Nieuw kopen</button><button type="button" data-ls="D">Leasen</button><button type="button" data-dw="h">Huidige houden</button></div><input type="hidden" id="dw" value="n"><div class="nwu" id="dwG" hidden>${plateForm('D')}<div class="seg sm" role="group" aria-label="Huidige diesel: eigendom of leasecontract" style="margin:0"><button type="button" data-dwl="eig">Eigendom</button><button type="button" data-dwl="lease">Leasecontract</button></div><input type="hidden" id="dwl" value="eig">${slider('dag')}</div><div id="dwlW" hidden><div id="lcW" hidden>${slider('lpC')}${slider('lrC')}<div class="qk lin" role="group" aria-label="In de leaseprijs"><span>In de leaseprijs</span><label><input type="checkbox" id="lcO" checked>Onderhoud</label><label><input type="checkbox" id="lcV">Verzekering</label></div><p class="hint" id="lcH"></p></div></div><div id="byD">${slider('pD')}<p class="hint" id="pDh"></p>${slider('rw')}</div>${leaseBody('D')}`,`<div class="seg sm nwg" role="group" aria-label="Elektrisch voertuig"><button type="button" data-nw="n">Nieuw kopen</button><button type="button" data-nw="g">Gebruikt kopen</button><button type="button" data-ls="E">Leasen</button></div><input type="hidden" id="nw" value="n"><div class="nwu" id="nwG" hidden>${plateForm('E')}<input type="hidden" id="plkE" value="">${slider('eag')}</div><div id="byE">${slider('pE')}<p class="hint" id="pEh"></p>${slider('rwE')}<p class="hint" id="rwEh"></p></div>${leaseBody('E')}`)}`,
 sub:()=>`<div class="wsec" id="clsW"><p class="wsl">Gewichtsklasse ${tipBtn('cls')}</p><div class="seg" role="group" aria-label="Gewichtsklasse"><button type="button" data-cls="N2">N2 · 3,5 tot 12 ton</button><button type="button" data-cls="N3">N3 · boven 12 ton</button></div><input type="hidden" id="cls" value="N3"></div><div class="wsec"><p class="wsl"><label for="reg">Subsidie of regeling</label> ${tipBtn('reg')}</p><span class="selw"><select id="reg"></select></span><div id="grW" class="wsec" style="margin-top:16px"><p class="wsl">Bedrijfsgrootte</p><div class="seg" id="grs" role="group" aria-label="Bedrijfsgrootte"><button type="button" data-gr="2">Klein</button><button type="button" data-gr="1">Middelgroot</button><button type="button" data-gr="0">Groot</button></div><input type="hidden" id="gr" value="1"><div class="sz" id="azd"></div></div><div id="subXW" style="margin-top:16px">${slider('subX')}</div><p class="res" id="subR"></p></div>`,
 en:()=>dex(slider('ld')+slider('dp'),slider('le')+slider('sp')+slider('acc')+slider('ere')+'<div style="margin-top:14px">'+sw('aERE','ERE-opbrengst meerekenen',1)+`<div class="ws-row">${sw('aSlim','Slim laden op goedkope uren',0)}${tipBtn('aSlim')}</div></div>`),
 up:()=>dex(slider('oD')+inLease('oD','Onderhoud')+slider('vD')+inLease('vD','Verzekering'),slider('oE')+inLease('oE','Onderhoud')+slider('vE')+inLease('vE','Verzekering')),
 hef:()=>dex(slider('tD'),slider('tE'))+'<p class="hint" id="hefh"></p>',
 fin:()=>``+sw('xFin','Meenemen in de berekening',0)+inLease('xFin','Financiering')+`<div class="xg">${slider('xfs')}${slider('xri')}${slider('xre')}</div>`,
 lad:()=>``+sw('xLad','Meenemen in de berekening',0)+`<div class="xg"><div class="ws-row">${sw('xSp','SPRILA-subsidie meenemen',0)}${tipBtn('xSp')}</div>${slider('xl0')}${slider('xla')}${slider('xlo')}${slider('xln')}<p class="hint" id="xsh"></p></div>`,
 ow:()=>``+sw('xOw','Meenemen in de berekening',0)+`<div class="xg">${slider('xos')}${slider('xop')}${slider('xot')}${slider('xoh')}</div>`,
 zon:()=>`<div class="ws-row">${sw('xZon','Meenemen in de berekening',0)}${tipBtn('xZon')}</div><div class="xg">${slider('xzk')}${slider('xzs')}<p class="hint" id="xzh"></p></div>`,
 tol:()=>`<div class="chips">${TOL.map(c=>`<button type="button" class="chip" data-tol="${c[0]}" aria-pressed="false"><span class="oval">${TOLC[c[0]]}</span>${c[1]}</button>`).join('')}</div><div id="tolBody" hidden><div class="tolcap"><span>Binnen je kilometers met heffing of tol</span><b id="xth"></b></div><div class="capbar"><i id="xtb"></i></div><div class="tolg">${TOL.map(c=>`<div class="tc" id="tc_${c[0]}" hidden><div class="tch"><span class="oval">${TOLC[c[0]]}</span>${c[1]}</div><p class="tcr">${tolTxt(c)}</p>${slider('k_'+c[0],`Kilometers per jaar<span class="sr"> in ${c[1]}</span>`)}</div>`).join('')}</div></div>`};

/* ===== Kostenposten ===== */
const ROWS=[['afs','Aanschaf','buy'],['en','Energie','en'],['ond','Onderhoud','up'],['ver','Verzekering','up'],['hef','Kilometer­heffing','hef']];
const XROWS=[['fin','Financiering','fin','xFin'],['lad','Laadpaal','lad','xLad'],['tij','Laden onderweg','ow','xOw'],['zon','Zonnepanelen','zon','xZon'],['tol','Tol buitenland','tol','']];
const rowHTML=q=>`<div class="row" id="row-${q[0]}"><button type="button" class="grid3 rh" data-step="${q[2]}" aria-label="${q[1]}: cijfers aanpassen"><span class="rd"><b class="rv" id="vD-${q[0]}"></b><i class="bar" id="bD-${q[0]}"></i></span><span class="rl"><b>${q[1]}</b><small id="df-${q[0]}"></small><i aria-hidden="true"></i></span><span class="re"><i class="bar" id="bE-${q[0]}"></i><b class="rv" id="vE-${q[0]}"></b></span></button></div>`;

function build(){
 document.querySelectorAll('[data-vts]').forEach(e=>e.innerHTML=vcards());
 $('rows').innerHTML=ROWS.map(rowHTML).join('');
 $('xrows').insertAdjacentHTML('beforeend',XROWS.map(rowHTML).join(''));
 $('wzB').innerHTML=STEPS.map(s=>`<section class="wst" data-st="${s[0]}" hidden aria-labelledby="wh-${s[0]}"><h3 id="wh-${s[0]}" tabindex="-1">${s[1]}</h3>${STEPBODY[s[0]]()}</section>`).join('');
 regOptions();
 document.querySelectorAll(':is(#calc,#wz) input[type=range],:is(#calc,#wz) input[type=checkbox],:is(#calc,#wz) select').forEach(e=>e.addEventListener('input',()=>{touched=true;render()}));
}
function regOptions(){
 const s=$('reg'),cur=s.value,o=T().truck?[['az','AanZET-subsidie'],['mia1','MIA, winst tot € 200.000'],['mia2','MIA, winst boven € 200.000'],['eigen','Eigen subsidiebedrag'],['geen','Geen']]:[['geen','Geen subsidie'],['eigen','Eigen subsidiebedrag']];
 s.innerHTML=o.map(x=>`<option value="${x[0]}">${x[1]}</option>`).join('');
 s.value=o.some(x=>x[0]===cur)?cur:T().reg;
}
const v=id=>parseFloat($(id).value)||0,ck=id=>$(id).checked;
/* Voorbeeldcijfers van een voertuig laden */
function applyType(t){
 vtype=t;
 Object.entries(VT[t].p).forEach(([id,val])=>{const e=$(id);if(!e)return;absRange(e);e.defaultValue=val;e.value=val});
 regOptions();$('reg').value=VT[t].reg;
 ['lqD','lqE'].forEach(id=>{if($(id))$(id).value='0'});
 modelOptions();fitRanges();
 if($('dw')&&$('dw').value==='h'){autoPD=autoOD=null;dieselAuto(true)}
}
/* Schuifbereik per voertuig, zodat een bestelbus niet op een schaal voor trekkers staat: [min, max] */
const RNG={
 trekker:{km:[20000,250000],pD:[60000,250000],pE:[150000,500000],ld:[20,45],le:[70,180],acc:[200,900],vD:[2000,15000],vE:[2000,20000],oD:[0,.3],oE:[0,.3],subX:[0,150000]},
 bakwagen:{km:[10000,150000],pD:[40000,200000],pE:[80000,400000],ld:[12,40],le:[40,160],acc:[100,700],vD:[1000,12000],vE:[1000,15000],oD:[0,.25],oE:[0,.25],subX:[0,100000]},
 bestel:{km:[5000,80000],pD:[15000,80000],pE:[20000,100000],ld:[5,15],le:[12,40],acc:[30,130],vD:[500,6000],vE:[500,6000],oD:[0,.15],oE:[0,.15],subX:[0,20000]},
 bus:{km:[20000,150000],pD:[150000,450000],pE:[250000,800000],ld:[20,50],le:[60,200],acc:[200,900],vD:[2000,20000],vE:[2000,25000],oD:[0,.4],oE:[0,.4],subX:[0,250000]}};
const nice=(x,up)=>{if(!x)return 0;const s=Math.pow(10,Math.floor(Math.log10(Math.abs(x))))/5;return(up?Math.ceil:Math.floor)(x/s)*s};
function absRange(e){const f=F[e.id];if(f&&e.type==='range'){e.min=f[2];e.max=e.dataset.mx}}
/* Bereik rond het gekozen model, anders rond het voertuig. Een eigen waarde buiten het bereik verbreedt het. */
function fitRanges(){
 const R={...RNG[vtype]},m=modelActive();R.lkD=R.lkE=R.km;R.lmD=R.lmE=[0,.2];
 if($('dw')&&$('dw').value==='h')R.pD=[nice(newPriceD()*.03),nice(newPriceD(),1)];
 if($('nw')&&$('nw').value==='g')R.pE=[nice(newPriceE()*.15),nice(newPriceE(),1)];
 if(m){R.acc=[nice(mAcc(m)*.5),nice(mAcc(m)*1.5,1)];R.le=[nice(mEnergy(m)*.5),nice(mEnergy(m)*1.6,1)];
  if(m.price&&$('nw').value!=='g')R.pE=[nice(m.price*.6),nice(m.price*1.4,1)];const dz=mDiesel(m);if($('dw').value!=='h')R.pD=[nice(dz.pD*.6),nice(dz.pD*1.4,1)];R.ld=[nice(dz.ld*.6),nice(dz.ld*1.5,1)]}
 Object.entries(R).forEach(([id,[a,b]])=>{const e=$(id),f=F[id];if(!e)return;const val=+e.value;
  e.min=Math.max(f[2],Math.min(a,val));e.max=Math.min(f[3],Math.max(b,val));e.value=val});
}
function setNum(e,val){if(e.type==='range'){absRange(e)}e.value=val}

/* Typbare waarde naast een schuif */
function syncSl(){document.querySelectorAll('.slin').forEach(i=>{if(i===document.activeElement)return;const r=$(i.dataset.for);i.value=nf(+r.value,decs(r.step))})}
function commitSl(i){
 const r=$(i.dataset.for),s=i.value.trim(),d=decs(r.step);
 const n=parseFloat(document.documentElement.lang==='en'?s.replace(/,/g,''):d&&!s.includes(',')?s:d?s.replace(/\./g,'').replace(',','.'):s.replace(/\D/g,''));
 if(!isNaN(n)){const f=F[r.id],c=f?Math.min(f[3],Math.max(f[2],n)):Math.min(+r.max,Math.max(+r.min,n));if(f&&r.id!=='kmH'&&!r.id.startsWith('k_')){if(c>+r.max)r.max=nice(c,1);if(c<+r.min)r.min=nice(c)}r.value=c;r.dispatchEvent(new Event('input',{bubbles:true}))}
 i.value=nf(+r.value,d);
}
document.addEventListener('focusout',e=>{if(e.target.matches('.slin'))commitSl(e.target)});
document.addEventListener('keydown',e=>{
 if(!e.target.matches||!e.target.matches('.slin'))return;
 if(e.key==='Enter'){e.preventDefault();commitSl(e.target);e.target.select();return}
 const d={ArrowUp:1,ArrowDown:-1}[e.key];if(!d)return;e.preventDefault();
 const r=$(e.target.dataset.for);r.value=+r.value+d*(+r.step)*(e.shiftKey?10:1);r.dispatchEvent(new Event('input',{bubbles:true}));e.target.value=nf(+r.value,decs(r.step));
});
document.addEventListener('focusin',e=>{if(e.target.matches('.slin'))setTimeout(()=>e.target.select(),0)});

/* ===== Berekening ===== */
const CAT=[['afs','Aanschaf (incl. restwaarde)'],['en','Energie (na ERE)'],['ond','Onderhoud'],['ver','Verzekering'],['hef','Kilometerheffing']];
function calc(o={}){
 const g=k=>k in o?o[k]:v(k);
 const L=Math.max(1,Math.round(g('jr'))),km=Math.max(1,g('km')),kmH=T().truck?Math.min(g('kmH'),km):0,rw=g('rw')/100,rwE=g('rwE')/100,pE=g('pE'),pD=g('pD'),spE=spNet(g);
 const sub=subsidy(pE),netE=pE-sub;
 const lit=km*g('ld')/100,kwh=km*g('le')/100,ereV=ck('aERE')?kwh*g('ere'):0;
 const lD=g('lsD')===1,lE=g('lsE')===1,on=k=>k in o?!!o[k]:ck(k);
 const lcD=$('dw').value==='h'&&$('dwl')&&$('dwl').value==='lease';
 const D={afs:lcD?g('lpC')*12:lD?leaseYear('D',o):(pD-pD*rw)/L,en:lit*g('dp'),ond:lcD?(ck('lcO')?0:km*g('oD')):lD&&on('loD')?0:km*g('oD'),ver:lcD?(ck('lcV')?0:g('vD')):lD&&on('lvD')?0:g('vD'),hef:kmH*g('tD')};
 const E={afs:lE?leaseYear('E',o,sub):(netE-pE*rwE)/L,en:kwh*spE-ereV,ond:lE&&on('loE')?0:km*g('oE'),ver:lE&&on('lvE')?0:g('vE'),hef:kmH*g('tE')};
 const tot=x=>CAT.reduce((s,c)=>s+x[c[0]],0),td=tot(D),te=tot(E);
 return{D,E,td,te,L,km,kmH,netE,sub,lD,lE,lcD,kwh,ereV,stroom:kwh*spE,co2d:lit*CO2D/1000,co2e:kwh*CO2E/1000,hefDiff:D.hef-E.hef};
}
const CATX=[...CAT,['lad','Laadpaal'],['fin','Financiering'],['tol','Tol buitenland'],['tij','Tijdverlies laden onderweg'],['zon','Zonnepanelen']];
function calcX(o={}){
 const b=calc(o),g=k=>k in o?o[k]:v(k),L=b.L,km=b.km,pD=g('pD'),pE=g('pE'),rw=g('rw')/100,rwE=g('rwE')/100,spE=spNet(g);
 const D={...b.D,lad:0,fin:0,tol:0,tij:0,zon:0},E={...b.E,lad:0,fin:0,tol:0,tij:0,zon:0};
 /* Een geleasede kant heeft geen eigen financiering: de rente zit in de leaseprijs */
 /* Huidige diesel: geen nieuwe lening, wel rendement op de waarde die erin vastzit */
 if(ck('xFin')){if(!b.lD&&!b.lcD)D.fin=finY(pD,rw,$('dw').value==='h'?{...o,xfs:0}:o);if(!b.lE)E.fin=finY(pE,rwE,o,b.sub)}
 let spr=0;
 if(ck('xLad')){const big=Math.round(g('gr'))===0,inv=g('xl0');const sv0=sprila(inv,big);spr=ck('xSp')&&sv0>=2500?sv0:0;E.lad=(inv-spr+g('xla'))/L+g('xlo')+g('xln')}
 {const kmH=b.kmH,on=TOL.filter(c=>g('k_'+c[0])>0),sum=on.reduce((a,c)=>a+g('k_'+c[0]),0),f=sum>kmH?(kmH?kmH/sum:0):1;on.forEach(c=>{const k=g('k_'+c[0])*f;E.tol+=k*c[2];D.tol+=k*c[3]});const ka=sum*f;D.hef=(kmH-ka)*g('tD');E.hef=(kmH-ka)*g('tE')}
 let kwhOw=0;
 if(ck('xOw')){const s=g('xos')/100,own=b.kwh*(1-s);kwhOw=b.kwh*s;E.en=own*spE+kwhOw*g('xop')-(ck('aERE')?own*g('ere'):0);E.tij=km*s/100*g('xot')/60*g('xoh')}
 /* Zonnestroom: een deel van de opbrengst gaat in je eigen voertuigen, tegen de kostprijs van je panelen in plaats van de stroomprijs */
 let zonUse=0;
 if(ck('xZon')){const own=b.kwh*(ck('xOw')?1-g('xos')/100:1);zonUse=Math.min(own,g('xzk')*ZON_KWH*g('xzs')/100);E.zon=-zonUse*Math.max(0,spE-ZON_PRIJS)}
 const tot=o=>CATX.reduce((s,c)=>s+o[c[0]],0);
 return{x:1,b,D,E,td:tot(D),te:tot(E),L,km,kwhOw,spr,zonUse,co2d:b.co2d,co2e:(b.kwh-zonUse)*CO2E/1000,dZon:-E.zon,dFin:D.fin-E.fin,dLad:-E.lad,dTol:(D.tol+D.hef-b.D.hef)-(E.tol+E.hef-b.E.hef),dOw:-((E.en-b.E.en)+E.tij)};
}
/* Terugverdientijd: extra investering gedeeld door de lagere gebruikskosten per jaar (zonder restwaarde).
   Financiering telt niet mee. Zo bedacht: de terugverdientijd vraagt hoe lang het duurt voor de extra investering terug is.
   De rente is de prijs van precies dat geld; tel je die er per jaar bij, dan reken je de investering twee keer.
   Bij leasen zit de investering in de leaseprijs; die telt daarom wel bij de jaarkosten. */
function payback(r,o={}){
 const g=k=>k in o?o[k]:v(k),x=!!r.x,b=x?r.b:r,lad=x&&ck('xLad');
 /* Leasen is geen investering: de leaseprijs telt mee bij de gebruikskosten */
 const upD=b.lD||b.lcD?0:g('pD'),upE=(b.lE?0:g('pE')-b.sub)+(lad?g('xl0')-r.spr+g('xla'):0);
 const op=(o,e)=>o.en+o.ond+o.ver+o.hef+((e?b.lE:(b.lD||b.lcD))?o.afs:0)+(x?o.tol+o.tij+o.zon:0)+(e&&lad?g('xlo')+g('xln'):0);
 const opD=op(r.D,0),opE=op(r.E,1),sv=opD-opE,gap=upE-upD,be=gap<=0?0:sv>0?gap/sv:null;
 return{upD,upE,opD,opE,sv,gap,be};
}
const ym=be=>{if(be===null)return'Niet';if(be===0)return'Direct';const M=Math.round(be*12),y=Math.floor(M/12),m=M%12;return[y?y+' jaar':'',m?m+' mnd':''].filter(Boolean).join(' ')||'0 mnd'};
/* Vanaf hoeveel kilometer per jaar is elektrisch goedkoper? */
function kmBreak(o={},it=28){
 const g=k=>k in o?o[k]:v(k),ratio=T().truck&&g('km')?Math.min(g('kmH'),g('km'))/g('km'):0,d=km=>{const r=calcX({...o,km,kmH:km*ratio});return r.td-r.te};
 if(d(1000)>0)return 0;if(d(400000)<=0)return null;
 let lo=1000,hi=400000;if(!it){const a=d(lo),b=d(hi);return lo-a*(hi-lo)/(b-a)}/* snelle schatting voor de bandbreedte: de besparing loopt vrijwel lineair met de kilometers */
 for(let i=0;i<it;i++){const m=(lo+hi)/2;d(m)>0?hi=m:lo=m}return hi;
}

/* ===== Weergave ===== */
const ICON={ab:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4v16M17 4v16M3 8l4-4 4 4M13 16l4 4 4-4"/></svg>',share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',print:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9V3h12v6M6 18H4v-7h16v7h-2M8 14h8v7H8z"/></svg>',pen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13 7 4 4"/></svg>'};
function board(r){
 const d=r.td-r.te,cheap=d>=0,pc=Math.abs(d)/r.td*100,even=pc<0.5,L=r.L,km=r.km,m=modelActive(),bd=band();
 const half=(c,n,t,win)=>`<div class="bd ${c}"><span class="who">${n}${c==='e'&&m?`<em>${mName(m)}</em>`:''}${win?'<em>Voordeligst</em>':''}</span><span class="big"><span data-tw>${eur(t/km,2)}</span><small>per km</small></span><span class="bsub">${eur(t)} totale kosten per jaar</span>${BX?`<span class="brr">${spanTxt(BX.map(q=>(c==='d'?q.r.td:q.r.te)/q.r.km),n=>eur(n,2),.005)||eur(t/km,2)} per km</span>`:''}</div>`;
 const n=coreSteps().length;
 const inv=`<div class="bcta"><div class="bct"><b>${touched?'Gebaseerd op jouw cijfers':'Voorbeeldcijfers voor een '+T().w}</b></div><a class="cta big" href="/uitgebreid/" data-xgo>${isFresh()?'Reken uitgebreid met je eigen cijfers':'Bekijk uitgebreide resultaten'} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg></a></div>`;
 setH($('board'),half('d',dName(),r.td,!cheap&&!even)+half('e','Elektrisch',r.te,cheap&&!even)+
  `<div class="bfoot${cheap||even?'':' neg'}"><p>${even?'Diesel en elektrisch kosten ongeveer hetzelfde.':cheap?`Elektrisch is <b>${nf(pc)}% goedkoper</b>: <b data-tw>${eur(d)}</b> lagere totale kosten per jaar, ${eur(d*L)} in ${L} jaar.`:`Elektrisch is <b>${nf(pc)}% duurder</b>: <b data-tw>${eur(-d)}</b> hogere totale kosten per jaar, ${eur(-d*L)} in ${L} jaar.`}${bd?`<span class="brg">Bandbreedte <b>${bandTxt(bd)}</b> per jaar</span>`:''}</p>${touched?`<div class="acts"><button class="btn" type="button" data-step="use">${ICON.pen}<span>Aanpassen</span></button><button class="btn" type="button" data-share>${ICON.share}<span>Deel</span></button>${scA?'':`<button class="btn" type="button" data-sca aria-label="Bewaar deze berekening om te vergelijken">${ICON.ab}<span>Vergelijk</span></button>`}<button class="btn" type="button" data-print aria-label="Opslaan als PDF of afdrukken">${ICON.print}<span>PDF</span></button></div>`:''}</div>`+inv);
 const vals=[r.td/km,r.te/km],fm=[n=>eur(n,2),n=>eur(n,2)];if(!even){vals.push(Math.abs(d));fm.push(n=>eur(n))}
 tween('bd',$('board').querySelectorAll('[data-tw]'),vals,fm);
 setH($('xSum'),`<p><span><i class="d"></i>Diesel <b>${eur(r.td/km,2)}</b> per km</span><span><i class="e"></i>Elektrisch <b>${eur(r.te/km,2)}</b> per km</span><span class="${cheap||even?'good':'bad'}">${even?'Ongeveer gelijk':`Elektrisch ${nf(pc)}% ${cheap?'goedkoper':'duurder'}: <b>${eur(Math.abs(d))}</b> ${cheap?'lagere':'hogere'} totale kosten per jaar`}</span></p><span class="acts"><button class="btn" type="button" data-step="use">${ICON.pen}<span>Aanpassen</span></button><button class="btn" type="button" data-print aria-label="Opslaan als PDF of afdrukken">${ICON.print}<span>PDF</span></button></span>`);
 $('mD').textContent=eur(r.td/km,2);$('mE').textContent=eur(r.te/km,2);$('mM').textContent=even?'≈':(cheap?'−':'+')+nf(pc)+'%';
}
const lcNow=()=>$('dw')&&$('dw').value==='h'&&$('dwl')&&$('dwl').value==='lease';
function sumItems(b,L,mActive){const dm=c=>`<i class="${c}" aria-hidden="true"></i>`,lD=lsOn('D'),lE=lsOn('E'),pm=s=>`${eur(Math.round(lpNow(s)/10)*10)} per maand`;
 /* Bij leasen: looptijd in plaats van afschrijving, en de leaseprijs in plaats van de aanschafprijs */
 const afs=lD&&lE?['use','Looptijd',`${L} jaar`]:lD||lE?['use','Termijn',`${L} jaar · ${v(lD?'rwE':'rw')}% restwaarde ${lD?'elektrisch':'diesel'}`]:['use','Afschrijving',`${L} jaar · ${v('rw')===v('rwE')?v('rw'):v('rw')+'% / '+v('rwE')}% restwaarde`];
 return [['buy','Voertuig',mActive?mName(mActive):'Marktgemiddelde'],['use','Kilometers per jaar',`${nf(v('km'))} km`],afs,['sub','Subsidie',lE&&b.sub>0?`${regLabel()} · in de leaseprijs`:b.sub>0?`${regLabel()} · ${eur(b.sub)}`:regLabel()],
  lD?['buy',dm('d')+'Lease diesel',pm('D')]:lcNow()?['buy',dm('d')+'Lease huidige diesel',eur(v('lpC'))+' per maand']:['buy',dm('d')+($('dw').value==='h'?'Waarde diesel nu':'Aanschaf diesel'),eur(v('pD'))],lE?['buy',dm('e')+'Lease elektrisch',pm('E')]:['buy',dm('e')+'Aanschaf elektrisch',eur(v('pE'))+($('nw').value==='g'?' · gebruikt':'')],['en',dm('d')+'Dieselprijs',`${eur(v('dp'),2)} per liter`],['en',dm('e')+'Stroomprijs',`${eur(v('sp'),2)} per kWh`]]}
/* Simpel: twee kleine blokjes. Vanaf hoeveel kilometer elektrisch goedkoper is, en wat de stroomprijs met de besparing doet. */
function simpleTiles(){
 const sv=o=>{const q=calcX(o);return q.td-q.te},kb=kmBreak(),dp0=v('dp'),s0=sv({}),sD=sv({dp:dp0+1})-s0,dpB=sD>0?Math.max(0,dp0-s0/sD):null;
 setH($('ins'),
  `<div class="in"><span class="slb">Elektrisch goedkoper vanaf ${tipBtn('i-km')}</span><b data-tw="fk">${kb===0?'Elke afstand':kb===null?'Boven 400.000 km':nf(Math.ceil(kb/1000)*1000)+' km'}</b></div>`+
  `<div class="in"><span class="slb">Goedkoper vanaf dieselprijs</span><b>${dpB===null?'—':dpB<=0?'Altijd':eur(dpB,2)+' <small>per liter</small>'}</b></div>`);
}
function insights(r){
 const rr=f=>BX?`<small class="inr">${f}</small>`:'',kmT=k=>k===0?'elke afstand':k===null?'niet':nf(Math.ceil(k/1000)*1000)+' km';
 let kbR='',raR='';
 if(BX){const kbs=BX.map(q=>kmBreak(q.o,0)),kf=kbs.filter(z=>z!==null),kn=kbs.length-kf.length;if(kf.length&&(kn||Math.max(...kf)-Math.min(...kf)>=1000))kbR=`${kmT(Math.min(...kf))} tot ${kn?'niet haalbaar':kmT(Math.max(...kf))}`;
  raR=spanTxt(BX.map(q=>v('acc')/((q.o.le??v('le'))/100)),n=>nf(Math.round(n/5)*5)+' km',5)}
 const kb=kmBreak(),range=v('acc')/(v('le')/100),day=v('km')/Math.max(1,v('wd')),over=day>range;
 setH($('ins'),
  `<div class="in"><span class="slb">Elektrisch goedkoper vanaf ${tipBtn('i-km')}</span><b data-tw="fk">${kb===0?'Elke afstand':kb===null?'Boven 400.000 km':nf(Math.ceil(kb/1000)*1000)+' km'}</b><small>${kb===0?'':'per jaar'}</small>${kbR?rr(kbR):''}</div>`+
  `<div class="in"><span class="slb">Actieradius ${tipBtn('i-range')}</span><b>± ${nf(Math.round(range/5)*5)} km</b><i class="rbar${over?' over':''}" aria-hidden="true"><i style="width:${Math.min(100,day/range*100)}%"></i></i><small class="${over?'warn':''}">Dagrit ± ${nf(Math.round(day/5)*5)} km${over?' · laden onderweg nodig':''}</small>${raR?rr(raR):''}</div>`);
}
const units=()=>[['km','Per km'],['mnd','Per maand'],['jr','Per jaar'],['tot',`In ${calcX().L} jaar`]].map(u=>`<button type="button" data-u="${u[0]}" aria-pressed="${u[0]===unit}">${u[1]}</button>`).join('');
const dfHTML=(df,dd,z)=>Math.abs(df)<z?'gelijk':`<span class="${df<0?'good':'bad'}"><span class="dfl">elektrisch </span>${df<0?'−':'+'}${eur(Math.abs(df),dd)}</span>`;
function rowsPaint(r,x){
 const k=unit==='km'?1/r.km:unit==='tot'?r.L:unit==='mnd'?1/12:1,dd=unit==='km'?2:0,z=dd?0.005:0.5,truck=T().truck;
 const on={fin:finOn(),lad:ck('xLad'),tij:ck('xOw'),tol:truck&&tolSel.size>0};
 $('row-hef').hidden=!truck;XROWS.forEach(q=>{$('row-'+q[0]).hidden=!on[q[0]]});$('xrows').hidden=!XROWS.some(q=>on[q[0]]);
 const list=ROWS.map(q=>q[0]).filter(c=>truck||c!=='hef').concat(XROWS.map(q=>q[0]).filter(c=>on[c]));
 {const lb=$('row-afs').querySelector('.rl b');if(lb)lb.textContent=afsLab();$('row-afs').querySelector('.rh').setAttribute('aria-label',afsLab()+': cijfers aanpassen')}
 const offOf=()=>false;
 const mx=Math.max(1e-9,...list.map(c=>offOf(c)?0:Math.max(r.D[c],r.E[c])*k));
 const vt=n=>Math.abs(n)<z?'—':eur(n,dd);
 const kq=q=>unit==='km'?1/q.r.km:unit==='tot'?q.r.L:unit==='mnd'?1/12:1,sx=n=>(n<0?'−':n>0?'+':'')+eur(Math.abs(n),dd);
 const rowR=f=>{if(!BX)return'';const t=spanTxt(BX.map(q=>f(q)*kq(q)),sx,z*2);return t?`<span class="rr">${t}</span>`:''};
 list.forEach(c=>{
  const off=offOf(c),dv=r.D[c]*k,ev=r.E[c]*k,iD=inLs(c,'D'),iE=inLs(c,'E');
  $('vD-'+c).textContent=off?'uit':iD?'in lease':vt(dv);$('vE-'+c).textContent=off?'uit':iE?'in lease':vt(ev);
  $('bD-'+c).style.width=off?0:Math.max(0,dv)/mx*100+'%';$('bE-'+c).style.width=off?0:Math.max(0,ev)/mx*100+'%';
  setH($('df-'+c),off?'staat uit':iD||iE?'zit in de leaseprijs':dfHTML(ev-dv,dd,z)+rowR(q=>q.r.E[c]-q.r.D[c]));
  $('row-'+c).classList.toggle('off',off);
  $('row-'+c).classList.toggle('win-e',!off && ev < dv);
  $('row-'+c).classList.toggle('win-d',!off && dv < ev);
 });
 $('vD-tot').textContent=eur(r.td*k,dd);$('vE-tot').textContent=eur(r.te*k,dd);
 setH($('df-tot'),dfHTML((r.te-r.td)*k,dd,z)+rowR(q=>q.r.te-q.r.td));
 setH($('unit'),units());
 {const u={km:'per km',mnd:'per maand',jr:'per jaar',tot:`in ${r.L} jaar`}[unit];document.querySelector('.colh .cd').textContent=dName()+' '+u;document.querySelector('.colh .ce').textContent=eName()+' '+u}
}
const facts=rows=>rows.filter(Boolean).map(q=>`<div><dt>${q[0]}</dt><dd>${q[1]}</dd></div>`).join('');
const regLabel=()=>({az:'AanZET',mia1:'MIA',mia2:'MIA',eigen:'Eigen bedrag',geen:'Geen'})[reg()]||'Geen';
function render(){
 const q=T(),truck=q.truck;
 modelPaint();
 $('kmH').max=v('km');if(!kmScale)kmShare=v('km')?Math.min(1,v('kmH')/v('km')):0;kmScale=false;
 const kmH=truck?Math.min(v('kmH'),v('km')):0;
 for(let i=0;i<2;i++)TOL.forEach(c=>{const k=$('k_'+c[0]);k.max=Math.max(0,kmH-TOL.filter(d=>d[0]!==c[0]).reduce((a,d)=>a+v('k_'+d[0]),0))});
 leaseSync();
 const x=calcX(),r=x,b=x.b,L=r.L;BX=bandScen();
 // Voertuig
 document.querySelectorAll('[data-vt]').forEach(e=>e.setAttribute('aria-checked',e.dataset.vt===vtype));
 $('clsW').hidden=vtype!=='bakwagen';
 document.querySelectorAll('[data-cls]').forEach(e=>e.setAttribute('aria-pressed',e.dataset.cls===$('cls').value));
 // Gebruik
 setH($('qk-km'),q.q.map(n=>`<button type="button" data-km="${n}" aria-pressed="${n===v('km')}">${nf(n)}</button>`).join(''));
 $('kmHW').hidden=!truck;
 document.querySelectorAll('[data-kmh]').forEach(e=>e.setAttribute('aria-pressed',Math.abs(+e.dataset.kmh*v('km')-v('kmH'))<500));
 // Aanschaf en subsidie
 const gi=Math.round(v('gr')),az=AZT[clsOf()][gi]||AZT.N3[1],zd=SZD[gi]||SZD[1],rg=reg();
 $('grW').hidden=!(truck&&rg==='az');$('subXW').hidden=rg!=='eigen';
 document.querySelectorAll('#grs [data-gr]').forEach(e=>e.setAttribute('aria-pressed',+e.dataset.gr===gi));
 setH($('azd'),`<div><small>Werknemers</small><b>${zd[1]}</b></div><i>${zd[3]}</i><div><small>Jaaromzet</small><b>${zd[2]}</b></div>${zd[0].startsWith('Klein')?'<p>Ook non-profitinstellingen vallen in deze categorie.</p>':''}`);
 setH($('subR'),(rg==='az'?`${eur(b.sub)} AanZET-subsidie<span>${nf(az[1]*100,1)}%, maximaal ${eur(az[2])}</span>`:rg.startsWith('mia')?`${eur(b.sub)} netto belastingvoordeel`:rg==='eigen'?`${eur(b.sub)} subsidie`:'Geen subsidie')+(lsOn('E')&&b.sub>0?'<span>Bij operational lease vraagt de leasemaatschappij dit aan. Het zit in de leaseprijs.</span>':''));
 // Optionele kosten
 TOL.forEach(c=>{if(v('k_'+c[0])>0)tolSel.add(c[0]);const on=tolSel.has(c[0]);$('tc_'+c[0]).hidden=!on;document.querySelector(`[data-tol="${c[0]}"]`).setAttribute('aria-pressed',on)});
 $('tolBody').hidden=!tolSel.size;
 const used=TOL.reduce((a,c)=>a+v('k_'+c[0]),0);$('xth').textContent=`${nf(used)} van ${nf(kmH)} km`;$('xtb').style.width=(kmH?Math.min(100,used/kmH*100):0)+'%';
 ['xFin','xLad','xOw','xZon'].forEach(id=>{const xg=$(id).closest('.wst').querySelector('.xg');xg.hidden=false;xg.classList.toggle('xguit',!ck(id))});
 {const both=lsOn('D')&&lsOn('E'),one=!both&&(lsOn('D')||lsOn('E'));$('xFin').closest('label').hidden=both;$('xFinL').hidden=!both;if(both)$('xFin').closest('.wst').querySelector('.xg').hidden=true;$('xFin').nextElementSibling.textContent=one?`Meenemen voor de ${lsOn('D')?'elektrische':'diesel'} die je koopt`:'Meenemen in de berekening'}
 {const big=gi===0,sv0=sprila(v('xl0'),big);setH($('xsh'),ck('xSp')?(sv0>=2500?`<b>Subsidie ${eur(sv0)}</b> (${eur(big?4880:9760)} per laadpunt, maximaal ${big?20:40}% van de kosten)`:`Subsidie ${eur(sv0)}: te laag, het minimum is € 2.500`):'')}
 $('sumRs').hidden=!touched;
 {const amt={fin:x.E.fin-x.D.fin,lad:x.E.lad,ow:-x.dOw,tol:x.dTol};
  setH($('addL'),optSteps().filter(s=>s[0]!=='fin'||!(lsOn('D')&&lsOn('E'))).map(s=>{const k=s[0],o=optOn(k),a=amt[k];return`<button type="button" class="addc" data-add="${k}" aria-pressed="${o}"><i aria-hidden="true">${o?'✓':'+'}</i>${s[1]}${o&&Math.abs(a)>=.5?`<small>${a>0?'+':'−'} ${eur(Math.abs(a))} per jaar</small>`:''}</button>`}).join(''))}
 layout();
 // Samenvatting van jouw cijfers

 const mActive=modelActive();
 /* Acht blokjes. Op een breed scherm vullen ze per kolom, zodat diesel steeds boven elektrisch staat. */
 setH($('sum'),sumItems(b,L,mActive).map(s=>`<button type="button" class="st" data-step="${s[0]}"><span>${s[1]}</span><b>${s[2]}</b>${ICON.pen}</button>`).join(''));
 // Uitkomst
 board(r);simpleTiles();rPaint(r);rowsPaint(r,x);
 {
  setH($('pbX'),payHTML(x));pbSl();
  const anyOpt=optSteps().some(s=>optOn(s[0]));$('wfD').hidden=!anyOpt;
  const items=[['Basis',b.td-b.te,1],['Financiering',x.dFin],['Laadpaal',x.dLad],...(truck?[['Tol buitenland',x.dTol]]:[]),['Laden onderweg',x.dOw],['Totaal',x.td-x.te,2]];
  let run=0;const pts=items.map(it=>{if(it[2]){run=it[1];return[0,it[1]]}const a=run;run+=it[1];return[a,run]});
  const wr=BX&&{1:mm(BX.map(q=>q.r.b.td-q.r.b.te)),2:mm(BX.map(q=>q.r.td-q.r.te))};
  const all=pts.flat().concat(0,...(wr?[...wr[1],...wr[2]]:[])),lo=Math.min(...all),hi=Math.max(...all)*1.12,sp=(hi-lo)||1,qq=n=>(n-lo)/sp*100;
  const wf=items.map((it,i)=>{const[a,c]=pts[i],t=!!it[2],off=!t&&Math.abs(it[1])<0.5,top=Math.max(a,c),bot=Math.min(a,c),col=it[2]===1?'#A3AAA2':it[2]===2?'#0A8F5B':it[1]>=0?'#3FA877':'#E39A2F';
   return`<div class="wc ${off?'off':''}"><div class="wbar" style="bottom:${qq(bot)}%;height:${off?0:Math.max(.8,qq(top)-qq(bot))}%;background:${col}"></div>${i<items.length-1?`<i class="wcn" style="bottom:${qq(pts[i][1])}%"></i>`:''}${wr&&it[2]&&wr[it[2]][1]-wr[it[2]][0]>.5?`<i class="wwk" style="bottom:${qq(wr[it[2]][0])}%;height:${qq(wr[it[2]][1])-qq(wr[it[2]][0])}%"></i>`:''}<span class="wval" style="bottom:calc(${qq(wr&&it[2]?Math.max(top,wr[it[2]][1]):top)}% + 6px)">${t?eur(it[1]):off?'uit':sg(it[1])}</span></div>`}).join('');
  setH($('wfX'),`<div class="wfp" role="img" aria-label="Besparing per jaar, van de basis tot het totaal met extra kosten">${wf}</div><div class="wl">${items.map(it=>`<span>${it[0]}</span>`).join('')}</div>`);
  setH($('snX'),sensHTML(o=>{const qq=calcX(o);return qq.td-qq.te}));
 }
 $('xAn').hidden=lsOn('E');
 setH($('facts'),facts([
  [reg().startsWith('mia')?'MIA-voordeel':'Subsidie',eur(b.sub)+(lsOn('E')&&b.sub>0?' · in de leaseprijs':'')],
  lsOn('E')?['Leaseprijs elektrisch',`${eur(lpNow('E'))} per maand${lqOn('E')?'':' · geschat'}`]:['Netto aanschaf elektrisch',eur(b.netE)],
  lsOn('D')&&['Leaseprijs diesel',`${eur(lpNow('D'))} per maand${lqOn('D')?'':' · geschat'}`],
  ['Stroom per jaar',`${eur(b.stroom)} · ${nf(b.kwh)} kWh`],
  ['ERE-opbrengst per jaar',eur(b.ereV)],
  ['CO₂-besparing per jaar',`${nf(x.co2d-x.co2e)} ton`],
  ['Actieradius',`± ${nf(Math.round(v('acc')/(v('le')/100)/5)*5)} km · dagrit ± ${nf(Math.round(v('km')/Math.max(1,v('wd'))/5)*5)} km`],
  finOn()&&['Financiering',`${nf(v('xfs'))}% geleend tegen ${nf(v('xri'),1)}%, eigen deel ${nf(v('xre'),1)}% rendementseis${finWho()}`],
  ck('xLad')&&['Laadpaal per jaar',`${eur(x.E.lad)}${x.spr>0?` · na SPRILA ${eur(x.spr)}`:''}`],
  ck('xOw')&&['Laden onderweg',`${nf(x.kwhOw)} kWh per jaar tegen ${eur(v('xop'),2)} per kWh, zonder ERE`],
  truck&&tolSel.size>0&&['Tol buitenland per jaar',`diesel ${eur(x.D.tol)} · elektrisch ${eur(x.E.tol)}`],
  truck&&['Kilometerheffing Nederland per jaar',`diesel ${eur(x.D.hef)} · elektrisch ${eur(x.E.hef)}`],
  ['Totaal over '+L+' jaar',`diesel ${eur(x.td*L)} · elektrisch ${eur(x.te*L)}`],
  BX&&['Bandbreedte besparing per jaar',`${bandTxt(band())} (${Object.keys(SR).map(id=>SENS[id][0].toLowerCase()).join(', ')})`]]));
 // Invulvenster
 const d=r.td-r.te;
 setH($('wzL'),`<span class="wzlk">Diesel <b>${eur(r.td/r.km,2)}</b> · elektrisch <b>${eur(r.te/r.km,2)}</b> per km · </span><b class="${d>=0?'good':'bad'}">${eur(Math.abs(d))}</b> ${d>=0?'besparing':'meerkosten'} per jaar`);
 if($('wz').open)wzNav();
 plPaint();usedPaint();dieselPaint();leasePaint();scPaint();
 {const i=PL.D,kg=i&&!i.err&&(i.vt==='trekker'&&i.combo?Math.max(i.combo,i.mass):i.mass);setH($('hefh'),kg&&truck?`Tarief volgens je kenteken: ${hefBand(kg)}, CO₂-klasse 1 (diesel) en 5 (elektrisch).`:'')}
 $('rw').dataset.prev=$('rw').value;
 syncSl();fillRanges();srPaint();mini();save();
}
/* Terugverdiengrafiek: het opgetelde voordeel van elektrisch. Start onder nul (de extra investering), stijgt met de lagere gebruikskosten en snijdt de nullijn op het moment van terugverdienen. Met bandbreedte een waaier om de lijn. */
let PBD=null;
function payHTML(x){
 const L=x.L,{upD,upE,opD,opE,sv,gap,be}=payback(x),PB=BX&&BX.map(q=>payback(q.r,q.o));
 const bes=PB?PB.map(p=>p.be).filter(z=>z!==null):[],far=Math.max(be||0,...bes);
 const T2=Math.max(L,be!==null||bes.length?Math.min(Math.ceil(far)+1,15):L);
 const cw=$('xAn').clientWidth,ph=cw>0&&cw<560,W=Math.round(Math.max(300,Math.min(900,(cw||680)-40))),H=ph?180:Math.max(180,Math.min(220,Math.round(innerHeight*.25))),mL=ph?50:60,mR=10,mT=24,mB=26;
 const dv=(g,s,t)=>s*t-g,sc=PB?PB.map(p=>[p.gap,p.sv]):[[gap,sv]];
 const ends=[0,...[0,T2].flatMap(t=>sc.concat([[gap,sv]]).map(q=>dv(q[0],q[1],t)))];
 const lo0=Math.min(...ends),hi0=Math.max(...ends),raw=(hi0-lo0)/4||1,mg=Math.pow(10,Math.floor(Math.log10(raw))),stp=[1,2,2.5,5,10].map(m=>m*mg).find(m=>m>=raw),lo=Math.floor(lo0/stp)*stp,hi=Math.ceil(hi0/stp)*stp,nT=Math.round((hi-lo)/stp);
 const X=t=>mL+t/T2*(W-mL-mR),Y=c=>mT+(1-(c-lo)/((hi-lo)||1))*(H-mT-mB),f1=n=>n.toFixed(1),y0=Y(0),bot=H-mB;
 const kf=c=>c===0?'€ 0':(c<0?'−':'+')+'€ '+(stp>=1000?nf(Math.abs(c)/1000,stp%1000?1:0)+'k':nf(Math.abs(c)));
 const grid=Array.from({length:nT+1},(_,i)=>lo+i*stp).map(c=>`<line x1="${mL}" x2="${W-mR}" y1="${f1(Y(c))}" y2="${f1(Y(c))}" class="${c===0?'z':'g'}"/><text x="${mL-8}" y="${f1(Y(c)+4)}" text-anchor="end">${kf(c)}</text>`).join('');
 const ev=Math.max(1,Math.ceil(T2/Math.max(1,Math.floor((W-mL-mR)/34))));
 const ticks=Array.from({length:T2+1},(_,t)=>t).filter(t=>t%ev===0||t===L).map(t=>`<text x="${f1(X(t))}" y="${H-6}" text-anchor="${t===0?'start':t===T2?'end':'middle'}"${t===L?' class="lt"':''}>${t===0?(ph?'0':'Start'):t}</text>`).join('');
 const p0=[X(0),Y(-gap)],p1=[X(T2),Y(dv(gap,sv,T2))],seg=`M${f1(p0[0])},${f1(p0[1])}L${f1(p1[0])},${f1(p1[1])}`;
 /* Boven de nullijn groen (terugverdiend), eronder amber (nog in te lopen) */
 const clip=`<clipPath id="pbUp"><rect x="0" y="0" width="${W}" height="${f1(y0)}"/></clipPath><clipPath id="pbDn"><rect x="0" y="${f1(y0)}" width="${W}" height="${f1(H-y0)}"/></clipPath>`;
 const ar=`M${f1(p0[0])},${f1(y0)}L${f1(p0[0])},${f1(p0[1])}L${f1(p1[0])},${f1(p1[1])}L${f1(p1[0])},${f1(y0)}Z`;
 let fan='',brk='';
 if(PB){const N=48,ts=Array.from({length:N+1},(_,i)=>i/N*T2),up=ts.map(t=>[X(t),Y(Math.max(...sc.map(q=>dv(q[0],q[1],t))))]),dn=ts.map(t=>[X(t),Y(Math.min(...sc.map(q=>dv(q[0],q[1],t))))]),pl=a=>a.map((p,i)=>(i?'L':'M')+f1(p[0])+','+f1(p[1])).join('');
  fan=`<path class="fan" d="${pl(up)}${pl(dn.slice().reverse()).replace('M','L')}Z"/><path class="fe" d="${pl(up)}"/><path class="fe" d="${pl(dn)}"/>`;
  if(bes.length){const a=Math.min(...bes),b2=bes.length<PB.length?T2:Math.min(T2,Math.max(...bes));if(X(b2)-X(a)>2)brk=`<line class="brk" x1="${f1(X(a))}" x2="${f1(X(b2))}" y1="${f1(y0)}" y2="${f1(y0)}"/>`}}
 const M=be===null?0:Math.round(be*12),yr=Math.floor(M/12),mo=M%12;
 const lm=L<T2?`<line class="lm" x1="${f1(X(L))}" x2="${f1(X(L))}" y1="${mT}" y2="${bot}"/>`:'';
 let mk='';
 if(be!==null&&be>0&&be<T2){const bx=X(be),lx=Math.min(Math.max(bx,mL+46),W-mR-46),ly=y0-26<mT+8?y0+30:y0-24;
  mk=`<circle cx="${f1(bx)}" cy="${f1(y0)}" r="6.5" class="bem"/><g transform="translate(${f1(lx)},${f1(ly)})" class="bel"><rect x="-44" y="-14" width="88" height="26" rx="4"/><text y="4" text-anchor="middle">${yr?yr+' jr ':''}${mo?mo+' mnd':''}</text></g>`}
 PBD={T2,W,mL,mR,X,Y,mT,bot,upD,opD,upE,opE,gap,sv,sc:PB?sc:null};
 const txt=be===null?'Niet terugverdiend':be===0?'Direct':[yr?`${yr} <small>jaar</small>`:'',mo?`${mo} <small>${mo===1?'maand':'maanden'}</small>`:''].filter(Boolean).join(' ')||'0 <small>maanden</small>';
 const note=be===null?'Elektrisch is per jaar niet goedkoper dan diesel.':be===0?'Elektrisch is vanaf de start goedkoper.':be>L?`Pas na de afschrijftermijn van ${L} jaar.`:'';
 const svg=`<svg viewBox="0 0 ${W} ${H}" tabindex="0" role="img" aria-label="Opgeteld voordeel van elektrisch per jaar. Met de pijltjes loop je door de maanden.">${clip}${grid}<path d="${ar}" class="au" clip-path="url(#pbUp)"/><path d="${ar}" class="ad" clip-path="url(#pbDn)"/>${fan}${lm}<path d="${seg}" class="lu" clip-path="url(#pbUp)"/><path d="${seg}" class="ld" clip-path="url(#pbDn)"/>${brk}${mk}${ticks}<g class="hv" style="display:none"><line class="hl" x1="0" x2="0" y1="${mT}" y2="${bot}"/><circle class="hd" r="5.5"/></g><rect class="hit" x="${mL}" y="0" width="${W-mL-mR}" height="${H}"/></svg>`;
 return`<div class="pbc"><div class="pbt"><div><div class="pbn">${txt}</div><div class="pbs">${note}</div>${PB?(()=>{const bs=PB.map(p=>p.be),f=bs.filter(z=>z!==null),n=bs.length-f.length;return f.length&&(n||Math.max(...f)-Math.min(...f)>=1/12)?`<div class="pbr">Bandbreedte <b>${ym(Math.min(...f))} tot ${n?'niet terugverdiend':ym(Math.max(...f))}</b></div>`:''})():''}</div><div class="pbq"><div><span>Extra investering</span><b>${gap>0?eur(gap):eur(0)}</b>${PB?`<small class="pbqr">${spanTxt(PB.map(p=>Math.max(0,p.gap)),eur,.5)}</small>`:''}</div><div><span>Lagere gebruikskosten</span><b>${eur(sv)} <small>per jaar</small></b>${PB?`<small class="pbqr">${spanTxt(PB.map(p=>p.sv),eur,.5)}</small>`:''}</div></div></div><div class="pbw">${svg}<div class="pbtip" hidden aria-live="polite"></div></div><div class="pbk"><span><i class="kd"></i><i class="ku"></i>Voordeel elektrisch, opgeteld</span>${PB?'<span><i class="kf"></i>Bandbreedte</span>':''}</div></div>`;
}
/* Onder de grafiek: de drie schuiven die voor deze berekening de terugverdientijd het meest verschuiven, gekoppeld aan de echte invoer */
let pbHold=false;
const PBC=['km','dp','sp','pD','pE','ld','le','lpD'];
let pbPin=null;try{const q=JSON.parse(localStorage.getItem('pbPin'));if(Array.isArray(q)&&q.length)pbPin=q.filter(id=>PBC.includes(id)).slice(0,3)}catch(e){}
function pbKeys(){
 const be=o=>{const p=payback(calcX(o),o);return p.be===null?30:Math.min(30,p.be)};
 return PBC.filter(id=>$(id)).map(id=>{const e=$(id),x=+e.value,mk=y=>{const o={[id]:y};if(id==='km')o.kmH=x?v('kmH')*y/x:0;return o};return[id,Math.abs(be(mk(Math.min(+e.max,x*1.1)))-be(mk(Math.max(+e.min,x*.9))))]}).filter(q=>q[1]>1/120).sort((a,b)=>b[1]-a[1]).slice(0,3).map(q=>q[0]);
}
function pbSl(){
 const h=$('pbS');if(!h)return;
 const keep=h._ids&&(pbHold||h.contains(document.activeElement)),ids=pbPin?pbPin.filter(id=>$(id)):keep?h._ids:pbKeys(),k=ids.join();
 if(h._k!==k){h._k=k;h._ids=ids;h.innerHTML=ids.map((id,i)=>`<div class="pbsl"><span><button type="button" class="pbpk" data-slot="${i}" aria-haspopup="true" aria-expanded="false">${SENS[id][0]}<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button><b></b></span><input type="range" data-pb="${id}" aria-label="${SENS[id][0]}"></div>`).join('')}
 h.hidden=!ids.length;
 h.querySelectorAll('[data-pb]').forEach(r=>{const e=$(r.dataset.pb);r.min=e.min;r.max=e.max;r.step=e.step;r.value=e.value;r.parentNode.querySelector('b').textContent=fmtV(r.dataset.pb,+e.value)});
}
document.addEventListener('input',e=>{const id=e.target.dataset&&e.target.dataset.pb;if(!id)return;const o=$(id);o.value=e.target.value;o.dispatchEvent(new Event('input',{bubbles:true}))});
$('pbS').addEventListener('pointerdown',e=>{if(e.target.closest('[data-pb]'))pbHold=true});
/* Zelf kiezen: tik op de naam van een schuif en kies een andere invoer. Nooit meer dan drie. */
const pbMenuClose=()=>{const h=$('pbS');h.querySelectorAll('.pbmn').forEach(m=>m.remove());h.querySelectorAll('.pbpk').forEach(b=>b.setAttribute('aria-expanded','false'))};
$('pbS').addEventListener('click',e=>{
 const h=$('pbS'),o=e.target.closest('[data-pick]');
 if(o){const ids=h._ids.slice(),i=+o.dataset.slot;if(o.dataset.pick==='auto')pbPin=null;else{ids[i]=o.dataset.pick;pbPin=ids}try{pbPin?localStorage.setItem('pbPin',JSON.stringify(pbPin)):localStorage.removeItem('pbPin')}catch(x){}h._k=null;pbSl();const b=h.querySelector(`[data-slot="${i}"]`);b&&b.focus();return}
 const b=e.target.closest('.pbpk');if(!b)return;
 const open=b.getAttribute('aria-expanded')==='true';pbMenuClose();if(open)return;
 const i=+b.dataset.slot,cur=h._ids[i],opts=PBC.filter(id=>$(id)&&(id===cur||!h._ids.includes(id)));
 b.setAttribute('aria-expanded','true');
 b.closest('.pbsl').insertAdjacentHTML('beforeend',`<div class="pbmn" role="menu">${opts.map(id=>`<button type="button" role="menuitemradio" aria-checked="${id===cur}" data-pick="${id}" data-slot="${i}">${SENS[id][0]}</button>`).join('')}${pbPin?`<button type="button" role="menuitem" class="pba" data-pick="auto" data-slot="${i}">Automatisch</button>`:''}</div>`);
 h.querySelector('.pbmn button[aria-checked=true]').focus();
});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.pbmn,.pbpk'))pbMenuClose()});
$('pbS').addEventListener('keydown',e=>{const m=$('pbS').querySelector('.pbmn');if(!m)return;if(e.key==='Escape'){const b=m.parentNode.querySelector('.pbpk');pbMenuClose();b.focus()}else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const bs=[...m.querySelectorAll('button')],j=bs.indexOf(document.activeElement);bs[(j+(e.key==='ArrowDown'?1:bs.length-1))%bs.length].focus()}});
addEventListener('pointerup',()=>{if(pbHold){pbHold=false;pbSl()}});addEventListener('pointercancel',()=>{pbHold=false});
$('pbS').addEventListener('focusout',()=>setTimeout(pbSl,0));
/* Schuiven over de grafiek: per maand de opgetelde kosten van diesel en elektrisch en het verschil */
function pbShow(m){
 const d=PBD,w=$('pbX').querySelector('.pbw');if(!d||!w)return;
 m=Math.max(0,Math.min(d.T2*12,Math.round(m)));d.m=m;const t=m/12,v0=d.sv*t-d.gap,x=d.X(t),y=d.Y(v0);
 const g=w.querySelector('.hv');g.style.display='';g.querySelector('.hl').setAttribute('x1',x);g.querySelector('.hl').setAttribute('x2',x);
 const c=g.querySelector('.hd');c.setAttribute('cx',x);c.setAttribute('cy',y);c.classList.toggle('up',v0>=0);
 const yy=Math.floor(m/12),mm2=m%12,when=m===0?'Start':[yy?yy+' jaar':'',mm2?mm2+' mnd':''].filter(Boolean).join(' ');
 const rg=d.sc&&mm(d.sc.map(q=>q[1]*t-q[0])),cD=d.upD+d.opD*t,cE=d.upE+d.opE*t;
 const tp=w.querySelector('.pbtip');tp.hidden=false;
 tp.innerHTML=`<b>${when}</b><span><i class="kd"></i>Diesel<em>${eur(cD)}</em></span><span><i class="ku"></i>Elektrisch<em>${eur(cE)}</em></span><span class="pv ${v0>=0?'up':'dn'}">Voordeel elektrisch<em>${sg(v0)}</em></span>${rg&&rg[1]-rg[0]>1?`<small>${sg(rg[0])} tot ${sg(rg[1])}</small>`:''}`;
 const s=w.clientWidth/d.W,px=x*s,tw=tp.offsetWidth,gap=14;
 tp.style.left=(px+gap+tw>w.clientWidth?Math.max(0,px-gap-tw):px+gap)+'px';
}
function pbHide(){const w=$('pbX').querySelector('.pbw');if(!w)return;w.querySelector('.hv').style.display='none';w.querySelector('.pbtip').hidden=true}
{
 const host=$('pbX'),at=e=>{const s=host.querySelector('.pbw svg');if(!s||!PBD)return null;const r=s.getBoundingClientRect(),x=(e.clientX-r.left)*PBD.W/r.width;return(x-PBD.mL)/(PBD.W-PBD.mL-PBD.mR)*PBD.T2*12};
 host.addEventListener('pointermove',e=>{if(!e.target.closest('.pbw svg'))return;const m=at(e);if(m!==null)pbShow(m)});
 host.addEventListener('pointerdown',e=>{if(!e.target.closest('.pbw svg'))return;const m=at(e);if(m!==null)pbShow(m)});
 host.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&e.target.matches('.pbw svg'))pbHide()},true);
 host.addEventListener('focusout',e=>{if(e.target.matches('.pbw svg'))pbHide()});
 host.addEventListener('keydown',e=>{if(!e.target.matches('.pbw svg')||!PBD)return;const k={ArrowLeft:-1,ArrowRight:1,Home:-1e3,End:1e3}[e.key];if(!k)return;e.preventDefault();pbShow((PBD.m??0)+(e.shiftKey&&Math.abs(k)===1?k*12:k))});
 /* Breedte veranderd of de pagina komt in beeld: opnieuw tekenen zodat de letters steeds even groot zijn */
 let lw=0;if(window.ResizeObserver)new ResizeObserver(()=>{const w=$('xAn').clientWidth;if(!w||Math.abs(w-lw)<24)return;lw=w;if(typeof calcX==='function'&&$('pbX').firstChild)setH($('pbX'),payHTML(calcX()))}).observe($('xAn'));
}
function sensHTML(sv){
 const dp0=v('dp'),sp0=v('sp'),s0=sv({}),sD=sv({dp:dp0+1})-s0,sE=sv({sp:sp0+1})-s0;
 const dpB=sD>0?dp0-s0/sD:null,spB=sE<0?sp0-s0/sE:null;
 const pos=(x,m)=>Math.min(100,Math.max(0,x/m*100));
 const trk=(be,cur,good,st)=>{const m=Math.max(cur,be>0?be:0,.01)*1.5,b=be>0?pos(be,m):0,tk=[];for(let k=1;k*st<m;k++)tk.push(`<b class="tk" style="left:${pos(k*st,m)}%"><s>${nf(k*st,2)}</s></b>`);const low=be>0&&Math.abs(pos(cur,m)-b)<14;
  const zone=good==='hi'?`left:${be>0?b:0}%;right:0`:`left:0;width:${be>0?b:0}%`;
  return`<div class="trk"><i style="${zone}"></i>${tk.join('')}${be>0?`<u style="left:${b}%"><em>kantelpunt</em></u>`:''}<span class="now" style="left:${pos(cur,m)}%"><em class="${low?'lo':''}">nu</em></span></div>`};
 const card=(t,val,txt,tr)=>`<div class="bc2"><small>${t}</small><b>${val}</b>${tr}<p>${txt}</p></div>`;
 const c1=card('Elektrisch goedkoper vanaf deze dieselprijs',dpB===null?'—':`${eur(Math.max(0,dpB),2)} <small>/ L</small>`,dpB===null?'Geen berekening mogelijk.':dpB<=0?`Elektrisch is goedkoper, ook als diesel gratis zou zijn. Nu rekent de calculator met ${eur(dp0,2)}.`:`Elektrisch is goedkoper vanaf deze dieselprijs. Nu rekent de calculator met ${eur(dp0,2)}.`,dpB===null?'':trk(dpB,dp0,'hi',.5)).replace('class="bc2"','class="bc2 dz"');
 const c2=card('Elektrisch goedkoper tot deze stroomprijs',spB===null?'—':spB<=0?'Geen':`${eur(spB,2)} <small>/ kWh</small>`,spB===null?'Geen berekening mogelijk.':spB<=0?`Elektrisch is niet goedkoper, zelfs niet bij gratis eigen stroom. Nu ${eur(sp0,2)}.`:`Elektrisch is goedkoper tot deze stroomprijs. Nu rekent de calculator met ${eur(sp0,2)}.`,spB===null||spB<=0?'':trk(spB,sp0,'lo',.1));
 const U=a=>[...new Set(a.map(x=>Math.round(Math.max(0,x)*1000)/1000))];
 const ds=U([-.5,-.25,0,.25,.5].map(d=>dp0+d)),es=U([-.1,-.05,0,.1,.2,.3].map(d=>sp0+d));
 const grid=es.map(e=>ds.map(d=>sv({dp:d,sp:e})));const mx=Math.max(1,...grid.flat().map(Math.abs));
 const rows=es.map((e,i)=>`<tr><th scope="row">${nf(e,2)}</th>${ds.map((d,j)=>{const z=grid[i][j],bg=z>=0?`rgba(10,143,91,${.1+.42*z/mx})`:`rgba(242,163,58,${.2+.45*-z/mx})`;return`<td class="${d===dp0&&e===sp0?'cur':''}" style="background:${bg}">${z<0?'−':''}${nf(Math.abs(z)/1000)}k</td>`}).join('')}</tr>`).join('');
 const kb=kmBreak(),km0=v('km');
 const c0=card('Elektrisch goedkoper vanaf',kb===0?'Elke afstand':kb===null?'—':`${nf(Math.ceil(kb/1000)*1000)} <small>km per jaar</small>`,kb===0?`Elektrisch is bij elke afstand goedkoper. Nu rekent de calculator met ${nf(km0)} km.`:kb===null?'Ook bij 400.000 km per jaar is elektrisch niet goedkoper.':`Elektrisch is goedkoper vanaf dit aantal kilometers. Nu rekent de calculator met ${nf(km0)} km.`,kb>0?trk(kb/1000,km0/1000,'hi',50).replace(/>(\d+),00</g,'>$1k<'):'');
 return`<div class="bec">${c0}${c1}${c2}</div><div class="hmw"><small>Besparing per jaar in duizenden euro's, omkaderd is je huidige situatie</small><div class="tw"><table class="hm"><tr><th><span>€/kWh ↓</span><span class="hmd"> · </span><span>€/L →</span></th>${ds.map(d=>`<th scope="col">${nf(d,2)}</th>`).join('')}</tr>${rows}</table></div></div>`;
}

/* ===== Invulvenster ===== */
const seen=new Set();
function layout(){
 const host=$('wzB');
 STEPS.forEach(s=>{const el=document.querySelector(`.wst[data-st="${s[0]}"]`);if(el.parentNode!==host)host.appendChild(el);el.hidden=s[0]!==wzStep});
}
function wzNav(){
 const cs=coreSteps(),os=optSteps(),opt=isOpt(wzStep),i=Math.max(0,cs.findIndex(s=>s[0]===wzStep));
 const btn=(s,num,cls)=>`<button type="button" data-go="${s[0]}"${s[0]===wzStep?' aria-current="step"':''} class="${cls}"><span class="num">${num}</span>${s[1]}</button>`;
 setH($('wzN'),cs.map((s,j)=>{const done=seen.has(s[0])&&s[0]!==wzStep;return btn(s,done?'✓':j+1,done?'done':'')}).join('')+`<p class="wzo">Extra kosten</p>`+os.map(s=>{const o=optOn(s[0]);return btn(s,o?'✓':'+','opt'+(o?' on':''))}).join(''));
 const tb=dxOn();
 const sn=STEPS.find(s=>s[0]===wzStep);$('wzT').textContent=sn?sn[1]:'Jouw cijfers';
 $('wzK').textContent=opt?'Extra kosten':`Stap ${i+1} van ${cs.length}`;$('wzPg').style.width=(opt?100:(i+(tb===0?.5:1))/cs.length*100)+'%';
 $('wzP').hidden=opt||(i===0&&tb<1);$('wzNxT').textContent=opt?'Klaar':i===cs.length-1&&tb!==0?'Bekijk uitkomst':'Volgende';
}
/* Telefoon: diesel en elektrisch staan als tabbladen in één stap, Volgende loopt ze na elkaar door */
const mob=()=>matchMedia('(max-width:760px)').matches;
const curDex=()=>document.querySelector(`#wzB .wst[data-st="${wzStep}"] .dex`);
const dxOn=()=>{const d=mob()&&curDex();return d?+d.dataset.tab:-1};
function dxTab(d,n){if(!d)return;d.dataset.tab=n;d.querySelectorAll('[data-dxt]').forEach(b=>b.setAttribute('aria-selected',+b.dataset.dxt===n))}
function dxGo(n){dxTab(curDex(),n);wzNav();$('wzB').scrollTop=0}
document.addEventListener('click',e=>{const b=e.target.closest('[data-dxt]');if(b)dxGo(+b.dataset.dxt)});
function go(k,focus=true,tab=0){
 const st=steps();if(!st.some(s=>s[0]===k))k=st[0][0];
 wzStep=k;seen.add(k);
 document.querySelectorAll('#wzB .wst').forEach(s=>s.hidden=s.dataset.st!==k);
 dxTab(curDex(),tab);wzNav();fillRanges();$('wzB').scrollTop=0;
 if(focus)$('wh-'+k).focus({preventScroll:true});
}
function openWz(k){
 const d=$('wz');if(!d.open)d.showModal();go(k||'use');mini();
}
function closeWz(show){$('wz').close();if(show){touched=true;if(isFresh())setUsed(true);render();const b=$(page==='uitgebreid'?'resX':'res');b.scrollIntoView({behavior:reduced()?'auto':'smooth',block:'center'});b.classList.remove('flash');void b.offsetWidth;b.classList.add('flash')}mini()}
$('wzX').onclick=()=>closeWz(false);
$('wzP').onclick=()=>{if(dxOn()===1)return dxGo(0);const st=coreSteps(),i=st.findIndex(s=>s[0]===wzStep);if(i>0)go(st[i-1][0],true,1)};
$('wzNx').onclick=()=>{if(dxOn()===0)return dxGo(1);const st=coreSteps(),i=st.findIndex(s=>s[0]===wzStep);if(!isOpt(wzStep)&&i<st.length-1)go(st[i+1][0]);else closeWz(true)};
$('wz').addEventListener('click',e=>{if(e.target===$('wz'))closeWz(false)});
$('wz').addEventListener('cancel',e=>{if(qtBtn){e.preventDefault();tipClose(true)}else if(!$('mpP').hidden){e.preventDefault();mpOpen(false);$('mpB').focus()}});
$('wzB').addEventListener('scroll',tipPlace,{passive:true});

/* ===== Startscherm =====
   Tot iemand het invulvenster heeft afgerond staat op de homepage de keuze (diesel vervangen of nieuw), het kenteken,
   waarom overstappen kan lonen en één knop. Daarna toont / de simpele uitkomst en kun je pas wisselen naar uitgebreid. */
let hc=null;
function isFresh(){return store('sod-used')!=='1'}
function setUsed(on){store('sod-used',on?'1':null);document.documentElement.classList.toggle('fresh',!on);if(!on)hc=null;homePaint()}
const HICON={h:ICON.ab,n:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>'};
const HARR='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
/* Voorbeeldberekening bij een ander aantal kilometers; het deel met heffing schaalt mee */
const hAt=km=>{const f=v('km')?v('kmH')/v('km'):0;return calc({km,kmH:km*f})};
/* Balken op een vaste schaal (de duurste bij de meeste kilometers), zodat ze allebei meegroeien met de schuif */
function hkmPaint(km){
 const r=hAt(km),d=r.td-r.te,el=$('home'),x=el.querySelector('.hx'),mx=+(x&&x.dataset.mx)||Math.max(r.td,r.te);
 const s=(id,h)=>{const e=el.querySelector('#'+id);if(e)e.innerHTML=h};
 const sl=el.querySelector('#hkm');if(sl)sl.style.setProperty('--f',(km-sl.min)/(sl.max-sl.min||1));
 s('hkV',nf(km));s('hkD',eur(r.td));s('hkE',eur(r.te));s('hkT',`Verschil: <b${d<0?' class="d"':''}>${eur(Math.abs(d))}</b>`);
 el.querySelectorAll('[data-bar]').forEach(b=>{const p=Math.min(100,(b.dataset.bar==='d'?r.td:r.te)/mx*100)+'%';b.style.width=p});
}
document.addEventListener('input',e=>{if(e.target.id==='hkm')hkmPaint(+e.target.value)});
/* Bereik van de voorbeeldschuif per voertuig (km per jaar) */
const HKM={trekker:[40000,150000],bakwagen:[20000,120000],bestel:[15000,100000],bus:[40000,150000]};
function homeHTML(){
 const [k0,k1]=HKM[vtype]||[15000,150000],r1=hAt(k1),d1=r1.td-r1.te,mx=Math.max(r1.td,r1.te);
 const tot=d1>500?`<p class="hxh">Elektrisch tot <b data-tw="hx">${eur(d1)}</b> per jaar goedkoper</p>`:`<p class="hxh">Bij weinig kilometers wint diesel vaak nog</p>`;
 const plt=`<div class="hplt">${plateForm('D').replace('Kenteken (optioneel)','Kenteken van je diesel')}</div><p class="hplr" data-hpl></p>`;
 const opt=(k,t,s)=>`<button type="button" role="radio" data-hc="${k}" aria-checked="${hc===k}">${HICON[k]}<b>${t}</b><span>${s}</span></button>`;
 const ch=`<div class="hch" role="radiogroup" aria-label="Jouw situatie">${opt('h','Huidige diesel vervangen','Doorrijden of nu vervangen?')}${opt('n','Nieuwe bedrijfsauto kopen of leasen','Diesel of elektrisch?')}</div>`;
 const k=Math.min(k1,Math.max(k0,v('km'))),st=[5000,2500,2000,1000].find(x=>(k1-k0)%x===0&&(k1-k0)/x>=10)||1000;
 const sld=`<div class="hks"><label for="hkm">Bij <b id="hkV">${nf(k)}</b> km per jaar</label><input id="hkm" class="hkr" type="range" min="${k0}" max="${k1}" step="${st}" value="${k}"></div>`;
 const bars=`<div class="hkw"><p class="hkh">Totale kosten per jaar</p>`+`<div class="hkb"><span>Diesel</span><i><u data-bar="d"></u></i><b id="hkD"></b><span>Elektrisch</span><i class="e"><u data-bar="e"></u></i><b id="hkE"></b></div>`+'</div>';
 return`<div class="wrap hA"><h1 tabindex="-1">Diesel of elektrisch: wat kost jouw bedrijfswagen?</h1><div class="hAg"><div class="hAl">${ch}${hc==='h'?plt:''}${vcards()}</div><aside class="hx" data-mx="${Math.round(mx)}" aria-label="Voorbeeldberekening voor een ${T().w}">${tot}${sld}${bars}<p class="hxv" id="hkT"></p></aside></div><button class="cta big hgo" type="button" data-start>Ga naar de calculator ${HARR}</button></div>`;
}
let hPaint=false;
function homePaint(){
 if(!isFresh()){$('home').innerHTML='';return}
 hPaint=true;twSet($('home'),()=>setH($('home'),homeHTML()));twIntro($('home'));plPaint();
 $('home').querySelectorAll('[data-vt]').forEach(e=>e.setAttribute('aria-checked',e.dataset.vt===vtype));
 if($('hkm'))hkmPaint(+$('hkm').value);
 const escH=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const i=PL.D;$('home').querySelectorAll('[data-plate="D"]').forEach(f=>{if(i&&i.k)f.elements.kt.value=plFmt(i.k)});
 $('home').querySelectorAll('[data-hpl]').forEach(p=>{p.innerHTML=!i?'':i.err?escH(i.err):[`<b>${escH(plName(i))}</b>`,i.first&&i.first.getFullYear(),zeTxt(i)&&'zero-emissiezone: '+escH(zeTxt(i).toLowerCase())].filter(Boolean).join(' · ')});
 hPaint=false;
}
{const f=render;render=function(){f.apply(this,arguments);if(!hPaint&&isFresh()&&!$('wz').open)homePaint()}}
{const f=plLookup;plLookup=async(...a)=>{const x=await f(...a);if(isFresh()){if(PL.D&&!PL.D.err)hc='h';homePaint()}return x}}
document.addEventListener('click',e=>{
 const c=e.target.closest('[data-hc]');if(c){hc=c.dataset.hc;if($('dw').value!==hc){$('dw').value=hc;dieselAuto(true);render()}homePaint();return}
 const st=e.target.closest('[data-start]');if(st){const hk=$('hkm');if(hk&&+hk.value!==v('km')){$('km').value=hk.value;$('km').dispatchEvent(new Event('input',{bubbles:true}));touched=true;render()}const k=st.dataset.start;if(k){hc=k;if($('dw').value!==k){$('dw').value=k;dieselAuto(true);render()}}openWz('use');return}
 if(e.target.closest('#home [data-vt]'))setTimeout(homePaint);
});

/* ===== Onder het startscherm =====
   Korte uitleg die meebeweegt met het voertuig en de kilometers van het startscherm: alle kostenposten, het omslagpunt,
   wat er verandert en waar we mee rekenen, als tabbladen in één blok. Het blok vertaalt zichzelf (data-no-translate). */
let uvCat=null,uvTab='kost';
const UVEN=document.documentElement.lang==='en',uL=(nl,en)=>UVEN?en:nl;
const UVC=[['afs',uL('Aanschaf','Purchase')],['en',uL('Energie','Energy')],['ond',uL('Onderhoud','Maintenance')],['ver',uL('Verzekering','Insurance')],['hef',uL('Heffing','Road charge')]];
const uvKm=()=>{const s=$('hkm');return s?+s.value:v('km')};
const uvDiff=(d,e,k,sp)=>{const x=d-e;return`<small${x<0?' class="d"':''} data-tw="c-${k}">${x<0?'+':'−'}${sp?' ':''}${eur(Math.abs(x))}</small>`};
function uvUit(k,r){
 const g=v;return{
  afs:uL(`<span data-tw="u-gpD">${eur(g('pD'))}</span> voor de diesel en <span data-tw="u-gpE">${eur(g('pE'))}</span> voor elektrisch${r.sub?`, min <span data-tw="u-rsub">${eur(r.sub)}</span> subsidie`:''}, min de restwaarde, verdeeld over ${r.L} jaar.`,`<span data-tw="u-gpD">${eur(g('pD'))}</span> for the diesel and <span data-tw="u-gpE">${eur(g('pE'))}</span> for electric${r.sub?`, minus <span data-tw="u-rsub">${eur(r.sub)}</span> in grants`:''}, minus the residual value, spread over ${r.L} years.`),
  en:uL(`${nf(r.km)} km per jaar: ${nf(g('ld'),1)} liter per 100&nbsp;km à <span data-tw="u-gdp2">${eur(g('dp'),2)}</span> tegenover ${nf(g('le'))} kWh à <span data-tw="u-gsp2">${eur(g('sp'),2)}</span>${r.ereV?', min de ERE-opbrengst':''}.`,`${nf(r.km)} km a year: ${nf(g('ld'),1)} litres per 100 km at <span data-tw="u-gdp2">${eur(g('dp'),2)}</span> against ${nf(g('le'))} kWh at <span data-tw="u-gsp2">${eur(g('sp'),2)}</span>${r.ereV?', minus ERE income':''}.`),
  ond:uL(`<span data-tw="u-goD2">${eur(g('oD'),2)}</span> tegenover <span data-tw="u-goE2">${eur(g('oE'),2)}</span> per km. Een elektromotor heeft geen olie, filters of koppeling.`,`<span data-tw="u-goD2">${eur(g('oD'),2)}</span> against <span data-tw="u-goE2">${eur(g('oE'),2)}</span> per km. An electric motor has no oil, filters or clutch.`),
  ver:uL(`Een vast bedrag per jaar: <span data-tw="u-gvD">${eur(g('vD'))}</span> tegenover <span data-tw="u-gvE">${eur(g('vE'))}</span>. Elektrisch is duurder te verzekeren door de hogere nieuwwaarde.`,`A fixed amount per year: <span data-tw="u-gvD">${eur(g('vD'))}</span> against <span data-tw="u-gvE">${eur(g('vE'))}</span>. Electric costs more to insure because of its higher value.`),
  hef:uL(`${nf(r.kmH)} km met vrachtwagenheffing: <span data-tw="u-gtD3">${eur(g('tD'),3)}</span> tegenover <span data-tw="u-gtE3">${eur(g('tE'),3)}</span> per km.`,`${nf(r.kmH)} km with the Dutch truck charge: <span data-tw="u-gtD3">${eur(g('tD'),3)}</span> against <span data-tw="u-gtE3">${eur(g('tE'),3)}</span> per km.`)}[k];
}
function uvKost(r){
 const cs=UVC.filter(c=>r.D[c[0]]||r.E[c[0]]),mx=Math.max(r.td,r.te),dd=c=>r.D[c[0]]-r.E[c[0]];
 if(!cs.some(c=>c[0]===uvCat))uvCat=cs.reduce((a,c)=>Math.abs(dd(c))>Math.abs(dd(a))?c:a)[0];
 const bar=(x,cl,t,tot)=>`<div class="uvb ${cl}"><span>${t}</span><div class="uvt">${cs.map(c=>`<i data-uvc="${c[0]}" title="${c[1]}"${c[0]===uvCat?' class="on"':''} style="width:${Math.max(0,x[c[0]])/mx*100}%"></i>`).join('')}</div><b data-tw="t-${cl}">${eur(tot)}</b></div>`;
 const d=r.td-r.te;
 twSet($('uvKh'),()=>$('uvKh').innerHTML=UVEN?`${d>=0?`Electric <b data-tw="kh">${eur(d)}</b> cheaper`:`Diesel <b class="d" data-tw="kh">${eur(-d)}</b> cheaper`} per year at ${nf(r.km)} km`:`${d>=0?`Elektrisch <b data-tw="kh">${eur(d)}</b> goedkoper`:`Diesel <b class="d" data-tw="kh">${eur(-d)}</b> goedkoper`} per jaar bij ${nf(r.km)} km`);
 twSet($('uvK'),()=>$('uvK').innerHTML=bar(r.D,'dz','Diesel',r.td)+bar(r.E,'el',uL('Elektrisch','Electric'),r.te)+
  `<div class="uvc">${cs.map(c=>`<button type="button" data-uvc="${c[0]}" aria-pressed="${c[0]===uvCat}"><span>${c[1]}</span>${uvDiff(r.D[c[0]],r.E[c[0]],c[0])}</button>`).join('')}</div><p class="uvx">${uvUit(uvCat,r)}</p>`);
}
/* Verschil per jaar (diesel min elektrisch) over het kilometerbereik van het voertuig, met het omslagpunt */
function uvOmslag(){
 const [k0,k1]=RNG[vtype].km,N=48,P=[];
 for(let i=0;i<=N;i++){const km=k0+(k1-k0)*i/N,r=hAt(km);P.push([km,r.td-r.te])}
 let be=null;for(let i=1;i<P.length;i++){const[a,da]=P[i-1],[b,db]=P[i];if((da<0)!==(db<0)){be=a+(b-a)*(-da)/(db-da);break}}
 const lo=Math.min(0,...P.map(p=>p[1])),hi=Math.max(0,...P.map(p=>p[1])),W=Math.max(300,Math.round($('uvO').clientWidth)||640),H=W<500?200:230,L=4,R=W-4,T0=14,B=H-30;
 const X=km=>L+(km-k0)/(k1-k0)*(R-L),Y=d=>T0+(hi-d)/((hi-lo)||1)*(B-T0),y0=Y(0);
 const pts=P.map(p=>`${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' '),area=`M${X(k0)},${y0} L${pts.replace(/ /g,' L')} L${X(k1)},${y0}Z`;
 const up=P.every(p=>p[1]>=0),rk=x=>nf(Math.round(x/1000)*1000);
 const ew=k=>uL(`Elektrisch wint vanaf <b>${k}</b> km per jaar`,`Electric wins from <b>${k}</b> km a year`);
 $('uvOh').innerHTML=be?(P[0][1]<0?ew(rk(be)):uL(`Diesel wint vanaf <b class="d">${rk(be)}</b> km per jaar`,`Diesel wins from <b class="d">${rk(be)}</b> km a year`)):up?ew(rk(k0)):uL(`Diesel wint tot <b class="d">${rk(k1)}</b> km per jaar`,`Diesel wins up to <b class="d">${rk(k1)}</b> km a year`);
 const tk=[k0,(k0+k1)/2,k1].map((k,i)=>`<text x="${X(k)}" y="${H-8}" text-anchor="${['start','middle','end'][i]}">${nf(Math.round(k/1000))}k</text>`).join('');
 $('uvO').innerHTML=`<p class="uvr" id="uvOr"></p><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${uL(`Verschil in kosten per jaar tussen diesel en elektrisch bij ${nf(k0)} tot ${nf(k1)} km per jaar`,`Annual cost difference between diesel and electric from ${nf(k0)} to ${nf(k1)} km a year`)}">
<defs><clipPath id="uvU"><rect x="0" y="0" width="${W}" height="${y0}"/></clipPath><clipPath id="uvD"><rect x="0" y="${y0}" width="${W}" height="${H}"/></clipPath></defs>
<path class="up" d="${area}" clip-path="url(#uvU)"/><path class="dn" d="${area}" clip-path="url(#uvD)"/>
<line class="zr" x1="${L}" x2="${R}" y1="${y0}" y2="${y0}"/><text x="${R}" y="${y0-6}" text-anchor="end">€ 0</text>
<polyline class="ln" points="${pts}"/>${be?`<line class="be" x1="${X(be)}" x2="${X(be)}" y1="${T0}" y2="${B}"/>`:''}
<line class="ax" x1="${L}" x2="${R}" y1="${B}" y2="${B}"/>${tk}
<line class="gd" id="uvOg" y1="${T0}" y2="${B}"/><circle class="cur" id="uvOc" r="6"/></svg>`;
 const svg=$('uvO').querySelector('svg'),at=km=>{km=Math.min(k1,Math.max(k0,km));const d=hAt(km),x=d.td-d.te,kk=nf(Math.round(km/1000)*1000);
  $('uvOc').setAttribute('cx',X(km));$('uvOc').setAttribute('cy',Y(x));$('uvOg').setAttribute('x1',X(km));$('uvOg').setAttribute('x2',X(km));
  $('uvOr').innerHTML=UVEN?`At <b>${kk} km</b>: ${Math.abs(x)<200?'about the same':x>0?`electric <b>${eur(x)}</b> a year cheaper`:`diesel <b>${eur(-x)}</b> a year cheaper`}`:`Bij <b>${kk} km</b>: ${Math.abs(x)<200?'ongeveer gelijk':x>0?`elektrisch <b>${eur(x)}</b> per jaar goedkoper`:`diesel <b>${eur(-x)}</b> per jaar goedkoper`}`};
 at(uvKm());
 const mv=e=>{const b=svg.getBoundingClientRect();at(k0+((e.clientX-b.left)/b.width*W-L)/(R-L)*(k1-k0))};
 svg.addEventListener('pointermove',mv);svg.addEventListener('pointerdown',mv);svg.addEventListener('pointerleave',()=>at(uvKm()));
}
/* Wat er verandert, gefilterd op voertuig: t vrachtwagens, b bestelbussen, k alleen bakwagens, a iedereen */
const UVY=UVEN?[
 ['2026-07-01','1 July 2026','Truck charge','Every kilometre on Dutch roads now costs a diesel much more than electric.','t','/overstapgids/heffing/'],
 ['2027-01-01','1 January 2027','Euro 5 out of the zones','Vans with Euro 5 or lower may no longer enter zero-emission zones.','b','/overstapgids/zero-emissiezones/'],
 ['2027-01-01','2027','Diesel excise duty','The government wants to extend the discount. Parliament votes on 12 November.','a','/nieuws/'],
 ['2028-01-01','1 January 2028','ETS2 on diesel','A CO₂ price on fuel, about 13 cents per litre.','a','/nieuws/'],
 ['2028-01-01','1 January 2028','Euro 6 out of the zones','For vans registered before 2025. Possibly not until 2029.','b','/overstapgids/zero-emissiezones/'],
 ['2028-01-01','1 January 2028','Older Euro VI out of the zones','Rigid trucks with Euro VI from 2017 to 2019.','k','/overstapgids/zero-emissiezones/'],
 ['2030-01-01','1 January 2030','All diesels out of the zones','Newer Euro VI trucks may then no longer enter either.','t','/overstapgids/zero-emissiezones/']]:[
 ['2026-07-01','1 juli 2026','Vrachtwagenheffing','Elke kilometer op Nederlandse wegen kost een diesel nu flink meer dan elektrisch.','t','/overstapgids/heffing/'],
 ['2027-01-01','1 januari 2027','Euro 5 de zones uit','Bestelauto\'s met Euro 5 of lager mogen niet meer in de zero-emissiezones.','b','/overstapgids/zero-emissiezones/'],
 ['2027-01-01','2027','Dieselaccijns','Het kabinet wil de korting verlengen. De Kamer stemt op 12 november.','a','/nieuws/'],
 ['2028-01-01','1 januari 2028','ETS2 op diesel','CO₂-prijs op brandstof, ongeveer 13 cent per liter.','a','/nieuws/'],
 ['2028-01-01','1 januari 2028','Euro 6 de zones uit','Voor bestelauto\'s van vóór 2025. Mogelijk pas in 2029.','b','/overstapgids/zero-emissiezones/'],
 ['2028-01-01','1 januari 2028','Oudere Euro VI de zones uit','Bakwagens met Euro VI van 2017 tot en met 2019.','k','/overstapgids/zero-emissiezones/'],
 ['2030-01-01','1 januari 2030','Alle diesels de zones uit','Ook nieuwere Euro VI-vrachtwagens mogen de zones dan niet meer in.','t','/overstapgids/zero-emissiezones/']];
function uvTijd(){
 const g=vtype==='bestel'?'b':vtype==='bus'?'':'t',now=new Date(),it=UVY.filter(x=>x[4]==='a'||x[4]===g||(x[4]==='k'&&vtype==='bakwagen'));
 const nx=it.findIndex(x=>new Date(x[0])>now);
 $('uvTh').textContent=uL(`${it.length} veranderingen tot 2030`,`${it.length} changes up to 2030`);
 $('uvT').innerHTML=`<ol class="uvy">${it.map((x,i)=>`<li class="${i<nx-1||nx<0?'past':i===nx-1?'past now':''}"><time datetime="${x[0]}">${x[1]}</time><b><a href="${x[5]}">${x[2]}</a></b><span>${x[3]}</span></li>`).join('')}</ol>`;
}
function uvOnaf(r){
 const q=T(),row=(t,w,s)=>`<div><dt>${t}</dt><dd>${w}</dd><dd>${s||''}</dd></div>`,ln=(h,t)=>`<a href="${h}"${h[0]==='/'?'':' target="_blank" rel="noopener"'}>${t}</a>`;
 $('uvL').innerHTML=[
  row(uL('Dieselprijs','Diesel price'),uL(`${eur(v('dp'),2)} per liter`,`${eur(v('dp'),2)} per litre`),ln('https://opendata.cbs.nl/#/CBS/nl/dataset/80416ned/table','CBS')),
  row(uL('Stroomprijs','Electricity price'),`${eur(v('sp'),2)} per kWh`,uL('eigen terrein','own depot')),
  q.truck&&row(uL('Vrachtwagenheffing','Truck charge'),`${eur(v('tD'),3)} / ${eur(v('tE'),3)} per km`,ln('https://zoek.officielebekendmakingen.nl/stcrt-2026-18058.pdf','Staatscourant')),
  r.sub&&row(uL('Subsidie','Grant'),eur(r.sub),ln('https://www.rvo.nl/subsidies-financiering/aanzet','RVO')),
  row(uL('Restwaarde','Residual value'),uL(`${nf(v('rw'))}% / ${nf(v('rwE'))}% na ${r.L} jaar`,`${nf(v('rw'))}% / ${nf(v('rwE'))}% after ${r.L} years`),ln('/restwaarde/',uL('marktprijzen','market prices'))),
  row(uL('Prijs elektrisch','Electric price'),`${eur(v('pE'))}`,ln('/modellen/',uL('modellen','models')))].filter(Boolean).join('');
}
/* Vaste teksten in het Engels; de Nederlandse staan in de HTML zodat zoekmachines ze zien */
function uvEn(){
 if(!UVEN||!$('uv'))return;
 const set=(q,h)=>{const e=$('uv').querySelector(q);if(e)e.innerHTML=h};
 set('[data-s=idee]>header h2','What Stekker of Diesel does');
 set('[data-s=idee]>div','<p>Replacing a tractor unit, rigid truck, van or bus raises one question: electric, or diesel again? Stekker of Diesel works it out with your mileage and counts every cost over the whole period you own the vehicle.</p><p>Free, no account and no sales pitch.</p>');
 ['All costs','Cheaper from','What is changing','Independent'].forEach((t,i)=>{const b=$('uv').querySelectorAll('[data-uvt]')[i];if(b)b.textContent=t});
 set('[data-s=kost]>header h2','All costs, not just fuel');set('[data-s=omslag]>header h2','Where diesel still wins');set('[data-s=tijd]>header h2','What is changing');
 set('[data-s=onaf]>header h2','Independent');set('[data-s=onaf]>header p','No dealer, no leasing company, no account.');
 set('.uvn','Prices as of October 2026. You can change everything in the calculator. <a href="/over-ons/">How we calculate</a>');
 set('[data-s=faq]>header h2','Frequently asked questions');
 set('[data-s=faq] .faq',[['Is an electric truck cheaper than a diesel?','Over the full ownership period it often is, especially at high mileage. An electric tractor unit or rigid truck costs more to buy but less in energy, maintenance and the Dutch truck charge. Whether that adds up for you depends on your mileage, your electricity price and the grant.'],
  ['Is an electric van cheaper than diesel?','At average use they are close, and at low mileage diesel often still wins. Vans pay no truck charge, so the difference mostly comes from energy and maintenance. If you drive into cities, also check the <a href="/overstapgids/zero-emissiezones/">zero-emission zones</a>.'],
  ['What is TCO?','Total cost of ownership: every cost of a vehicle for as long as you own it. That is the purchase minus grants and residual value, plus energy, maintenance, insurance and road charges. Comparing fuel prices alone gives a distorted picture.'],
  ['Which grants are there for an electric truck?','Tractor units and rigid trucks can get AanZET, or otherwise the MIA. SPRILA may apply to a charger. Amounts and conditions are under <a href="/overstapgids/subsidies/">Grants and schemes</a>.'],
  ['Does electric suit my routes?','That depends on your longest daily route, where you can charge and how much power your grid connection has. Check it under <a href="/overstapgids/actieradius/">Range</a> and <a href="/overstapgids/netcongestie/">Grid congestion</a>.']].map(q=>`<details><summary>${q[0]}</summary><p>${q[1]}</p></details>`).join(''));
 const c=$('uv').querySelector('.uvend .cta');if(c)c.firstChild.data='Start calculating ';
}
uvEn();
function uvPaint(){
 if(!isFresh()||!$('uvK'))return;
 const r=hAt(uvKm());uvKost(r);uvOmslag();uvTijd();uvOnaf(r);twIntro($('uv'));
 document.querySelectorAll('[data-uvt]').forEach(b=>b.setAttribute('aria-selected',b.dataset.uvt===uvTab));
 document.querySelectorAll('.uvS').forEach(s=>s.classList.toggle('act',s.dataset.s===uvTab));
}
{const f=homePaint;homePaint=function(){f.apply(this,arguments);uvPaint()}}
addEventListener('resize',()=>{if(isFresh()&&$('uvO'))uvOmslag()});
document.addEventListener('input',e=>{if(e.target.id==='hkm'){const r=hAt(+e.target.value);uvKost(r);uvOnaf(r);const s=$('uvO')&&$('uvO').querySelector('svg');if(s)s.dispatchEvent(new Event('pointerleave'))}});
document.addEventListener('click',e=>{
 const c=e.target.closest('[data-uvc]');if(c){uvCat=c.dataset.uvc;uvKost(hAt(uvKm()));return}
 const t=e.target.closest('[data-uvt]');if(t){uvTab=t.dataset.uvt;uvPaint()}
});

/* ===== Resultaat na het invulvenster =====
   Het voertuig is al gekozen op het startscherm. Bovenaan voertuig en uitkomst, daaronder de kosten met wat-als schuiven,
   waar het verschil zit, jouw cijfers en de omslagpunten. Twee kolommen, alleen lijnen. Uitgebreid krijgt dezelfde kop. */
const BKI='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12H5M11 6l-6 6 6 6"/></svg>';
let RP='jr';
/* Terug naar het startscherm, met alles wat je al had ingevuld */
function goHome(){const k=$('dw').value;setUsed(false);hc=k;navTo('/');homePaint();scrollTo(0,0)}
document.addEventListener('click',e=>{if(e.target.closest('[data-home]')){e.preventDefault();e.stopPropagation();goHome()}},true);
/* Namen per kant: een geleasede kant heet zo, zodat je overal ziet wat je vergelijkt */
const dName=()=>lsOn('D')?'Diesel lease':lcNow()?'Huidige lease':$('dw').value==='h'?'Huidige diesel':'Diesel';
const eName=m=>(m?mName(m):'Elektrisch')+(lsOn('E')?' lease':'');
const afsLab=()=>{const a=lsOn('D'),b=lsOn('E');return a&&b?'Lease':a||b?'Aanschaf of lease':'Aanschaf'};
const jrLab=()=>lsOn('E')?'Looptijd':'Afschrijftermijn';
/* Onderhoud of verzekering die in de leaseprijs zit */
const inLs=(c,s)=>lsOn(s)&&(c==='ond'?ck('lo'+s):c==='ver'?ck('lv'+s):c==='fin');
const finWho=()=>lsOn('D')?', alleen elektrisch':lsOn('E')?', alleen diesel':'';
/* Leaseprijs per maand nu: de offerte of de schatting */
const lpNow=s=>lqOn(s)?v('lp'+s):Math.round(leaseEst(s,{},s==='E'?subsidy(v('pE')):0)/10)*10;
/* Dezelfde kant gekocht, met de kosten van het geld: zonder Financiering rekenen we met de standaard rente en rendementseis */
const buyY=s=>{const z=calcX({['ls'+s]:0}),fin=ck('xFin')?0:finY(v('p'+s),v(s==='D'?'rw':'rwE')/100,{},s==='E'?subsidy(v('pE')):0);return(s==='D'?z.td:z.te)+fin};
/* Meer of minder rijden dan het leasecontract: de kosten bij 80 tot 120% van de contractkilometers, met de leaseprijs van nu vast */
function leaseKm(r){
 const km=r.km,K=lqOn('E')?v('lkE'):km,fx={lqE:1,lpE:lpNow('E'),lkE:K,...(lsOn('D')?{lqD:1,lpD:lpNow('D'),lkD:lqOn('D')?v('lkD'):km}:{})},sh=km?r.kmH/km:0;
 const ks=[...new Set([.8,.9,1,1.1,1.2].map(f=>Math.round(K*f/1000)*1000).concat(Math.round(km)))].sort((a,b)=>a-b);
 return{K,rows:ks.map(k=>{const z=calcX({...fx,km:k,kmH:k*sh});return{k,td:z.td,te:z.te,now:k===Math.round(km),con:k===Math.round(K)}})};
}
/* Kop van Simpel en Uitgebreid: voertuig links, uitkomst rechts */
function rTop(r,x){
 const d=r.td-r.te,cheap=d>=0,even=Math.abs(d)/r.td<.005,L=r.L,q=T(),i=PL.D&&!PL.D.err?PL.D:null,bd=band();
 const pn=i?[plName(i),i.first&&i.first.getFullYear()].filter(Boolean).join(' · '):'';
 const back=`<a class="bk" href="/" data-home>${BKI}Terug naar start</a>`;
 return`<section class="nS nTop"><div class="nA"><p class="nBk">${back}</p><div class="rvw"><div><div class="rveh">${VICON[vtype]}<h1 tabindex="-1">${q.n}</h1></div><p class="nSub">${[q.sub,pn].filter(Boolean).join(' · ')}</p></div></div></div>
<div class="nB${cheap?'':' neg'}" data-r="head"><p class="nV${even?' ev':''}">${even?'Diesel en elektrisch kosten ongeveer hetzelfde':`Elektrisch <b data-tw="hv">${eur(Math.abs(d))}</b> ${cheap?'goedkoper':'duurder'}`}</p><p class="nVs">in totale kosten per jaar${even?'':` · <span data-tw="hl">${eur(Math.abs(d)*L)}</span> <span class="nwr">in ${L} jaar</span>`}</p>${bd?`<p class="nVs">Bandbreedte ${bandTxt(bd)} per jaar</p>`:''}${x?`<div class="acts"><button class="btn" type="button" data-step="use">${ICON.pen}<span>Aanpassen</span></button><button class="btn" type="button" data-print aria-label="Opslaan als PDF of afdrukken">${ICON.print}<span>PDF</span></button></div>`:''}</div></section>`;
}
/* Ronde getallen voor de schaal boven de balken */
const niceStep=mx=>{const p=Math.pow(10,Math.floor(Math.log10(mx/4||1))),m=mx/4/p;return(m<=1?1:m<=2?2:m<=5?5:10)*p};
const eurK=n=>n>=1e6?'€ '+nf(n/1e6,1)+' mln':n>=1e4?'€ '+nf(n/1000)+'k':eur(n);
/* Schuiven: ze zetten het veld in het invulvenster, render() doet de rest */
const rsl=(id,lab,fm,pf='r_',rg)=>{const e=$(id),x=+e.value,hk=rg||id==='km'&&HKM[vtype],a=hk?Math.min(hk[0],x):+e.min,b=hk?Math.max(hk[1],x):+e.max;return`<div class="rsl"><label for="${pf}${id}"><span>${lab}</span><b data-r="v_${id}">${fm(x)}</b></label><input id="${pf}${id}" type="range" data-rin="${id}" min="${a}" max="${b}" step="${e.step}" value="${x}" style="--f:${(x-a)/(b-a||1)}"></div>`};
/* Vaste schaal voor de balken met totale kosten: het duurste van diesel en elektrisch bij de hoogste kilometers van het voertuig,
   met de voorbeeldcijfers. Zo groeien en krimpen beide balken echt mee met de schuiven. Kom je erboven, dan schuift de schaal op. */
function rScale(r){const p=VT[vtype].p,k1=(HKM[vtype]||[0,150000])[1],z=calc({...p,km:k1,kmH:p.km?k1*p.kmH/p.km:0}),m=Math.max(z.td,z.te,r.td,r.te,1),st=Math.pow(10,Math.floor(Math.log10(m))-1);return Math.ceil(m/st)*st}
/* De strook naar de vlootanalyse staat vast in het uitgebreide resultaat; het simpele resultaat neemt dezelfde over */
const flnHTML=()=>{const e=$('xFln');return e?e.outerHTML.replace(' id="xFln"',''):''};
function rPaint(r){
 const el=$('res');
 const d=r.td-r.te,cheap=d>=0,L=r.L,km=r.km,q=T(),m=modelActive(),mx=rScale(r);
 const sv=o=>{const z=calcX(o);return z.td-z.te},kb=kmBreak(),dp0=v('dp'),s0=sv({}),sD=sv({dp:dp0+1})-s0,dpB=sD>0?Math.max(0,dp0-s0/sD):null;
 const dn=dName(),en=eName(m);
 const facts=`<div class="rf"><span>Elektrisch goedkoper vanaf ${tipBtn('i-km')}</span><b data-tw="fk">${kb===0?'Elke afstand':kb===null?'Boven 400.000 km':nf(Math.ceil(kb/1000)*1000)+' km per jaar'}</b></div><div class="rf"><span>Goedkoper vanaf dieselprijs</span><b data-tw="fp">${dpB===null?'—':dpB<=0?'Altijd':eur(dpB,2)+' <small>per liter</small>'}</b></div>`;
 const lst=sumItems(r.b,L,m).filter((s,j)=>j!==1&&j!==6&&j!==7).map(s=>`<button type="button" class="st" data-step="${s[0]}"><span>${s[1]}</span><b>${s[2]}</b>${ICON.pen}</button>`).join('');
 /* Waar zit het verschil: per onderdeel, per jaar of over de afschrijftermijn, met een schaal en het bedrag bij hover */
 const k=RP==='tot'?L:1,pt=RP==='tot'?`in ${L} jaar`:'per jaar',rows=ROWS.filter(z=>q.truck||z[0]!=='hef');
 const cmx=Math.max(1,...rows.map(z=>Math.max(r.D[z[0]],r.E[z[0]])*k)),st=niceStep(cmx),top=Math.ceil(cmx/st)*st,tks=Array.from({length:Math.round(top/st)+1},(_,j)=>j*st);
 const grid=tks.slice(1,-1).map(t=>`<s style="left:${t/top*100}%"></s>`).join('');
 const bar=(c,n,lab,val)=>`<i class="${c}" style="width:${Math.max(0,val)/top*100}%" data-tip2="${lab} · ${n}: ${eur(val)} ${pt}"></i>`;
 const per=`<div class="seg sm rper" role="group" aria-label="Periode">${[['jr','Per jaar'],['tot',`In ${L} jaar`]].map(z=>`<button type="button" data-rper="${z[0]}" aria-pressed="${z[0]===RP}">${z[1]}</button>`).join('')}</div>`;
 const diff=`<div class="xdh"><span></span><span class="xsc">${tks.map(t=>`<em style="left:${t/top*100}%">${eurK(t)}</em>`).join('')}</span><span>${dn} ${pt}</span><span>${en} ${pt}</span><span>Verschil ${pt}</span></div>`+
  rows.map(z=>{const a=r.D[z[0]]*k,b2=r.E[z[0]]*k,df=b2-a,lb=z[0]==='afs'?afsLab():z[1],iD=inLs(z[0],'D'),iE=inLs(z[0],'E'),il='<span class="xdv xil">in lease</span>';return`<div class="xdr"><span class="xdl">${lb}</span><span class="xdb">${grid}${bar('d',dn,lb,a)}${bar('e',en,lb,b2)}</span>${iD?il:`<span class="xdv" data-tw="xd-${z[0]}">${eur(a)}</span>`}${iE?il:`<span class="xdv" data-tw="xe-${z[0]}">${eur(b2)}</span>`}${iD||iE?'<b class="xdf">—</b>':`<b data-tw="xf-${z[0]}" class="xdf${df<-.5?' g':df>.5?' a':''}">${Math.abs(df)<.5?'gelijk':(df<0?'−':'+')+' '+eur(Math.abs(df))}</b>`}</div>`}).join('')+
  `<div class="xdr xdt"><span class="xdl">Totaal</span><span class="xdb"></span><span class="xdv" data-tw="xd-t">${eur(r.td*k)}</span><span class="xdv" data-tw="xe-t">${eur(r.te*k)}</span><b data-tw="xf-t" class="xdf${cheap?' g':' a'}">${(cheap?'−':'+')+' '+eur(Math.abs(d)*k)}</b></div>`;
 const cost=`<div class="rcb" data-r="bars"><span>${dn}</span><i class="d"><u style="width:${r.td/mx*100}%"></u></i><b data-tw="td">${eur(r.td)}</b><span>${en}</span><i class="e"><u style="width:${r.te/mx*100}%"></u></i><b data-tw="te">${eur(r.te)}</b></div><div class="nPk" data-r="pkm"><div><span>Diesel per km</span><b data-tw="pd">${eur(r.td/km,2)}</b></div><div><span>Elektrisch per km</span><b data-tw="pe">${eur(r.te/km,2)}</b></div><div><span>Verschil per km</span><b data-tw="pv">${eur(Math.abs(d)/km,2)}</b></div></div>`;
 const h=`<div class="rN">${rTop(r,0)}
<section class="nS"><div class="nA"><p class="nk">Totale kosten per jaar</p>${cost}</div><div class="nB"><p class="nk">Wat als</p><div class="nSl">${rsl('km','Kilometers per jaar',x=>nf(x)+' km')}${rsl('dp','Dieselprijs',x=>eur(x,2)+' per liter')}${rsl('sp','Stroomprijs',x=>eur(x,2)+' per kWh')}</div></div></section>
<section class="nS nX"><div class="nXh"><p class="nk">Waar zit het verschil<span class="nkp"> · ${pt}</span></p>${per}</div><div class="xd" data-r="xd">${diff}</div></section>
<section class="nS"><div class="nA"><p class="nk">Jouw cijfers</p><div class="nTl" data-r="tiles">${lst}</div></div><div class="nB"><p class="nk">Elektrisch goedkoper vanaf</p><div class="nF" data-r="facts">${facts}</div></div></section>
${flnHTML()}
<a class="rhgo" href="/uitgebreid/" data-xgo>Uitgebreide resultaten ${HARR}</a></div>`;
 rSet(el,h);twIntro(el);
 /* Uitgebreid: dezelfde kop en kosten, met meer schuiven */
 const p0=(m&&m.price)||VT[vtype].p.pE,pR=[Math.floor(p0*.6/1000)*1000,Math.ceil(p0*1.4/1000)*1000],pb=payback(r);
 rSet($('resX'),`<div class="rN">${rTop(r,1)}
<section class="nS"><div class="nA"><p class="nk">Totale kosten per jaar</p>${cost}<div class="nF xF" data-r="xfacts">${facts}${lsOn('E')?`<div class="rf"><span>Leaseprijs elektrisch</span><b>${eur(lpNow('E'))} <small>per maand</small></b></div>`:`<div class="rf"><span>Terugverdientijd</span><b>${ym(pb.be)}</b></div>`}</div></div><div class="nB"><p class="nk">Wat als</p><div class="nSl">${rsl('km','Kilometers per jaar',x=>nf(x)+' km','x_')}${rsl('dp','Dieselprijs',x=>eur(x,2)+' per liter','x_')}${rsl('sp','Stroomprijs',x=>eur(x,2)+' per kWh','x_')}${lsOn('E')?rsl('lpE','Leaseprijs elektrisch',x=>eur(x)+' per maand','x_'):rsl('pE','Aanschafprijs elektrisch',x=>eur(x),'x_',pR)+rsl('rwE','Restwaarde elektrisch',x=>nf(x)+'% na '+L+' jaar','x_')}${rsl('jr',jrLab(),x=>x+' jaar','x_')}</div></div></section></div>`);twIntro($('resX'));
 const [x1,x2]=xExtra(r,dn,en);rSet($('xEx1'),x1);rSet($('xEx2'),x2);
}
/* Maandlasten: een annuïteitenlening over de afschrijftermijn op het geleende deel van de aanschafprijs, plus de gebruikskosten per maand */
function mLast(r){
 const L=r.L,n=L*12,i=v('xri')/1200,sh=v('xfs')/100,an=P=>P<=0?0:i?P*i/(1-Math.pow(1+i,-n)):P/n;
 const cats=ROWS.filter(z=>z[0]!=='afs'&&(T().truck||z[0]!=='hef')).map(z=>[z[0],z[1].replace(/­/g,'')]);
 /* Een geleasede kant heeft geen lening: daar staat de leaseprijs */
 const one=(o,p,ls)=>{const q=ls?{P:0,lening:o.afs/12}:{P:p*sh,lening:an(p*sh)};cats.forEach(z=>q[z[0]]=o[z[0]]/12);q.gk=cats.reduce((a,z)=>a+q[z[0]],0);q.tot=q.lening+q.gk;return q};
 return{cats,d:one(r.D,$('dw').value==='h'?0:v('pD'),lsOn('D')),e:one(r.E,v('pE'),lsOn('E'))};
}
/* Uitgebreid: wat een transportondernemer nog meer wil weten. Per maand, per rit, bij een lagere restwaarde en of de dagrit past */
let RIT=0,mlCat='lening';
document.addEventListener('click',e=>{const c=e.target.closest('[data-mlc]');if(c){mlCat=c.dataset.mlc;render()}});
function xExtra(r,dn,en){
 const L=r.L,km=r.km,wd=Math.max(1,v('wd')),cheap=r.td>=r.te,m0=modelActive();
 /* Wat kost het per maand vertaalt zichzelf; de namen van de kanten halen we door het woordenboek */
 const tn=t=>UVEN&&window.sodText?window.sodText(t):t;
 const dfc=(df,t)=>`<b class="xdf${df<-t?' g':df>t?' a':''}">${Math.abs(df)<t?'gelijk':(df<0?'−':'+')+' '+eur(Math.abs(df),t<.5?2:0)}</b>`;
 const tr=(lab,a,b,dec=0,c='')=>`<div class="xtr${c}"><span>${lab}</span><b>${eur(a,dec)}</b><b>${eur(b,dec)}</b>${dfc(b-a,dec?.005:.5)}</div>`;
 const th=`<div class="xtr xth"><span></span><span>${dn}</span><span>${en}</span><span>Verschil</span></div>`;
 /* Per maand en per rijdag */
 const mnd=th+tr(afsLab()==='Aanschaf'?'Aanschaf na restwaarde':afsLab(),r.D.afs/12,r.E.afs/12)+tr('Gebruikskosten',(r.td-r.D.afs)/12,(r.te-r.E.afs)/12)+tr('Totale kosten per maand',r.td/12,r.te/12,0,' xtt')+tr('Totale kosten per rijdag',r.td/wd,r.te/wd,0,' xtt');
 /* Doorberekenen aan je opdrachtgever: per km, per 100 km en per rit */
 const dag=Math.round(km/wd/10)*10,rit=Math.min(800,Math.max(20,RIT||dag||100));
 const ritS=`<div class="rsl xrit"><label for="x_rit"><span>Ritlengte</span><b data-r="v_rit">${nf(rit)} km</b></label><input id="x_rit" type="range" data-rit min="20" max="800" step="10" value="${rit}" style="--f:${(rit-20)/780}"></div>`;
 const pr=th+tr('Per km',r.td/km,r.te/km,2)+tr('Per 100 km',r.td/km*100,r.te/km*100)+tr(`Per rit van ${nf(rit)} km`,r.td/km*rit,r.te/km*rit,0,' xtt');
 /* Restwaarde: de grootste onzekerheid bij elektrisch. Waar slaat het om? */
 const pE=v('pE'),rw0=Math.round(v('rwE')),te=p=>calcX({rwE:p}).te,k=(te(0)-te(50))/50;
 const rwB=k>0?(te(0)-r.td)/k:null;
 const ps=[...new Set([0,10,20,30,40,50,rw0])].filter(p=>p<=60).sort((a,b)=>a-b);
 const rwT=`<div class="xtr xth xrw"><span>Restwaarde</span><span>Waarde na ${L} jaar</span><span>${en} per jaar</span><span>Verschil per jaar</span></div>`+ps.map(p=>{const t=p===rw0?r.te:te(p);return`<div class="xtr xrw${p===rw0?' on':''}"><span>${p}%${p===rw0?' <em>nu</em>':''}</span><b>${eur(pE*p/100)}</b><b>${eur(t)}</b>${dfc(t-r.td,.5)}</div>`}).join('');
 const rwF=`<div class="rf"><span>${en} goedkoper ${rwB!==null&&rwB>0&&rwB<100?'bij een restwaarde vanaf':''}</span><b>${rwB===null||rwB>=100?'Bij geen enkele restwaarde':rwB<=0?'Ook zonder restwaarde':nf(Math.ceil(rwB))+'%'+' <small>na '+L+' jaar</small>'}</b></div>`;
 /* Leasen: meer of minder rijden dan het contract, en wat dezelfde auto gekocht zou kosten */
 const lD=lsOn('D'),lE=lsOn('E');let kmS='',kopS='';
 if(lE){
  const lk=leaseKm(r);
  const kT=`<div class="xtr xth xrw xkm"><span>Kilometers</span><span>${dn}</span><span>${en}</span><span>Verschil per jaar</span></div>`+lk.rows.map(q=>`<div class="xtr xrw xkm${q.now?' on':''}"><span>${nf(q.k)}${q.con?' <em>contract</em>':q.now?' <em>nu</em>':''}</span><b>${eur(q.td)}</b><b>${eur(q.te)}</b>${dfc(q.te-q.td,.5)}</div>`).join('');
  kmS=`<p class="nk">Meer of minder rijden ${tipBtn('lkE')}</p><div class="xt" data-r="kmt">${kT}</div><div class="nF" data-r="kmf"><div class="rf"><span>Meerkilometers</span><b>${eur(v('lmE'),2)} <small>per km, minder krijg je half terug</small></b></div></div>`;
 }
 if(lD||lE){
  const sides=[lD&&'D',lE&&'E'].filter(Boolean),base=s=>s==='D'?'Diesel':m0?mName(m0):'Elektrisch';
  const kh=`<div class="xtr xth"><span></span><span>Lease</span><span>Kopen</span><span>Verschil</span></div>`;
  const kr=sides.map(s=>{const ls=s==='D'?r.td:r.te,by=buyY(s);return tr(`${base(s)} per jaar`,ls,by)+tr(`${base(s)} in ${L} jaar`,ls*L,by*L,0,' xtt')}).join('');
  const kf=sides.map(s=>{const ls=s==='D'?r.td:r.te,by=buyY(s),be=lpNow(s)+(by-ls)/12,d=by-ls,w=t=>sides.length>1?base(s)+': '+t.toLowerCase():t;return`<div class="rf"><span>${w(Math.abs(d)<.5?'Kopen en leasen kosten hetzelfde':d>0?'Leasen goedkoper':'Kopen goedkoper')}</span><b>${Math.abs(d)<.5?'—':eur(Math.abs(d))+' <small>per jaar</small>'}</b></div><div class="rf"><span>${w('Leasen loont tot')}</span><b>${be>0?eur(Math.floor(be/10)*10):eur(0)} <small>per maand</small></b></div>`}).join('');
  const ka=sides.map(s=>s==='D'?`Diesel kopen: ${eur(v('pD'))}, ${nf(v('rw'))}% restwaarde`:`Elektrisch kopen: ${eur(v('pE'))}, ${nf(v('rwE'))}% restwaarde${r.b.sub>0?`, ${regLabel()} ${eur(r.b.sub)}`:''}`).join(' · ')+(ck('xFin')?'':`, ${nf(v('xri'),1)}% rente`);
  kopS=`<section class="nS nS2 xKop"><div class="nA"><p class="nk">Kopen of leasen</p><div class="xt" data-r="kop">${kh+kr}</div><p class="xka" data-r="kopa">${ka}</p></div><div class="nB"><p class="nk">Elektrisch goedkoper vanaf</p><div class="nF" data-r="kopf">${kf}</div></div></section>`;
 }
 /* Actieradius tegenover de gemiddelde dagrit, ook in de winter */
 const rg=v('acc')/(v('le')/100),wi=rg*.75,day=km/wd,mx=Math.max(rg,day),kwh=day*v('le')/100,kw=vtype==='bestel'?11:40;
 const rb=(c,lab,n)=>`<span>${lab}</span><i class="${c}"><u style="width:${n/mx*100}%"></u></i><b>± ${nf(Math.round(n/5)*5)} km</b>`;
 const rgV=day<=wi?'Past ook in de winter zonder laden onderweg':day<=rg?'Past zonder laden onderweg, in de winter krap':'Laden onderweg nodig op een gemiddelde dag';
 const rgH=`<div class="rcb xrg">${rb('e','Actieradius',rg)}${rb('e w','In de winter',wi)}${rb('d','Gemiddelde dagrit',day)}</div><p class="xrv${day>rg?' a':''}">${rgV}</p><div class="nF"><div class="rf"><span>Laden per rijdag</span><b>± ${nf(Math.round(kwh/5)*5)} kWh <small>± ${nf(Math.max(.5,Math.round(kwh/kw*2)/2),1).replace(',0','')} uur aan een ${kw} kW-lader</small></b></div></div>`;
 /* Wat kost het per maand, in dezelfde opmaak als Alle kosten op de startpagina:
    kop links, rechts balken per onderdeel waarvan het gekozen onderdeel kleurt, knoppen met het verschil en een korte uitleg */
 const ml=mLast(r),mx2=Math.max(ml.d.tot,ml.e.tot),dM=ml.d.tot-ml.e.tot,ri=v('xri'),lsD=lsOn('D'),lsE=lsOn('E'),mc=[['lening',lsD&&lsE?uL('Lease','Lease'):lsD||lsE?uL('Lening of lease','Loan or lease'):uL('Lening','Loan')],...ml.cats.map(z=>[z[0],{en:uL('Energie','Energy'),ond:uL('Onderhoud','Maintenance'),ver:uL('Verzekering','Insurance'),hef:uL('Heffing','Road charge')}[z[0]]||z[1]])];
 if(!mc.some(c=>c[0]===mlCat))mlCat='lening';
 const mbar=(o,cl,t)=>`<div class="uvb ${cl}"><span>${t}</span><div class="uvt">${mc.map(c=>`<i data-mlc="${c[0]}" title="${c[1]}"${c[0]===mlCat?' class="on"':''} style="width:${Math.max(0,o[c[0]])/mx2*100}%"></i>`).join('')}</div><b>${eur(o.tot)}</b></div>`;
 const xr=(ml.e.lening-ml.d.lening)*L*12-(ml.e.P-ml.d.P),g=v;
 const mlx={
  lening:lsD||lsE?[[tn(dn),ml.d,lsD],[tn(en),ml.e,lsE]].map(([n,q,ls])=>ls?uL(`${n}: ${eur(q.lening)} per maand`,`${n}: ${eur(q.lening)} a month`):uL(`${n}: ${eur(q.P)} geleend tegen ${nf(ri,1)}% rente in ${L} jaar, ${eur(q.lening)} per maand`,`${n}: ${eur(q.P)} borrowed at ${nf(ri,1)}% over ${L} years, ${eur(q.lening)} a month`)).join('. ')+'.':uL(`${eur(ml.e.P)} geleend voor elektrisch en ${eur(ml.d.P)} voor diesel, tegen ${nf(ri,1)}% rente in ${L} jaar: ${eur(ml.e.lening)} tegenover ${eur(ml.d.lening)} per maand. Daarvan is ${eur(xr/L/12)} per maand extra rente. Het eigen deel en de subsidie zitten er niet in.`,`${eur(ml.e.P)} borrowed for electric and ${eur(ml.d.P)} for diesel, at ${nf(ri,1)}% interest over ${L} years: ${eur(ml.e.lening)} against ${eur(ml.d.lening)} a month. Of that, ${eur(xr/L/12)} a month is extra interest. Your own contribution and the grant are not included.`),
  en:uL(`${nf(r.km)} km per jaar: ${eur(ml.d.en)} per maand aan diesel tegenover ${eur(ml.e.en)} aan stroom${r.ereV?', na de ERE-opbrengst':''}.`,`${nf(r.km)} km a year: ${eur(ml.d.en)} a month on diesel against ${eur(ml.e.en)} on electricity${r.ereV?', after ERE income':''}.`),
  ond:uL(`${eur(g('oD'),2)} tegenover ${eur(g('oE'),2)} per km. Een elektromotor heeft geen olie, filters of koppeling.`,`${eur(g('oD'),2)} against ${eur(g('oE'),2)} per km. An electric motor has no oil, filters or clutch.`),
  ver:uL(`Het bedrag per jaar gedeeld door twaalf: ${eur(g('vD'))} tegenover ${eur(g('vE'))} per jaar.`,`The annual amount divided by twelve: ${eur(g('vD'))} against ${eur(g('vE'))} a year.`),
  hef:uL(`${nf(r.kmH)} km per jaar met vrachtwagenheffing: ${eur(g('tD'),3)} tegenover ${eur(g('tE'),3)} per km.`,`${nf(r.kmH)} km a year with the Dutch truck charge: ${eur(g('tD'),3)} against ${eur(g('tE'),3)} per km.`)}[mlCat];
 const rr=lsD&&lsE?'':uL(` bij ${nf(ri,1)}% rente`,` at ${nf(ri,1)}% interest`);
 const mlh=Math.abs(dM)<1?uL('Diesel en elektrisch kosten per maand hetzelfde','Diesel and electric cost the same per month'):dM>0?uL(`Elektrisch <b>${eur(dM)}</b> goedkoper per maand`,`Electric <b>${eur(dM)}</b> cheaper per month`)+rr:uL(`Diesel <b class="d">${eur(-dM)}</b> goedkoper per maand`,`Diesel <b class="d">${eur(-dM)}</b> cheaper per month`)+rr;
 const mlSec=`<section class="uvS mlS" data-no-translate><header><h2>${uL('Wat kost het per maand','What it costs per month')}</h2><p data-r="mlh">${mlh}</p></header>
<div><div data-r="mlb">${mbar(ml.d,'dz',tn(dn))}${mbar(ml.e,'el',tn(en))}</div><div class="uvc" data-r="mlc">${mc.map(c=>`<button type="button" data-mlc="${c[0]}" aria-pressed="${c[0]===mlCat}"><span>${c[1]}</span>${uvDiff(ml.d[c[0]],ml.e[c[0]],'m'+c[0],1)}</button>`).join('')}</div><p class="uvx" data-r="mlx">${mlx}</p></div></section>`;
 return[mlSec+`<section class="nS nS2"><div class="nA"><p class="nk">Per maand</p><div class="xt" data-r="mnd">${mnd}</div></div><div class="nB"><p class="nk">Doorberekenen aan je opdrachtgever</p>${ritS}<div class="xt" data-r="rit">${pr}</div></div></section>`+kopS,
  `<section class="nS nS2"><div class="nA">${lE?kmS:`<p class="nk">Als de restwaarde tegenvalt</p><div class="xt" data-r="rw">${rwT}</div><div class="nF" data-r="rwf">${rwF}</div>`}</div><div class="nB"><p class="nk">Actieradius en dagrit</p><div data-r="rg">${rgH}</div></div></section>`];
}
document.addEventListener('input',e=>{const t=e.target;if(!t.dataset||t.dataset.rit===undefined)return;RIT=+t.value;t.style.setProperty('--f',(RIT-20)/780);render()});
document.addEventListener('change',e=>{if(e.target.dataset&&e.target.dataset.rit!==undefined)e.target.blur()});
/* Tijdens het slepen alleen de cijfers bijwerken, anders verdwijnt de schuif onder je vinger */
/* Chrome stuurt bij een klik naast de knop al een input voordat de schuif focus heeft, dus onthoud ook de schuif onder de muis of vinger */
let rHold=null;
document.addEventListener('pointerdown',e=>{if(e.target.type==='range')rHold=e.target},true);
['pointerup','pointercancel'].forEach(t=>addEventListener(t,()=>{rHold=null},true));
/* Bedragen tellen mee: een bedrag met data-tw="naam" rolt van de oude naar de nieuwe waarde in plaats van te verspringen */
function twNum(t){t=String(t);const en=document.documentElement.lang==='en',th=en?',':'.',dc=en?'.':',',m=t.match(en?/\d[\d,]*(?:\.\d+)?/:/\d[\d.]*(?:,\d+)?/);if(!m)return null;return{v:parseFloat(m[0].split(th).join('').replace(dc,'.')),d:(m[0].split(dc)[1]||'').length,a:t.slice(0,m.index),b:t.slice(m.index+m[0].length)}}
function twText(el,to,from,D=550){
 cancelAnimationFrame(el._twr);const A=twNum(from??el.textContent),B=twNum(to);
 if(!A||!B||A.d!==B.d||A.a!==B.a||A.b!==B.b||A.v===B.v||reduced()){el.textContent=to;return}
 el.textContent=from??el.textContent;const t0=performance.now();
 const step=now=>{const k=Math.min(1,(now-t0)/D),e=1-Math.pow(1-k,3);if(k<1){el.textContent=B.a+nf(A.v+(B.v-A.v)*e,B.d)+B.b;el._twr=requestAnimationFrame(step)}else el.textContent=to};
 el._twr=requestAnimationFrame(step);
}
/* Alleen "Elektrisch tot € … per jaar goedkoper" (startpagina) en "Elektrisch € … goedkoper" (resultaten) tellen door; alle andere bedragen staan direct goed. */
const TWQ='[data-tw="hx"],[data-tw="hv"]';
function twSet(el,put){
 const old={};el.querySelectorAll(TWQ).forEach(n=>old[n.dataset.tw]=n.textContent);
 put();
 el.querySelectorAll(TWQ).forEach(n=>{const o=old[n.dataset.tw];if(o!=null&&o!==n.textContent)twText(n,n.textContent,o)});
}
function rSet(el,h){twSet(el,()=>rSet0(el,h))}
/* Eerste keer in beeld: bedragen tellen op vanaf 0. Per bedrag en per pagina één keer per bezoek; niet zolang er een venster (zoals de stappen) open staat. */
const TWI=new Set();let twIO=null;
function twIntro(root){
 if(!root||reduced()||!('IntersectionObserver' in window))return;
 twIO=twIO||new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const n=e.target,k=n._twk;if(document.querySelector('dialog[open]'))return;twIO.unobserve(n);if(TWI.has(k)||!n.isConnected)return;TWI.add(k);const B=twNum(n.textContent);if(B&&B.v)twText(n,n.textContent,B.a+nf(0,B.d)+B.b,1100)}),{threshold:.6});
 root.querySelectorAll(TWQ).forEach(n=>{n._twk=root.id+':'+n.dataset.tw;if(!TWI.has(n._twk)){twIO.unobserve(n);twIO.observe(n)}});
}
/* Sluit een venster, kijk dan opnieuw welke bedragen in beeld zijn */
document.addEventListener('close',()=>setTimeout(()=>['home','uv','res','resX'].forEach(id=>twIntro($(id))),50),true);
function rSet0(el,h){
 const a=rHold&&rHold.isConnected?rHold:document.activeElement;
 if(a&&a.type==='range'&&el.contains(a)){const t=document.createElement('div');t.innerHTML=h;t.querySelectorAll('[data-r]').forEach(n=>{const o=el.querySelector(`[data-r="${n.dataset.r}"]`);if(!o)return;if(o.innerHTML!==n.innerHTML)o.innerHTML=n.innerHTML;o.className=n.className});el._h=null;return}
 setH(el,h);
}
document.addEventListener('input',e=>{const r=e.target;if(!r.dataset||!r.dataset.rin)return;const o=$(r.dataset.rin);o.value=r.value;r.style.setProperty('--f',(r.value-r.min)/(r.max-r.min||1));o.dispatchEvent(new Event('input',{bubbles:true}))});
document.addEventListener('change',e=>{if(e.target.dataset&&e.target.dataset.rin)e.target.blur()});
document.addEventListener('click',e=>{const b=e.target.closest('[data-rper]');if(b){RP=b.dataset.rper;render()}});
/* Bedrag bij de balken: hover met de muis, tik op een telefoon */
function xTip(t,x,y){let q=$('xtip');if(!q){q=document.createElement('div');q.id='xtip';q.className='xtip';q.setAttribute('role','status');document.body.appendChild(q)}
 if(!t){q.hidden=true;return}q.textContent=t;q.hidden=false;const w=q.offsetWidth;q.style.left=Math.max(8,Math.min(x-w/2,innerWidth-w-8))+'px';q.style.top=(y-q.offsetHeight-12)+'px'}
document.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;const b=e.target.closest&&e.target.closest('[data-tip2]');if(b)xTip(b.dataset.tip2,e.clientX,e.clientY);else if($('xtip')&&!$('xtip').hidden)xTip(null)});
document.addEventListener('click',e=>{const b=e.target.closest('[data-tip2]');if(b){const r=b.getBoundingClientRect();xTip(b.dataset.tip2,r.left+r.width/2,r.top)}else if($('xtip'))xTip(null)});
addEventListener('scroll',()=>{if($('xtip')&&!$('xtip').hidden)xTip(null)},{passive:true});

/* ===== Interactie ===== */
document.addEventListener('click',e=>{
 const s=e.target.closest('[data-step]');if(s){openWz(s.dataset.step);return}
 const g0=e.target.closest('[data-go]');if(g0){go(g0.dataset.go);return}
 const vt=e.target.closest('[data-vt]');if(vt){if(vt.dataset.vt!==vtype){applyType(vt.dataset.vt);tolSel.clear();TOL.forEach(c=>$('k_'+c[0]).value=0);touched=false;render()}return}
 const u=e.target.closest('[data-u]');if(u){unit=u.dataset.u;render();return}
 const kq=e.target.closest('[data-km]');if(kq){$('km').value=kq.dataset.km;$('km').dispatchEvent(new Event('input',{bubbles:true}));return}
 const kh=e.target.closest('[data-kmh]');if(kh){$('kmH').max=v('km');$('kmH').value=Math.round(+kh.dataset.kmh*v('km')/1000)*1000;$('kmH').dispatchEvent(new Event('input',{bubbles:true}));return}
 const dw=e.target.closest('[data-dw]');if(dw){const was=lsOn('D');$('lsD').value='0';finBack();if($('dw').value!==dw.dataset.dw){$('dw').value=dw.dataset.dw;dieselAuto(true);touched=true;render()}else if(was){touched=true;render()}return}
 const dwl=e.target.closest('[data-dwl]');if(dwl){if($('dwl').value!==dwl.dataset.dwl){$('dwl').value=dwl.dataset.dwl;touched=true;dieselPaint();render()}return}
 const nw=e.target.closest('[data-nw]');if(nw){const was=lsOn('E');$('lsE').value='0';finBack();if($('nw').value!==nw.dataset.nw){$('nw').value=nw.dataset.nw;usedAuto(true);touched=true;render()}else if(was){touched=true;render()}return}
 /* Leasen: altijd een nieuw voertuig, dus terug van huidige diesel of gebruikt elektrisch */
 /* Kopen tegenover leasen is alleen eerlijk met de kosten van het geld erbij: Financiering gaat aan, zichtbaar bij Extra kosten */
 const ls=e.target.closest('[data-ls]');if(ls){const k=ls.dataset.ls;if(!lsOn(k)){$('ls'+k).value='1';if(!lsOn(k==='D'?'E':'D')&&!ck('xFin')){$('xFin').checked=true;finAuto=true}if(k==='D'&&$('dw').value!=='n'){$('dw').value='n';dieselAuto(true)}if(k==='E'&&$('nw').value!=='n'){$('nw').value='n';usedAuto(true)}touched=true;render()}return}
 const le=e.target.closest('[data-lest]');if(le){$('lq'+le.dataset.lest).value='0';touched=true;render();return}
 const cl=e.target.closest('[data-cls]');if(cl){$('cls').value=cl.dataset.cls;touched=true;render();return}
 const tol=e.target.closest('[data-tol]');if(tol){const k=tol.dataset.tol;touched=true;if(tolSel.has(k)){tolSel.delete(k);$('k_'+k).value=0}else tolSel.add(k);render();return}
 const g=e.target.closest('button[data-gr]');if(g){$('gr').value=g.dataset.gr;touched=true;render();return}
 const ad=e.target.closest('[data-add]');if(ad){const k=ad.dataset.add;if(OPTSW[k]&&!ck(OPTSW[k]))$(OPTSW[k]).checked=true;touched=true;render();openWz(k);return}
 const xg=e.target.closest('[data-xgo]');if(xg){e.preventDefault();navTo('/uitgebreid/');if(isFresh())openWz('use');return}
 if(e.target.closest('[data-reset]')){reset();return}
 const j=e.target.closest('[data-jump]');if(j){const t=$(j.dataset.jump);if(t.closest('.faq'))t.classList.add('open');t.scrollIntoView({behavior:reduced()?'auto':'smooth'});return}
 const fh=e.target.closest('.faq section>h2');if(fh){fh.parentNode.classList.toggle('open');fh.setAttribute('aria-expanded',fh.parentNode.classList.contains('open'));return}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')menu(false)});


/* Uitlegvenster */
let qtBtn=null;
function tipClose(back){const q=$('qt');if(!q||q.hidden)return;q.hidden=true;if(qtBtn){qtBtn.setAttribute('aria-expanded','false');if(back)qtBtn.focus()}qtBtn=null}
function tipPlace(){
 const q=$('qt');if(!qtBtn||!q||q.hidden||innerWidth<=640)return;const r=qtBtn.getBoundingClientRect();
 if(r.bottom<0||r.top>innerHeight){tipClose(false);return}
 const w=q.offsetWidth,h=q.offsetHeight;let top=r.bottom+8;if(top+h>innerHeight-8)top=Math.max(8,r.top-h-8);q.style.left=Math.max(8,Math.min(r.left-14,innerWidth-w-8))+'px';q.style.top=top+'px';
}
function tipOpen(btn){
 const k=btn.dataset.tip,tp=TIPS[k];if(!tp)return;if(qtBtn===btn){tipClose(true);return}tipClose(false);
 let q=$('qt');if(!q){q=document.createElement('div');q.id='qt';q.className='qt';q.setAttribute('role','dialog');q.tabIndex=-1;q.hidden=true}
 (btn.closest('dialog')||document.body).appendChild(q);
 q.setAttribute('aria-label',tp.t);
 q.innerHTML=`<p class="qtt">${tp.t}</p>${tp.b.map(x=>`<p>${x}</p>`).join('')}${tp.l?`<div class="qtl">${tp.l.map(a=>a[1][0]==='/'?`<a href="${a[1]}">${a[0]} <span aria-hidden="true">→</span></a>`:`<a href="${a[1]}" target="_blank" rel="noopener">${a[0]} <span aria-hidden="true">↗</span></a>`).join('')}</div>`:''}<button type="button" class="qtx" aria-label="Sluiten"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>`;
 q.hidden=false;qtBtn=btn;btn.setAttribute('aria-expanded','true');
 tipPlace();q.focus({preventScroll:true});
}
document.addEventListener('click',e=>{
 const b=e.target.closest('.qi');if(b){e.preventDefault();e.stopPropagation();tipOpen(b);return}
 if(e.target.closest('.qtx')){tipClose(true);return}
 if(qtBtn&&!e.target.closest('#qt'))tipClose(false);
},true);
/* ± zet een bandbreedte van 10% aan en opent de keuze ernaast; een keuze klapt hem weer in tot een label */
let srOpen=null;
const srPct=(id,p)=>{if(p){const d=v(id)*p/100;SR[id]=[d,d,p]}else delete SR[id];touched=true;render()};
document.addEventListener('click',e=>{
 const b=e.target.closest('.qs');if(b){e.preventDefault();const id=b.dataset.sens;if(!(id in SR))SR[id]=[v(id)*.1,v(id)*.1,10];srOpen=id;touched=true;render();return}
 const r=e.target.closest('[data-rp]');if(r){srOpen=null;srPct(r.dataset.for,+r.dataset.rp);return}
 if(srOpen&&!e.target.closest('.rxp')){srOpen=null;render()}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&srOpen){srOpen=null;render()}});
document.addEventListener('input',e=>{const r=e.target;if(!r.classList||!r.classList.contains('rx'))return;e.stopPropagation();const id=r.dataset.for,x=+r.value;SR[id].length=2;SR[id][r.dataset.x==='lo'?0:1]=Math.max(0,r.dataset.x==='lo'?v(id)-x:x-v(id));touched=true;render()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&qtBtn){e.preventDefault();e.stopPropagation();tipClose(true)}},true);
addEventListener('scroll',tipPlace,{passive:true});
addEventListener('resize',()=>tipClose(false));

/* Klein scorebord zodra het grote uit beeld is */
function mini(){
 // Alleen meten op de rekenpagina's: elders kost de layoutmeting tijd zonder dat er iets te tonen is
 if(page!=='calc'&&page!=='uitgebreid'){$('mini').classList.remove('show');$('fcta').hidden=true;return}
 const w=$(page==='uitgebreid'?'resX':'res'),t=w.querySelector('.nS')||w,b=t.getBoundingClientRect(),show=(page==='calc'&&!isFresh()||page==='uitgebreid')&&b.top<64;$('mini').classList.toggle('show',show);
 const c=document.querySelector('.bcta'),r=c&&c.getBoundingClientRect();$('fcta').hidden=!(c&&page==='calc'&&!$('wz').open&&(r.bottom<64||r.top>innerHeight))}
addEventListener('scroll',mini,{passive:true});


/* ===== Pagina's ===== */
function setView(){render()}
/* Elke pagina heeft een echt pad (/overstapgids/laden/), zodat zoekmachines ze los vinden. Oude #-links worden omgezet. */
const PAGES={'':'calc',simpel:'calc',calculator:'calc',top:'calc',uitgebreid:'uitgebreid',faq:'faq','veelgestelde-vragen':'faq',overstapgids:'faq',gids:'gids',nieuws:'nieuws','over-ons':'over',privacy:'privacy',modellen:'modellen',vlootanalyse:'vloot',vloot:'vloot',restwaarde:'restwaarde'};
const SEO=(()=>{try{return JSON.parse($('seo').textContent)}catch(e){return{routes:{}}}})();
const PATHS={calc:'/',uitgebreid:'/uitgebreid/',modellen:'/modellen/',faq:'/overstapgids/',nieuws:'/nieuws/',over:'/over-ons/',privacy:'/privacy/',vloot:'/vlootanalyse/',restwaarde:'/restwaarde/'};
const routeEntry=(p,g)=>SEO.routes[p==='gids'?'gids/'+g:p==='modellen'&&g&&g!=='all'?'modellen/'+g:p]||SEO.routes[p]||SEO.routes.calc;
const pathForLanguage=(p,g,l)=>{const r=routeEntry(p,g);return l==='en'?r.enPath:r.path};
const pathOf=(p,g)=>pathForLanguage(p,g,document.documentElement.lang);
const routeFromKey=k=>k.startsWith('gids/')?['gids',k.slice(5)]:k.startsWith('modellen/')?['modellen',k.slice(9)]:[k,null];
function parsePath(pn){const p=pn.replace(/\/index\.html$/,'/').replace(/\/?$/,'/');const k=Object.keys(SEO.routes).find(k=>SEO.routes[k].path===p||SEO.routes[k].enPath===p);return k?routeFromKey(k):null}
function localizedURL(href,language=document.documentElement.lang){const u=new URL(href,location.href);if(u.origin!==location.origin)return href;const r=parsePath(u.pathname);if(!r)return href;u.pathname=pathForLanguage(...r,language);return u.pathname+u.search+u.hash}
window.sodLocalizedURL=localizedURL;
function parseHash(){let h='';try{h=decodeURIComponent(location.hash.slice(1))}catch(e){}
 if(h.startsWith('gids/'))return['gids',h.slice(5)];return h&&h in PAGES?[PAGES[h],null]:null}
const routeKey=()=>page==='gids'?'gids/'+gid:{calc:'calc',faq:'faq',over:'over-ons',vloot:'vlootanalyse'}[page]||page;
function navTo(url){history.pushState(null,'',localizedURL(url));route(false)}
/* Grapje: klik op de schakelaar in het logo en hij springt naar diesel */
document.addEventListener('click',e=>{if(!e.target.closest('.top .bmark,.foot .bmark'))return;e.preventDefault();e.stopPropagation();const d=document.documentElement.classList.toggle('sod-d');track('logo_toggle',{diesel:d})},true);
function setMeta(p,g){
 const entry=routeEntry(p,g),r=document.documentElement.lang==='en'?entry.en:entry,u='https://stekkerofdiesel.nl'+pathOf(p,g);
 document.title=r.title||BRAND;
 const set=(sel,a,v)=>{const e=document.querySelector(sel);if(e&&v)e.setAttribute(a,v)};
 set('meta[name=description]','content',r.desc);set('link[rel=canonical]','href',u);
 set('meta[name=robots]','content',entry.noindex?'noindex,follow':'index,follow,max-image-preview:large,max-snippet:-1');
 for(const l of ['nl','en','x-default'])set('link[hreflang="'+l+'"]','href','https://stekkerofdiesel.nl'+pathForLanguage(p,g,l==='en'?'en':'nl'));
 document.querySelectorAll('[data-lang]').forEach(a=>{a.href=pathForLanguage(p,g,a.dataset.lang)});
 set('meta[property="og:url"]','content',u);set('meta[property="og:title"]','content',r.title);set('meta[property="og:description"]','content',r.desc);
 set('meta[name="twitter:title"]','content',r.title);set('meta[name="twitter:description"]','content',r.desc);
 const graph=window.SOD_PAGE_SCHEMA?.[new URL(u).pathname],structured=document.querySelector('script[type="application/ld+json"]');if(graph&&structured)structured.textContent=JSON.stringify(graph);
}
function route(first){
 let r=parseHash();
 if(r)history.replaceState(null,'',pathOf(...r)+location.search);
 else r=parsePath(location.pathname)||['calc',null];
 let [p,g]=r;const prevP=page,prevG=gid;
 if(p==='uitgebreid'&&isFresh()){p='calc';history.replaceState(null,'',pathOf('calc')+location.search)}
 page=p;
 if(p!=='calc'&&p!=='uitgebreid'&&$('wz').open)$('wz').close();
 if(p!=='modellen'&&$('mDlg').open)$('mDlg').close();
 document.querySelectorAll('.page').forEach(s=>s.hidden=s.dataset.page!==p);
 document.querySelectorAll('[data-nav]').forEach(a=>a.dataset.nav===(p==='uitgebreid'?'calc':p)?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current'));
 if(p==='calc'||p==='uitgebreid')setView();
 if(p==='gids')gShow(g);
 setMeta(p,p==='gids'?gid:g);
 menu(false);tipClose(false);
 if(p==='modellen'){mCat=g||'all';mPaint()}else $('mBar').hidden=true;
 if(p==='restwaarde')rwPaint();
 if(p==='vloot')vzTaart();
 if(!first&&(p!==prevP||p==='gids'&&gid!==prevG)){scrollTo(0,0);const h1=[...document.querySelectorAll(`.page[data-page="${p}"] h1`)].find(e=>!e.closest('[hidden]'));if(h1)h1.focus({preventScroll:true})}
 mini();ads();
}
/* Interne links openen zonder herladen */
document.addEventListener('click',e=>{
 if(e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||!e.target.closest)return;
 const a=e.target.closest('a[href^="/"]');if(!a||a.target||a.hasAttribute('download')||a.hasAttribute('data-lang'))return;
 const u=new URL(a.href);if(u.origin!==location.origin||!parsePath(u.pathname))return;
 e.preventDefault();if(u.pathname+u.search!==location.pathname+location.search||location.hash)navTo(u.pathname+u.search+u.hash);else menu(false);
 if(u.hash){const target=document.getElementById(decodeURIComponent(u.hash.slice(1)));if(target)target.scrollIntoView({block:'start'})}
});
/* AdSense: zolang AD_SLOT leeg is blijven de vakken placeholder. Vul pas als de pagina zichtbaar is, anders heeft het blok geen breedte. */
const AD_CLIENT='ca-pub-5802360734201634',AD_SLOT='';
function ads(){
 if(!AD_SLOT)return;
 if(!document.getElementById('sod-ads')){const lib=document.createElement('script');lib.id='sod-ads';lib.async=true;lib.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+AD_CLIENT;lib.crossOrigin='anonymous';document.head.appendChild(lib)}
 document.querySelectorAll(`.page[data-page="${page}"] .ad:not(.on)`).forEach(a=>{
  a.classList.add('on');a.innerHTML=`<ins class="adsbygoogle" style="display:block" data-ad-client="${AD_CLIENT}" data-ad-slot="${AD_SLOT}" data-ad-format="auto" data-full-width-responsive="true"></ins>`;
  try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){}
 })
}
addEventListener('hashchange',()=>{if(parseHash())route(false)});
addEventListener('popstate',()=>route(false));
function menu(open){$('nav').classList.toggle('open',open);$('mnu').setAttribute('aria-expanded',open)}
$('mnu').onclick=()=>menu(!$('nav').classList.contains('open'));

/* Delen: een link met precies deze berekening, plus een korte samenvatting */
function stateObj(){const o={};document.querySelectorAll(':is(#calc,#wz) input[id],:is(#calc,#wz) select[id]').forEach(e=>{if(e.classList.contains('slin'))return;if(e.type==='checkbox'){if(e.checked!==e.defaultChecked)o[e.id]=e.checked?1:0}else if(e.tagName==='SELECT'||e.type==='hidden'||e.value!==e.defaultValue)o[e.id]=e.value});return o}
const b64e=s=>btoa(unescape(encodeURIComponent(s))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const b64d=s=>decodeURIComponent(escape(atob(s.replace(/-/g,'+').replace(/_/g,'/'))));
function shareURL(){return location.href.split(/[?#]/)[0]+'?s='+b64e(JSON.stringify({t:vtype,v:stateObj(),...(Object.keys(SR).length?{sr:SR}:{})}))+'&lang='+document.documentElement.lang}
const srLoad=o=>{Object.keys(SR).forEach(k=>delete SR[k]);Object.entries(o||{}).forEach(([id,a])=>{if(SENS[id]&&Array.isArray(a))SR[id]=a.slice(0,3).map(Number)})};
function summ(){const r=calcX(),d=r.td-r.te,m=modelActive();return`Diesel of elektrisch: ${T().w}${m?'\nModelbasis: '+mName(m):''}\n${nf(r.km)} km per jaar, ${r.L} jaar\n\nDiesel: ${eur(r.td/r.km,2)} per km, ${eur(r.td)} per jaar\nElektrisch: ${eur(r.te/r.km,2)} per km, ${eur(r.te)} per jaar\n${d>=0?'Elektrisch':'Diesel'} is ${eur(Math.abs(d)*r.L)} goedkoper over ${r.L} jaar.${BX?`\nBandbreedte: ${bandTxt(band())} per jaar.`:''}\n\nBekijk de berekening: ${shareURL()}`}
function fromURL(){try{const q=new URLSearchParams(location.search).get('s');if(!q)return false;const s=JSON.parse(b64d(q));if(VT[s.t])applyType(s.t);srLoad(s.sr);Object.entries(s.v||{}).forEach(([id,val])=>{const e=$(id);if(!e)return;if(e.type==='checkbox')e.checked=!!+val;else setNum(e,val)});fitRanges();touched=true;history.replaceState(null,'',location.href.split('?')[0].split('#')[0]+location.hash);return true}catch(e){return false}}
async function copyText(t){
 if(!t.trim().startsWith('<iframe'))t=window.sodText(t);
 try{await navigator.clipboard.writeText(t);return true}catch(e){}
 try{const a=document.createElement('textarea');a.value=t;a.setAttribute('readonly','');a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();const ok=document.execCommand('copy');a.remove();return ok}catch(e){return false}
}
document.addEventListener('click',async e=>{
 const ec=e.target.closest('[data-embcopy]');if(ec){const ok=await copyText($('embC').textContent);ec.textContent=ok?'Gekopieerd':'Lukte niet';setTimeout(()=>{ec.textContent='Kopieer'},2500);track('embed_copy',{});return}
 const c=e.target.closest('[data-share]');
 if(c){const ok=await copyText(summ()),s=c.querySelector('span');s.textContent=ok?'Link gekopieerd':'Lukte niet';setTimeout(()=>{s.textContent='Deel'},2500);return}
 if(e.target.closest('[data-print]')){pdfAsk();return}
});
/* PDF-rapport (ontwerp A): pagina 1 de uitkomst, je uitgangspunten, de kosten per jaar en de opgetelde kosten met de terugverdientijd.
   Pagina 2 wat het per maand kost, drie kerncijfers, de gevoeligheid en de restwaarde. */
function rptChart(pb,L){
 const{upD,upE,opD,opE}=pb,W=680,H=170,mL=54,mR=70,mT=12,mB=22,cD=t=>upD+opD*t,cE=t=>upE+opE*t;
 const hi0=Math.max(cD(L),cE(L),cD(0),cE(0)),raw=hi0/4||1,mg=Math.pow(10,Math.floor(Math.log10(raw))),stp=[1,2,2.5,5,10].map(m=>m*mg).find(m=>m>=raw),hi=Math.ceil(hi0/stp)*stp,nT=Math.round(hi/stp);
 const X=t=>mL+t/L*(W-mL-mR),Y=c=>mT+(1-c/(hi||1))*(H-mT-mB),ln=(f,c)=>`<path d="M${X(0)},${Y(f(0))}L${X(L)},${Y(f(L))}" stroke="${c}" stroke-width="2.6" fill="none"/>`;
 const grid=Array.from({length:nT+1},(_,i)=>{const c=i*stp,y=Y(c);return`<line x1="${mL}" x2="${W-mR}" y1="${y}" y2="${y}" stroke="#15171A" stroke-opacity=".08"/><text x="${mL-8}" y="${y+3.5}" text-anchor="end">€ ${c?nf(Math.round(c/1000))+'k':0}</text>`}).join('');
 const ticks=Array.from({length:L+1},(_,t)=>`<text x="${X(t)}" y="${H-5}" text-anchor="${t===0?'start':'middle'}">${t===0?'Start':t+' jr'}</text>`).join('');
 const lab=(f,c,t,dy)=>`<text x="${X(L)+8}" y="${Y(f(L))+4+dy}" style="font:600 11px var(--text);fill:${c}">${t}</text>`,gap=Y(cE(L))-Y(cD(L)),dy=Math.abs(gap)<14?(gap>=0?7:-7):0;
 return`<svg viewBox="0 0 ${W} ${H}">${grid}${ticks}${ln(cD,'#F2A33A')}${ln(cE,'#0A8F5B')}${lab(cD,'#A9620A',$('dw').value==='h'&&!lsOn('D')?'Huidige diesel':'Diesel',-dy)}${lab(cE,'#07734A','Elektrisch',dy)}</svg>`;
}
function rptHTML(){
 const x=calcX(),b=x.b,L=x.L,km=x.km,d=x.td-x.te,cheap=d>=0,pc=Math.abs(d)/x.td*100,even=pc<0.5,m=modelActive(),truck=T().truck,pb=payback(x),bd=BX&&band();
 const dN=dName(),eN=lsOn('E')?'Elektrisch lease':'Elektrisch',lD=lsOn('D'),lE=lsOn('E'),used=$('nw').value==='g'&&!lE,date=new Intl.DateTimeFormat(document.documentElement.lang==='en'?'en-GB':'nl-NL',{day:'numeric',month:'long',year:'numeric'}).format(new Date());
 const mi=n=>(n<0?'−':'')+'€ '+nf(Math.abs(n)),dot=c=>`<i class="${c}"></i>`;
 /* Kosten per onderdeel, per jaar */
 const on={fin:finOn(),lad:ck('xLad'),tij:ck('xOw'),zon:ck('xZon'),tol:truck&&tolSel.size>0};
 const list=ROWS.filter(q=>truck||q[0]!=='hef').concat(XROWS.filter(q=>on[q[0]])),mx=Math.max(1,...list.map(q=>Math.max(x.D[q[0]],x.E[q[0]])));
 const df=n=>Math.abs(n)<.5?'<td>—</td>':`<td class="${n<0?'good':'bad'}">${n<0?'−':'+'} € ${nf(Math.abs(n))}</td>`;
 const rows=list.map(([c,l])=>`<tr><td>${c==='afs'?afsLab():l.replace(/­/g,'')}</td><td class="rpb"><i class="d" style="width:${Math.max(0,x.D[c])/mx*100}%"></i><i class="e" style="width:${Math.max(0,x.E[c])/mx*100}%"></i></td><td>${inLs(c,'D')?'in lease':mi(x.D[c])}</td><td>${inLs(c,'E')?'in lease':mi(x.E[c])}</td>${inLs(c,'D')||inLs(c,'E')?'<td>—</td>':df(x.E[c]-x.D[c])}</tr>`).join('');
 /* Kerncijfers */
 const sv=o=>{const q=calcX(o);return q.td-q.te},kb=kmBreak(),sD=sv({dp:v('dp')+1})-d,dpB=sD>0?Math.max(0,v('dp')-d/sD):null,range=v('acc')/(v('le')/100);
 const be=pb.be,M=be===null?0:Math.round(be*12),pbT=be===null?'Niet terugverdiend':be===0?'Direct':[Math.floor(M/12)?Math.floor(M/12)+' jaar':'',M%12?M%12+' mnd':''].filter(Boolean).join(' ')||'0 mnd';
 const tile=(l,v,s)=>`<div><small>${l}</small><b>${v}</b>${s?`<span>${s}</span>`:''}</div>`;
 /* Uitgangspunten: alles wat je hebt ingevuld, in drie kolommen */
 const fv=id=>fmtV(id,v(id));
 const gen=[['Voertuig',T().n+(truck&&vtype==='bakwagen'?' · '+clsOf():'')],m&&['Model',mName(m)],['Kilometers per jaar',nf(km)+' km'],truck&&['Waarvan met heffing of tol',nf(b.kmH)+' km'],['Rijdagen per jaar',nf(v('wd'))],[jrLab(),L+' jaar'],['Subsidie',b.sub>0?`${regLabel()} · ${eur(b.sub)}${lE?' in de leaseprijs':''}`:regLabel()],ck('aERE')&&['ERE-opbrengst',fv('ere')],['Bruikbare accu',fv('acc')],['Actieradius',`± ${nf(Math.round(range/5)*5)} km`]].filter(Boolean);
 const lsI=s=>[ck('lo'+s)&&'onderhoud',ck('lv'+s)&&'verzekering'].filter(Boolean).join(' en ')||'alleen het voertuig';
 const pair=[(lD||lE)&&['Leaseprijs per maand',lD?eur(lpNow('D')):'kopen',lE?eur(lpNow('E')):'kopen'],(lD||lE)&&['In de leaseprijs',lD?lsI('D'):'—',lE?lsI('E'):'—'],[$('dw').value==='h'&&!lD?'Waarde nu / aanschaf':'Aanschafprijs',lD?'lease':eur(v('pD')),lE?'lease':eur(v('pE'))+(used?' · gebruikt':'')],['Restwaarde',lD?'—':v('rw')+'%',lE?'—':v('rwE')+'%'],['Verbruik per 100 km',nf(v('ld'),1)+' l',nf(v('le'),1)+' kWh'],['Energieprijs',eur(v('dp'),2)+' per l',eur(spNet(v),2)+' per kWh'],['Onderhoud per km',eur(v('oD'),2),eur(v('oE'),2)],['Verzekering per jaar',eur(v('vD')),eur(v('vE'))],truck&&['Heffing per km',eur(v('tD'),3),eur(v('tE'),3)]].filter(Boolean);
 const ext=[on.fin&&['Financiering',`${nf(v('xfs'))}% geleend tegen ${nf(v('xri'),1)}%, eigen geld ${nf(v('xre'),1)}%${finWho()}`],on.lad&&['Laadpaal',`${eur(v('xl0'))} investering, ${eur(v('xla'))} aansluiting${x.spr>0?`, ${eur(x.spr)} SPRILA`:''}`],on.tij&&['Laden onderweg',`${nf(v('xos'))}% tegen ${eur(v('xop'),2)} per kWh`],on.zon&&['Zonnepanelen',`${nf(v('xzk'))} kWp, ${nf(v('xzs'))}% voor je voertuigen`],on.tol&&['Tol buitenland',TOL.filter(c=>v('k_'+c[0])>0).map(c=>`${c[1]} ${nf(v('k_'+c[0]))} km`).join(', ')],bd&&['Bandbreedte',Object.keys(SR).map(id=>`${SENS[id][0]} ± ${nf(SR[id][2]||Math.round(SR[id][1]/v(id)*100))}%`).join(', ')]].filter(Boolean);
 const uit=[...gen,...pair.map(q=>[q[0],q[1]+' / '+q[2]]),...ext],per=Math.ceil(uit.length/3);
 const uitH=`<div class="rpu">${[0,1,2].map(k=>`<dl>${uit.slice(k*per,(k+1)*per).map(q=>`<div><dt>${q[0]}</dt><dd>${q[1]}</dd></div>`).join('')}</dl>`).join('')}</div><p class="rpx">Bij twee waarden staat diesel eerst, dan elektrisch.</p>`;
 /* Wat kost het per maand: lening en gebruik, twee vakken naast elkaar op dezelfde schaal */
 const ml=mLast(b),mt=Math.max(ml.d.tot,ml.e.tot),dM=ml.d.tot-ml.e.tot;
 const mcol=(k,n,ls)=>{const o=ml[k];return`<div class="rpmc ${k}"><small>${n}</small><b class="num">${eur(o.tot)} <span>per maand</span></b><i style="width:${o.tot/mt*100}%"><u style="flex:${o.lening}"></u><u style="flex:${o.gk}"></u></i><p><span><s></s>${ls?'Lease':'Lening'} <b>${eur(o.lening)}</b></span><span><s></s>Gebruik <b>${eur(o.gk)}</b></span></p></div>`};
 const vl=lD&&lE?'De lease':lD||lE?'De lease of lening':'De lening';
 const mnd=`<div class="rpm2">${mcol('d',dN,lD)}${mcol('e',eN,lE)}</div><p class="rpms"><b class="${dM>=0?'good':'bad'}">Elektrisch ${eur(Math.abs(dM))} per maand ${dM>=0?'goedkoper':'duurder'}.</b> ${vl} is ${eur(Math.abs(ml.e.lening-ml.d.lening))} ${ml.e.lening>=ml.d.lening?'hoger':'lager'}, het gebruik ${eur(Math.abs(ml.d.gk-ml.e.gk))} ${ml.e.gk<=ml.d.gk?'lager':'hoger'}.</p><p class="rpx">${lD&&lE?'Lease: de leaseprijs per maand':`Lening: ${nf(v('xfs'))}% van de aanschafprijs tegen ${nf(v('xri'),1)}% rente, afgelost in ${L} jaar${lD||lE?'. Lease: de leaseprijs per maand':''}`}. Gebruik: energie, onderhoud, verzekering${truck?' en heffing':''}.</p>`;
 /* Gevoeligheid: besparing per jaar bij andere energieprijzen */
 const dp0=v('dp'),sp0=v('sp'),U=a=>[...new Set(a.map(z=>Math.round(Math.max(0,z)*1000)/1000))];
 const ds=U([-.5,-.25,0,.25,.5].map(z=>dp0+z)),es=U([-.1,-.05,0,.1,.2,.3].map(z=>sp0+z)),grid=es.map(e=>ds.map(z=>sv({dp:z,sp:e}))),gm=Math.max(1,...grid.flat().map(Math.abs));
 const heat=`<table class="rph2"><tr><th>€/kWh · €/L</th>${ds.map(z=>`<th>${nf(z,2)}</th>`).join('')}</tr>${es.map((e,i)=>`<tr><th>${nf(e,2)}</th>${ds.map((z,j)=>{const q=grid[i][j];return`<td class="${z===dp0&&e===sp0?'cur':''}" style="background:${q>=0?`rgba(10,143,91,${.1+.42*q/gm})`:`rgba(242,163,58,${.2+.45*-q/gm})`}">${q<0?'−':''}${nf(Math.abs(q)/1000)}k</td>`}).join('')}</tr>`).join('')}</table>`;
 /* Als de restwaarde tegenvalt */
 const rw0=Math.round(v('rwE')),ps=[...new Set([0,10,20,30,40,50,rw0])].filter(q=>q<=60).sort((a,c)=>a-c);
 const lkm=lE&&leaseKm(x);
 const kmT=lE?`<table class="rpc rpr"><thead><tr><th>Kilometers</th><th>${dN} per jaar</th><th>${eN} per jaar</th><th>Verschil</th></tr></thead><tbody>${lkm.rows.map(q=>`<tr${q.now?' class="now"':''}><td>${nf(q.k)}${q.con?' · contract':q.now?' · nu':''}</td><td>${eur(q.td)}</td><td>${eur(q.te)}</td>${df(q.te-q.td)}</tr>`).join('')}</tbody></table>`:'';
 const rwT=`<table class="rpc rpr"><thead><tr><th>Restwaarde</th><th>Waarde na ${L} jaar</th><th>Elektrisch per jaar</th><th>Verschil</th></tr></thead><tbody>${ps.map(q=>{const t=q===rw0?x.te:calcX({rwE:q}).te;return`<tr${q===rw0?' class="now"':''}><td>${q}%${q===rw0?' · nu':''}</td><td>${eur(v('pE')*q/100)}</td><td>${eur(t)}</td>${df(t-x.td)}</tr>`}).join('')}</tbody></table>`;
 const head=`<div class="rph"><span class="brand"><svg class="bmark" viewBox="2 16 60 32" aria-hidden="true"><rect class="bt" x="2" y="16" width="60" height="32" rx="16"/><g transform="translate(46 32)"><g class="bk"><circle r="11" fill="#fff"/><path class="bb" d="M1.6 -7.5L-4.2 1.6H-0.2L-1.6 7.5L4.2 -1.6H0.2Z"/><g class="bp" transform="scale(1.15)"><path d="M-5.8 6V-4.6A1.6 1.6 0 0 1 -4.2 -6.2H0.2A1.6 1.6 0 0 1 1.8 -4.6V6Z"/><rect x="-4.3" y="-4.7" width="4.6" height="3.4" rx=".6" fill="#fff"/><rect x="-7" y="5" width="10" height="2" rx="1"/><path class="bh" d="M1.8 -1.6H3.2A1 1 0 0 1 4.2 -0.6V3.4A1.1 1.1 0 0 0 6.4 3.4V-2.6L4.4 -4.8"/></g></g></g></svg>Stekker of Diesel</span><span>${date}</span></div>`;
 const pbl=lE?(()=>{const by=buyY('E'),be=lpNow('E')+(by-x.te)/12;return`<div class="rpbl"><div><small>Leasen goedkoper tot</small><b class="num">${eur(Math.max(0,Math.floor(be/10)*10))}</b></div><p>per maand, nu <b>${eur(lpNow('E'))}</b></p><p>Elektrisch kopen: <b>${eur(by)}</b> per jaar</p></div>`})():`<div class="rpbl"><div><small>Terugverdientijd</small><b class="num">${pbT}</b></div><p>Extra investering${b.sub>0?' na '+regLabel():''}: <b>${eur(Math.max(0,pb.gap))}</b></p><p>Lagere gebruikskosten: <b>${eur(pb.sv)}</b> per jaar</p></div>`;
 return head+
 `<span class="rpk">Kostenvergelijking</span><h1>${m?mName(m):'Elektrische '+T().w}${lE?' lease':''} tegen ${dN.toLowerCase()}</h1><p class="rpm">${nf(km)} km per jaar · ${L} jaar · ${b.sub>0?regLabel()+' '+eur(b.sub):'zonder subsidie'}</p>`+
 `<div class="rpv"><div class="w${cheap||even?'':' neg'}"><small>${even?'Ongeveer gelijk':cheap?'Elektrisch goedkoper':'Elektrisch duurder'}</small><strong class="num">${eur(Math.abs(d))}</strong><span>per jaar · ${eur(Math.abs(d)*L)} in ${L} jaar${even?'':` · ${nf(pc)}%`}</span>${bd?`<span>Bandbreedte ${bandTxt(bd)}</span>`:''}</div>`+
 `<div><small>${dot('d')}${dN}</small><strong class="num">${eur(x.td/km,2)}</strong><span>per km · ${eur(x.td)} per jaar</span></div><div><small>${dot('e')}${eN}</small><strong class="num">${eur(x.te/km,2)}</strong><span>per km · ${eur(x.te)} per jaar</span></div></div>`+
 `<h2>Jouw uitgangspunten</h2>${uitH}`+
 `<h2>Kosten per jaar</h2><table class="rpc"><colgroup><col><col><col><col><col></colgroup><thead><tr><th>Onderdeel</th><th></th><th>${dN}</th><th>${eN}</th><th>Verschil</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td>Totaal per jaar</td><td></td><td>${mi(x.td)}</td><td>${mi(x.te)}</td>${df(x.te-x.td)}</tr></tfoot></table>`+
 `<div class="rpch"><h2>Opgetelde kosten</h2>${rptChart(pb,L)}${pbl}</div>`+
 `<div class="rp2">${head}<h2 style="margin-top:22px">Wat kost het per maand</h2>${mnd}`+
 `<div class="rpg">${tile('Goedkoper vanaf',kb===0?'Elke afstand':kb===null?'Niet':nf(Math.ceil(kb/1000)*1000)+' km',kb?'per jaar':'')}${tile('Goedkoper vanaf dieselprijs',dpB===null?'—':dpB<=0?'Altijd':eur(dpB,2),dpB>0?'per liter':'')}${tile('CO₂-besparing',nf(Math.round(x.co2d-x.co2e))+' ton','per jaar')}</div>`+
 `<div class="rp2c"><div><h2>Wat als prijzen veranderen?</h2>${heat}<p class="rpx">Besparing per jaar bij andere energieprijzen. Omkaderd: je huidige situatie.</p></div><div><h2>${lE?'Meer of minder rijden':'Als de restwaarde tegenvalt'}</h2>${lE?kmT:rwT}</div></div>`+
 `<div class="rpn"><p>Indicatieve berekening, exclusief btw, chauffeur en overhead. Aanschaf is verminderd met restwaarde en subsidie en verdeeld over de afschrijftermijn.${lD||lE?' Bij lease telt de leaseprijs per maand; meerkilometers tegen de meerkilometerprijs, minder kilometers voor de helft terug.':''} CO₂: 3,27 kg per liter diesel en 0,48 kg per kWh.${range?` Actieradius ± ${nf(Math.round(range/5)*5)} km.`:''}</p><p><a href="${shareURL()}">Open deze berekening op stekkerofdiesel.nl</a></p></div></div>`;
}
/* Voor de PDF vragen we eenmalig een e-mailadres. Het adres gaat naar Supabase (tabel pdf_requests, alleen toevoegen), daarna opent het rapport om op te slaan. */
const PDFK='sod-pdf-email';
function pdfGo(){rptOn();print()}
function pdfAsk(){if(store(PDFK)){pdfGo();return}const d=$('pdfD');$('pdfErr').hidden=true;if(!d.open)d.showModal();setTimeout(()=>$('pdfE').focus(),30)}
$('pdfF').addEventListener('submit',e=>{
 e.preventDefault();if(e.target.elements.website&&e.target.elements.website.value)return;const em=$('pdfE').value.trim();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)||em.length>200){$('pdfErr').hidden=false;$('pdfE').focus();return}
 const nb=$('pdfN').checked;
 /* Link naar de berekening, zonder kenteken */
 let link='';try{link=location.href.split(/[?#]/)[0]+'?s='+b64e(JSON.stringify({t:vtype,v:(({plk,plkE,...q})=>q)(stateObj())}))}catch(x){}
 sbInsert('pdf_requests',{email:em,nieuws:nb,vt:vtype,modus:page==='uitgebreid'?'uitgebreid':'simpel',lang:document.documentElement.lang==='en'?'en':'nl',calc_link:link.slice(0,4000)});
 track('pdf_email',{nieuws:nb,vt:vtype});
 store(PDFK,'1');$('pdfD').close();pdfGo();
});
$('pdfX').onclick=()=>$('pdfD').close();
$('pdfD').addEventListener('click',e=>{if(e.target===$('pdfD'))$('pdfD').close()});
let reopen=[],docT='';
function rptOn(){$('rpt').innerHTML=rptHTML();document.documentElement.classList.add('rp');if(!docT){docT=document.title;document.title=`Stekker of Diesel - ${T().n} - ${new Date().toISOString().slice(0,10)}`}}
addEventListener('beforeprint',()=>{
 if(page==='calc'||page==='uitgebreid'){rptOn();return}
 reopen=[...document.querySelectorAll('.page:not([hidden]) details:not([open])')];reopen.forEach(d=>d.open=true)});
addEventListener('afterprint',()=>{reopen.forEach(d=>d.open=false);reopen=[];if(docT){document.title=docT;docT=''}document.documentElement.classList.remove('rp');$('rpt').innerHTML=''});

/* Vergelijken: bewaar de huidige berekening als A en zet hem naast wat je daarna verandert */
let scA=null;
const snap=()=>{const r=calcX();return{t:vtype,v:stateObj(),sr:JSON.parse(JSON.stringify(SR)),m:modelActive()?mName(modelActive()):'',td:r.td,te:r.te,km:r.km}};
function snapApply(s){applyType(s.t);tolSel.clear();TOL.forEach(c=>$('k_'+c[0]).value=0);srLoad(s.sr);Object.entries(s.v||{}).forEach(([id,val])=>{const e=$(id);if(!e)return;if(e.type==='checkbox')e.checked=!!+val;else setNum(e,val)});fitRanges();touched=true;render()}
function scPaint(){
 const el=$('scn');if(!scA){el.hidden=true;return}
 const r=calcX(),dA=scA.td-scA.te,dN=r.td-r.te,df=dN-dA;
 el.hidden=false;
 setH(el,`<span class="scl">A</span><span class="scv">${scA.m?`<em>${scA.m}</em> `:''}Diesel <b>${eur(scA.td/scA.km,2)}</b> · elektrisch <b>${eur(scA.te/scA.km,2)}</b> per km · <b class="${dA>=0?'good':'bad'}">${eur(Math.abs(dA))}</b> ${dA>=0?'besparing':'meerkosten'} per jaar</span><span class="scd">Nu <b class="${df>=0?'good':'bad'}">${Math.abs(df)<.5?'gelijk':sg(df)}</b>${Math.abs(df)<.5?'':' per jaar'}</span><button class="lnk" type="button" data-scw>Wissel</button><button class="wzx" type="button" data-scx aria-label="Vergelijken sluiten">${XSVG}</button>`);
}
document.addEventListener('click',e=>{
 if(e.target.closest('[data-sca]')){scA=snap();render();track('scenario_save',{vt:vtype});return}
 if(e.target.closest('[data-scx]')){scA=null;render();return}
 if(e.target.closest('[data-scw]')){const a=scA;scA=snap();snapApply(a);track('scenario_swap',{});return}
});

/* Invoer onthouden in deze browser, en terugzetten */
const KEY='stekkerofdiesel-v3';
function save(){try{localStorage.setItem(KEY,JSON.stringify({touched,vtype,v:stateObj(),sr:SR}))}catch(e){}}
function load(){try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(!s)return;if(VT[s.vtype])applyType(s.vtype);srLoad(s.sr);['km'].concat(Object.keys(s.v||{})).forEach(id=>{const e=$(id);if(!e||!(id in s.v))return;if(e.type==='checkbox')e.checked=!!+s.v[id];else setNum(e,s.v[id])});fitRanges();touched=!!s.touched}catch(e){}}
function reset(){PL.D=PL.E=null;finAuto=false;autoPE=autoPD=autoOD=autoVD=autoVE=autoAcc=null;document.querySelectorAll('[data-plate] input').forEach(i=>i.value='');document.querySelectorAll(':is(#calc,#wz) input[type=range]').forEach(absRange);document.querySelectorAll(':is(#calc,#wz) input[id]').forEach(e=>{if(e.classList.contains('slin'))return;if(e.type==='checkbox')e.checked=e.defaultChecked;else e.value=e.defaultValue});$('gr').value='1';$('cls').value='N3';$('dw').value=$('nw').value='n';['lsD','lsE','lqD','lqE'].forEach(id=>$(id).value='0');applyType(vtype);touched=false;tolSel.clear();srLoad();render();if(!isFresh()){setUsed(false);scrollTo(0,0)}}

function tween(key,els,vals,fmts){els.forEach((el,i)=>{el.textContent=fmts[i](vals[i])})}
function fillRanges(){document.querySelectorAll('input[type=range]').forEach(r=>{const a=+r.min,b=+r.max;r.style.setProperty('--f',b>a?(r.value-a)/(b-a):0)})}
/* ===== Modellen: g bruto, u bruikbaar, ue afgeleid, a capaciteit waarvan bruto/netto onbekend; r bereik, rc meetcyclus; dc/mcs laadsnelheid (kW); checked broncontrole; fam modelfamilie en vl naam van de uitvoering binnen die familie. ===== */
const MCAT=[['all','Alle'],['trekker','Trekker'],['bakwagen','Bakwagen'],['bestel','Bestelbus'],['bus','Bus']];
const MODELS=[
 {
  "c": "trekker",
  "b": "Mercedes-Benz",
  "m": "eActros 600",
  "g": 621,
  "r": 500,
  "dc": 400,
  "mcs": 1000,
  "st": "nu",
  "n": "Drie LFP-accupakketten: 621 kWh geïnstalleerd en 600 kWh bruikbaar. Fabrieksbereik tot 500 km, afhankelijk van gewicht en omstandigheden. CCS tot 400 kW en voorbereid op megawattladen.",
  "s": [
   "Mercedes-Benz Trucks",
   "https://www.mercedes-benz-trucks.com/content/dam/brandhub/markets/gb/files/product-sheets/eActros-600-product-sheet.pdf.coredownload.pdf"
  ],
  "u": 600,
  "rt": "tot 500",
  "checked": "2026-10-21",
  "consumption": 103
 },
 {
  "c": "trekker",
  "b": "Tesla",
  "m": "Semi (Europa)",
  "ue": 550,
  "r": 550,
  "mcs": 800,
  "st": "komt",
  "y": 2027,
  "n": "Aangekondigd voor Europa, leveringen vanaf 2027. Tesla noemt 550 km bij 40 ton en een verbruik van ongeveer 1 kWh per km. De accugrootte is nog niet bekendgemaakt. Laadt tot 800 kW.",
  "s": [
   "Tesla",
   "https://www.tesla.com/en_GB/semi"
  ],
  "consumption": 100,
  "checked": "2026-10-21"
 },
 {
  "c": "trekker",
  "b": "Volvo",
  "m": "FH Aero Electric",
  "g": 780,
  "u": 725,
  "r": 700,
  "mcs": 700,
  "st": "nu",
  "n": "780 kWh geïnstalleerd, waarvan 725 kWh bruikbaar. In productie sinds september 2026.",
  "s": [
   "electrive",
   "https://www.electrive.com/2026/04/14/volvo-trucks-increases-range-of-flagship-e-truck-to-700-km/"
  ],
  "pD": 115000,
  "pDm": "Volvo FH 420 diesel",
  "pDs": [
   "autozeitung.de",
   "https://www.autozeitung.de/volvo-fh-2024-preis-motoren-207714.html"
  ]
 },
 {
  "c": "trekker",
  "b": "DAF",
  "m": "XF Electric",
  "g": 525,
  "gt": "210–525",
  "u": 462,
  "ut": "185–462",
  "r": 500,
  "rt": "tot 500",
  "dc": 325,
  "st": "nu",
  "n": "De accu kies je in stappen, zodat je niet meer gewicht en geld meeneemt dan je inzet vraagt. In serieproductie sinds september 2025.",
  "s": [
   "electrive",
   "https://www.electrive.com/2025/09/22/daf-begins-series-production-of-xd-and-xf-electric-electric-trucks"
  ]
 },
 {
  "c": "trekker",
  "b": "MAN",
  "m": "eTGX (nieuwe generatie 2027)",
  "fam": "eTGX",
  "vl": "Nieuwe generatie",
  "r": 660,
  "st": "komt",
  "n": "Nieuwe generatie, getoond op de IAA in september 2026. De 4×2-trekker heeft zes accupakketten: 552 kWh geïnstalleerd en 528 kWh bruikbaar, voor tot 660 km bij 20 °C, 60% belading en snelweginzet. De 6×2 met een zevende pakket haalt tot 720 km. Verkoopstart gepland voor april 2027, productie vanaf zomer 2027.",
  "g": 552,
  "u": 528,
  "s": [
   "MAN Truck & Bus",
   "https://www.man.eu/global/en/truck/all-models/the-man-tgx/the-man-etgx/the-new-man-etgx.html"
  ],
  "rt": "tot 660",
  "y": 2027,
  "checked": "2026-10-21"
 },
 {
  "c": "trekker",
  "b": "Scania",
  "m": "R-serie elektrisch",
  "u": 560,
  "r": 515,
  "mcs": 750,
  "st": "nu",
  "n": "Configuratie met 560 kWh bruikbaar: Scania noemt maximaal 515 km bij 42 ton treingewicht, 560 km bij 29 ton en 360 km bij 64 ton. De later aangekondigde 720 km gebruikt extra accu’s achter de cabine en wordt daarom niet met deze accu gecombineerd.",
  "s": [
   "Scania",
   "https://www.scania.com/group/en/home/products-and-services/trucks/battery-electric-truck.html"
  ],
  "rt": "tot 515",
  "dc": 375,
  "checked": "2026-10-21"
 },
 {
  "c": "trekker",
  "b": "Renault Trucks",
  "m": "E-Tech T 780",
  "fam": "E-Tech T",
  "vl": "780 kWh · 6×2",
  "g": 780,
  "r": 660,
  "rt": "tot 660",
  "mcs": 720,
  "st": "nu",
  "n": "6×2-trekker met 780 kWh en maximaal 660 km volgens Renault Trucks. De fabrikant noemt een gebruiksvenster tot 95%; de hier afgeleide 741 kWh is dus een indicatieve maximale bruikbare energie, geen afzonderlijk gepubliceerde netto capaciteit. CCS tot 350 kW en MCS tot 720 kW.",
  "s": [
   "Renault Trucks",
   "https://www.renault-trucks.com/en/newsroom/press-releases/long-haul-operations-now-within-reach-renault-trucks-electric-tractors"
  ],
  "ue": 741,
  "derived": "afgeleid uit 95% van 780 kWh; maximaal gebruiksvenster",
  "dc": 350,
  "checked": "2026-10-21"
 },
 {
  "c": "trekker",
  "b": "IVECO",
  "m": "S-eWay",
  "g": 603,
  "r": 600,
  "dc": 350,
  "st": "nu",
  "n": "De LFP-uitvoering heeft 603 kWh geïnstalleerde capaciteit, waarvan volgens IVECO 97% bruikbaar is (afgerond 585 kWh). Fabrieksbereik tot 600 km. DC-snelladen tot 350 kW; belading en rijprofiel bepalen het praktijkbereik.",
  "s": [
   "IVECO",
   "https://www.iveco.com/estonia/-/media/IVECOdotcom/Content/Products/S-eWay_2026/Brochure/IVECO-S-eWay_EN.pdf?rev=-1"
  ],
  "ue": 585,
  "derived": "afgeleid uit 97% van 603 kWh, afgerond",
  "rt": "tot 600",
  "checked": "2026-10-21"
 },
 {
  "c": "bakwagen",
  "b": "Mercedes-Benz",
  "m": "eActros 300/400",
  "g": 448,
  "gt": "336–448",
  "u": 388,
  "ut": "291–388",
  "r": 400,
  "rt": "330–400",
  "dc": 160,
  "st": "nu",
  "n": "Drie (300) of vier (400) accupakketten van 112 kWh, waarvan elk 97 kWh bruikbaar. De 400 km is gemeten in distributie zonder aanhanger bij 20 °C.",
  "s": [
   "Mercedes-Benz Trucks",
   "https://www.mercedes-benz-trucks.com/en_GB/emobility/world/your-benefits/usability.html"
  ],
  "price": 300000,
  "ps": [
   "boerse-online.de",
   "https://www.boerse-online.de/dpa-afx/roundup-mercedes-startet-serienproduktion-von-e-lkw-128851.html"
  ],
  "pt": "reported"
 },
 {
  "c": "bakwagen",
  "b": "DAF",
  "m": "XD Electric",
  "g": 525,
  "gt": "210–525",
  "u": 462,
  "ut": "185–462",
  "r": 500,
  "rt": "tot 500",
  "dc": 325,
  "st": "nu",
  "n": "Dezelfde accu-opbouw als de XF Electric, voor regionale distributie.",
  "s": [
   "DAF",
   "https://dealers.daf.com/-/media/files/document-library/infosheets/electric/daf-xd-electric-infosheet-xde-en-556205.pdf"
  ]
 },
 {
  "c": "bakwagen",
  "b": "DAF",
  "m": "XB Electric",
  "g": 282,
  "gt": "141–282",
  "u": 248,
  "ut": "124–248",
  "r": 350,
  "rt": "tot 350",
  "dc": 150,
  "st": "nu",
  "n": "Lichte distributie van 12 tot 19 ton. Snelladen van 20 naar 80% duurt 40 tot 70 minuten.",
  "s": [
   "DAF",
   "https://www.daf.co.uk/-/media/files/document-library/infosheets/electric/daf-xb-electric-infosheet-xbe-en-556205.pdf"
  ]
 },
 {
  "c": "bakwagen",
  "b": "Volvo",
  "m": "FM Electric",
  "g": 540,
  "gt": "360–540",
  "r": 470,
  "rt": "tot 470",
  "st": "nu",
  "n": "De actuele generatie met vier tot zes accupakketten: maximaal 540 kWh geïnstalleerd en 460 kWh bruikbaar. Volvo noemt tot 470 km; de opbouw en inzet bepalen het daadwerkelijke bereik. DC-laden van 20 tot 80% in ongeveer 65 minuten.",
  "s": [
   "Volvo Trucks Nederland",
   "https://www.volvotrucks.nl/nl-nl/trucks/electric/volvo-fm-electric.html"
  ],
  "u": 460,
  "dc": 350,
  "vc": "n3",
  "checked": "2026-10-21"
 },
 {
  "c": "bakwagen",
  "b": "MAN",
  "m": "eTGL",
  "g": 160,
  "u": 160,
  "r": 235,
  "dc": 250,
  "st": "nu",
  "n": "12-tonner voor de stad, met twee pakketten van 80 kWh. Van 10 naar 80% in ongeveer 30 minuten, tot 6,6 ton laadvermogen.",
  "s": [
   "electrive",
   "https://www.electrive.com/2024/09/04/man-adds-12-tonne-model-to-its-electric-truck-portfolio"
  ],
  "vc": "n2",
  "gvw": 12000
 },
 {
  "c": "bakwagen",
  "b": "Renault Trucks",
  "m": "E-Tech D 16 t",
  "g": 375,
  "r": 330,
  "dc": 150,
  "st": "nu",
  "n": "Vier accupakketten, samen 375 kWh. Met een uur DC-laden onderweg ongeveer 450 km.",
  "s": [
   "Renault Trucks",
   "https://www.renault-trucks.de/sites/default/files/2024-09/Renault%20Trucks%20E-TECH%20D16%20MED%20P4x2_0.pdf"
  ]
 },
 {
  "c": "bestel",
  "b": "Mercedes-Benz",
  "m": "eSprinter",
  "u": 81,
  "r": 268,
  "rt": "268",
  "dc": 115,
  "st": "nu",
  "n": "N1-voorbeeld: gesloten bestelbus L2 met 81 kWh bruikbare accu en 3,5 ton toegestane massa. Mercedes-Benz publiceert voor deze Nederlandse L2-configuratie 268 km WLTP. De grotere 113 kWh-uitvoering met hogere toegestane massa heeft andere waarden; laaduitrusting verschilt per uitvoering.",
  "s": [
   "Mercedes-Benz Nederland",
   "https://certified.vans.mercedes-benz.nl/mercedes-benz/esprinter/esprinter-320-bestelwagen-l2/occ21613999"
  ],
  "gvw": 3500,
  "checked": "2026-10-21",
  "price": 49900,
  "ps": [
   "wensink.nl",
   "https://www.wensink.nl/p/mercedes-benz-esprinter-314-l2-h2-rwd-pro-81kwh-55986781"
  ],
  "pt": "reported"
 },
 {
  "c": "bestel",
  "b": "Ford",
  "m": "E-Transit",
  "u": 89,
  "r": 341,
  "rt": "341",
  "dc": 180,
  "st": "nu",
  "n": "N1-bestelbus 350 L3H2 Trend met 89 kWh bruikbaar en 135 kW motor. De Europese prijslijst noemt 341 km WLTP gecombineerd en 26,1 kWh/100 km voor deze 3,5-tonuitvoering. De eerder genoemde 402 km hoort bij een zwaardere, op 90 km/u begrensde uitvoering. DC tot 180 kW.",
  "s": [
   "Ford Europa (Finland)",
   "https://www.ford.fi/content/dam/guxeu/fi/documents/pricelists/cv/transit-van/PL-ford-e-transit.pdf"
  ],
  "consumption": 26.1,
  "gvw": 3500,
  "checked": "2026-10-21",
  "price": 60000,
  "ps": [
   "fordmediacenter.nl",
   "https://fordmediacenter.nl/ford-e-transit-met-extra-grote-actieradius-nu-te-bestellen-vanaf-e-59-995/"
  ],
  "pt": "list"
 },
 {
  "c": "bestel",
  "b": "Renault",
  "m": "Master E-Tech",
  "a": 87,
  "r": 410,
  "rt": "tot 410",
  "dc": 130,
  "st": "nu",
  "n": "N1-referentie met 87 kWh long-range-accu en 3,5 ton toegestane massa. Renault communiceert tot 410 km WLTP voor deze generatie. De 460 km van de 4-tonuitvoering wordt hier niet als N1-bereik gebruikt. Carrosserie, uitrusting en snelheid beïnvloeden het bereik; DC tot 130 kW.",
  "s": [
   "Renault",
   "https://www.renault.is/cars/master-e-tech-rafmagn/master.html"
  ],
  "gvw": 3500,
  "checked": "2026-10-21",
  "price": 50900,
  "ps": [
   "Renault Nederland",
   "https://cdn.group.renault.com/ren/nl/brochures-en-prijslijsten/prijslijsten/master-etech-electric-prijslijst.pdf"
  ],
  "pt": "Vanafprijs voor advance gesloten bestel L2H2 T35 87 kWh 140 pk. Nederlandse catalogusprijs excl. btw en eventuele afleveringskosten; geen tijdelijke korting of subsidie afgetrokken. Prijslijst: januari 2026. Gecontroleerd op 23 oktober 2026."
 },
 {
  "c": "bestel",
  "b": "Fiat",
  "m": "E-Ducato",
  "g": 110.6,
  "u": 97.8,
  "r": 378,
  "rt": "378",
  "dc": 150,
  "st": "nu",
  "n": "N1 L3H2 gesloten bestelbus van 3,5 ton. De Nederlandse prijslijst van 1 september 2026 noemt 110,6 kWh geïnstalleerd, 97,8 kWh bruikbaar, 378 km WLTP gecombineerd en 29,4 kWh/100 km. Catalogusprijs € 53.700 excl. btw en opties. De 424 km van de 4,25-tonversie wordt hier niet gebruikt. AC standaard 22 kW.",
  "s": [
   "Fiat Professional Nederland",
   "https://www.fiat.nl/professional/modellen/e-ducato/prijslijst"
  ],
  "consumption": 29.4,
  "price": 53700,
  "gvw": 3500,
  "checked": "2026-10-21",
  "pD": 35700,
  "pDm": "Fiat Ducato L3H2 140 pk",
  "pDs": [
   "fiat.nl",
   "https://www.fiat.nl/content/dam/fiat2023/nl/professional/prijslijsten/ducato/prijslijst-fiat-ducato-my26-per-1-april-2026.pdf"
  ],
  "ld": 9.9,
  "pt": "Vanafprijs voor gesloten bestel L3H2 3,5 ton 110 kWh (97,8 kWh bruikbaar). Nederlandse catalogusprijs excl. btw en eventuele afleveringskosten; geen tijdelijke korting of subsidie afgetrokken. Prijslijst: 12 januari 2026. Gecontroleerd op 23 oktober 2026.",
  "ps": [
   "Fiat Professional Nederland",
   "https://www.fiat.nl/content/dam/fiat2023/nl/professional/prijslijsten/e-ducato/Prijslijst_eDucato_12_januari_2026.pdf"
  ]
 },
 {
  "c": "bus",
  "b": "Mercedes-Benz",
  "m": "eCitaro",
  "g": 666,
  "gt": "444–666",
  "r": 600,
  "rt": "tot 600",
  "dc": 300,
  "st": "nu",
  "n": "Stadsbus met vier tot zes NMC4-pakketten van 111 kWh. Mercedes noemt tot 600 km, ook aan het eind van de accuduur. 10 jaar accugarantie.",
  "s": [
   "Mercedes-Benz Bus",
   "https://www.mercedes-benz-bus.com/en_DE/models/ecitaro.html"
  ]
 },
 {
  "c": "bus",
  "b": "Mercedes-Benz",
  "m": "eCitaro G",
  "g": 777,
  "gt": "444–777",
  "r": 480,
  "rt": "tot 480",
  "dc": 300,
  "st": "nu",
  "n": "Gelede stadsbus met tot zeven NMC4-pakketten.",
  "s": [
   "Mercedes-Benz Bus",
   "https://www.mercedes-benz-bus.com/en_DE/models/ecitaro.html"
  ],
  "price": 950000,
  "ps": [
   "electrive.net",
   "https://www.electrive.net/2026/06/09/kiel-bestellt-28-e-gelenkbusse-bei-daimler-buses/"
  ],
  "pt": "reported"
 },
 {
  "c": "bus",
  "b": "VDL",
  "m": "Citea LE-122",
  "g": 575,
  "r": 600,
  "rt": "500–600",
  "st": "nu",
  "n": "Nieuwe generatie met de accu in de vloer in plaats van op het dak. VDL noemt 500 tot 600 km, en 250 km in een strenge winter.",
  "s": [
   "electrive",
   "https://www.electrive.net/2025/03/21/transdev-bestellt-42-elektrobusse-bei-vdl/"
  ]
 },
 {
  "c": "bus",
  "b": "Yutong",
  "m": "T12E touringcar",
  "g": 400,
  "r": 350,
  "st": "nu",
  "n": "Elektrische touringcar met LFP-accu en een verbruik onder 1,05 kWh per km. Een Oostenrijkse vervoerder rekent met ongeveer 380 km.",
  "s": [
   "electrive",
   "https://www.electrive.com/2026/02/26/three-battery-electric-yutong-coaches-deployed-in-austria/"
  ]
 },
 {
  "c": "bestel",
  "b": "Citroën",
  "m": "ë-Berlingo Van",
  "a": 54,
  "r": 337,
  "rt": "tot 337",
  "rc": "WLTP gecombineerd",
  "dc": 100,
  "st": "nu",
  "n": "Compacte elektrische bestelbus. De actuele Nederlandse modelpagina noemt 54 kWh en maximaal 337 km WLTP gecombineerd; de uitvoering en uitrusting bepalen het werkelijke homologatiebereik.",
  "s": [
   "Citroën Nederland",
   "https://www.citroen.nl/modellen/bedrijfswagens/e-berlingo-van.html"
  ],
  "checked": "2026-10-21",
  "price": 27800,
  "ps": [
   "wassinkautogroep.nl",
   "https://www.wassinkautogroep.nl/content/uploads/2024/11/Prijslijst-citroen-e-berlingo-van-per-1-januari-2026.pdf"
  ],
  "pt": "list"
 },
 {
  "c": "bestel",
  "b": "Citroën",
  "m": "ë-Jumpy Comfort Range",
  "a": 75,
  "r": 356,
  "rt": "tot 356",
  "rc": "WLTP gecombineerd",
  "dc": 100,
  "st": "nu",
  "n": "Middelgrote bestelbus met de 75 kWh-accu. Citroën noemt voor Comfort Range maximaal 356 km WLTP gecombineerd. Ook verkrijgbaar als Urban Range met een kleinere accu.",
  "s": [
   "Citroën Nederland",
   "https://www.citroen.nl/modellen/bedrijfswagens/e-jumpy.html"
  ],
  "checked": "2026-10-21",
  "price": 43400,
  "ps": [
   "Citroën Nederland",
   "https://www.citroen.nl/content/dam/citroen/netherlands/b2b/local-content/brochures-prijslijsten/model/jumpy/12012026-Prijzen-en-specificaties-e-Jumpy.pdf"
  ],
  "pt": "Vanafprijs voor gesloten bestel L2 75 kWh. Nederlandse catalogusprijs excl. btw en eventuele afleveringskosten; geen tijdelijke korting of subsidie afgetrokken. Prijslijst: 12 januari 2026. Gecontroleerd op 23 oktober 2026."
 },
 {
  "c": "bestel",
  "b": "Peugeot",
  "m": "E-Partner",
  "a": 50,
  "r": 343,
  "rt": "tot 343",
  "rc": "WLTP gecombineerd",
  "dc": 100,
  "st": "nu",
  "n": "Compacte bestelbus met een 50 kWh-accu. Peugeot noemt maximaal 343 km WLTP; beschikbare lengtes, uitrusting en belading beïnvloeden de actieradius.",
  "s": [
   "Peugeot Nederland",
   "https://www.peugeot.nl/showroom/peugeot-partner/elektrisch.html"
  ],
  "checked": "2026-10-21",
  "price": 27795,
  "pt": "Vanafprijs voor gesloten bestel L1 50 kWh. Nederlandse catalogusprijs excl. btw en eventuele afleveringskosten; geen tijdelijke korting of subsidie afgetrokken. Prijslijst: 1 januari 2026. Gecontroleerd op 23 oktober 2026.",
  "ps": [
   "Peugeot-prijslijst via Haaima (dealer)",
   "https://www.haaima.nl/media/uikihcaa/peugeot-e-partner-prijslijst.pdf"
  ]
 },
 {
  "c": "bestel",
  "b": "Peugeot",
  "m": "E-Expert 75 kWh",
  "a": 75,
  "r": 352,
  "rt": "tot 352",
  "rc": "WLTP gecombineerd",
  "dc": 100,
  "st": "nu",
  "n": "Middelgrote elektrische bestelbus met de 75 kWh-accu en maximaal 352 km WLTP gecombineerd. De kleinere 49 kWh-uitvoering haalt volgens Peugeot tot 223 km.",
  "s": [
   "Peugeot Nederland",
   "https://www.peugeot.nl/showroom/peugeot-expert/faq.html"
  ],
  "checked": "2026-10-21",
  "price": 43400,
  "pt": "Vanafprijs voor gesloten bestel L2 75 kWh. Nederlandse catalogusprijs excl. btw en eventuele afleveringskosten; geen tijdelijke korting of subsidie afgetrokken. Prijslijst: 14 mei 2025. Gecontroleerd op 23 oktober 2026.",
  "ps": [
   "Peugeot-prijslijst via Haaima (dealer)",
   "https://www.haaima.nl/media/y0ul0z5b/prijslijst-peugeot-e-expert.pdf"
  ]
 },
 {
  "c": "bestel",
  "b": "Opel",
  "m": "Combo Cargo Electric",
  "a": 50,
  "r": 343,
  "rt": "tot 343",
  "rc": "WLTP gecombineerd",
  "dc": 100,
  "st": "nu",
  "n": "Compacte elektrische bestelbus met een 50 kWh-accu. De Nederlandse modelpagina noemt maximaal 343 km; de gekozen uitvoering en opties bepalen het homologatiebereik. Leverbaar in twee lengtes.",
  "s": [
   "Opel Nederland",
   "https://www.opel.nl/bedrijfswagens/combo-modellen/nieuwe-combo-electric/overzicht.html"
  ],
  "checked": "2026-10-21",
  "price": 27795,
  "ps": [
   "Opel Nederland",
   "https://www.opel.nl/content/dam/opel/netherlands/vehicles/combo-e/pdf/GP26-1706PM-Prijslijst-Opel-Combo-Cargo-Electric.pdf"
  ],
  "pt": "Vanafprijs voor Advance L1 50 kWh. Nederlandse catalogusprijs excl. btw en eventuele afleveringskosten; geen tijdelijke korting of subsidie afgetrokken. Prijslijst: september 2026. Gecontroleerd op 23 oktober 2026.",
  "pD": 20400,
  "pDm": "Opel Combo Cargo diesel",
  "pDs": [
   "opel.nl",
   "https://www.opel.nl/bedrijfswagens/combo-modellen/nieuwe-combo/overzicht.html"
  ]
 },
 {
  "c": "bestel",
  "b": "Opel",
  "m": "Vivaro Electric 75 kWh",
  "a": 75,
  "r": 350,
  "rt": "tot 350",
  "rc": "WLTP gecombineerd",
  "dc": 100,
  "st": "nu",
  "n": "Middelgrote elektrische bestelbus met de 75 kWh-accu. Opel noemt in zijn elektrische modellenoverzicht maximaal 350 km WLTP. Leverbaar in twee lengtes en meerdere carrosserievarianten.",
  "s": [
   "Opel Nederland",
   "https://www.opel.nl/elektrisch-rijden/elektrische-bedrijfswagens.html"
  ],
  "checked": "2026-10-21",
  "price": 43400,
  "pt": "Vanafprijs voor gesloten bestel L2 75 kWh. Nederlandse catalogusprijs excl. btw en eventuele afleveringskosten; geen tijdelijke korting of subsidie afgetrokken. Prijslijst: 12 januari 2026. Gecontroleerd op 23 oktober 2026.",
  "ps": [
   "Opel-prijslijst via Haaima (dealer)",
   "https://www.haaima.nl/media/bajntekd/vivaro-electric.pdf"
  ]
 },
 {
  "c": "bestel",
  "b": "Fiat",
  "m": "E-Doblò",
  "a": 50,
  "r": 343,
  "rt": "tot 343",
  "rc": "WLTP gecombineerd",
  "dc": 100,
  "st": "nu",
  "n": "Compacte elektrische bestelbus met de 50 kWh-accu en maximaal 343 km WLTP gecombineerd. Verkrijgbaar in de lengtes M en XL; volgens Fiat is laden tot 80% in circa 30 minuten mogelijk.",
  "s": [
   "Fiat Professional Nederland",
   "https://www.fiat.nl/professional/modellen/e-doblo"
  ],
  "checked": "2026-10-21",
  "price": 27795,
  "pt": "Vanafprijs voor L1 50 kWh. Nederlandse catalogusprijs excl. btw en eventuele afleveringskosten; geen tijdelijke korting of subsidie afgetrokken. Prijslijst: actuele online prijslijst. Gecontroleerd op 23 oktober 2026.",
  "ps": [
   "Fiat Professional Nederland",
   "https://www.fiat.nl/professional/modellen/e-doblo/prijslijst"
  ]
 },
 {
  "c": "bestel",
  "b": "Fiat",
  "m": "E-Scudo 75 kWh",
  "a": 75,
  "r": 352,
  "rt": "tot 352",
  "rc": "WLTP gecombineerd",
  "dc": 100,
  "st": "nu",
  "n": "Middelgrote bestelbus met de 75 kWh-accu. Fiat noemt maximaal 352 km WLTP gecombineerd en circa 45 minuten snelladen tot 80%. Het bereik verschilt per carrosserie en uitvoering.",
  "s": [
   "Fiat Professional Nederland",
   "https://www.fiat.nl/professional/modellen/e-scudo/features"
  ],
  "checked": "2026-10-21",
  "price": 43400,
  "pt": "Vanafprijs voor Easy Pro L2 75 kWh. Nederlandse catalogusprijs excl. btw en eventuele afleveringskosten; geen tijdelijke korting of subsidie afgetrokken. Prijslijst: actuele online prijslijst. Gecontroleerd op 23 oktober 2026.",
  "ps": [
   "Fiat Professional Nederland",
   "https://www.fiat.nl/professional/modellen/e-scudo/prijslijst"
  ]
 },
 {
  "c": "bestel",
  "b": "Toyota",
  "m": "Proace City Electric",
  "a": 50,
  "r": 330,
  "rt": "tot 330",
  "rc": "WLTP gecombineerd",
  "dc": 100,
  "st": "nu",
  "n": "Compacte elektrische bestelbus met de 50 kWh-accu. Toyota noemt in zijn Nederlandse bereikoverzicht en FAQ maximaal 330 km WLTP gecombineerd. Verkrijgbaar als L1 en Long L2.",
  "s": [
   "Toyota Nederland",
   "https://www.toyota.nl/modellen/proace-city"
  ],
  "checked": "2026-10-21",
  "price": 27945,
  "ps": [
   "Toyota Nederland",
   "https://datablob.toyota.nl/data/brochures/Proace-City-Electric-brochure.pdf"
  ],
  "pt": "Vanafprijs voor Comfort L1 50 kWh. Nederlandse catalogusprijs excl. btw en eventuele afleveringskosten; geen tijdelijke korting of subsidie afgetrokken. Prijslijst: actuele online prijslijst. Gecontroleerd op 23 oktober 2026."
 },
 {
  "c": "bestel",
  "b": "Toyota",
  "m": "Proace Electric 75 kWh",
  "a": 75,
  "r": 350,
  "rt": "tot 350",
  "rc": "WLTP gecombineerd",
  "dc": 100,
  "st": "nu",
  "n": "Middelgrote elektrische bestelbus met de 75 kWh-accu en maximaal 350 km WLTP gecombineerd. Ook leverbaar met een kleinere accu van 50 kWh; carrosserie en uitrusting beïnvloeden het bereik.",
  "s": [
   "Toyota Nederland",
   "https://www.toyota.nl/modellen/proace"
  ],
  "checked": "2026-10-21",
  "price": 43050,
  "pt": "Vanafprijs voor Comfort Worker L2 Extra Range 75 kWh. Nederlandse catalogusprijs excl. btw en eventuele afleveringskosten; geen tijdelijke korting of subsidie afgetrokken. Prijslijst: actuele online prijslijst. Gecontroleerd op 23 oktober 2026.",
  "ps": [
   "Toyota Nederland",
   "https://datablob.toyota.nl/data/brochures/Proace-Worker-Electric-brochure.pdf"
  ]
 },
 {
  "c": "bestel",
  "b": "Renault",
  "m": "Kangoo Van E-Tech electric",
  "u": 45,
  "r": 295,
  "rt": "tot 295",
  "rc": "WLTP gecombineerd",
  "dc": 80,
  "st": "nu",
  "n": "Compacte bestelbus met 45 kWh bruikbare accucapaciteit. De actuele Nederlandse modelpagina noemt maximaal 295 km WLTP, afhankelijk van uitvoering, uitrusting en lader. DC-snelladen is afhankelijk van de gekozen laaduitrusting.",
  "s": [
   "Renault Nederland",
   "https://bedrijfswagens.renault.nl/modellen/kangoo-e-tech-electric.html?bodyTypeCode=PT1261_kastenwagen"
  ],
  "checked": "2026-10-21",
  "price": 28000,
  "ps": [
   "cdn.group.renault.com",
   "https://cdn.group.renault.com/ren/nl/brochures-en-prijslijsten/prijslijsten/kangoo-etech-electric-prijslijst.pdf"
  ],
  "pt": "list",
  "consumption": 19
 },
 {
  "c": "bestel",
  "b": "Nissan",
  "m": "Townstar EV Van",
  "a": 44,
  "r": 301,
  "rt": "tot 301",
  "rc": "WLTP gecombineerd",
  "st": "nu",
  "n": "Compacte elektrische bestelbus in de lengtes L1 en L2. De actuele Nederlandse aandrijflijnpagina noemt 44 kWh en maximaal 301 km WLTP gecombineerd. Laaduitrusting en bereik verschillen per versie.",
  "s": [
   "Nissan Nederland",
   "https://www.nissan.nl/voertuigen/nieuw/townstar/motor.html"
  ],
  "checked": "2026-10-21",
  "price": 32000,
  "ps": [
   "stam.nl",
   "https://www.stam.nl/nissan/modellen/nissan-townstar/prijzen/"
  ],
  "pt": "reported",
  "consumption": 18.6
 },
 {
  "c": "bestel",
  "b": "Mercedes-Benz",
  "m": "eCitan",
  "a": 45,
  "r": 284,
  "rt": "tot 284",
  "rc": "WLTP gecombineerd",
  "dc": 75,
  "st": "nu",
  "n": "Compacte gesloten bestelbus met een 45 kWh-accu en maximaal 284 km WLTP gecombineerd. Mercedes-Benz Nederland noemt DC-snelladen tot 75 kW als optie. Beschikbaarheid en laaduitrusting verschillen per versie.",
  "s": [
   "Mercedes-Benz Nederland",
   "https://www.mercedes-benz.nl/vans/models/ecitan/panel-van/overview.html"
  ],
  "checked": "2026-10-21",
  "price": 34300,
  "ps": [
   "laadpunt.nl",
   "https://www.laadpunt.nl/laadpaal-kennisbank/elektrische-bestelwagens/"
  ],
  "pt": "reported"
 },
 {
  "c": "bestel",
  "b": "Ford",
  "m": "E-Transit Custom",
  "u": 71,
  "r": 370,
  "rt": "tot 370",
  "dc": 125,
  "st": "nu",
  "n": "Modeljaar 2026 met 71 kWh bruikbaar. Fabrieksopgave tot 370 km WLTP; 10–80% laden duurt circa 29 minuten. Bereik varieert per uitvoering.",
  "s": [
   "Ford Nederland",
   "https://fordmediacenter.nl/meer-kilometers-minder-wachttijd-ford-e-transit-custom-geeft-jouw-werkdag-een-upgrade/"
  ],
  "checked": "2026-10-21",
  "price": 44390,
  "ps": [
   "Ford Nederland",
   "https://www.ford.nl/content/dam/guxeu/nl/documents/pricelists/commercial-vehicles/PL-ford_e_transit_custom.pdf"
  ],
  "pt": "Vanafprijs voor Trend L1H1 320 71 kWh 136 pk RWD. Nederlandse catalogusprijs excl. btw en eventuele afleveringskosten; geen tijdelijke korting of subsidie afgetrokken. Prijslijst: 24 september 2026. Gecontroleerd op 23 oktober 2026."
 },
 {
  "c": "bestel",
  "b": "Ford",
  "m": "E-Transit Courier",
  "a": 46,
  "r": 325,
  "rt": "tot 325",
  "dc": 100,
  "st": "nu",
  "n": "Bijgewerkte 46 kWh-uitvoering uit 2026. Tot 325 km WLTP en AC-laden met 11 kW; 10–80% DC-laden in minder dan 30 minuten.",
  "s": [
   "Ford Nederland",
   "https://fordmediacenter.nl/ford-e-transit-courier-krijgt-grotere-batterij-meer-actieradius-verbeterde-connectiviteit-en-inzetbaarheid/"
  ],
  "checked": "2026-10-21",
  "price": 28410,
  "ps": [
   "Ford Nederland",
   "https://fordmediacenter.nl/ford-e-transit-courier-krijgt-grotere-batterij-meer-actieradius-verbeterde-connectiviteit-en-inzetbaarheid/"
  ],
  "pt": "Vanafprijs voor Trend met vergroot accupakket 46 kWh. Nederlandse catalogusprijs excl. btw en eventuele afleveringskosten; geen tijdelijke korting of subsidie afgetrokken. Prijslijst: 2026, fabrikantbericht. Gecontroleerd op 23 oktober 2026."
 },
 {
  "c": "bestel",
  "b": "Volkswagen",
  "m": "ID. Buzz Cargo",
  "u": 79,
  "r": 459,
  "rt": "tot 459",
  "dc": 185,
  "st": "nu",
  "n": "Cargo met 79 kWh netto en 210 kW achterwielaandrijving: tot 459 km WLTP gecombineerd. De 4MOTION-versie en de kleinere 59 kWh-accu hebben een ander bereik. Laadvolume 3,9 m³.",
  "s": [
   "Volkswagen Bedrijfswagens",
   "https://www.vwbedrijfswagens.nl/nl/modellen/id-buzz-cargo.html"
  ],
  "checked": "2026-10-21",
  "price": 43690,
  "ps": [
   "Volkswagen Bedrijfswagens Nederland",
   "https://www.vwbedrijfswagens.nl/idhub/content/dam/onehub_nfz/importers/nl/downloads/prijslijsten-en-brochures/id--buzz-cargo/Prijslijst-ID-Buzz-Cargo.pdf"
  ],
  "pt": "Vanafprijs voor Economy Limited Edition 79 kWh 286 pk RWD. Nederlandse catalogusprijs excl. btw en eventuele afleveringskosten; geen tijdelijke korting of subsidie afgetrokken. Prijslijst: 2 april 2026. Gecontroleerd op 23 oktober 2026.",
  "consumption": 19.9
 },
 {
  "c": "bestel",
  "b": "Volkswagen",
  "m": "e-Transporter",
  "u": 70.9,
  "r": 372,
  "rt": "tot 372",
  "dc": 125,
  "st": "nu",
  "n": "Bijgewerkte accu met 70,9 kWh bruikbaar. Tot 372 km WLTP, afhankelijk van uitvoering; 10–80% snelladen duurt circa 29 minuten. Keuze uit twee lengtes en twee dakhoogtes.",
  "s": [
   "Volkswagen Bedrijfswagens",
   "https://www.vwbedrijfswagens.nl/nl/modellen/e-transporter.html"
  ],
  "checked": "2026-10-21",
  "price": 43990,
  "ps": [
   "Volkswagen Bedrijfswagens Nederland",
   "https://nieuws.vwbedrijfswagens.nl/betere-specificaties-voor-e-transporter-en-e-caravelle/"
  ],
  "pt": "Vanafprijs voor bestelbus met 70,9 kWh netto-accu. Nederlandse catalogusprijs excl. btw en eventuele afleveringskosten; geen tijdelijke korting of subsidie afgetrokken. Prijslijst: 8 januari 2026, fabrikantbericht. Gecontroleerd op 23 oktober 2026."
 },
 {
  "c": "bestel",
  "b": "Renault",
  "m": "Trafic Van E-Tech (nieuwe generatie)",
  "a": 81,
  "r": 470,
  "rt": "tot 470",
  "dc": 190,
  "st": "komt",
  "y": 2026,
  "n": "Nieuwe 800V-generatie met 81 kWh long range, L1H1. Volgens Renault bestelbaar medio november 2026. De opgegeven 470 km en laadprestaties zijn voorlopig, in afwachting van WLTP-typegoedkeuring; 60 kWh volgt in 2027.",
  "s": [
   "Renault Nederland",
   "https://bedrijfswagens.renault.nl/trafic-van/trafic-e-tech-electric.html"
  ],
  "checked": "2026-10-21"
 },
 {
  "c": "bestel",
  "b": "Opel",
  "m": "Movano Electric",
  "a": 110,
  "r": 430,
  "rt": "tot 430",
  "dc": 150,
  "st": "nu",
  "n": "110 kWh-accu en tot 430 km WLTP volgens Opel, afhankelijk van carrosserie en opties. Tot 17 m³ laadvolume; DC-laden tot 80% duurt circa 55 minuten.",
  "s": [
   "Opel Nederland",
   "https://www.opel.nl/bedrijfswagens/movano-modellen/nieuwe-movano-electric/overzicht.html"
  ],
  "checked": "2026-10-21",
  "price": 53700,
  "ps": [
   "Opel Nederland",
   "https://www.opel.nl/content/dam/opel/netherlands/vehicles/nieuwe-movano/pdf/07082026-Prijslijst-Movano-Electric.pdf"
  ],
  "pt": "Vanafprijs voor gesloten bestel L3H2 3,5 ton 110 kWh. Nederlandse catalogusprijs excl. btw en eventuele afleveringskosten; geen tijdelijke korting of subsidie afgetrokken. Prijslijst: 1 augustus 2026. Gecontroleerd op 23 oktober 2026."
 },
 {
  "c": "bestel",
  "b": "Peugeot",
  "m": "E-Boxer",
  "a": 110,
  "r": 424,
  "rt": "tot 424",
  "dc": 150,
  "st": "nu",
  "n": "110 kWh-uitvoering met een fabrieksopgave tot 424 km WLTP gecombineerd, afhankelijk van carrosserie en toegestane massa. Tot 17 m³ laadvolume; 0–80% DC-laden in circa 55 minuten.",
  "s": [
   "Peugeot Nederland",
   "https://www.peugeot.nl/content/dam/peugeot/netherlands/b2c/brochures/model/boxer/11032026-Prijzen-en-specificaties-Peugeot-E-Boxer.pdf"
  ],
  "checked": "2026-10-21",
  "price": 53700,
  "ps": [
   "Peugeot-prijslijst via Haaima (dealer)",
   "https://www.haaima.nl/media/kh5pkjvg/peugeot-e-boxer.pdf"
  ],
  "pt": "Vanafprijs voor gesloten bestel L3H2 3,5 ton 110 kWh. Nederlandse catalogusprijs excl. btw en eventuele afleveringskosten; geen tijdelijke korting of subsidie afgetrokken. Prijslijst: 12 januari 2026. Gecontroleerd op 23 oktober 2026."
 },
 {
  "c": "bestel",
  "b": "Citroën",
  "m": "ë-Jumper",
  "a": 110,
  "r": 424,
  "rt": "tot 424",
  "dc": 150,
  "st": "nu",
  "n": "110 kWh-uitvoering: tot 424 km WLTP gecombineerd, afhankelijk van configuratie. Laadvolume 13–17 m³. Snelladen van 0 naar 80% duurt volgens Citroën circa 55 minuten.",
  "s": [
   "Citroën Nederland",
   "https://www.citroen.nl/modellen/bedrijfswagens/e-jumper.html"
  ],
  "checked": "2026-10-21",
  "price": 53700,
  "pt": "Vanafprijs voor gesloten bestel L3H2 3,5 ton 110 kWh. Nederlandse catalogusprijs excl. btw en eventuele afleveringskosten; geen tijdelijke korting of subsidie afgetrokken. Prijslijst: 1 augustus 2026. Gecontroleerd op 23 oktober 2026.",
  "ps": [
   "Citroën Nederland",
   "https://www.citroen.nl/content/dam/citroen/netherlands/b2b/local-content/brochures-prijslijsten/model/e-jumper/01082026-Prijzen-en-specificaties-e-Jumper.pdf"
  ]
 },
 {
  "c": "bestel",
  "b": "Toyota",
  "m": "Proace Max Electric",
  "a": 110,
  "r": 424,
  "rt": "tot 424",
  "dc": 150,
  "st": "nu",
  "n": "110 kWh-accu met tot 424 km gecombineerd WLTP-bereik volgens Toyota Nederland. Verkrijgbaar als L3H2, L3H3 en L4H3; bereik verschilt per uitvoering. Tot 17 m³ laadvolume.",
  "s": [
   "Toyota Nederland",
   "https://www.toyota.nl/modellen/proace-max"
  ],
  "checked": "2026-10-21",
  "price": 53000,
  "pt": "Vanafprijs voor Comfort 3,5t Heavy L3H2 110 kWh. Nederlandse catalogusprijs excl. btw en eventuele afleveringskosten; geen tijdelijke korting of subsidie afgetrokken. Prijslijst: actuele online prijslijst. Gecontroleerd op 23 oktober 2026.",
  "ps": [
   "Toyota Nederland",
   "https://datablob.toyota.nl/data/brochures/Proace-Max-Electric_brochure.pdf"
  ]
 },
 {
  "c": "bestel",
  "b": "IVECO",
  "m": "eDaily",
  "g": 74,
  "r": 265,
  "rt": "tot 265",
  "dc": 80,
  "st": "nu",
  "n": "35S-bestelbus (3,5 ton) met twee geïnstalleerde 37 kWh-modules. WLTP-opgave 265 km voor H1 met wielbasis 3.520 mm onder de testvoorwaarden uit de brochure. De vaak genoemde 400 km is een stedelijke simulatie voor andere configuraties.",
  "s": [
   "IVECO Nederland",
   "https://info.iveco.nl/hubfs/Brochure%20IVECO%20eDaily.pdf?hsLang=nl-nl"
  ],
  "checked": "2026-10-21"
 },
 {
  "c": "bestel",
  "b": "Maxus",
  "m": "eDeliver 3",
  "a": 50,
  "r": 227,
  "dc": 57,
  "st": "nu",
  "n": "Gesloten bestelbus L1 met 50 kWh-accu volgens de actuele Nederlandse prijslijst: 227 km WLTP gecombineerd, 322 km in de stad. Laadvolume 4,8 m³. De chassis-cabine heeft andere waarden.",
  "s": [
   "Maxus Nederland",
   "https://www.maxus-motors.nl/assets/Uploads/Brochures/Prijslijst-eDeliver-3-v3.pdf"
  ],
  "checked": "2026-10-21",
  "price": 29950,
  "pt": "Vanafprijs voor L1 50 kWh. Nederlandse catalogusprijs excl. btw en eventuele afleveringskosten; geen tijdelijke korting of subsidie afgetrokken. Prijslijst: januari 2025. Gecontroleerd op 23 oktober 2026.",
  "ps": [
   "Maxus Nederland",
   "https://www.maxus-motors.nl/assets/Uploads/Brochures/Prijslijst-eDeliver-3-v3.pdf"
  ]
 },
 {
  "c": "bestel",
  "b": "Maxus",
  "m": "eDeliver 5",
  "a": 64,
  "r": 335,
  "dc": 70,
  "st": "nu",
  "n": "L1H1 met 64 kWh-accu: 335 km WLTP gecombineerd en 6,6 m³ laadvolume. Hogere of langere carrosserieën halen minder kilometers. DC-laden van 20 naar 80% duurt circa 36 minuten.",
  "s": [
   "Maxus Nederland",
   "https://www.maxus-motors.nl/assets/Uploads/Brochures/Prijslijst-eDeliver-5-v2.pdf"
  ],
  "checked": "2026-10-21",
  "price": 34750,
  "pt": "Vanafprijs voor L1H1 64 kWh. Nederlandse catalogusprijs excl. btw en eventuele afleveringskosten; geen tijdelijke korting of subsidie afgetrokken. Prijslijst: januari 2025. Gecontroleerd op 23 oktober 2026.",
  "ps": [
   "Maxus Nederland",
   "https://www.maxus-motors.nl/assets/Uploads/Brochures/Prijslijst-eDeliver-5-v2.pdf"
  ]
 },
 {
  "c": "bestel",
  "b": "Maxus",
  "m": "eDeliver 7",
  "a": 88,
  "r": 370,
  "dc": 90,
  "st": "nu",
  "n": "L1H1 met 88 kWh-accu: 370 km WLTP gecombineerd. Er zijn ook 77 kWh-, langere, hogere en AWD-uitvoeringen met afwijkend bereik. DC-laden van 20 naar 80% duurt circa 43 minuten.",
  "s": [
   "Maxus Nederland",
   "https://www.maxus-motors.nl/assets/Uploads/Brochures/Prijslijst-eDeliver-7-v7.pdf"
  ],
  "checked": "2026-10-21",
  "price": 42590,
  "pt": "Vanafprijs voor L1 88 kWh. Nederlandse catalogusprijs excl. btw en eventuele afleveringskosten; geen tijdelijke korting of subsidie afgetrokken. Prijslijst: januari 2025. Gecontroleerd op 23 oktober 2026.",
  "ps": [
   "Maxus Nederland",
   "https://www.maxus-motors.nl/assets/Uploads/Brochures/Prijslijst-eDeliver-7-v7.pdf"
  ]
 },
 {
  "c": "bestel",
  "b": "Maxus",
  "m": "eDeliver 9",
  "a": 88,
  "r": 347,
  "dc": 90,
  "st": "nu",
  "n": "L2H2 met 88 kWh-accu: 347 km WLTP gecombineerd volgens de Nederlandse prijslijst. Dit is de vernieuwde uitvoering; oudere 89 kWh-versies hebben andere specificaties. Laadvolume 9,7 m³.",
  "s": [
   "Maxus Nederland",
   "https://www.maxus-motors.nl/assets/Uploads/Brochures/Prijslijst-eDeliver-9-v4.pdf"
  ],
  "checked": "2026-10-21",
  "price": 46950,
  "ps": [
   "Maxus Nederland",
   "https://www.maxus-motors.nl/assets/Uploads/Brochures/Prijslijst-eDeliver-9-v4.pdf"
  ],
  "pt": "Vanafprijs voor L2H2 88 kWh. Nederlandse catalogusprijs excl. btw en eventuele afleveringskosten; geen tijdelijke korting of subsidie afgetrokken. Prijslijst: juni 2025. Gecontroleerd op 23 oktober 2026."
 },
 {
  "c": "bakwagen",
  "b": "Volvo",
  "m": "FL Electric",
  "a": 565,
  "r": 450,
  "rt": "tot 450",
  "dc": 150,
  "st": "nu",
  "n": "Compact distributiechassis voor 12 tot 18,6 ton. Hier staat de grootste accukeuze van 565 kWh met de door Volvo opgegeven maximale actieradius; een kleinere accu biedt meer laadvermogen. Volvo specificeert op deze pagina niet of de capaciteit bruto of bruikbaar is.",
  "s": [
   "Volvo Trucks",
   "https://www.volvotrucks.com/en-en/trucks/electric/volvo-fl-electric.html"
  ],
  "checked": "2026-10-21"
 },
 {
  "c": "bakwagen",
  "b": "Volvo",
  "m": "FE Electric",
  "vc": "n3",
  "a": 375,
  "r": 275,
  "rt": "tot 275",
  "dc": 150,
  "st": "nu",
  "n": "Distributie-, bouw- en inzamelchassis tot 28 ton, ook met lage instap. Grootste accukeuze van 375 kWh. Volvo geeft tot 275 km op; de opbouw en inzet bepalen de haalbare afstand. Bruto of bruikbaar wordt bij deze capaciteit niet vermeld.",
  "s": [
   "Volvo Trucks",
   "https://www.volvotrucks.com/en-en/trucks/electric/volvo-fe-electric.html"
  ],
  "checked": "2026-10-21"
 },
 {
  "c": "bakwagen",
  "b": "Volvo",
  "m": "FM Low Entry",
  "vc": "n3",
  "a": 360,
  "r": 200,
  "rt": "tot 200",
  "dc": 250,
  "st": "nu",
  "n": "Lage cabine voor stadsdistributie en gemeentelijke inzet tot 32 ton. Vier accupakketten van samen 360 kWh; Volvo noemt tot 200 km. De bron maakt geen onderscheid tussen bruto en bruikbare accucapaciteit.",
  "s": [
   "Volvo Trucks",
   "https://www.volvotrucks.com/en-en/trucks/electric/volvo-fm-low-entry.html"
  ],
  "checked": "2026-10-21"
 },
 {
  "c": "bakwagen",
  "b": "Volvo",
  "m": "FMX Electric",
  "vc": "n3",
  "g": 540,
  "u": 460,
  "r": 470,
  "rt": "tot 470",
  "dc": 350,
  "st": "nu",
  "n": "Elektrisch bouwchassis voor onder meer kipper, kraan of betonmixer. Grootste uitvoering met zes accupakketten: 540 kWh geïnstalleerd en maximaal 460 kWh bruikbaar. Volvo noemt tot 470 km; opbouw, belading en terrein beïnvloeden de actieradius.",
  "s": [
   "Volvo Trucks",
   "https://www.volvotrucks.com/en-en/trucks/electric/volvo-fmx-electric.html"
  ],
  "checked": "2026-10-21"
 },
 {
  "c": "bakwagen",
  "b": "FUSO",
  "m": "eCanter 9C18e L",
  "vc": "n2",
  "g": 124,
  "u": 116,
  "r": 200,
  "rt": "tot 200",
  "dc": 104,
  "st": "nu",
  "n": "Licht chassis van 8,55 ton met het L-accupakket: 124 kWh geïnstalleerd, 116 kWh bruikbaar. De 200 km is door FUSO getest met gesloten laadbak, 50% van het laadvermogen en 20 °C. AC-laden kan met 22 kW.",
  "s": [
   "FUSO technische gegevens",
   "https://www.fuso-trucks.com/wp-content/uploads/sites/2/2024/05/eCanter_Technical-Datasheets_2024_EN_855T.pdf"
  ],
  "checked": "2026-10-21",
  "gvw": 8550
 },
 {
  "c": "bakwagen",
  "b": "MAN",
  "m": "eTGM (4 accupakketten)",
  "vc": "n3",
  "u": 320,
  "r": 480,
  "rt": "tot 480",
  "dc": 375,
  "st": "komt",
  "y": 2026,
  "n": "Distributiechassis van 16,01 tot 16,5 ton. Vier pakketten geven 320 kWh bruikbaar en volgens MAN tot 480 km zonder aanhanger; met aanhanger noemt MAN maximaal 285 km. Interne fabriekswaarden. Productiestart verwacht in december 2026.",
  "s": [
   "MAN Truck & Bus",
   "https://www.man.eu/uk/en/truck/all-models/the-man-tgm-and-man-tgl/the-man-etgm/overview.html"
  ],
  "checked": "2026-10-21"
 },
 {
  "c": "bakwagen",
  "b": "MAN",
  "m": "eTGS 4×2 chassis",
  "vc": "n3",
  "u": 480,
  "r": 600,
  "rt": "tot 600",
  "dc": 375,
  "mcs": 750,
  "st": "nu",
  "n": "Zwaar distributiechassis met zes accupakketten en 480 kWh bruikbaar. MAN noemt maximaal 600 km voor een solovoertuig in distributie (0,8 kWh per km) en 400 km met aanhanger op de snelweg. De vaak genoemde 800 km per dag haal je alleen met tussentijds laden.",
  "s": [
   "MAN Truck & Bus",
   "https://www.man.eu/uk/en/truck/all-models/the-man-tgs/the-man-etgs/overview.html"
  ],
  "checked": "2026-10-21"
 },
 {
  "c": "bakwagen",
  "b": "Renault Trucks",
  "m": "E-Tech D Wide 375",
  "vc": "n3",
  "a": 375,
  "r": 315,
  "rt": "tot 315",
  "dc": 150,
  "st": "nu",
  "n": "Distributie- en inzamelchassis van 19 tot 26 ton. Dit betreft de configuratie met maximaal 375 kWh en tot 315 km uit de fabrieksdocumentatie. Renault vermeldt bij deze capaciteit niet expliciet bruto of bruikbaar. Het rijprofiel en de opbouw bepalen het praktijkbereik.",
  "s": [
   "Renault Trucks",
   "https://www.renault-trucks.at/press-release/renault-trucks-e-tech-d-wide-erste-praxiseinsatze"
  ],
  "checked": "2026-10-21"
 },
 {
  "c": "bus",
  "b": "Solaris",
  "m": "Urbino 12 electric (modulair)",
  "a": 600,
  "at": "> 600",
  "r": 600,
  "rt": "> 600",
  "rc": "SORT 2",
  "st": "nu",
  "n": "Stadsbus van 12 meter met modulaire aandrijving. Solaris noemt zes dakpakketten met samen meer dan 600 kWh en een bereik boven 600 km op basis van SORT 2-verbruik. Exacte bruto/netto-capaciteit en laadsnelheid worden op deze pagina niet gespecificeerd. Ook pantograafladen is mogelijk.",
  "s": [
   "Solaris Bus & Coach",
   "https://www.solarisbus.com/en/urbino-12-electric-with-modular-drive"
  ],
  "checked": "2026-10-21"
 },
 {
  "c": "bus",
  "b": "Solaris",
  "m": "Urbino 18 electric (modulair)",
  "a": 800,
  "at": "> 800",
  "r": 600,
  "rt": "tot 600",
  "rc": "e-SORT 2",
  "st": "nu",
  "n": "Gelede stadsbus van 18 meter. De grootste accuconfiguratie bevat meer dan 800 kWh; Solaris geeft 600 km op, berekend uit het e-SORT 2-verbruik. Exacte bruto/netto-capaciteit en laadsnelheid worden op deze pagina niet gespecificeerd. Laden via stekker of pantograaf.",
  "s": [
   "Solaris Bus & Coach",
   "https://www.solarisbus.com/en/urbino-18-electric"
  ],
  "checked": "2026-10-21"
 },
 {
  "c": "bus",
  "b": "MAN",
  "m": "Lion’s City 10 E",
  "g": 356,
  "u": 320,
  "r": 310,
  "rt": "tot 310",
  "dc": 150,
  "st": "nu",
  "n": "Compacte stadsbus van circa 10,6 meter met vier pakketten. De 320 kWh bruikbaar en tot 310 km horen bij de Maximum Range-accustrategie; belading, route en klimaatregeling beïnvloeden het bereik.",
  "s": [
   "MAN brochure Lion’s City E",
   "https://www.man.eu/content/dam/man/countries/doc/bw-master/bus/eventassets-1/Brochure-MAN-Lions-City-E-IT.pdf/_jcr_content/renditions/original./Brochure-MAN-Lions-City-E-IT.pdf"
  ],
  "checked": "2026-10-21"
 },
 {
  "c": "bus",
  "b": "MAN",
  "m": "Lion’s City 12 E",
  "g": 445,
  "u": 400,
  "r": 380,
  "rt": "tot 380",
  "dc": 150,
  "st": "nu",
  "n": "Stadsbus van circa 12,2 meter met vijf pakketten. Deze 445 kWh-configuratie biedt maximaal 400 kWh bruikbaar bij de Maximum Range-accustrategie. MAN noemt tot 380 km onder gunstige inzetomstandigheden.",
  "s": [
   "MAN brochure Lion’s City E",
   "https://www.man.eu/content/dam/man/countries/doc/bw-master/bus/eventassets-1/Brochure-MAN-Lions-City-E-IT.pdf/_jcr_content/renditions/original./Brochure-MAN-Lions-City-E-IT.pdf"
  ],
  "checked": "2026-10-21"
 },
 {
  "c": "bus",
  "b": "MAN",
  "m": "Lion’s City 18 E",
  "g": 623,
  "u": 560,
  "r": 350,
  "rt": "tot 350",
  "dc": 150,
  "st": "nu",
  "n": "Gelede stadsbus van circa 18,1 meter met zeven pakketten. Tot 560 kWh bruikbaar volgens de Maximum Range-accustrategie. Het technische fabrieksblad noemt 350 km onder gunstige omstandigheden, afhankelijk van accustrategie, belading en klimaatregeling.",
  "s": [
   "MAN technische gegevens",
   "https://media.man.eu/is/content/MAN/man_lions_city_datenblatt_18-E_ENpdf"
  ],
  "checked": "2026-10-21"
 },
 {
  "c": "bus",
  "b": "BYD",
  "m": "eBus B12.b",
  "a": 500,
  "r": 600,
  "rt": "tot 600",
  "st": "nu",
  "n": "Stadsbus van 12 meter met Blade Battery in het chassis en plaats voor maximaal 105 reizigers. BYD noemt maximaal 500 kWh en tot 600 km op één lading. De bron specificeert de testcyclus, bruto/netto-capaciteit en de laadsnelheid niet.",
  "s": [
   "BYD Europe",
   "https://bydeurope.com/byd-ebus-b12"
  ],
  "checked": "2026-10-21",
  "price": 457000,
  "ps": [
   "truckandbusbuilder.com",
   "https://truckandbusbuilder.com/article/2024/02/25/belgian-transport-operator-orders-92-byd-electric-buses"
  ],
  "pt": "order"
 },
 {
  "c": "bus",
  "b": "Karsan",
  "m": "e-ATA 12",
  "a": 528,
  "r": 500,
  "rt": "tot 500",
  "st": "nu",
  "n": "Lagevloer-stadsbus van 12 meter met een LFP-accu tot 528 kWh. Karsan noemt 500 km onder realistische omstandigheden, afhankelijk van accugrootte en rijprofiel; er staat geen gestandaardiseerde testcyclus bij. Laden via DC-stekker en optioneel pantograaf; bruto/netto en laadpiek niet gespecificeerd.",
  "s": [
   "Karsan",
   "https://www.karsan.com/en/electric-bus/e-ata-12"
  ],
  "checked": "2026-10-21"
 },
 {
  "c": "trekker",
  "b": "MAN",
  "m": "eTGX (huidige generatie)",
  "fam": "eTGX",
  "vl": "Huidige generatie",
  "a": 480,
  "r": 570,
  "rt": "tot 570",
  "dc": 375,
  "mcs": 750,
  "st": "nu",
  "n": "4×2-trekker met zes accupakketten, samen 480 kWh volgens de technische modeltabel. De 570 km is een interne richtwaarde onder gunstige omstandigheden, geen WLTP-cijfer. De apart vermelde nieuwe generatie met 660 km volgt in 2027.",
  "s": [
   "MAN Truck & Bus",
   "https://www.man.eu/uk/en/truck/all-models/the-man-tgx/the-man-etgx/overview.html"
  ],
  "checked": "2026-10-21"
 },
 {
  "c": "trekker",
  "b": "Renault Trucks",
  "m": "E-Tech T 540",
  "fam": "E-Tech T",
  "vl": "540 kWh · 4×2",
  "a": 540,
  "r": 450,
  "rt": "tot 450",
  "dc": 350,
  "st": "nu",
  "n": "Elektrische 4×2-trekker voor regionaal vervoer, met maximaal 540 kWh en tot 450 km volgens Renault Trucks. Bereik is afhankelijk van treingewicht en inzet. DC-snelladen via CCS tot 350 kW.",
  "s": [
   "Renault Trucks",
   "https://www.renault-trucks.com/en/newsroom/press-releases/long-haul-operations-now-within-reach-renault-trucks-electric-tractors"
  ],
  "checked": "2026-10-21"
 },
 {
  "c": "trekker",
  "b": "Renault Trucks",
  "m": "E-Tech T 585",
  "fam": "E-Tech T",
  "vl": "585 kWh · 6×2 e-as",
  "a": 585,
  "r": 500,
  "rt": "tot 500",
  "dc": 350,
  "st": "nu",
  "n": "6×2-trekker met e-as, afgestemd op laadvermogen. Renault Trucks noemt 585 kWh en maximaal 500 km. Andere belading, opbouw en omstandigheden geven een ander bereik; CCS-laden tot 350 kW.",
  "s": [
   "Renault Trucks",
   "https://www.renault-trucks.com/en/newsroom/press-releases/long-haul-operations-now-within-reach-renault-trucks-electric-tractors"
  ],
  "checked": "2026-10-21"
 }
];
MODELS.forEach(m=>m.id=(m.b+' '+m.m).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''));
const MI={};MODELS.forEach(m=>MI[m.id]=m);
let mCat=null,mOpen=new Set(),mSel=[],mVar={},mMin=0;
/* 90% is een expliciete aanname, ook als de fabrikant bruto/netto niet vermeldt. */
const mU=m=>m.u||m.ue||Math.round((m.g||m.a)*.9);
const mCap=m=>m.u||m.ue||m.g||m.a;
const mFmt=n=>nf(n,Number.isInteger(n)?0:1);
const mCapText=m=>m.u||m.ue?(m.ut||mFmt(m.u||m.ue)):m.g?(m.gt||mFmt(m.g)):(m.at||mFmt(m.a));
const mUq=m=>m.u?'bruikbaar':m.ue?'afgeleid':m.g?'bruto':'type niet vermeld';
const mAcc=m=>Math.min(F.acc[3],Math.max(F.acc[2],Math.round(mU(m)*10)/10));
const mEnergy=m=>Math.min(F.le[3],Math.max(F.le[2],Math.round((m.consumption||mAcc(m)/m.r*100)*10)/10));
const mAssumption=m=>m.u?'opgave bruikbaar':m.ue?(m.derived||'afgeleid uit actieradius en verbruik'):m.g?'geschat: 90% van bruto':'geschat: 90% van opgegeven capaciteit; bruto/netto onbekend';
const mRange=m=>`${m.rt||nf(m.r)} km${m.rc?' ('+m.rc+')':m.c==='bestel'?' (WLTP gecombineerd)':''}`;
const mK=m=>Math.max(m.dc||0,m.mcs||0);
const mName=m=>`${m.b} ${m.m}`;
const mEsc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mStat=m=>m.st==='nu'?'Leverbaar':'Verwacht '+m.y;
function modelOptions(){$('calcModel').value='';$('mpQ').value='';mpList()}
const modelActive=()=>{const m=MI[$('calcModel').value];return m&&m.c===vtype?m:null};
function mpList(){
 const cur=$('calcModel').value,q=mNorm($('mpQ').value).split(/\s+/).filter(Boolean);
 const list=MODELS.filter(m=>m.c===vtype&&q.every(w=>mNorm(mName(m)).includes(w))).sort((a,b)=>mName(a).localeCompare(mName(b),'nl'));
 setH($('mpL'),(q.length?'':`<button type="button" class="mpo" role="option" data-mp="" aria-selected="${!cur}"><span><b>Geen specifiek voertuig</b></span></button>`)+list.map(m=>`<button type="button" class="mpo" role="option" data-mp="${m.id}" aria-selected="${m.id===cur}"><span><small>${m.b}</small><b>${m.m}</b></span><em>${m.st==='komt'?'verwacht '+m.y:`${mFmt(mAcc(m))} kWh · ${nf(m.r)} km`}</em></button>`).join('')+(list.length?'':'<p class="mpnone">Geen voertuig gevonden.</p>'));
}
function modelPaint(){
 const m=modelActive();
 $('mpB').classList.toggle('on',!!m);$('mpN').textContent=m?mName(m)+(m.st==='komt'?' · verwacht '+m.y:''):'Geen specifiek voertuig';

 $('mpH').hidden=!m;
 const lk=(s,t)=>s?` <a href="${s[1]}" target="_blank" rel="noopener">${t||s[0]} ↗</a>`:'';
 setH($('mpH'),m?`<b>Elektrisch:</b> ${m.price?`${eur(m.price)} ${m.pt==='list'||!m.pt?'catalogusprijs':m.pt==='estimate'?'geschat':'indicatief'}, `:'prijs onbekend, voorbeeldbedrag ingevuld, '}accu ${mFmt(mAcc(m))} kWh, verbruik ${nf(mEnergy(m),1)} kWh/100 km.${lk(m.s,'Bron')}${m.price&&m.ps?lk(m.ps,'Prijs'):''}<br><b>Diesel ter vergelijking:</b> ${(dz=>m.pD?`${m.pDm}, ${eur(m.pD)}, ${nf(dz.ld,1)} l/100 km${m.ld?'':' (geschat)'}.${lk(m.pDs,'Bron')}`:`voorbeeldcijfers ${eur(dz.pD)} en ${nf(dz.ld,1)} l/100 km${dz.kg?' (verbruik naar gewicht)':''}.`)(mDiesel(m))}`:'');
}
function mpOpen(open){
 const p=$('mpP');if(p.hidden===!open)return;p.hidden=!open;$('mpB').setAttribute('aria-expanded',open);
 if(open){$('mpQ').value='';mpList();(innerWidth>640?$('mpQ'):$('mpL').querySelector('[aria-selected=true]')||$('mpQ')).focus({preventScroll:true});const s=$('mpL').querySelector('[aria-selected=true]');if(s)s.scrollIntoView({block:'nearest'})}
}
document.addEventListener('click',e=>{
 if(e.target.closest('#mpB')){mpOpen($('mpP').hidden);return}
 const o=e.target.closest('[data-mp]');
 if(o){const id=o.dataset.mp;mpOpen(false);if(id)modelApply(id);else{$('calcModel').value='';fitRanges();touched=true;render()}$('mpB').focus({preventScroll:true});return}
 if(!$('mpP').hidden&&!e.target.closest('#mpk'))mpOpen(false);
});
document.addEventListener('input',e=>{if(e.target.id==='mpQ')mpList()});
document.addEventListener('keydown',e=>{
 if($('mpP').hidden||!e.target.closest||!e.target.closest('#mpk'))return;
 const os=[...$('mpL').querySelectorAll('[data-mp]')],i=os.indexOf(document.activeElement);
 if(e.key==='Escape'){e.preventDefault();e.stopPropagation();mpOpen(false);$('mpB').focus();return}
 if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const n=os[e.key==='ArrowDown'?Math.min(os.length-1,i+1):i<=0?-1:i-1];(n||$('mpQ')).focus()}
 if(e.key==='Enter'&&e.target.id==='mpQ'&&os.length){e.preventDefault();os[0].click()}
},true);
/* Diesel ter vergelijking: bekende dieseltweeling, anders de voorbeeldcijfers van het voertuig. Een lichte bakwagen krijgt het verbruik van zijn gewichtsklasse.
   Zo bedacht: eerst schaalden we prijs en verbruik van de diesel mee met het elektrische model. Een eActros van € 300.000 gaf zo een
   diesel van € 118.800 in plaats van € 95.000, en dat maakte elektrisch duizenden euro's per jaar te gunstig. Een diesel wordt niet
   duurder omdat de elektrische versie duur is. Het gewicht zegt wel iets over het verbruik; daarvoor gebruiken we dezelfde tabel als
   bij een kenteken (tot 12 ton 17, tot 18 ton 22 l/100 km). Kennen we geen gewicht, dan gelden de voorbeeldcijfers. */
const mDiesel=m=>{const P=VT[m.c].p,kg=m.c==='bakwagen'&&m.gvw&&m.gvw<=18000?m.gvw:0;return{pD:m.pD||P.pD,ld:m.ld||(kg?(kg<=12000?17:22):P.ld),known:!!m.pD,kg:!!(kg&&!m.ld)}};
function modelApply(id,keepOwnPrice=false){
 const m=MI[id];if(!m)return false;
 if(m.c!==vtype){applyType(m.c);tolSel.clear();TOL.forEach(c=>$('k_'+c[0]).value=0)}
 $('calcModel').value=id;mpList();
 const P=VT[m.c].p;setNum($('acc'),mAcc(m));setNum($('le'),mEnergy(m));if(m.price||!keepOwnPrice)setNum($('pE'),m.price||P.pE);const dz=mDiesel(m);if($('dw').value!=='h'){setNum($('pD'),dz.pD);setNum($('ld'),dz.ld)}
 fitRanges();
 if(m.c==='bakwagen'){$('cls').value=(m.vc||'n3').toUpperCase();if(m.gvw&&m.gvw<10000)$('reg').value='geen'}
 /* Gebruikt of huidige diesel: prijs, accu en verzekering volgen het gekozen model, niet de nieuwprijs */
 if($('nw').value==='g')usedAuto(true);if($('dw').value==='h')dieselAuto(true);
 touched=true;render();return true;
}
const mBase=(c=mCat)=>MODELS.filter(m=>(c==='all'||m.c===c)&&(ck('mSoon')||m.st==='nu')&&mMatches(m));
function mRows(){
 const sort=$('mSort').value,br=$('mBrand').value;
 return mBase().filter(m=>m.r>=mMin&&(!br||m.b===br)).sort((a,b)=>(sort==='b'?mName(a).localeCompare(mName(b),'nl'):sort==='u'?mU(b)-mU(a):sort==='k'?mK(b)-mK(a)||b.r-a.r:sort==='p'?(a.price||1e9)-(b.price||1e9):b.r-a.r)||mName(a).localeCompare(mName(b),'nl'));
}
const mNorm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const mMatches=m=>mNorm($('mSearch').value).split(/\s+/).filter(Boolean).every(q=>mNorm(`${mName(m)} ${m.fam||''} ${m.vl||''}`).includes(q));
/* Uitvoeringen van dezelfde familie worden één rij; de volgorde volgt de best scorende uitvoering in de huidige sortering. */
const mFamId=m=>m.fam?'fam-'+mNorm(`${m.c} ${m.b} ${m.fam}`).replace(/ /g,'-'):m.id;
function mGroups(list){const G=new Map();list.forEach(m=>{const k=mFamId(m);G.has(k)?G.get(k).push(m):G.set(k,[m])});return[...G].map(([k,vs])=>({k,vs:vs.slice().sort((a,b)=>mCap(a)-mCap(b)||a.r-b.r),top:vs[0]}))}
const mSpan=(a,b,f=mFmt)=>a===b?f(a):`${f(a)}–${f(b)}`;
const mBar=(m,mx)=>`<span class="mbar" aria-hidden="true"><i style="width:${Math.min(100,m.r/mx*100)}%"></i></span>`;
const mBatt=m=>m.u||m.ue?`${m.ut||mFmt(m.u||m.ue)} kWh ${m.u?'bruikbaar':'(afgeleid)'}`:'Niet opgegeven';
const mCharge=m=>[m.dc?`CCS tot ${nf(m.dc)} kW`:'',m.mcs?`MCS tot ${nf(m.mcs)} kW`:''].filter(Boolean).join(' · ')||'Niet opgegeven';
function mAccLine(m){
 const v=m.u||m.ue?(m.ut||mFmt(m.u||m.ue)):m.g?(m.gt||mFmt(m.g)):(m.at||mFmt(m.a));
 const q=m.u?['bruikbaar']:m.ue?['bruikbaar, afgeleid']:m.g?['bruto']:['bruto of netto niet vermeld'];
 if((m.u||m.ue)&&m.g)q.push(`${m.gt||mFmt(m.g)} bruto`);
 return`${v} kWh <small>${q.join(' · ')}</small>`;
}
const MIC={bat:'<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10.5v3M7 10.5v3"/>',bolt:'<path d="M13 3 5.5 13.5H12L11 21l7.5-10.5H12z"/>',eur:'<path d="M17.5 6.5A7 7 0 1 0 17.5 17.5M4 10.5h9M4 13.5h9"/>'};
const mIc=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${MIC[k]}</svg>`;
const arrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
/* Eén kaart per model. Actieradius is het hoofdgetal; accu, laden en prijs staan eronder. Uitvoeringen wissel je in de kaart. */
function mCard(k,vs,top,mx){
 const m=vs.find(x=>x.id===mVar[k])||top,sel=mSel.includes(m.id),now=m.st==='nu',rt=m.rt||'',upto=/^tot\s/.test(rt);
 /* Zolang er geen uitvoering gekozen is, toont een familie de actieradius van kleinste tot grootste uitvoering */
 const rs=vs.map(x=>x.r),r0=Math.min(...rs),r1=Math.max(...rs),span=!mVar[k]&&r0!==r1;
 const caps=vs.map(x=>x.g||x.a||x.u||x.ue),ps=vs.map(x=>x.price).filter(Boolean),bat=span?mSpan(Math.min(...caps),Math.max(...caps)):mCapText(m),kw=span?Math.max(...vs.map(mK)):mK(m);
 const pr=span?(ps.length?(ps.length<vs.length||Math.min(...ps)!==Math.max(...ps)?'vanaf ':'')+eur(Math.min(...ps)):''):m.price?eur(m.price):'';
 const pick=vs.length>1?`<div class="mvar"><div class="seg sm" role="radiogroup" aria-label="Uitvoering">${vs.map(x=>`<button type="button" role="radio" data-mvar="${k}" data-mvid="${x.id}" aria-checked="${span?false:x.id===m.id}" tabindex="${(span?x===vs[0]:x.id===m.id)?0:-1}"${x.vl?` title="${x.vl}"`:''}>${x.vl?x.vl.split(' · ')[0]:mCapText(x)+' kWh'}</button>`).join('')}</div></div>`:'<div class="mvar" aria-hidden="true"></div>';
 return`<article class="mc${sel?' sel':''}"><div class="mch"><span class="mbrand">${m.b}</span><span class="mst${now?'':' soon'}"><i aria-hidden="true"></i>${now?'Leverbaar':'Verwacht '+m.y}</span></div>
  <h3 class="mcn">${m.fam||m.m}</h3>
  <div class="mcr"><p><b>${span?`${nf(r0)}–${nf(r1)}`:upto?rt.slice(4):rt||nf(m.r)}</b><small>km actieradius</small></p>${span?`<span class="mbar" aria-hidden="true"><i class="mx" style="width:${Math.min(100,r1/mx*100)}%"></i><i style="width:${Math.min(100,r0/mx*100)}%"></i></span>`:mBar(m,mx)}</div>
  <ul class="mcs"><li>${mIc('bat')}<b>${bat}</b> kWh</li>${kw?`<li>${mIc('bolt')}<b>${nf(kw)}</b> kW</li>`:''}<li class="mpr${pr?'':' na'}">${mIc('eur')}${pr?`<b>${pr}</b>`:'Op aanvraag'}</li></ul>${pick}
  <div class="mca"><button class="cta" type="button" data-muse="${m.id}">Reken hiermee ${arrow}</button><label class="mcv"><input type="checkbox" data-msel="${m.id}"${sel?' checked':''}${!sel&&mSel.length>=3?' disabled':''}>Vergelijk</label><button type="button" class="mci" data-mrow="${m.id}" aria-haspopup="dialog">Info</button></div></article>`;
}
function mInfo(id){
 const m=MI[id];if(!m)return;
 const when=m.checked?new Intl.DateTimeFormat(document.documentElement.lang==='en'?'en-GB':'nl-NL',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(m.checked+'T12:00:00Z')):'';
 $('mDlgT').textContent=mName(m);
 $('mDlgB').innerHTML=`<div class="minfo"><p>${m.n}</p><dl class="mkv"><div><dt>Actieradius</dt><dd>${m.rt||nf(m.r)} km <small><a href="/overstapgids/begrippen/">${m.rc||(m.c==='bestel'?'WLTP gecombineerd':'opgave fabrikant')}</a></small></dd></div><div><dt>Accu</dt><dd>${mAccLine(m)}</dd></div><div><dt>Snelladen</dt><dd>${mCharge(m)}</dd></div><div><dt>Prijs</dt><dd>${m.price?`${eur(m.price)} <small>excl. btw${m.pt&&m.pt!=='list'?(m.pt==='estimate'?', geschat':', indicatief'):''}</small>${m.pt&&!['list','estimate','order'].includes(m.pt)?`<small class="price-note">${mEsc(m.pt)}</small>`:''}${(!m.pt||m.pt==='list')&&m.ps&&/^https:\/\//.test(m.ps[1])&&m.ps[1]!==m.s[1]?` <a href="${mEsc(m.ps[1])}" target="_blank" rel="noopener">${mEsc(m.ps[0])} ↗</a>`:''}`:'Op aanvraag'}</dd></div>${PRAK[m.id]?`<div><dt>Praktijk</dt><dd>${nf(PRAK[m.id].le,1)} kWh/100 km <small>gemiddeld uit ${nf(PRAK[m.id].n)} berekeningen</small></dd></div>`:''}${m.c==='bestel'?`<div><dt>Tweedehands</dt><dd>${usedLinks(m)}</dd></div>`:''}<div><dt>Bron</dt><dd><a href="${m.s[1]}" target="_blank" rel="noopener">${m.s[0]} <span aria-hidden="true">↗</span></a>${when?` <small>${when}</small>`:''}</dd></div></dl><div class="mbtns"><button class="cta" type="button" data-muse="${m.id}">Reken hiermee ${arrow}</button><button class="btn" type="button" data-mquote="${m.id}">Offerte aanvragen</button></div></div>`;
 const d=$('mDlg');if(!d.open)d.showModal();
}
const MRG=[0,200,300,400,500];
function mPaint(){
 if(!mCat)mCat='all';
 const soon=ck('mSoon'),brs=[...new Set(mBase().map(m=>m.b))].sort((a,b)=>a.localeCompare(b,'nl')),bs=$('mBrand');
 if(bs.value&&!brs.includes(bs.value))bs.value='';
 const bv=bs.value;bs.innerHTML='<option value="">Alle merken</option>'+brs.map(b=>`<option${b===bv?' selected':''}>${b}</option>`).join('');
 setH($('mRg'),MRG.map(n=>`<button type="button" data-mrg="${n}" aria-pressed="${n===mMin}">${n?n+'+ km':'Alle'}</button>`).join(''));
 const entry=routeEntry('modellen',mCat),copy=document.documentElement.lang==='en'?entry.en:entry;
 const heading=document.querySelector('[data-page=modellen] h1');if(heading)heading.textContent=copy.name||'Elektrische voertuigen';
 const intro=$('mIntro');if(intro)intro.textContent=copy.intro||copy.desc;
 const advice=$('mAdvice');if(advice)advice.textContent=copy.advice||'';
 const list=mRows(),groups=mGroups(list),mx=Math.max(1,...list.map(m=>m.r));
 setH($('mCat'),MCAT.map(c=>`<a href="${pathOf('modellen',c[0])}" data-mcat="${c[0]}"${c[0]===mCat?' aria-current="page"':''}>${c[1]}</a>`).join(''));
 $('mCount').textContent=`${groups.length} ${groups.length===1?'model':'modellen'}`;
 setH($('mList'),groups.length?groups.map(({k,vs,top})=>mCard(k,vs,top,mx)).join(''):`<p class="mnone">Geen voertuigen met deze filters.</p>`);
 $('mBar').hidden=!mSel.length||page!=='modellen'||$('mDlg').open;
 $('mBarT').textContent=mSel.length===1?'1 voertuig gekozen · kies er nog een':`${mSel.length} voertuigen gekozen`;
 $('mGo').disabled=mSel.length<2;
}
function mCompare(){
 const ms=mSel.map(id=>MI[id]),mx=Math.max(...ms.map(m=>m.r)),best=f=>Math.max(...ms.map(f));
 const row=(lab,f,num)=>`<tr><th scope="row">${lab}</th>${ms.map(m=>`<td${num&&ms.length>1&&num(m)===best(num)&&num(m)>0?' class="best"':''}>${f(m)}</td>`).join('')}</tr>`;
 $('mDlgT').textContent='Vergelijken';
 $('mDlgB').innerHTML=`<table class="mct"><thead><tr><th></th>${ms.map(m=>`<th scope="col"><small>${m.b}</small><b>${m.m}</b></th>`).join('')}</tr></thead><tbody>
  ${row('Soort',m=>VT[m.c].n)}${row('Status',mStat)}
  ${row('Accu bruto',m=>m.g?(m.gt||mFmt(m.g))+' kWh':'–')}${row('Accu type niet vermeld',m=>m.a?(m.at||mFmt(m.a))+' kWh':'–')}${row('Accu bruikbaar',m=>m.u||m.ue?`${m.ut||mFmt(m.u||m.ue)} kWh${m.u?'':' (afgeleid)'}`:`≈ ${nf(mU(m))} kWh (90% geschat)`,mU)}
  ${row('Actieradius',m=>`${mRange(m)}${mBar(m,mx)}`,m=>m.r)}
  ${row('Snelladen',m=>mCharge(m),mK)}${row('Prijs excl. btw',m=>m.price?eur(m.price):'–')}
  ${ms.some(m=>m.c===vtype)?row('Kosten per km <small>met jouw cijfers</small>',m=>{const c=mTco(m);return c===null?'–':eur(c,2)},m=>{const c=mTco(m);return c===null?0:1/c}):''}
  ${row('',m=>`<button class="wbtn" type="button" data-muse="${m.id}">Reken hiermee</button>`)}</tbody></table>`;
 const d=$('mDlg');if(!d.open)d.showModal();mPaint();
}
/* Kosten per km van een model met al je andere cijfers uit de calculator */
const mTco=m=>{if(m.c!==vtype)return null;const r=calcX({acc:mAcc(m),le:mEnergy(m),pE:m.price||v('pE')});return r.te/r.km};
/* Tweedehands: gefilterd zoeken op Marktplaats en op de grote bedrijfswagensites */
const mQ=m=>`${m.b} ${(m.fam||m.m).replace(/\(.*?\)/g,'')}`.replace(/\s+/g,' ').trim();
const usedLinks=m=>{const q=mQ(m);return`<a href="https://www.marktplaats.nl/q/${encodeURIComponent(q).replace(/%20/g,'+')}/" target="_blank" rel="noopener">Marktplaats <span aria-hidden="true">↗</span></a>`};
/* Offerte aanvragen: naar Supabase (tabel quote_requests, alleen insert) */
async function sbInsert(table,row){try{const r=await fetch(SB_URL+'/rest/v1/'+table,{method:'POST',headers:{apikey:SB_KEY,Authorization:'Bearer '+SB_KEY,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(row)});return r.ok}catch(e){return false}}
function mQuote(id){
 const m=MI[id];if(!m)return;
 $('mDlgT').textContent='Offerte aanvragen';
 $('mDlgB').innerHTML=`<form class="qf" id="qForm" data-qid="${m.id}" novalidate><p class="qfm"><b>${mName(m)}</b>${m.vl?` <small>${m.vl}</small>`:''}</p><div class="ffr two"><label class="ff"><span>Naam</span><input name="contact_name" required maxlength="200" autocomplete="name"></label><label class="ff"><span>Bedrijf</span><input name="company" required maxlength="200" autocomplete="organization"></label></div><div class="ffr two"><label class="ff"><span>E-mail</span><input name="email" type="email" required maxlength="200" autocomplete="email"></label><label class="ff"><span>Telefoon</span><input name="phone" type="tel" maxlength="50" autocomplete="tel"></label></div><fieldset class="ffs"><legend>Aantal</legend><div class="seg"><label><input type="radio" name="quantity" value="1" checked><span>1</span></label><label><input type="radio" name="quantity" value="2-5"><span>2–5</span></label><label><input type="radio" name="quantity" value="6+"><span>6+</span></label></div></fieldset><input class="fhp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><p class="ferr" id="qErr" role="alert" hidden></p><div class="fsub"><button class="cta" type="submit"><span>Verstuur</span>${arrow}</button><a href="/privacy/">Privacy</a></div></form>`;
 const d=$('mDlg');if(!d.open)d.showModal();
 track('quote_open',{id});
}
document.addEventListener('input',e=>{const xg=e.target.closest&&e.target.closest('.xg.xguit');if(!xg)return;const wst=xg.closest('.wst');const id=['xFin','xLad','xOw','xZon'].find(i=>$(i)&&$(i).closest('.wst')===wst);if(id)$(id).checked=true});
document.addEventListener('submit',async e=>{
 const f=e.target;if(f.id!=='qForm')return;e.preventDefault();
 const fd=new FormData(f),val=n=>String(fd.get(n)||'').trim(),err=t=>{$('qErr').textContent=t;$('qErr').hidden=!t};
 if(val('website'))return;
 let bad=null;['contact_name','company','email'].forEach(n=>{const el=f.elements[n],ok=!!el.value.trim()&&el.checkValidity();el.setAttribute('aria-invalid',String(!ok));if(!ok&&!bad)bad=el});
 if(bad){err('Vul je naam, bedrijf en een geldig e-mailadres in.');bad.focus();return}
 err('');const btn=f.querySelector('button[type=submit]');btn.disabled=true;
 const m=MI[f.dataset.qid];let link='';try{link=shareURL()}catch(x){}
 const ok=await sbInsert('quote_requests',{model_id:m.id,model_name:mName(m),category:m.c,company:val('company'),contact_name:val('contact_name'),email:val('email'),phone:val('phone')||null,quantity:val('quantity'),calc_link:link||null});
 btn.disabled=false;
 if(!ok){err('Versturen lukte niet. Probeer het later opnieuw.');return}
 track('quote_sent',{id:m.id});
 $('mDlgB').innerHTML=`<div class="fok"><h2>Bedankt</h2><p>We vragen offertes op voor de ${mName(m)} en nemen contact met je op.</p></div>`;
});

function mUse(id){
 const m=MI[id];if(!m)return;
 if($('mDlg').open)$('mDlg').close();
 if(!modelApply(id))return;
 navTo('/'+location.search);
 openWz('use');
}
document.addEventListener('click',e=>{
 if(e.target.closest('[data-toastx]'))$('toast').hidden=true;
 const c=e.target.closest('[data-mcat]');if(c){if(c.tagName!=='A'){e.preventDefault();navTo(pathOf('modellen',c.dataset.mcat))}return}
 const vo=e.target.closest('[data-mvar]');if(vo){mVar[vo.dataset.mvar]=vo.dataset.mvid;mPaint();const n=document.querySelector(`[data-mvid="${vo.dataset.mvid}"]`);if(n)n.focus({preventScroll:true});return}
 const r=e.target.closest('[data-mrow]');if(r){mInfo(r.dataset.mrow);return}
 const g=e.target.closest('[data-mrg]');if(g){mMin=+g.dataset.mrg;mPaint();return}
 const u=e.target.closest('[data-muse]');if(u){mUse(u.dataset.muse);return}
 const qq=e.target.closest('[data-mquote]');if(qq){mQuote(qq.dataset.mquote);return}
 if(e.target.closest('[data-mclear]')){mSel=[];mPaint();return}
 if(e.target.closest('[data-mclose]')){$('mDlg').close();return}
 if(e.target===$('mDlg'))$('mDlg').close();
});
document.addEventListener('change',e=>{
 const s=e.target.closest('[data-msel]');if(s){const id=s.dataset.msel;mSel=s.checked?[...mSel.filter(x=>x!==id),id].slice(0,3):mSel.filter(x=>x!==id);mPaint();const n=document.querySelector(`[data-msel="${id}"]`);if(n)n.focus({preventScroll:true});return}
 if(e.target.id==='mSort'||e.target.id==='mSoon'||e.target.id==='mBrand')mPaint();
});
document.addEventListener('input',e=>{if(e.target.id==='mSearch')mPaint()});
document.addEventListener('keydown',e=>{
 const vo=e.target.closest&&e.target.closest('[data-mvar]');if(!vo||!/^Arrow(Left|Right|Up|Down)$/.test(e.key))return;
 e.preventDefault();const os=[...vo.parentNode.children],n=os[(os.indexOf(vo)+(/Right|Down/.test(e.key)?1:os.length-1))%os.length];n.click();
});
$('mGo').onclick=mCompare;
$('mDlg').addEventListener('close',mPaint);

/* ===== Kenteken: gegevens uit RDW open data (gratis, zonder sleutel) =====
   Diesel: vult soort voertuig, verbruik en heffingstarief in en toont waarde, zero-emissiezone en het beste moment om over te stappen.
   Gebruikt elektrisch: vult leeftijd en model in. */
const RDW='https://opendata.rdw.nl/resource/';
const plNorm=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
/* Streepjes volgens de Nederlandse sidecodes: bij elke wissel tussen letters en cijfers, en een blok van vier gelijke soorten in tweeën (AB-12-34, 12-AB-CD) */
const plFmt=k=>{const g=k.match(/[A-Z]+|\d+/g)||[];return k.length===6?g.flatMap(x=>x.length===4?[x.slice(0,2),x.slice(2)]:[x]).join('-'):g.join('-')};
const plCheck='<svg class="pok" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>';
const plArrow='<svg class="pgo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
const plateForm=k=>`<form class="plate" data-plate="${k}" novalidate><input name="kt" maxlength="9" placeholder="${k==='E'?'Kenteken':'Kenteken (optioneel)'}" autocomplete="off" autocapitalize="characters" spellcheck="false" enterkeyhint="search" aria-label="${k==='E'?'Kenteken van het gebruikte elektrische voertuig':'Kenteken van je huidige diesel'}"><span class="plo" aria-live="polite"></span><button type="submit" aria-label="Zoek kenteken">${plArrow}${plCheck}</button></form>`;
/* Vrachtwagenheffing per gewichtsklasse, prijspeil 2026: diesel Euro VI in CO₂-klasse 1, elektrisch in klasse 5 */
const HEF=[[12000,.113,.025],[18000,.160,.035],[32000,.182,.037],[Infinity,.201,.038]];
const hefRow=kg=>HEF.find(h=>kg<=h[0]);
const hefBand=kg=>kg<=12000?'3,5 tot 12 ton':kg<=18000?'12 tot 18 ton':kg<=32000?'18 tot 32 ton':'boven 32 ton';
/* Waardeverloop: eerste jaar, daarna per jaar. Elektrisch daalt voorlopig sneller. */
const VCURVE={d:{trekker:[.80,.86],bakwagen:[.80,.87],bestel:[.82,.87],bus:[.78,.88]},e:{trekker:[.75,.85],bakwagen:[.75,.85],bestel:[.78,.85],bus:[.74,.86]}};
const valPct=(f,vt,age)=>{if(age<=0)return 1;const c=VCURVE[f][vt]||VCURVE[f].bakwagen;return age<1?1-(1-c[0])*age:c[0]*Math.pow(c[1],age-1)};
const PL={D:null,E:null};
let RIX=null,PRAK={};/* restwaarde-index uit Supabase: 'd|trekker|5' → {p: mediaanprijs, n: aantal} */
const num=x=>{const n=parseFloat(x);return isFinite(n)?n:0};
const rdwDate=s=>{s=String(s||'');return s.length>=8?new Date(+s.slice(0,4),+s.slice(4,6)-1,+s.slice(6,8)):null};
const ageOf=d=>d?Math.max(0,(Date.now()-d)/31557600000):0;
async function rdwGet(k){
 const q=ds=>fetch(`${RDW}${ds}.json?kenteken=${k}`).then(r=>r.ok?r.json():[]).catch(()=>[]);
 const[a,b]=await Promise.all([q('m9d7-ebf2'),q('8ys7-d773')]);
 const r=a&&a[0];if(!r)return null;
 const eu=String(r.europese_voertuigcategorie||'').toUpperCase(),inr=String(r.inrichting||'').toLowerCase(),soort=String(r.voertuigsoort||'').toLowerCase();
 const vt=eu==='N1'?'bestel':/^N[23]/.test(eu)?(inr.includes('trekker')?'trekker':'bakwagen'):(/^M[23]/.test(eu)||soort.includes('bus'))?'bus':null;
 const fuels=(b||[]).map(f=>String(f.brandstof_omschrijving||'').toLowerCase());
 const el=fuels.length?fuels.every(f=>f.includes('elektr')):false,diesel=fuels.some(f=>f.includes('diesel'));
 const first=rdwDate(r.datum_eerste_toelating),mass=num(r.technische_max_massa_voertuig)||num(r.toegestane_maximum_massa_voertuig),combo=num(r.maximum_massa_samenstelling);
 let euro=0;(b||[]).forEach(f=>{const t=String(f.uitlaatemissieniveau||f.emissiecode_omschrijving||'').toUpperCase(),m=t.match(/\b(VI|V|IV|III|[3-6])\b/);if(m){const e={VI:6,V:5,IV:4,III:3}[m[1]]||+m[1];euro=Math.max(euro,e)}});
 if(!euro&&first&&!el){const y=first.getFullYear()+first.getMonth()/12;euro=vt==='bestel'?(y>=2016.7?6:y>=2011?5:4):(y>=2014?6:y>=2009.8?5:4)}
 const lpk=(b||[]).map(f=>num(f.brandstofverbruik_gecombineerd)).find(Boolean)||0;
 return{k,vt,eu,merk:String(r.merk||'').trim(),model:String(r.handelsbenaming||'').trim(),first,mass,combo,euro,el,diesel,lpk,cat:num(r.catalogusprijs)};
}
const tcase=s=>s.length<=3?s:s.toLowerCase().replace(/(^|[\s-])\S/g,c=>c.toUpperCase());
const plName=i=>{let t=i.model;if(t.toUpperCase().startsWith(i.merk.toUpperCase()))t=t.slice(i.merk.length).trim();return(tcase(i.merk)+' '+tcase(t)).trim()};
/* Wat het voertuig nu ongeveer waard is: de nieuwprijs (catalogusprijs of het voorbeeld, teruggerekend naar het bouwjaar) langs de waardecurve */
function plValue(i,f){
 const age=ageOf(i.first),idx=RIX&&RIX[`${f}|${i.vt}|${Math.round(age)}`];
 if(idx&&idx.n>=5)return{v:idx.p,src:'markt'};
 const p0=i.cat?i.cat/(i.vt==='bestel'?1.21:1):VT[i.vt].p[f==='d'?'pD':'pE']*Math.pow(.97,age);
 return{v:p0*valPct(f,i.vt,age),src:'curve'};
}
function zeTxt(i){
 if(i.vt==='bus'||i.el)return'';
 const y=i.first?i.first.getFullYear()+i.first.getMonth()/12:0;
 if(i.vt==='bestel')return y>=2025?'Geen toegang':i.euro>=6?'Tot 2028':i.euro===5?'Tot 2027':'Geen toegang';
 if(i.euro<6||y<2017)return'Geen toegang';return i.vt==='bakwagen'&&y<2020?'Tot 2028':'Tot 2030';
}
const XSVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
/* Kenteken van je diesel: in het invulveld een korte bevestiging, de details staan in het invulvenster */
function plPaint(){const i=PL.D,ok=!!(i&&!i.err);document.querySelectorAll('[data-plate="D"]').forEach(f=>{const bad=!!(i&&i.err);f.classList.toggle('bad',bad);f.classList.toggle('ok',ok);f.title=bad?i.err:'';f.elements.kt.setAttribute('aria-invalid',bad);const o=f.querySelector('.plo');if(o)o.textContent=ok?[plName(i),i.first&&i.first.getFullYear()].filter(Boolean).join(' · '):''})}
/* Kenteken van je diesel toepassen: soort voertuig, verbruik en heffing */
function plApplyD(i){
 if(i.vt!==vtype){applyType(i.vt);tolSel.clear();TOL.forEach(c=>$('k_'+c[0]).value=0)}
 if(i.vt==='bakwagen')$('cls').value=i.mass&&i.mass<=12000?'N2':'N3';
 if(i.vt==='bestel'&&i.lpk)setNum($('ld'),Math.round(i.lpk*1.15*10)/10);
 if(i.vt==='bakwagen'&&i.mass)setNum($('ld'),i.mass<=12000?17:i.mass<=18000?22:27);
 if(T().truck){const h=hefRow(i.vt==='trekker'&&i.combo?Math.max(i.combo,i.mass):i.mass||40000);setNum($('tD'),h[1]);setNum($('tE'),h[2])}
 $('dw').value='h';setNum($('dag'),Math.min(20,Math.max(1,Math.round(ageOf(i.first)))));dieselAuto(true);touched=true;
}
/* Kenteken van een gebruikt elektrisch voertuig: leeftijd en, als we hem kennen, het model */
function plApplyE(i){
 const age=Math.min(12,Math.max(1,Math.round(ageOf(i.first))));
 const w=s=>mNorm(s).split(' ').filter(Boolean),bw=w(i.merk)[0]||'',tw=w(i.model);
 let best=null,sc=0;MODELS.filter(m=>mNorm(m.b).split(' ')[0]===bw).forEach(m=>{const mw=w(m.m+' '+(m.fam||'')),s=tw.filter(t=>mw.includes(t)).length+(m.c===i.vt?.5:0);if(s>sc){sc=s;best=m}});
 if(best&&sc>=1)modelApply(best.id,true);else if(i.vt&&i.vt!==vtype){applyType(i.vt);tolSel.clear();TOL.forEach(c=>$('k_'+c[0]).value=0)}
 $('nw').value='g';setNum($('eag'),age);usedAuto(true);touched=true;
}
async function plLookup(kind,k,apply){
 if(!k){PL[kind]=null;$(kind==='E'?'plkE':'plk').value='';if(kind==='D'&&$('dw').value==='h'){$('dw').value='n';dieselAuto(true)}render();return}
 const fs=document.querySelectorAll(`[data-plate="${kind}"]`);fs.forEach(f=>{f.classList.add('busy');f.elements.kt.value=plFmt(k)});
 let i=null,err='';
 try{i=await rdwGet(k)}catch(e){err='De RDW is nu niet bereikbaar. Probeer het later opnieuw.'}
 fs.forEach(f=>f.classList.remove('busy'));
 if(!err&&!i)err=`Kenteken ${plFmt(k)} niet gevonden.`;
 else if(i&&!i.vt)err='Dit is geen bedrijfsauto of bus.';
 else if(i&&kind==='D'&&i.el)err='Dit voertuig rijdt al elektrisch.';
 else if(i&&kind==='E'&&!i.el)err='Dit is geen elektrisch voertuig.';
 if(err){PL[kind]=kind==='D'?{err}:{err};render();return}
 PL[kind]=i;$(kind==='E'?'plkE':'plk').value=k;
 if(apply)(kind==='D'?plApplyD:plApplyE)(i);
 render();if(page==='gids')gShow(gid);
 if(apply)track('plate_lookup',{kind,vt:i.vt,year:i.first?i.first.getFullYear():null,euro:i.euro||null});
}
document.addEventListener('input',e=>{const f=e.target.closest('[data-plate]');if(!f||e.target.name!=='kt')return;const v=e.target.value;if(!v.includes('-')&&plNorm(v).length===6&&e.target.selectionStart===v.length)e.target.value=plFmt(plNorm(v));f.classList.remove('ok','bad');const o=f.querySelector('.plo');if(o)o.textContent=''});
document.addEventListener('focusout',e=>{if(e.target.name!=='kt'||!e.target.closest('[data-plate]'))return;const v=e.target.value;if(!v.includes('-')&&plNorm(v).length===6)e.target.value=plFmt(plNorm(v))});
document.addEventListener('submit',e=>{const f=e.target.closest('[data-plate]');if(!f)return;e.preventDefault();const k=plNorm(f.elements.kt.value);f.elements.kt.value=k?plFmt(k):'';plLookup(f.dataset.plate,k,true)});
/* Gebruikt elektrisch: eerlijke prijs uit de waardecurve, restwaarde aan het eind van de looptijd */
const newPriceE=()=>{const m=modelActive();return m&&m.price?m.price:VT[vtype].p.pE};
const fairE=age=>{const ix=RIX&&RIX[`e|${vtype}|${age}`];return ix&&ix.n>=5?ix.p:newPriceE()*valPct('e',vtype,age)};
let autoPE=null,autoVE=null,autoAcc=null;
/* Bruikbare accu van het nieuwe voertuig: van het gekozen model, anders het voorbeeld */
const newAcc=()=>{const m=modelActive();return m?mAcc(m):VT[vtype].p.acc};
function usedAuto(force){
 const used=$('nw').value==='g',age=Math.round(v('eag')),p=VT[vtype].p;
 const fit=(id,val,auto,d)=>(force||auto===null||Math.abs(v(id)-auto)<d)&&(setNum($(id),val),true);
 if(used){const fp=Math.round(fairE(age)/1000)*1000;if(fit('pE',fp,autoPE,1))autoPE=fp;
  /* Restwaarde vast op het standaardpercentage van de prijs nu, net als bij een nieuw voertuig (zie VT) */
  setNum($('rwE'),p.rwE);
  /* Verzekering naar de waarde nu, zoals bij de huidige diesel (zie verNaarWaarde) */
  const ve=verNaarWaarde(p.vE,v('pE'),newPriceE());if(fit('vE',ve,autoVE,1))autoVE=ve;
  /* Accuslijtage: een gebruikte accu heeft minder bruikbare capaciteit. Zo bedacht: we gebruiken dezelfde schatting als de
     accugezondheid onder de restwaarde (soh: 1,5% per jaar plus slijtage per volledige laadbeurt, nooit onder 60%), over de
     jaren die het voertuig al gereden heeft en met jouw kilometers. Dat verlaagt de actieradius en laat zien of je dagrit nog past.
     Het verbruik per km verandert nauwelijks door slijtage, dat laten we gelijk. */
  const a0=newAcc(),ac=Math.round(a0*soh(age,v('km')*v('le')/100,a0)*10)/10;if(fit('acc',ac,autoAcc,.05))autoAcc=ac}
 else{/* Terug naar nieuw: wat we voor gebruikt hadden ingevuld, gaat terug naar de nieuwwaarde; eigen invoer blijft staan */
  if(autoPE!==null&&Math.abs(v('pE')-autoPE)<1)setNum($('pE'),newPriceE());
  autoPE=null;setNum($('rwE'),$('dw').value==='h'?p.rwE:v('rw'));
  if(autoVE!==null&&Math.abs(v('vE')-autoVE)<1)setNum($('vE'),p.vE);
  if(autoAcc!==null&&Math.abs(v('acc')-autoAcc)<.05)setNum($('acc'),newAcc());
  autoVE=autoAcc=null}
 fitRanges();
}
/* Huidige diesel: rekenen vanaf de waarde nu, met de restwaarde aan het eind van de termijn en onderhoud dat met de leeftijd stijgt */
const newPriceD=()=>{const m=modelActive();return m?mDiesel(m).pD:VT[vtype].p.pD};
/* Verzekering van een ouder of gebruikt voertuig: een vast deel en een deel dat meegaat met de waarde.
   Zo bedacht: de WA-dekking (schade aan anderen) kost ongeveer hetzelfde, oud of nieuw. Casco (schade aan je eigen voertuig) hangt af
   van wat het voertuig waard is. We nemen 40% van de voorbeeldpremie als vast deel en laten de rest meegaan met de waarde nu tegenover
   de nieuwprijs. Een diesel van € 36.000 tegenover € 130.000 nieuw kost dan 0,4 + 0,6 × 36/130 = 57% van de premie van een nieuwe. */
const VER_VAST=.4,verNaarWaarde=(premie,waarde,nieuw)=>Math.round(premie*(VER_VAST+(1-VER_VAST)*Math.min(1,waarde/Math.max(1,nieuw)))/100)*100;
const odF=a=>1+.05*a;
function dieselAuto(force){
 const cur=$('dw').value==='h',age=Math.round(v('dag')),L=Math.max(1,Math.round(v('jr'))),i=PL.D,p=VT[vtype].p;
 if(cur&&$('dwl')&&$('dwl').value==='lease'){fitRanges();return}
 const fit=(id,val,auto,d)=>(force||auto===null||Math.abs(v(id)-auto)<d)&&(setNum($(id),val),true);
 if(cur){
  const fp=Math.round((i&&!i.err&&Math.round(ageOf(i.first))===age?plValue(i,'d').v:newPriceD()*valPct('d',vtype,age))/500)*500;
  absRange($('pD'));if(fit('pD',fp,autoPD,1))autoPD=fp;
  const od=Math.round(p.oD*odF(age+L/2)*100)/100;if(fit('oD',od,autoOD,.001))autoOD=od;
  const vd=verNaarWaarde(p.vD,v('pD'),newPriceD());if(fit('vD',vd,autoVD,1))autoVD=vd;
  /* Restwaarde vast op het standaardpercentage van de waarde nu, net als bij een nieuw voertuig (zie VT) */
  setNum($('rw'),p.rw);
 }else{
  if(autoPD!==null&&Math.abs(v('pD')-autoPD)<1)setNum($('pD'),newPriceD());
  if(autoOD!==null&&Math.abs(v('oD')-autoOD)<.001)setNum($('oD'),p.oD);
  if(autoVD!==null&&Math.abs(v('vD')-autoVD)<1)setNum($('vD'),p.vD);
  if(autoPD!==null)setNum($('rw'),p.rw);
  autoPD=autoOD=autoVD=null;
 }
 fitRanges();
}
function dieselPaint(){
 const cur=$('dw').value==='h',lease=cur&&$('dwl').value==='lease';
 document.querySelectorAll('[data-dw]').forEach(e=>e.setAttribute('aria-pressed',e.dataset.dw===$('dw').value&&!lsOn('D')));
 document.querySelectorAll('[data-dwl]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.dwl===$('dwl').value)));
 $('dwG').hidden=!cur;$('dwlW').hidden=!cur;$('lcW').hidden=!lease;{const pf=$('dwG').querySelector('.plate');if(pf)pf.hidden=lease}$('byD').hidden=lease;$('dag').closest('.sl').hidden=lease||!!(PL.D&&!PL.D.err);
 if(lease)$('lcH').textContent=`Loopt nog ${Math.round(v('lrC'))} maanden; daarna rekenen we door met hetzelfde bedrag. Geen restwaarde.`;
 const lb=document.querySelector('label[for="pD"]');if(lb)lb.textContent=cur?'Waarde nu':F.pD[1];
 /* Bij je huidige diesel volgt de restwaarde uit de leeftijd: geen aparte schuif, wel het bedrag */
 $('rw').closest('.sl').hidden=cur;
 const i=PL.D,ok=cur&&i&&!i.err,ze=ok?zeTxt(i):'',L=Math.max(1,Math.round(v('jr')));
 setH($('pDh'),!cur?'':i&&i.err?`<span class="warn">${i.err}</span>`:[`Over ${L} jaar ± ${eur(Math.round(v('pD')*v('rw')/100/500)*500)}`,ok&&i.euro&&'Euro '+i.euro,ze&&(ze==='Geen toegang'?'Geen toegang tot ZE-zones':'ZE-zone '+ze.toLowerCase())].filter(Boolean).join(' · '));
}
/* Hoeveel capaciteit de accu ongeveer overhoudt: 1,5% per jaar plus slijtage per volledige laadbeurt */
const soh=(yrs,kwh,acc)=>Math.max(.6,1-yrs*(.015+Math.min(400,kwh/Math.max(1,acc))*.00004));
/* Maximale aanschafprijs elektrisch waarbij elektrisch per jaar nog goedkoper is dan diesel */
function maxPE(){const x0=calcX(),x1=calcX({pE:v('pE')+1000}),sl=(x1.te-x0.te)/1000;if(sl<=0)return null;return v('pE')+(x0.td-x0.te)/sl}
function usedPaint(){
 const used=$('nw').value==='g',L=Math.max(1,Math.round(v('jr'))),age=used?Math.round(v('eag')):0,b=calc();
 document.querySelectorAll('[data-nw]').forEach(e=>e.setAttribute('aria-pressed',e.dataset.nw===$('nw').value&&!lsOn('E')));
 $('nwG').hidden=!used;$('eag').closest('.sl').hidden=!!(PL.E&&!PL.E.err);
 const mp=maxPE(),fp=used?Math.round(fairE(age)/1000)*1000:0,iE=PL.E;
 setH($('pEh'),[used&&iE&&iE.err?`<span class="warn">${iE.err}</span>`:'',used&&iE&&!iE.err?`<b>${modelActive()?'Bouwjaar '+(iE.first?iE.first.getFullYear():''):plName(iE)+(iE.first?' · '+iE.first.getFullYear():'')}</b>`:'',used?`Eerlijke prijs ± ${eur(fp)}`:'',mp===null?'':mp<=0?'Niet lonend tegenover diesel':`Lonend tot ${eur(Math.floor(mp/1000)*1000)}`].filter(Boolean).join(' · '));
 const s0=used?soh(age,b.kwh,v('acc')):1,s1=soh(age+L,b.kwh,v('acc'));
 setH($('rwEh'),`Accu na ${L} jaar ± ${nf(Math.round(s1*100))}%${used?` · nu ± ${nf(Math.round(s0*100))}%`:''}`);
}

/* Leasen: zonder offerte volgt de leaseprijs de schatting, en het bereik van de schuif ligt eromheen */
function leaseSync(){
 ['D','E'].forEach(s=>{if(!lsOn(s)||lqOn(s))return;const est=Math.round(leaseEst(s,{},s==='E'?subsidy(v('pE')):0)/10)*10,e=$('lp'+s),f=F['lp'+s];
  e.min=Math.max(f[2],nice(est*.5));e.max=Math.min(f[3],nice(est*1.6,1));e.value=est});
}
/* Zelf een leaseprijs invullen maakt er een offerte van: vanaf dan geldt het contract bij de kilometers van nu */
document.addEventListener('input',e=>{const m=/^lp([DE])$/.exec(e.target.id||'');if(m&&!lqOn(m[1])){$('lq'+m[1]).value='1';setNum($('lk'+m[1]),Math.round(v('km')/1000)*1000);fitRanges()}},true);
/* Financiering die we zelf aanzetten bij leasen, gaat weer uit als niets meer geleaset wordt. Zet je hem zelf om, dan blijft je keuze staan */
function finBack(){if(finAuto&&!lsOn('D')&&!lsOn('E')){$('xFin').checked=false;finAuto=false}}
document.addEventListener('input',e=>{if(e.target.id==='xFin')finAuto=false},true);
function leasePaint(){
 const any=lsOn('D')||lsOn('E'),both=lsOn('D')&&lsOn('E'),L=Math.max(1,Math.round(v('jr')));
 const jl=document.querySelector('label[for="jr"]');if(jl)jl.textContent=both?'Looptijd':any?'Afschrijftermijn en looptijd':F.jr[1];
 ['D','E'].forEach(s=>{
  const on=lsOn(s),q=lqOn(s);
  document.querySelectorAll(`[data-ls="${s}"]`).forEach(b=>b.setAttribute('aria-pressed',on));
  $('by'+s).hidden=on||(s==='D'&&lcNow());$('ls'+s+'W').hidden=!on;$('lq'+s+'W').hidden=!q;
  [['o'+s,'lo'+s],['v'+s,'lv'+s]].forEach(([id,c])=>{const inc=on&&ck(c);$(id).closest('.sl').hidden=inc;$(id+'L').hidden=!inc});
  if(!on)return;
  const est=leaseEst(s,{},s==='E'?subsidy(v('pE')):0);
  setH($('lp'+s+'h'),q?`Jouw offerte · <button type="button" class="lnk" data-lest="${s}">Schatting ${eur(Math.round(est/10)*10)}</button>`:`Geschat bij ${nf(v('km'))} km per jaar en ${L} jaar`);
 });
}

/* ===== Supabase Live Data Integration ===== */
const SB_URL = 'https://zarvyblveyomngypwvhw.supabase.co';
const SB_KEY = 'sb_publishable_srfj19l9xWDSkdirFz6RtQ_RperxnNH';

/* ===== Restwaarde: mediaanprijs per leeftijd uit advertenties, veilingen en meldingen; zonder genoeg data de schatting ===== */
let rwC='trekker',rwFu='e';
function rwPaint(){
 setH($('rwC'),Object.entries(VT).map(([k,q])=>`<button type="button" data-rwc="${k}" aria-pressed="${k===rwC}">${q.n}</button>`).join(''));
 setH($('rwF'),[['e','Elektrisch'],['d','Diesel']].map(([k,t])=>`<button type="button" data-rwf="${k}" aria-pressed="${k===rwFu}">${t}</button>`).join(''));
 const P=VT[rwC].p[rwFu==='e'?'pE':'pD'],rows=[];
 for(let a=1;a<=10;a++){const ix=RIX&&RIX[`${rwFu}|${rwC}|${a}`],mk=ix&&ix.n>=5;rows.push({a,p:mk?ix.p:P*valPct(rwFu,rwC,a),n:mk?ix.n:0})}
 const mx=Math.max(...rows.map(r=>r.p));
 setH($('rwI'),rows.map(r=>`<div class="rwr${r.n?'':' est'}"><span>${r.a} jaar</span><i><b style="width:${r.p/mx*100}%"></b></i><em>${eur(Math.round(r.p/1000)*1000)}</em><small>${r.n?nf(r.n)+'×':''}</small></div>`).join(''));
 const lab=`${VT[rwC].n} · ${rwFu==='e'?'elektrisch':'diesel'}`;document.querySelectorAll('.rwx').forEach(e=>e.textContent=lab);
}
document.addEventListener('click',e=>{
 const g=e.target.closest('[data-rw]');if(g){[rwFu,rwC]=g.dataset.rw.split('|');return}
 const c=e.target.closest('[data-rwc]');if(c){rwC=c.dataset.rwc;rwPaint();return}
 const f=e.target.closest('[data-rwf]');if(f){rwFu=f.dataset.rwf;rwPaint()}
});
async function rwSubmit(f,table,row,need,ok){
 const err=t=>{const p=f.querySelector('.ferr');p.textContent=t;p.hidden=!t};
 if(f.elements.website.value)return;
 let bad=null;need.forEach(n=>{const el=f.elements[n],good=!!el.value.trim()&&el.checkValidity();el.setAttribute('aria-invalid',String(!good));if(!good&&!bad)bad=el});
 if(bad){err('Controleer de gemarkeerde velden.');bad.focus();return}
 err('');const b=f.querySelector('button[type=submit]');b.disabled=true;
 const done=await sbInsert(table,row);b.disabled=false;
 if(!done){err('Versturen lukte niet. Probeer het later opnieuw.');return}
 f.reset();const t=$('toast');t.innerHTML=`<span>${ok}</span>`;t.hidden=false;clearTimeout(t._t);t._t=setTimeout(()=>{t.hidden=true},5000);
}
const ival=(f,n)=>{const x=parseInt(f.elements[n].value,10);return isFinite(x)?x:null};
$('rwRep').addEventListener('submit',e=>{e.preventDefault();const f=e.target;rwSubmit(f,'residual_reports',{category:rwC,fuel:rwFu,brand_model:f.elements.brand_model.value.trim()||null,year:ival(f,'year'),km:ival(f,'km'),price:ival(f,'price')},['year','price'],'Bedankt. Je melding telt mee in de index.').then(()=>track('residual_report',{c:rwC,f:rwFu}))});
$('rwAl').addEventListener('submit',e=>{e.preventDefault();const f=e.target;rwSubmit(f,'price_alerts',{category:rwC,fuel:rwFu,max_price:ival(f,'max_price'),model:f.elements.model.value.trim()||null,email:f.elements.email.value.trim()},['max_price','email'],'Prijsalarm staat aan. Je krijgt een mail bij een passend aanbod.').then(()=>track('price_alert',{c:rwC,f:rwFu}))});
/* Afmelden voor een prijsalarm via de link in de mail */
(async()=>{const t=new URLSearchParams(location.search).get('afmelden');if(!t)return;history.replaceState(null,'',location.pathname+location.hash);try{const r=await fetch(SB_URL+'/rest/v1/rpc/unsubscribe_price_alert',{method:'POST',headers:{apikey:SB_KEY,Authorization:'Bearer '+SB_KEY,'Content-Type':'application/json'},body:JSON.stringify({p_token:t})});const el=$('toast');el.innerHTML=`<span>${r.ok?'Je prijsalarm staat uit.':'Afmelden lukte niet. Probeer het later opnieuw.'}</span>`;el.hidden=false;setTimeout(()=>{el.hidden=true},6000)}catch(e){}})();

/* Live cijfers: dieselprijs, stroomverschil, restwaarde-index en praktijkverbruik */
async function syncExtra(){
 const h={apikey:SB_KEY,Authorization:'Bearer '+SB_KEY},get=u=>fetch(SB_URL+'/rest/v1/'+u,{headers:h}).then(r=>r.ok?r.json():null).catch(()=>null);
 const[lp,ri,pr]=await Promise.all([get('live_prices?select=id,value,measured_on'),get('residual_index?select=fuel,category,age,median_price,n'),get('model_usage?select=model_id,le,n')]);
 if(Array.isArray(lp))lp.forEach(r=>{const x=parseFloat(r.value);if(!(x>=0))return;
  if(r.id==='night_spread'&&x<.3)LIVE.slim=x});
 if(Array.isArray(ri)){RIX={};ri.forEach(r=>{RIX[`${r.fuel}|${r.category}|${r.age}`]={p:+r.median_price,n:+r.n}})}
 if(Array.isArray(pr))pr.forEach(r=>{PRAK[r.model_id]={le:+r.le,n:+r.n}});
 render();if(page==='restwaarde')rwPaint();
}


/* Vlootanalyse: waar zit het geld van een dieselvoertuig per jaar. Uit de calculator; de chauffeur zit er niet in en is een vaste aanname. De posten verschijnen bij aanwijzen. */
const VZ_CHAUF=60000;let vzM='D';
function vzTaart(){
 const el=$('vzT');if(!el)return;const r=hAt(uvKm()),w=T().w,K=r[vzM],e=vzM==='E',
  /* Zo bedacht: afs is alleen afschrijving (prijs min restwaarde, na subsidie, over de looptijd). Bij koop komt daar de rente en
     de rendementseis op eigen geld bij, met de instellingen van de uitgebreide berekening; bij lease zit die al in de leaseprijs. */
  fin=(e?r.lE:r.lD)?0:e?finY(v('pE'),v('rwE')/100,{},r.sub):finY(v('pD'),v('rw')/100),dn=vzM==='D'?'Diesel':'Elektrisch',nm=vzM==='D'?'diesel'+w:'elektrische '+w,hc=e?'var(--volt)':'var(--amber)',hi=e?'var(--volt-ink)':'var(--amber-ink)';
 const rows=[['chf','Chauffeur',VZ_CHAUF,0,'Blijft gelijk, ook als je elektrisch rijdt.'],['ver','Verzekering',K.ver,0,'Hangt vooral af van de waarde en de verzekeraar.'],['en','Energie',K.en,1,vzM==='D'?'Brandstof is de grootste post die je zelf kunt sturen, bijvoorbeeld door over te stappen.':'Slim laden, een passend stroomcontract en ERE-opbrengst.'],['afs','Aanschaf en financiering',K.afs+fin,1,'Subsidie, kopen of leasen en het beste moment om te vervangen.'],['hef','Heffing',K.hef,0,'Volgt uit het wettelijke tarief en je kilometers.'],['ond','Onderhoud',K.ond,0,'Verschilt weinig, welke keuze je ook maakt.']].filter(x=>x[2]>0).sort((p,q)=>p[3]-q[3]);
 const tot=rows.reduce((q,x)=>q+x[2],0),help=rows.filter(x=>x[3]).reduce((q,x)=>q+x[2],0),pc=x=>nf(x/tot*100)+'%';
 const cx=200,cy=200,R=190,ri=116,pt=(q,g)=>(cx+q*Math.cos(g)).toFixed(1)+' '+(cy+q*Math.sin(g)).toFixed(1);let a=-Math.PI/2,arcs='',labs='';
 rows.forEach((x,i)=>{const sw=x[2]/tot*2*Math.PI,b=a+sw,lg=sw>Math.PI?1:0,m=a+sw/2;
  arcs+=`<path d="M${pt(R,a)}A${R} ${R} 0 ${lg} 1 ${pt(R,b)}L${pt(ri,b)}A${ri} ${ri} 0 ${lg} 0 ${pt(ri,a)}Z" fill="${x[3]?hc:'#9AA0A6'}" stroke="var(--page)" stroke-width="3" data-i="${i}" tabindex="0" aria-label="${x[1]}: ${eur(x[2])} per jaar, ${pc(x[2])}"></path>`;
  if(sw>.32)labs+=`<text x="${(cx+(R+ri)/2*Math.cos(m)).toFixed(1)}" y="${(cy+(R+ri)/2*Math.sin(m)+7).toFixed(1)}" text-anchor="middle" fill="${x[3]&&!e?'var(--ink)':'#fff'}" font-size="21" font-weight="700" font-family="var(--display)" pointer-events="none">${pc(x[2])}</text>`;a=b});
 const idle='<p>Tik op een stuk om te zien welke kosten het zijn.</p>';
 setH(el,`<svg viewBox="0 0 400 400" role="img" aria-label="Kostenverdeling van een ${nm} per jaar">${arcs}${labs}<text id="vzTc1" x="${cx}" y="${cy-12}" text-anchor="middle" font-size="15" fill="var(--ink-2)">${dn} per jaar</text><text id="vzTc2" x="${cx}" y="${cy+24}" text-anchor="middle" font-size="32" font-weight="700" fill="var(--ink)" font-family="var(--display)">${eur(tot)}</text></svg>`+
  `<div><div class="seg sm vztm" role="group" aria-label="Aandrijving"><button type="button" data-m="D" aria-pressed="${vzM==='D'}">Diesel</button><button type="button" data-m="E" aria-pressed="${vzM==='E'}">Elektrisch</button></div><h3>Wat kost een ${nm} per jaar?</h3><div class="vztk"><span><i style="background:${hc}"></i>Hier heb je invloed op</span><span><i style="background:#9AA0A6"></i>Ligt grotendeels vast</span></div><div class="vztd" id="vzTd" aria-live="polite">${idle}</div><p class="vzts" style="color:${hi}">${pc(help)} van je kosten heb je zelf in de hand</p><p class="vztx">De rest ligt grotendeels vast. Juist daarom loont het om energie, aanschaf en financiering zo goed mogelijk te regelen. Daar zit de ruimte om je winstmarge te verhogen.</p><p class="vztn">Bij ${nf(r.km)} km per jaar, uit de <a href="/">calculator</a>. Chauffeur: aanname ${eur(VZ_CHAUF)} per jaar.</p></div>`);
 const svg=el.querySelector('svg'),d=$('vzTd'),c1=$('vzTc1'),c2=$('vzTc2');
 const show=p=>{svg.querySelectorAll('path').forEach(q=>q.classList.toggle('on',q===p));svg.classList.toggle('on',!!p);
  if(!p){d.className='vztd';d.innerHTML=idle;c1.textContent=dn+' per jaar';c2.textContent=eur(tot);return}
  const x=rows[+p.dataset.i];d.className='vztd'+(x[3]?' g':'');d.style.setProperty('--hi',hi);d.innerHTML=`<b>${x[1]}</b><em>${eur(x[2])} per jaar · ${pc(x[2])}</em><span>${x[4]}</span>`;c1.textContent=x[1];c2.textContent=eur(x[2])};
 svg.querySelectorAll('path').forEach(p=>{p.addEventListener('pointerenter',()=>show(p));p.addEventListener('focus',()=>show(p));p.addEventListener('click',()=>show(p))});
 svg.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')show(null)});svg.addEventListener('focusout',()=>show(null));
 el.querySelectorAll('.vztm button').forEach(b=>b.addEventListener('click',()=>{if(vzM===b.dataset.m)return;vzM=b.dataset.m;vzTaart();el.querySelector('.vztm [data-m="'+vzM+'"]').focus()}));
}
/* ===== Vlootanalyse: aanvraag naar Supabase (tabel fleet_requests, alleen insert) ===== */
const CONTACT_MAIL='info@stekkerofdiesel.nl';
let fCalc='';
function fErr(t){const e=$('fErr');e.innerHTML=t;e.hidden=!t}
document.addEventListener('click',e=>{
 const c=e.target.closest('[data-fleet]');if(!c)return;
 const from=c.dataset.fleet;track('fleet_cta_click',{from});
 if(from==='calc'){try{fCalc=shareURL()}catch(x){}}
 $('fCl').hidden=!fCalc;
});
$('fClX').addEventListener('click',()=>{fCalc='';$('fCl').hidden=true});
/* Kaart en lijst wijzen elkaar aan; de regels van het vlootplan lichten hun deel van de tekening op */
const vzPair=(at,f)=>document.querySelectorAll('.vz ['+at+']').forEach(e=>{const k=e.getAttribute(at),set=x=>{document.querySelectorAll('.vz ['+at+']').forEach(y=>y.classList.toggle('on',x!==null&&y.getAttribute(at)===x));f&&f(x)};e.addEventListener('mouseenter',()=>set(k));e.addEventListener('mouseleave',()=>set(null));e.addEventListener('focusin',()=>set(k));e.addEventListener('focusout',()=>set(null))});
vzPair('data-s');vzPair('data-p',x=>document.querySelector('.vzpd').classList.toggle('hl',x!==null));
document.querySelector('.vzs1').addEventListener('click',()=>$('fForm').elements.contact_name.focus());
$('fGo').addEventListener('click',()=>{$('fForm').scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>$('fForm').elements.contact_name.focus({preventScroll:true}),400)});
/* Bericht groeit mee met de tekst */
const fMsgFit=()=>{const t=$('fMsg');t.style.height='auto';t.style.height=t.scrollHeight+2+'px'};$('fMsg').addEventListener('input',fMsgFit);
$('fForm').addEventListener('submit',async e=>{
 e.preventDefault();const f=e.target,fd=new FormData(f),val=n=>String(fd.get(n)||'').trim();
 if(val('website'))return;
 let bad=null;['contact_name','company','email'].forEach(n=>{const el=f.elements[n],ok=!!el.value.trim()&&el.checkValidity();el.setAttribute('aria-invalid',String(!ok));if(!ok&&!bad)bad=el});
 if(bad){fErr('Vul je naam, bedrijf en een geldig e-mailadres in.');bad.focus();return}
 fErr('');const btn=$('fSend');btn.disabled=true;
 try{
  const row={company:val('company'),contact_name:val('contact_name'),email:val('email'),phone:val('phone')||null,fleet_size:val('fleet_size')||null,message:val('message')||null,calc_link:fCalc||null};
  const r=await fetch(SB_URL+'/rest/v1/fleet_requests',{method:'POST',headers:{apikey:SB_KEY,Authorization:'Bearer '+SB_KEY,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(row)});
  if(!r.ok)throw new Error('insert');
  track('fleet_request_sent',{fleet_size:row.fleet_size});
  f.hidden=true;$('fOk').hidden=false;$('fOk').focus();
 }catch(x){fErr(CONTACT_MAIL?`Versturen lukte niet. Mail ons op <a href="mailto:${CONTACT_MAIL}" data-no-translate>${CONTACT_MAIL}</a>.`:'Versturen lukte niet. Probeer het later opnieuw.')}
 finally{btn.disabled=false}
});

async function syncSupabase() {
 let catsLoaded = false;
 try {
  const [resModels, resCats] = await Promise.all([
   fetch(SB_URL + '/rest/v1/vehicle_models?select=*', {
    headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY }
   }),
   fetch(SB_URL + '/rest/v1/vehicle_categories?select=*', {
    headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY }
   })
  ]);

  if (resCats.ok) {
   const cats = await resCats.json();
   if (Array.isArray(cats)) {
    /* Kolommen uit vehicle_categories naar de voorbeeldcijfers van het voertuig (VT[id].p) */
    const COLS = {km:'default_annual_km', kmH:'default_toll_km', wd:'default_work_days', jr:'default_depreciation_years', rw:'default_residual_value_pct',
     rwE:'default_residual_value_pct', dp:'default_diesel_price_per_l', sp:'default_electricity_price_per_kwh', ere:'default_ere_yield_per_kwh',
     ld:'default_diesel_consumption', le:'default_electric_consumption', acc:'default_battery_kwh',
     vD:'default_insurance_diesel_annual', vE:'default_insurance_electric_annual', oD:'default_maintenance_diesel_per_km', oE:'default_maintenance_electric_per_km',
     tD:'default_toll_diesel_per_km', tE:'default_toll_electric_per_km', lmD:'default_lease_excess_km_eur', lmE:'default_lease_excess_km_eur'};
    cats.forEach(c => {
     const v = VT[c.id]; if (!v) return;
     Object.entries(COLS).forEach(([k, col]) => { if (c[col] != null && isFinite(parseFloat(c[col]))) v.p[k] = parseFloat(c[col]); });
     if (Array.isArray(c.quick_select_km) && c.quick_select_km.length) v.q = c.quick_select_km.map(Number);
     if (c.name) v.n = c.name;
     if (c.sub_title) v.sub = c.sub_title;
     if (c.is_truck != null) v.truck = c.is_truck ? 1 : 0;
     if (c.regulatory_scheme) v.reg = c.regulatory_scheme;
    });
    catsLoaded = true;
   }
  }

  if (resModels.ok) {
   const rows = await resModels.json();
   if (Array.isArray(rows) && rows.length > 0) {
    const list = rows.map(r => {
     const m = {
      id: r.id,
      c: r.category_id,
      b: r.brand,
      m: r.model,
      st: r.status
     };
     if (r.release_year != null) m.y = r.release_year;
     if (r.gross_battery_kwh != null) m.g = parseFloat(r.gross_battery_kwh);
     if (r.gross_battery_text) m.gt = r.gross_battery_text;
     if (r.usable_battery_kwh != null) m.u = parseFloat(r.usable_battery_kwh);
     if (r.usable_battery_text) m.ut = r.usable_battery_text;
     if (r.estimated_usable_battery_kwh != null) m.ue = parseFloat(r.estimated_usable_battery_kwh);
     if (r.advertised_battery_kwh != null) m.a = parseFloat(r.advertised_battery_kwh);
     if (r.advertised_battery_text) m.at = r.advertised_battery_text;
     if (r.derived_method) m.derived = r.derived_method;
     if (r.range_km != null) m.r = parseInt(r.range_km, 10);
     if (r.range_text) m.rt = r.range_text;
     if (r.range_condition) m.rc = r.range_condition;
     if (r.consumption_kwh_per_100km != null) m.consumption = parseFloat(r.consumption_kwh_per_100km);
     if (r.dc_fast_charge_kw != null) m.dc = parseInt(r.dc_fast_charge_kw, 10);
     if (r.mcs_charge_kw != null) m.mcs = parseInt(r.mcs_charge_kw, 10);
     if (r.indicative_price_eur != null) m.price = parseFloat(r.indicative_price_eur);
     /* Een uitgeschreven toelichting bij de prijs is altijd een catalogusprijs */
     if (r.indicative_price_text) m.pt = ['list','reported','order','estimate'].includes(r.indicative_price_text) ? r.indicative_price_text : 'list';
     if (r.price_source_name) m.ps = [r.price_source_name, r.price_source_url || ''];
     if (r.diesel_ref_model) m.pDm = r.diesel_ref_model;
     if (r.diesel_ref_price_eur != null) m.pD = parseFloat(r.diesel_ref_price_eur);
     if (r.diesel_ref_consumption_l_per_100km != null) m.ld = parseFloat(r.diesel_ref_consumption_l_per_100km);
     if (r.diesel_price_source_name) m.pDs = [r.diesel_price_source_name, r.diesel_price_source_url || ''];
     if (r.gvw_kg != null) m.gvw = parseInt(r.gvw_kg, 10);
     if (r.gvw_class) m.vc = String(r.gvw_class).toLowerCase();
     if (m.b === 'Iveco') m.b = 'IVECO';
     if (r.description) m.n = r.description;
     if (r.source_name) m.s = [r.source_name, r.source_url || ''];
     if (r.last_verified_at) m.checked = r.last_verified_at;
     if (r.model_family) m.fam = r.model_family;
     if (r.variant_label) m.vl = r.variant_label;
     /* Zolang model_family nog niet in de database staat, blijft de ingebouwde indeling gelden */
     if (!('model_family' in r) && MI[m.id] && MI[m.id].fam) { m.fam = MI[m.id].fam; m.vl = MI[m.id].vl; }
     return m;
    });

    MODELS.length = 0;
    list.forEach(m => MODELS.push(m));
    document.querySelectorAll('[data-mcount]').forEach(e => { e.textContent = MODELS.length; });
    Object.keys(MI).forEach(k => delete MI[k]);
    MODELS.forEach(m => { MI[m.id] = m; });

    if (typeof mPaint === 'function') mPaint();
    if (typeof modelPaint === 'function') modelPaint();
    if (typeof render === 'function') render();
   }
  }
  if (catsLoaded) {
   document.querySelectorAll('[data-vts]').forEach(e => e.innerHTML = vcards());
   if (!touched && !modelActive()) applyType(vtype);
   else Object.entries(VT[vtype].p).forEach(([id, val]) => { const e = $(id); if (e) e.defaultValue = val });
   mpList(); render();
  }
 } catch (err) {
  /* Offline: de ingebouwde cijfers blijven staan */
 }
}


/* ===== Overstapgids: losse onderwerpen met een eigen rekenhulp, check of kaart ===== */
const GIDS=[['stappenplan','Stappenplan'],['netcongestie','Netcongestie en je aansluiting'],['laden','Laden op eigen terrein en onderweg'],['stroom','Stroomcontract en zonnepanelen'],['actieradius','Actieradius en planning'],['zero-emissiezones','Zero-emissiezones'],['subsidies','Subsidies en regelingen'],['heffing','Kilometerheffing en tol'],['financiering','Kopen, leasen of huren'],['accu','Accu, garantie en restwaarde'],['regels','Rijbewijs, gewicht en werkplaats']];
const GSTEPS=[
 ['Breng je ritten in kaart','Dagritten, stilstand en waar het voertuig \'s nachts staat. Daarmee weet je hoeveel accu en laadsnelheid je nodig hebt.','/overstapgids/actieradius/','Actieradius en planning'],
 ['Check je netaansluiting','Doe dit als eerste: in congestiegebieden kan een zwaardere aansluiting jaren duren.','/overstapgids/netcongestie/','Netcongestie'],
 ['Reken de kosten door','Met je eigen kilometers, prijzen en subsidie, en met je huidige diesel als vergelijking.','/','Naar de calculator'],
 ['Kies een voertuig','Let op bruikbare accu, laadsnelheid en levertijd. Rijd proef op je eigen routes.','/modellen/','Voertuigen'],
 ['Regel subsidie op tijd','Check bij AanZET en SPRILA wanneer je moet aanvragen, en meld de MIA binnen drie maanden.','/overstapgids/subsidies/','Subsidies en regelingen'],
 ['Regel het laden','Laadpunten op eigen terrein, een laadpas voor onderweg en een geijkte meter voor je ERE\'s.','/overstapgids/laden/','Laden'],
 ['Kies tussen kopen, leasen of huren','Vergelijk maandlasten en wie het risico op de restwaarde draagt.','/overstapgids/financiering/','Kopen, leasen of huren'],
 ['Bereid chauffeurs en werkplaats voor','Rijbewijs, training, NEN 9140 voor de werkplaats en de eisen van je verzekeraar.','/overstapgids/regels/','Rijbewijs, gewicht en werkplaats'],
 ['Meet en stuur bij','Houd verbruik, laadkosten en accugezondheid bij. Dat helpt bij het volgende voertuig en bij verkoop.','/overstapgids/accu/','Accu en restwaarde']];
const GKEY='sod-gids-stappen';
const gDone=()=>{try{return new Set(JSON.parse(localStorage.getItem(GKEY)||'[]'))}catch(e){return new Set()}};
let gid=null;
const G={},GF={};/* toestand en opmaak per rekenhulp */
const gArrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
const gSeg=(k,label,opts,wide)=>`<div class="gc${wide?' gwd':''}"><span class="gl">${label}</span><div class="seg sm" role="group" aria-label="${label}">${opts.map(o=>`<button type="button" data-gs="${k}" data-v="${o[0]}" aria-pressed="${String(G[k])===String(o[0])}">${o[1]}</button>`).join('')}</div></div>`;
const gRng=(k,label,min,max,step,fmt)=>{GF[k]=fmt;return`<label class="gc"><span class="gl">${label}<output data-go="${k}"></output></span><input type="range" data-gr="${k}" min="${min}" max="${max}" step="${step}" value="${G[k]}" aria-label="${label}"></label>`};
const gFill=el=>{const f=(el.value-el.min)/(el.max-el.min||1);el.style.setProperty('--f',f);const o=el.closest('.gtool').querySelector(`[data-go="${el.dataset.gr}"]`);if(o)o.textContent=GF[el.dataset.gr](+el.value)};
const gDur=h=>{const m=Math.max(1,Math.round(h*60));return m<60?m+' min':Math.floor(m/60)+(document.documentElement.lang==='en'?' h':' u')+(m%60?' '+m%60+' min':'')};
const gDef=()=>{const t=VT[vtype]?vtype:'trekker',p=VT[t].p;let s;try{s=v('acc')&&v('km')}catch(e){s=0}
 return s?{t,acc:v('acc'),le:v('le'),km:v('km'),wd:v('wd'),jr:v('jr'),pE:v('pE'),ld:v('ld'),dp:v('dp'),sp:v('sp'),ere:v('ere')}:{t,acc:p.acc,le:p.le,km:p.km,wd:p.wd,jr:p.jr,pE:p.pE,ld:p.ld,dp:p.dp,sp:p.sp,ere:p.ere}};

const NLP={"dr":"M468,124 472,125 474,120 476,116 478,110 480,107 481,105 482,105 482,102 484,101 486,100 489,98 492,96 494,96 497,95 501,97 504,99 507,104 508,107 510,106 511,107 511,110 515,112 516,113 517,116 518,118 519,120 525,117 528,117 535,117 537,119 544,126 547,129 549,132 558,142 566,150 570,156 578,168 580,170 583,171 579,181 583,182 583,184 586,187 587,188 588,191 591,191 588,198 588,201 585,241 583,244 581,244 578,243 577,242 573,241 571,242 569,243 566,243 565,242 563,240 561,240 557,240 555,240 550,239 548,240 546,240 544,239 541,239 540,240 537,241 533,243 531,245 529,246 529,244 530,242 530,240 525,238 515,233 505,236 499,240 499,244 500,250 498,249 497,248 495,248 493,247 491,249 489,249 487,248 486,246 485,247 483,247 481,248 479,250 478,248 477,245 476,243 475,242 474,241 472,239 471,238 470,237 469,235 467,236 465,237 463,235 461,236 460,235 458,234 457,233 455,232 453,231 450,231 448,232 445,230 443,228 442,225 440,222 437,213 438,212 442,211 445,209 450,202 446,197 439,190 438,188 437,186 444,181 450,177 455,171 457,170 459,167 466,168 471,173 480,166 486,156 476,140 476,131 467,127Z","fl":"M327,272 327,268 329,263 331,262 333,261 332,254 323,240 332,254 334,260 331,263 328,269 327,272ZM372,191 375,193 375,189 378,190 384,196 385,200 387,202 389,204 392,204 394,205 399,208 400,209 401,210 406,214 408,218 409,223 411,225 413,228 412,229 409,231 407,233 409,235 411,235 413,236 416,238 418,239 420,241 420,243 416,245 411,246 407,249 405,249 403,248 394,250 392,251 383,251 383,258 387,257 395,265 397,274 395,278 394,280 394,282 393,285 391,286 389,290 390,292 388,294 385,298 380,302 377,305 375,306 373,307 372,308 370,309 367,309 363,313 362,312 358,314 355,314 353,314 351,318 346,334 345,337 326,343 324,343 321,341 313,333 309,329 304,326 295,324 284,325 282,323 283,322 281,320 281,314 279,311 285,306 285,304 293,300 295,300 297,298 300,296 320,281 323,280 329,275 329,272 330,270 332,266 333,265 338,265 344,259 349,254 359,251 361,250 363,248 358,240 355,238 354,237 354,210 365,193 372,191Z","fr":"M318,128 320,129 321,132 322,134 319,133 318,131 317,129ZM313,129 312,130 307,131 294,142 293,143 286,149 291,143 306,130 311,129ZM271,67 275,68 275,70 272,70 270,71 269,72 267,73 264,75 258,77 255,78 256,81 255,82 255,85 251,86 249,89 246,89 241,91 239,89 248,82 250,81 253,77 255,75 265,69 267,68 270,67ZM282,72 280,74 278,73 280,70 281,69 283,67 284,68 283,71ZM448,40 445,45 445,49 446,51 447,53 453,54 454,56 455,58 458,57 461,57 463,59 463,66 465,67 462,69 462,70 461,72 458,72 458,76 459,78 457,79 456,81 454,83 452,85 454,88 454,90 454,92 453,94 451,96 450,98 448,99 446,103 446,106 446,113 448,116 450,118 456,119 460,118 462,120 463,121 464,122 468,124 467,127 476,131 476,140 486,156 480,166 471,173 466,168 460,167 457,168 455,171 450,177 444,181 437,186 435,188 433,189 431,190 428,190 426,191 427,194 424,196 422,195 419,196 417,195 415,193 414,192 414,190 412,190 411,192 409,192 407,192 406,195 405,196 403,198 399,200 397,199 394,199 392,198 390,197 386,199 384,196 378,190 375,189 376,192 374,191 372,190 371,189 368,189 367,188 366,189 364,189 363,186 362,185 357,187 355,187 352,188 352,190 349,192 347,192 343,191 336,188 332,186 331,187 327,188 323,186 320,183 318,182 317,180 316,178 317,177 318,175 321,174 323,173 324,169 323,165 324,163 324,160 324,159 325,157 324,154 324,152 323,148 324,145 324,143 323,141 323,138 323,136 323,138 322,140 321,137 320,136 321,134 323,135 322,132 321,130 320,125 315,129 314,130 313,128 315,127 319,123 320,121 322,118 324,116 325,113 325,107 325,105 325,103 325,102 326,100 327,96 329,93 330,91 333,88 336,85 339,83 341,82 343,80 345,79 348,76 348,73 353,69 357,66 359,66 365,64 368,63 371,62 381,56 384,54 386,53 389,52 391,51 395,49 397,48 400,47 399,44 400,46 403,46 405,46 410,45 411,44 414,43 416,43 421,42 425,42 429,41 432,41 433,40 435,41 440,42 446,39 448,40ZM343,30 341,31 346,31 346,33 344,35 342,35 339,36 336,38 334,37 334,39 331,38 333,39 335,40 333,41 325,42 323,42 321,42 316,46 315,47 313,48 311,49 309,48 308,49 307,51 304,50 301,50 298,52 295,52 294,54 292,55 291,56 289,58 287,57 285,56 284,53 285,51 288,49 289,46 290,45 308,40 311,39 327,35 331,33 341,29 344,29 346,29 343,30ZM428,27 428,29 426,30 424,28 425,27 428,27ZM374,27 383,27 393,25 396,26 407,25 413,26 415,26 412,28 408,28 404,27 401,29 398,30 396,30 392,31 387,33 384,33 383,34 379,32 376,31 374,32 371,35 369,36 366,36 364,37 362,36 360,35 358,33 357,31 358,26 359,24 362,24 365,25 370,27 374,27ZM442,14 445,16 447,16 449,16 461,15 467,14 473,14 471,16 468,17 464,19 462,19 461,20 457,22 453,23 449,23 445,24 443,25 441,25 442,27 439,27 437,29 436,27 437,25 437,23 438,21 440,19 443,16 437,14 436,17 436,13 442,14Z","ge":"M396,274 399,273 401,275 403,278 404,279 406,283 408,284 410,283 413,285 419,278 421,277 422,276 424,276 427,279 428,281 430,283 432,285 434,286 434,290 434,293 436,294 438,298 439,300 439,305 438,309 434,311 431,312 430,313 432,315 431,317 430,320 430,323 429,325 431,326 431,330 434,330 435,332 436,336 437,338 438,340 438,343 440,343 442,344 441,346 441,348 444,350 444,351 444,349 445,347 447,346 450,346 452,348 455,349 457,349 459,349 462,349 464,348 466,350 469,350 471,349 472,347 473,346 477,345 478,345 481,345 484,345 485,348 486,350 489,353 490,356 492,356 493,360 495,361 499,361 506,362 511,361 513,362 513,364 515,365 516,364 518,363 519,364 521,363 524,365 525,367 524,369 524,372 523,374 525,375 529,376 531,377 538,377 538,382 536,384 537,385 535,388 528,389 527,393 527,397 531,397 537,400 539,402 540,403 546,408 549,409 549,413 550,415 549,417 546,418 545,418 544,421 544,424 543,425 540,429 537,430 535,432 533,434 530,432 529,431 528,429 526,429 519,432 518,433 510,435 508,437 507,438 504,437 503,438 502,439 500,440 498,441 497,443 494,444 492,445 490,443 487,444 486,442 484,441 481,440 479,442 482,445 482,447 483,449 482,452 479,450 477,450 475,447 470,446 467,446 466,442 464,440 461,440 460,441 456,441 452,441 450,440 448,438 449,436 445,433 443,432 439,433 437,433 436,434 437,435 439,436 441,439 444,443 444,448 441,447 439,446 436,447 434,446 430,443 428,442 427,444 427,446 425,447 423,448 421,448 420,450 418,451 416,451 413,450 410,453 412,454 410,455 412,457 415,459 414,461 415,462 415,465 417,467 412,471 411,473 408,474 406,472 405,471 404,468 401,465 397,465 398,469 394,469 387,470 383,471 381,471 379,470 377,468 376,466 372,465 370,462 369,461 366,461 364,459 363,458 362,455 360,454 357,453 355,452 353,451 351,452 348,452 346,454 342,454 339,451 336,452 335,454 334,456 332,456 329,456 327,455 326,453 323,453 323,455 321,457 318,462 317,465 317,469 315,470 310,473 307,475 304,474 301,474 300,475 298,475 296,474 294,473 291,474 288,473 280,475 282,471 281,469 282,467 278,464 277,462 275,462 272,464 269,462 268,460 263,457 262,456 261,454 264,448 260,448 259,446 259,443 261,444 265,444 269,444 268,441 270,440 273,439 274,438 274,436 278,437 279,434 281,430 284,425 288,416 291,417 293,418 295,417 296,414 298,413 301,415 303,416 305,417 307,417 310,419 313,418 315,416 317,415 320,415 326,413 328,412 333,412 336,412 339,413 345,416 347,418 349,419 353,420 356,422 357,421 359,420 358,416 359,414 357,412 357,410 355,409 354,408 353,405 351,403 352,398 349,397 348,395 349,390 349,388 349,385 348,383 347,380 344,381 345,383 345,384 343,385 343,388 340,387 338,389 334,388 334,384 337,383 337,380 338,379 337,378 340,378 340,377 338,375 340,374 341,372 339,371 338,369 336,367 335,366 329,365 326,364 326,361 328,360 329,358 322,351 324,343 326,343 344,337 346,334 351,318 353,315 355,314 357,315 362,312 363,313 367,309 370,309 372,308 373,307 375,305 376,304 379,302 383,299 388,295 390,292 389,290 391,286 393,285 394,282 394,280 395,278Z","gr":"M543,28 547,26 550,27 550,29 547,29 549,30 548,31 550,31 552,31 551,30 551,28 554,29 558,32 557,37 556,41 559,44 559,48 560,51 561,56 565,59 566,60 565,62 567,63 570,64 572,64 575,66 577,67 580,68 583,69 588,69 591,68 590,70 589,72 588,78 589,80 591,81 592,82 595,82 597,82 599,83 601,84 603,85 605,85 609,86 609,84 610,88 611,91 611,96 610,98 612,101 610,102 607,106 606,110 605,111 605,116 608,118 608,127 610,144 611,146 609,148 606,162 593,183 591,187 591,191 588,191 588,188 586,187 584,184 583,182 579,181 583,171 580,170 579,168 570,156 566,150 558,142 549,132 547,129 544,126 537,119 535,117 528,117 525,117 519,120 518,118 517,116 516,113 515,112 513,110 511,108 510,106 508,107 507,104 504,100 503,97 497,95 494,96 492,96 489,97 488,99 484,101 483,102 482,105 481,105 480,107 478,110 476,116 476,120 472,125 468,124 464,122 463,121 462,120 460,118 456,119 450,118 448,116 446,113 446,106 446,103 448,99 450,98 450,96 452,95 454,93 454,91 454,89 452,87 455,85 455,82 456,80 457,78 459,77 458,72 461,72 462,70 462,69 465,67 463,66 463,58 461,57 458,57 456,58 454,57 453,55 447,53 446,51 445,49 445,45 448,40 450,41 456,39 459,39 465,42 467,44 469,43 471,41 476,39 480,37 487,36 507,34 511,33 514,32 517,30 521,29 528,26 536,25 541,27 543,28ZM515,5 513,5 514,7 511,5 508,6 509,4 513,4 515,5ZM496,4 498,5 501,7 499,7 497,6 497,8 494,8 494,10 492,10 491,7 489,6 488,3 489,0 490,3 496,4Z","li":"M397,470 397,465 400,464 404,468 405,471 406,472 408,474 410,473 417,474 419,476 422,477 424,479 425,480 423,481 422,482 423,485 423,487 423,490 425,492 427,492 430,494 432,494 437,495 436,498 435,501 434,504 433,508 435,510 437,512 438,514 440,516 443,518 445,523 446,525 448,526 450,528 452,532 452,537 453,539 454,542 453,548 452,553 451,560 454,560 452,564 454,570 448,575 445,578 444,580 443,582 443,584 441,587 439,589 438,591 432,599 429,600 432,605 430,605 429,609 430,615 431,618 434,618 436,617 438,616 444,612 447,614 440,617 446,621 444,623 443,624 439,625 437,626 435,627 433,627 432,629 431,630 428,632 427,634 425,636 423,637 421,638 419,639 417,641 416,642 415,644 413,646 413,648 412,651 411,652 409,652 408,651 406,649 405,645 401,648 397,648 399,652 398,654 399,656 402,658 403,661 403,664 401,666 403,667 406,666 408,665 411,664 413,666 415,665 422,665 421,670 419,672 421,673 421,678 425,679 427,679 429,681 431,681 433,682 432,683 430,688 432,691 432,693 432,695 430,696 430,699 427,698 423,699 421,703 422,705 422,707 421,709 420,710 417,710 415,709 414,712 416,713 418,715 422,718 421,720 421,722 418,723 415,723 414,721 408,722 406,723 405,722 403,723 401,722 400,719 396,721 395,722 394,720 392,721 389,722 385,718 383,715 378,719 377,721 374,720 371,721 369,722 368,721 370,718 371,715 369,712 370,710 370,708 367,708 366,707 364,706 363,704 362,702 361,700 362,697 362,694 366,691 368,689 369,688 370,684 372,683 373,684 375,683 375,680 377,677 378,674 380,674 379,672 378,671 376,672 374,672 376,668 378,666 380,663 381,662 381,659 383,656 382,654 380,653 381,651 382,648 382,646 385,646 386,645 386,643 387,642 386,639 387,637 390,638 391,637 391,634 389,634 388,632 390,629 393,628 393,626 395,625 392,623 392,620 390,619 389,620 386,621 384,623 383,621 382,620 383,618 381,615 379,614 378,614 376,615 373,615 371,615 369,615 367,615 365,614 363,613 361,610 349,605 354,604 358,603 359,598 359,592 366,582 398,572 407,564 398,548 396,537 395,534 392,518 401,520 403,522 408,521 413,520 419,517 421,519 423,521 424,521 424,518 424,514 423,511 422,509 422,506 421,504 417,501 414,498 413,497 414,494 413,493 411,492 412,489 411,485 411,482 408,480 404,480 401,479 400,477 400,474 399,471Z","nb":"M260,453 262,456 263,457 267,459 269,461 271,464 274,462 277,462 278,464 282,466 281,468 282,470 280,473 285,473 291,474 294,473 296,474 298,475 300,475 301,474 304,474 306,475 310,472 315,470 317,469 317,465 318,462 321,457 323,455 323,453 325,453 327,455 329,456 331,456 334,456 335,454 336,451 338,451 342,454 345,455 347,452 351,452 353,451 355,452 357,453 360,454 362,455 363,458 364,459 366,461 369,461 370,462 371,464 375,465 377,467 378,469 380,471 383,471 387,470 394,469 397,470 399,471 400,474 400,477 401,479 403,479 408,480 410,481 411,485 412,489 411,491 413,493 414,494 413,497 414,498 417,501 421,504 422,506 422,508 423,511 424,514 424,518 425,520 423,521 421,519 419,517 413,520 409,521 403,522 401,520 392,518 395,534 396,537 398,548 407,564 398,572 366,582 359,592 359,598 358,603 354,605 349,605 348,600 348,597 348,594 346,593 343,590 342,588 338,586 336,587 334,589 330,590 329,592 326,595 320,594 315,592 314,595 310,595 306,596 302,594 298,596 296,594 298,585 292,580 288,582 286,583 281,582 281,574 279,572 278,569 271,562 275,555 277,552 272,542 268,542 266,540 265,538 263,540 261,542 261,546 260,549 254,554 249,561 246,561 246,560 245,558 243,557 240,556 239,557 237,557 234,557 227,558 225,557 224,555 223,553 226,552 227,553 231,554 233,555 234,556 236,555 233,555 232,552 232,549 234,546 235,546 234,544 234,542 235,540 232,539 231,537 228,535 226,535 224,534 222,534 220,536 219,538 217,539 216,542 215,543 213,543 212,545 211,547 207,549 207,553 205,554 203,555 201,554 193,552 186,554 185,548 188,542 186,539 179,541 176,541 175,542 171,543 163,548 161,549 164,549 164,551 164,553 162,555 164,558 170,567 170,569 164,571 161,572 159,571 156,571 155,567 145,566 144,565 144,562 143,556 145,554 138,538 136,534 137,529 139,524 139,521 138,519 132,512 132,511 132,507 133,505 135,503 139,501 141,498 145,499 149,498 151,497 154,496 157,495 160,492 161,490 164,487 165,486 166,484 169,482 181,486 184,486 196,483 198,481 208,478 213,475 217,472 219,469 221,464 223,461 226,460 228,459 230,459 234,459 237,459 239,457 242,454 246,452 250,452 255,453 260,453ZM248,547 249,549 248,548 247,550 246,551 248,552 250,553 250,551 249,550 251,548 252,547 249,548Z","nh":"M308,229 316,232 323,240 316,233 308,229 306,229 308,229ZM213,156 210,156 205,157 203,158 202,159 201,158 202,156 204,155 205,154 207,154 210,154 213,155ZM269,164 267,166 266,169 272,176 273,178 278,189 276,207 278,208 279,212 282,214 284,216 287,217 288,216 291,212 295,212 297,213 298,214 302,213 304,215 305,218 305,220 306,222 308,224 306,226 305,227 304,229 301,230 299,231 297,238 293,241 291,243 289,243 285,246 283,247 280,247 279,244 277,244 275,243 272,242 271,243 269,244 268,242 266,243 264,244 263,245 263,250 264,253 264,255 264,257 265,259 267,262 269,267 269,269 270,271 271,273 273,275 273,277 272,280 271,281 269,283 271,286 269,287 266,288 267,289 268,288 268,290 268,293 269,294 272,295 274,291 275,289 276,287 274,282 276,287 278,288 280,288 278,290 277,291 275,295 274,296 272,297 271,299 271,301 268,301 267,303 265,304 264,308 262,308 261,311 260,310 257,311 255,310 254,311 256,312 255,314 256,315 258,316 259,317 261,319 263,318 265,319 264,320 267,321 269,320 272,320 274,320 276,321 277,322 280,323 283,325 295,324 304,326 309,329 313,333 308,336 304,335 302,337 299,342 295,345 295,351 295,353 293,356 290,361 287,361 279,361 281,359 283,356 281,352 279,351 272,352 270,352 267,350 266,348 269,346 267,344 266,341 265,340 264,337 265,337 268,336 269,334 267,335 265,334 264,335 262,336 260,333 258,333 255,334 255,335 252,335 250,335 249,338 247,339 246,340 241,341 238,342 237,343 235,345 233,347 230,348 227,348 224,349 223,350 222,351 219,353 217,354 216,352 216,348 213,347 210,349 207,349 202,352 198,353 196,352 194,351 192,352 190,351 189,349 190,347 191,341 191,339 194,335 195,332 197,329 198,327 194,325 191,326 190,328 180,323 188,301 190,295 191,293 191,289 191,287 193,284 194,279 196,269 198,256 199,246 201,238 202,230 203,217 204,210 205,208 207,205 209,196 213,182 214,178 215,164 215,161 216,159 218,158 220,158 222,157 225,157 225,160 228,159 227,163 227,165 227,167 229,171 240,177 245,176 247,175 250,173 253,170 253,168 255,167 257,166 260,165 262,166 264,165 266,166 268,164 286,148 269,164ZM241,107 244,109 245,113 245,114 244,122 244,124 244,128 241,130 240,131 240,134 238,136 237,138 236,139 234,140 231,140 227,146 226,148 224,147 221,146 223,148 224,149 221,150 220,151 217,151 215,151 214,148 213,145 214,140 215,135 216,132 217,129 220,123 225,115 226,113 232,105 234,102 236,100 237,100 239,102 241,104 241,107Z","ov":"M437,186 438,188 439,190 445,197 449,201 445,208 442,211 438,212 437,213 440,222 442,225 443,228 444,230 446,232 450,232 451,231 454,232 456,233 458,234 460,235 461,236 463,235 464,236 465,236 468,235 470,236 471,238 472,239 474,240 475,242 476,243 477,245 478,248 479,250 480,249 482,248 485,248 486,246 487,248 488,249 491,249 492,246 493,247 496,248 498,248 499,250 500,245 499,241 504,236 515,233 525,238 530,240 530,242 529,244 529,246 531,246 532,247 533,249 532,252 532,254 539,262 537,263 535,263 533,262 532,265 526,265 530,273 528,282 531,284 533,285 537,288 541,289 550,289 552,289 553,292 562,293 567,295 570,293 573,288 574,287 575,288 577,292 578,297 580,299 582,304 584,305 586,307 588,311 588,317 585,321 584,324 583,327 582,329 581,332 581,335 582,338 583,342 586,345 586,347 582,349 580,349 577,349 574,350 573,352 572,354 570,358 568,361 565,362 562,362 558,367 556,374 553,377 548,377 538,377 531,377 529,376 525,375 523,374 524,372 524,369 525,367 524,365 521,363 519,364 518,363 516,364 515,365 514,364 513,362 512,361 506,362 499,361 496,362 494,361 492,358 491,356 489,353 486,350 485,348 484,346 481,345 478,345 477,345 474,345 472,347 471,349 469,350 466,350 464,348 462,349 461,350 457,349 455,349 452,348 450,346 447,346 445,347 444,349 445,351 442,349 441,347 442,345 440,344 438,343 439,341 437,338 436,336 436,333 434,331 432,330 431,327 429,326 430,323 430,320 430,317 432,316 431,314 430,312 434,311 437,310 438,306 439,301 438,298 436,294 434,293 434,290 434,287 432,285 430,283 429,282 427,279 424,276 422,276 421,277 419,278 413,285 411,283 408,285 406,283 404,279 403,278 401,275 399,273 396,274 395,266 388,258 383,258 383,251 392,251 394,250 403,248 405,249 407,249 411,247 416,245 420,243 420,241 418,239 416,238 413,236 411,235 409,234 409,231 411,230 412,229 412,226 410,224 408,218 407,215 403,211 400,209 399,208 396,206 393,204 389,204 387,202 386,199 390,197 392,198 394,199 396,199 398,200 402,199 404,197 406,195 407,192 409,192 411,192 412,190 414,190 414,192 415,193 416,195 417,196 420,195 423,196 427,194 426,191 428,190 430,191 432,189 435,188Z","ut":"M227,348 230,348 233,347 235,345 236,343 238,342 240,341 245,341 246,339 248,338 248,335 251,335 254,336 256,334 258,333 260,333 262,336 263,336 264,334 267,335 268,333 270,334 268,335 266,336 265,337 264,340 265,342 267,343 269,346 266,348 267,350 270,352 272,352 279,352 281,352 283,356 282,358 279,360 287,361 290,361 293,356 295,353 295,351 295,345 299,342 301,336 304,335 308,336 313,333 321,341 324,343 322,351 329,357 328,360 326,361 327,363 329,365 335,365 336,367 338,369 339,371 341,372 340,374 338,375 340,377 340,378 337,378 338,379 337,380 337,383 334,384 333,387 336,389 340,389 342,387 344,386 345,384 345,383 344,381 346,381 347,383 348,385 349,388 348,389 348,394 349,396 352,398 351,403 352,405 353,407 355,409 357,410 357,412 359,414 358,416 359,418 358,420 356,422 353,420 349,419 347,418 345,416 340,414 337,412 333,412 329,411 326,413 321,415 317,415 315,416 313,418 311,419 307,417 305,417 303,416 301,415 299,413 297,413 295,417 293,418 291,417 288,416 285,415 283,412 282,410 280,408 277,407 274,407 271,409 267,412 266,414 263,415 261,414 258,414 256,417 253,418 251,417 249,418 248,420 247,422 244,423 241,423 239,418 238,416 235,413 233,411 232,409 230,407 237,405 235,403 232,403 229,404 229,402 230,401 230,399 233,395 235,393 239,391 240,390 235,390 233,389 232,386 232,383 232,380 226,376 229,374 229,372 230,371 233,370 234,371 238,372 240,372 239,368 242,366 237,362 235,361 230,356 229,354 229,352 228,350Z","ze":"M123,570 124,571 121,571 123,569ZM30,560 33,561 34,562 36,563 38,564 41,565 45,566 52,568 53,569 56,571 57,573 60,573 64,573 63,575 65,576 65,573 68,573 70,574 71,576 72,578 73,576 74,575 75,576 81,576 82,575 84,573 88,570 90,570 92,569 94,569 95,567 96,565 96,563 96,561 98,559 100,559 105,560 106,562 107,564 109,568 114,569 116,569 120,573 123,576 124,577 123,575 122,573 123,572 125,573 128,575 130,574 127,573 131,572 128,572 125,569 127,568 128,567 129,570 131,571 130,570 130,568 131,566 134,567 135,567 136,570 137,571 139,573 136,576 128,587 117,595 115,597 112,599 108,600 106,600 104,599 102,600 101,602 98,604 96,605 95,607 93,607 90,606 89,606 89,608 86,610 84,611 82,609 84,607 84,605 79,608 77,607 75,608 72,608 70,607 68,604 68,599 69,597 66,595 65,595 63,593 58,592 53,592 53,590 50,590 48,588 45,588 43,587 37,584 35,586 36,588 34,588 32,587 31,588 29,590 27,589 27,599 20,600 15,600 12,599 11,597 9,596 7,595 6,594 5,592 3,591 4,589 2,588 3,585 0,582 4,577 4,575 3,573 3,570 1,568 4,566 7,565 10,563 13,564 15,562 18,561 20,561 22,560 24,558 26,559 29,559ZM64,523 66,524 62,524 64,523ZM52,522 53,523 52,526 52,524 51,522ZM76,469 77,471 82,472 86,468 89,466 92,466 95,466 97,468 103,469 104,473 107,476 107,481 108,483 109,486 117,487 120,488 123,488 125,488 133,494 138,497 141,498 139,501 135,503 133,505 132,507 132,510 132,512 138,519 139,521 139,523 137,529 136,532 138,538 144,553 144,555 144,560 144,563 145,565 140,567 140,565 138,561 135,560 133,559 130,560 126,561 124,561 118,560 115,558 113,557 111,557 110,555 109,554 107,552 104,550 102,549 101,548 100,547 99,545 96,546 91,548 89,549 90,551 89,553 88,555 86,561 81,561 79,562 77,563 75,564 73,564 70,562 68,561 66,559 64,558 63,556 61,557 59,557 57,553 56,552 54,550 52,548 46,547 45,549 42,550 40,550 38,547 38,549 37,548 38,550 35,550 33,549 32,548 28,546 27,544 24,539 22,537 21,535 15,532 14,530 13,529 12,526 13,524 16,522 20,519 22,518 26,516 30,513 34,511 37,511 40,512 42,513 48,511 50,511 51,507 51,505 52,503 56,499 57,497 57,493 55,492 53,491 51,488 51,485 52,480 53,478 55,477 58,476 65,473 69,473 73,474 74,471 76,469ZM70,486 68,487 63,491 58,493 58,496 56,500 57,502 55,503 53,504 52,506 51,510 54,510 56,511 58,512 60,511 62,510 64,510 66,510 70,509 72,508 74,509 75,508 80,510 81,512 84,516 85,519 84,520 82,521 80,524 77,522 75,521 73,521 71,523 68,522 66,521 64,521 59,524 56,526 55,528 54,527 55,525 54,523 52,521 54,518 52,520 51,520 50,519 48,518 45,514 43,514 43,516 45,518 45,520 47,521 49,522 51,525 52,528 54,531 55,533 57,532 55,531 57,529 59,526 61,524 66,524 69,525 71,523 73,523 75,523 77,523 78,525 79,525 80,524 84,524 86,524 88,523 90,524 91,526 92,528 95,527 100,529 102,530 102,532 102,530 104,530 106,532 108,533 110,534 110,537 110,539 111,541 113,543 114,545 116,548 122,551 123,552 126,552 129,550 133,550 135,551 136,546 136,537 129,534 128,533 129,531 128,530 126,529 124,529 121,529 118,529 116,528 113,528 112,526 111,524 110,523 107,521 106,519 105,518 104,517 102,516 100,515 99,513 100,511 102,511 105,510 108,509 110,507 113,506 116,507 118,507 119,509 120,510 125,509 127,509 129,508 129,506 126,506 122,506 120,503 119,502 117,499 121,496 125,497 127,498 129,499 132,501 131,498 130,497 126,496 123,495 127,494 124,493 126,493 126,491 119,491 117,493 118,495 117,496 115,499 113,502 111,502 108,503 105,504 103,505 100,505 97,506 94,503 92,501 91,502 88,503 85,502 89,498 85,501 84,499 84,498 83,495 82,493 79,490 74,488 73,486 71,485Z","zh":"M156,479 158,479 159,481 156,481 154,480 156,479ZM144,471 150,472 155,474 157,475 158,476 155,478 152,477 150,477 148,476 143,472 144,471ZM180,323 190,328 191,326 194,325 198,327 197,329 196,332 194,335 191,339 191,341 190,347 189,349 190,351 192,352 194,351 196,352 199,353 202,352 207,349 210,349 212,348 216,348 216,351 217,353 219,352 221,351 223,350 224,348 226,348 228,350 229,352 229,354 230,356 235,361 237,362 243,366 239,368 240,372 238,372 235,372 234,370 231,370 229,372 229,374 227,375 232,380 232,383 232,386 233,389 235,390 240,390 239,391 236,393 233,395 231,398 230,400 229,401 229,404 232,403 234,403 237,405 230,407 232,409 234,411 235,413 237,415 238,417 241,423 242,423 247,422 248,420 249,418 250,417 254,418 256,417 258,414 259,413 263,415 266,414 267,412 270,410 274,407 277,407 280,408 282,409 283,412 284,414 288,415 284,425 282,428 279,434 279,436 276,436 274,436 273,439 270,440 268,441 270,443 267,444 261,444 260,443 260,445 260,448 264,448 263,453 260,453 255,453 250,452 248,452 242,454 239,457 237,459 234,459 230,459 228,459 226,460 224,461 221,464 220,468 217,472 213,475 209,478 199,481 196,483 184,486 181,486 169,482 167,484 165,486 164,487 162,489 160,492 159,494 154,496 151,497 149,498 145,499 141,498 138,497 133,494 126,488 123,488 120,488 117,487 110,486 108,483 107,481 107,476 104,473 104,470 97,468 95,466 92,465 89,466 87,468 83,472 77,471 76,469 78,468 80,464 79,458 80,455 82,453 85,452 89,452 93,450 98,448 100,447 103,447 105,448 104,450 106,451 107,452 108,451 110,449 111,448 113,446 112,445 107,438 107,435 110,430 109,428 107,429 105,428 103,429 101,428 104,419 104,417 104,413 107,411 109,412 111,412 113,413 118,411 120,410 121,408 123,407 125,404 127,401 139,387 142,382 144,381 146,378 150,374 157,365 162,358 168,348 172,339 180,323ZM110,450 109,451 109,453 111,454 112,455 118,458 120,459 124,462 127,464 132,465 136,469 138,471 140,472 143,477 147,479 151,482 154,483 156,483 162,483 164,482 165,478 164,477 157,474 152,471 145,469 141,467 138,464 138,462 136,459 133,458 131,458 127,454 125,453 123,454 121,453 116,451 115,450 113,448 111,449Z"};
/* Netcongestie voor afname per provincie, stand oktober 2026: [naam, netbeheerders, niveau (2 aansluitpauze in een deel, 1 wachtlijst in grote delen, 0 wachtlijst in delen), toelichting, bron] */
const NLPV={
 dr:['Drenthe',['Enexis','Rendo'],0,'Wachtlijst voor afname op een aantal plekken, zoals rond Coevorden en Bargermeer bij Emmen. In de rest van de provincie zit de krapte vooral bij teruglevering.',['TenneT, congestie-update Drenthe','https://www.tennet.eu/nl/projectnieuws/congestie-update-voor-delen-van-drenthe']],
 fl:['Flevoland',['Liander'],1,'De Flevopolder valt in hetzelfde krappe TenneT-gebied als Gelderland en Utrecht. In februari 2026 dreigde daar een aansluitstop; die is met maatregelen voorkomen, maar nieuwe aanvragen komen op de wachtlijst en de netverzwaring duurt jaren.',['Provincie Gelderland, statenbrief netcongestie','https://gelderland.stateninformatie.nl/document/16637802/1/Netcongestie+-+dreigende+aansluitstop']],
 fr:['Friesland',['Liander'],0,'Liander heeft op een groot aantal Friese stations congestie door vertraging van de netuitbreiding, onder meer rond Leeuwarden. De grootste krapte zit bij teruglevering; daarvoor gaf TenneT in 2026 670 MW vrij.',['Solar Magazine, TenneT in Friesland','https://solarmagazine.nl/nieuws-zonne-energie/i43541/tennet-geeft-670-megawatt-netcapaciteit-in-friesland-vrij-voor-teruglevering']],
 ge:['Gelderland',['Liander'],1,'Grootverbruik staat hier sinds 2022 op een wachtlijst; in september 2025 stonden er al 2.100 aanvragen voor afname op. In februari 2026 dreigde een aansluitstop. Die is voorkomen, maar de verzwaringen kosten jaren.',['Provincie Gelderland, statenbrief netcongestie','https://gelderland.stateninformatie.nl/document/16637802/1/Netcongestie+-+dreigende+aansluitstop']],
 gr:['Groningen',['Enexis'],0,'Wachtlijst voor afname vooral in het westen en rond de stad, zoals bij Vierverlaten, Hunze en Kropswolde, door krapte in het TenneT-net. Elders is er vaker nog ruimte.',['Provincie Groningen, uitvoeringsprogramma netcongestie','https://www.provinciegroningen.nl/fileadmin/user_upload/Documenten/Dossiers/Energie/Uitvoeringsprogramma_netcongestie_Groningen.pdf']],
 li:['Limburg',['Enexis'],1,'Wachtlijst voor afname in het grootste deel van de provincie. TenneT gaf in januari 2026 130 MW vrij; uitbreidingen rond Boxmeer, Venray en Maasbracht moeten vanaf 2029 tot 2031 meer ruimte geven.',['Enexis, transportcapaciteit voor afname','https://www.enexis.nl/zakelijk/netcapaciteit/transportcapaciteit/afname']],
 nb:['Noord-Brabant',['Enexis'],1,'Wachtlijst voor afname in vrijwel de hele provincie, door congestie in het TenneT-net. In augustus 2026 kwamen er knelpunten bij in onder meer \'s-Hertogenbosch, Helmond, Eindhoven en Oss, en herberekeningen leverden bijna geen ruimte op.',['Enexis, transportcapaciteit voor afname','https://www.enexis.nl/zakelijk/netcapaciteit/transportcapaciteit/afname']],
 nh:['Noord-Holland',['Liander'],1,'Wachtlijst voor afname in vrijwel de hele provincie. Na een nieuwe berekening van TenneT en Liander in januari 2026 moeten de meeste klanten langer wachten; alleen rond Oostzaan kwam ruimte vrij.',['TenneT, onderzoeken naar congestiemanagement','https://www.tennet.eu/nl/de-elektriciteitsmarkt/congestiemanagement/onderzoeken-naar-congestiemanagement']],
 ov:['Overijssel',['Enexis','Rendo','Coteq'],1,'Enexis meldde in september 2026 26 nieuwe knelpunten voor afname in Overijssel, onder meer bij Almelo, Dedemsvaart en Deventer. De druk op het TenneT-net blijft hoog; rond Zwolle verwacht TenneT een oplossing in 2032, rond Hengelo in 2035.',['TenneT, druk op het net in Groningen en Overijssel','https://www.tennet.eu/nl-en/news/pressure-electricity-grid-groningen-and-overijssel-remains-high']],
 ut:['Utrecht',['Stedin'],2,'Tussen Breukelen, Driebergen en Vianen geldt sinds 1 juli 2026 een aansluitpauze, ook voor kleine aansluitingen en verzwaringen. Rond Amersfoort, Soest en Veenendaal wordt aangesloten op volgorde van maatschappelijke prioriteit. In het pauzegebied wordt vanaf 2028 weer aangesloten, eerst voor prioriteiten.',['Gemeente Utrecht, omgaan met een vol stroomnet','https://www.utrecht.nl/wonen-en-leven/duurzame-stad/vol-stroomnet']],
 ze:['Zeeland',['Stedin'],0,'TenneT vond in april 2026 260 MW extra ruimte met flexibele contracten, waardoor zeker 173 grootverbruikers van de wachtlijst konden. Stedin meldt nog congestie rond onder meer Terneuzen, Zuid-Beveland, Tholen en Schouwen.',['Solar Magazine, TenneT in Zeeland','https://solarmagazine.nl/nieuws-zonne-energie/i43596/tennet-vindt-in-zeeland-260-megawatt-extra-transportcapaciteit']],
 zh:['Zuid-Holland',['Stedin','Liander','Westland Infra'],1,'Wachtlijst voor afname in grote delen, onder meer in de Rotterdamse haven, Den Haag en het Westland. In het havengebied loopt het tekort volgens de provincie op tot 244 MW in 2029.',['TenneT, congestieonderzoek Zuid-Holland','https://www.tennet.eu/nl/de-elektriciteitsmarkt/congestiemanagement/onderzoeken-naar-congestiemanagement/congestieonderzoek-zuid-holland']]};
const NBH={Liander:'https://www.liander.nl/',Stedin:'https://www.stedin.net/',Enexis:'https://www.enexis.nl/',Rendo:'https://www.rendo.nl/',Coteq:'https://www.coteq.nl/','Westland Infra':'https://www.westlandinfra.nl/'};
const NLST=['Wachtlijst in delen','Wachtlijst in grote delen','Aansluitpauze in een deel'];
/* Lengte- en breedtegraad naar de kaart (lineair, past op deze projectie van de provincies) */
const nlXY=(lo,la)=>[(lo-3.36)/3.87*613,(53.56-la)/2.81*724];
const gExt=(t,u)=>`<a href="${u}" target="_blank" rel="noopener">${t} <span aria-hidden="true">↗</span></a>`;
let nlSel=null,nlPlace='';
function nlPanel(){
 const p=nlSel&&NLPV[nlSel];
 if(!p)return`<h3>Nederland</h3><p>In elke provincie staan aanvragen voor afname op een wachtlijst. Sinds 1 juli 2026 komen in congestiegebieden ook kleine aansluitingen tot 3×80 A op dezelfde wachtlijst als grote. Maatschappelijke functies en projecten die het net ontlasten gaan voor.</p><div class="nll">${gExt('Check je adres op de capaciteitskaart','https://capaciteitskaart.netbeheernederland.nl/')}</div>`;
 return`<h3>${p[0]}</h3>${nlPlace?`<p class="nlw">${nlPlace}</p>`:''}<p class="nls l${p[2]}">${NLST[p[2]]}</p><p>${p[3]}</p><p class="nlb">Stand oktober 2026 · ${gExt(p[4][0],p[4][1])}</p><dl><dt>Netbeheerder</dt><dd>${p[1].map(n=>gExt(n,NBH[n])).join('')}</dd></dl><div class="nll">${gExt('Check je adres op de capaciteitskaart','https://capaciteitskaart.netbeheernederland.nl/')}${gExt('Aanvragen tot 3×80 A','https://www.mijnaansluiting.nl/')}</div>`;
}
function nlPaint(){const el=$('gtMap');if(!el)return;el.querySelectorAll('[data-pv]').forEach(p=>{p.classList.toggle('on',p.dataset.pv===nlSel);p.setAttribute('aria-pressed',p.dataset.pv===nlSel)});setH($('gNp'),nlPanel())}
async function nlFind(q){
 const msg=$('gPcM');msg.textContent='';
 try{
  const r=await fetch('https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?rows=1&fl=provincienaam,gemeentenaam,woonplaatsnaam,centroide_ll,weergavenaam&q='+encodeURIComponent(q));
  const d=(await r.json()).response.docs[0];if(!d)throw 0;
  const id=Object.keys(NLPV).find(k=>NLPV[k][0]===d.provincienaam||(k==='fr'&&/Frysl/.test(d.provincienaam)));if(!id)throw 0;
  const m=/POINT\(([\d.]+) ([\d.]+)\)/.exec(d.centroide_ll||'');const dot=$('gDot');
  if(m){const[x,y]=nlXY(+m[1],+m[2]);dot.setAttribute('cx',x);dot.setAttribute('cy',y);dot.removeAttribute('hidden')}
  nlSel=id;nlPlace=d.weergavenaam||d.gemeentenaam||'';nlPaint();
 }catch(e){msg.textContent='Niet gevonden. Probeer een postcode, zoals 3511 AB.'}
}

/* Overgangsregeling zero-emissiezones voor de diesel uit de check: [einde (0 geen toegang), uitleg] */
/* Gegevens van je diesel: kenteken als dat bekend is, anders het type in de calculator */
const gPl=()=>PL.D&&!PL.D.err&&!PL.D.el?PL.D:null;
function zeDef(){const i=gPl(),t=i&&['bestel','bakwagen','trekker'].includes(i.vt)?i.vt:vtype==='trekker'||vtype==='bakwagen'?vtype:'bestel';G.zeT=t;G.zeE=i&&i.euro?Math.min(6,Math.max(4,i.euro)):6;G.zeY=i&&i.first?Math.min(2026,Math.max(2005,i.first.getFullYear())):2019}
function zeRule(){
 if(G.zeT===undefined)zeDef();
 const t=G.zeT,e=G.zeE,y=G.zeY;let end=0,why;
   if(y>=2025){why='Diesels die vanaf 1 januari 2025 nieuw op kenteken komen, mogen de zone niet in.'}
   else if(t==='bestel'){if(e===5){end=2027;why='Bestelauto\'s met Euro 5 mogen tot 1 januari 2027 de zone in.'}else if(e===6){end=2028;why='Bestelauto\'s met Euro 6 mogen tot 1 januari 2028 de zone in. Een verlenging tot 1 januari 2029 is voorgesteld; Schiphol hanteert die datum al.'}else why='Bestelauto\'s met Euro 4 of lager mogen sinds 1 januari 2025 niet meer de zone in.'}
   else if(e<6)why='Vrachtauto\'s onder Euro VI mogen sinds 1 januari 2025 niet meer de zone in.';
   else if(t==='bakwagen'){if(y>=2020){end=2030;why='Euro VI-bakwagens die op 1 januari 2025 hooguit vijf jaar oud waren, mogen tot 1 januari 2030 de zone in.'}else if(y>=2017){end=2028;why='Euro VI-bakwagens die op 1 januari 2025 hooguit acht jaar oud waren, mogen tot 1 januari 2028 de zone in.'}else why='Euro VI-bakwagens die op 1 januari 2025 ouder waren dan acht jaar, vallen buiten de overgangsregeling.'}
   else{if(y>=2017){end=2030;why='Euro VI-trekkers die op 1 januari 2025 hooguit acht jaar oud waren, mogen tot 1 januari 2030 de zone in.'}else why='Euro VI-trekkers die op 1 januari 2025 ouder waren dan acht jaar, vallen buiten de overgangsregeling.'}
 return[end,why];
}
/* Zero-emissiezones: [gemeente, lengtegraad, breedtegraad, jaar, maand, bijzonderheid], stand oktober 2026 (Op weg naar ZES, gemeenten) */
const ZES=[['Amersfoort',5.387,52.156,2025,1],['Amsterdam',4.9,52.373,2025,1],['Assen',6.562,52.993,2025,1],['Delft',4.357,52.012,2025,1],['Den Haag',4.3,52.078,2025,1],['Eindhoven',5.479,51.441,2025,1],['Gouda',4.708,52.012,2025,1],['Leiden',4.497,52.16,2025,1],['Maastricht',5.691,50.851,2025,1],['Nijmegen',5.852,51.842,2025,1],['Rotterdam',4.479,51.922,2025,1],['Tilburg',5.084,51.555,2025,1],['Utrecht',5.121,52.091,2025,1],['Zwolle',6.094,52.512,2025,1],
 ["'s-Hertogenbosch",5.304,51.69,2025,3],['Groningen',6.567,53.219,2025,4],['Haarlem',4.636,52.381,2025,6],['Enschede',6.894,52.221,2025,7],
 ['Schiphol',4.764,52.308,2026,1,'Op Schiphol-Centrum mogen bestelauto\'s met Euro 6 tot 1 januari 2029 in, een jaar langer dan in de meeste gemeenten.'],['Dordrecht',4.69,51.813,2026,1,'Bronnen noemen 1 januari of 1 juli 2026 als start.'],['Arnhem',5.898,51.985,2026,7,'Bronnen noemen 1 juni of 1 juli 2026 als start.'],
 ['Alphen aan den Rijn',4.657,52.13,2027,1],['Venlo',6.172,51.37,2027,1],['Hilversum',5.176,52.223,2027,1,'De ingangsdatum is nog niet definitief; bronnen noemen 2027.'],['Almere',5.222,52.371,2028,1],['Deventer',6.163,52.255,2028,1],['Breda',4.776,51.589,2029,1],['Apeldoorn',5.969,52.211,2030,1,'De gemeente bespreekt uitstel van de ingangsdatum.'],['Ede',5.665,52.04,2030,1,'De gemeente bespreekt uitstel van de ingangsdatum.'],['Zaanstad',4.826,52.457,2030,1]];
const ZEM=['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
let zeSel=null;
/* Rekenhulpen: bouw de bediening één keer, daarna alleen de uitkomst opnieuw */
const GT={
 gtMap:{init(){return`<form class="gpc" id="gPc" role="search"><input name="q" type="text" placeholder="Postcode of plaats" aria-label="Postcode of plaats" autocomplete="postal-code" maxlength="60"><button class="btn" type="submit">Zoek</button><span class="gpm" id="gPcM" role="status"></span></form>
  <div class="nlm"><svg viewBox="0 0 613 724" role="group" aria-label="Kaart van Nederland per provincie">${Object.entries(NLP).map(([k,d])=>`<path d="${d}" data-pv="${k}" class="l${NLPV[k][2]}" tabindex="0" role="button" aria-label="${NLPV[k][0]}"><title>${NLPV[k][0]}</title></path>`).join('')}<circle id="gDot" r="9" hidden/></svg><div class="nlp" id="gNp" aria-live="polite"></div></div>
  <div class="nlk"><span class="k2">Aansluitpauze in een deel</span><span class="k1">Wachtlijst in grote delen</span><span class="k0">Wachtlijst in delen</span><span>Stand oktober 2026</span><a href="https://github.com/VictorCazanave/svg-maps" target="_blank" rel="noopener">Kaart: svg-maps, CC BY 4.0</a></div>`},paint:nlPaint},
 gtKw:{init(){const d=gDef();G.kwT=d.t;G.kwN=1;G.kwE=Math.round(d.km/d.wd*d.le/100);G.kwH=10;
  return gSeg('kwT','Voertuig',Object.keys(VT).map(k=>[k,VT[k].n]))+gRng('kwN','Aantal voertuigen',1,40,1,x=>nf(x))+gRng('kwE','Laden per voertuig per dag',10,900,5,x=>nf(x)+' kWh')+gRng('kwH','Uren om te laden',2,16,1,x=>x+' uur')+'<div class="gout"></div>'},
  seg(k){if(k==='kwT'){const p=VT[G.kwT].p;G.kwE=Math.round(p.km/p.wd*p.le/100);gSet('kwE')}},
  paint(el){
   const tot=G.kwN*G.kwE/.92,P=tot/G.kwH,KV=[[17,'3×25 A'],[24,'3×35 A'],[35,'3×50 A'],[43,'3×63 A'],[55,'3×80 A']],fit=KV.find(s=>P<=s[0]),mx=Math.max(80,P*1.15);
   const H=tot/55,B=(P-55)*G.kwH/.9,bOk=P>55&&(P-55)*G.kwH<=55*(24-G.kwH)*.9;
   const why=fit?`Past op een kleinverbruikaansluiting van ${fit[1]}. Tel daar op wat je pand al gebruikt. Moet je daarvoor verzwaren, dan komt ook die aanvraag in een congestiegebied op de wachtlijst.`:`Je hebt een grootverbruikaansluiting nodig, en in een congestiegebied kom je op de wachtlijst.${H<=20?` Met ${Math.ceil(H)} uur laden past het wel op 3×80 A.`:''}${bOk?` Of een batterij van ongeveer ${nf(Math.ceil(B/10)*10)} kWh vangt de piek op.`:''}`;
   setH(el.querySelector('.gout'),`<div class="gres"><b>${nf(P)} kW</b><span>laadsnelheid nodig</span></div>
    <div class="gsc" aria-hidden="true"><i class="${fit?'ok':'hi'}" style="width:${Math.min(100,P/mx*100)}%"></i>${KV.map(s=>`<u style="left:${s[0]/mx*100}%"><s>${s[1].replace('3×','')}</s></u>`).join('')}</div>
    <p class="gwh">${why}</p>`)}},
 gtLd:{init(){const d=gDef();G.ldA=Math.round(d.acc);G.ldP=70;G.ldV={trekker:400,bakwagen:250,bestel:100,bus:250}[d.t];
  return gRng('ldA','Bruikbare accu',30,900,5,x=>nf(x)+' kWh')+gRng('ldP','Te laden',10,90,5,x=>x+'% · '+nf(G.ldA*x/100)+' kWh')+gSeg('ldV','Voertuig laadt maximaal',[[100,'100 kW'],[150,'150 kW'],[250,'250 kW'],[400,'400 kW'],[1000,'MCS']],1)+'<div class="gout"></div>'},
  input(k){if(k==='ldA')gSet('ldP')},
  paint(el){
   const kwh=G.ldA*G.ldP/100,L=[[11,'AC 11 kW'],[22,'AC 22 kW'],[50,'DC 50 kW'],[150,'DC 150 kW'],[350,'DC 350 kW'],[1000,'MCS 1 MW']];
   const rows=L.map(([p,n])=>{const ac=p<50,eff=ac?p*.92:Math.min(p,G.ldV)*.85,h=kwh/eff;return{n,h,lim:!ac&&p>G.ldV}}),mx=Math.max(...rows.map(r=>Math.min(r.h,14)));
   setH(el.querySelector('.gout'),`<div class="gbl">${rows.map(r=>`<div class="gbr"><span>${r.n}</span><i><b class="${r.h<=.75?'ok':r.h<=10?'':'hi'}" style="width:${Math.max(2,Math.min(r.h,14)/mx*100)}%"></b></i><em>${gDur(r.h)}</em><small>${r.h<=.75?'In de pauze':r.h<=10?'In een nacht':'Langer dan een nacht'}${r.lim?' · max '+G.ldV+' kW':''}</small></div>`).join('')}</div>`)}},
 gtEn:{init(){const d=gDef();G.enD=d;G.enK=Math.round(d.km*d.le/100/500)*500;G.enP=d.sp;G.enC='v';G.enZ=0;G.enS=40;
  return gRng('enK','Laden per jaar',1000,300000,500,x=>nf(x)+' kWh')+gRng('enP','Stroomprijs excl. btw',.08,.6,.01,x=>eur(x,2)+' per kWh')+gSeg('enC','Contract',[['v','Vast'],['d','Dynamisch, slim laden']])+gRng('enZ','Zonnepanelen',0,500,5,x=>x?nf(x)+' kWp':'Geen')+gRng('enS','Deel zonnestroom in je voertuigen',0,100,5,x=>x+'%')+'<div class="gout"></div>'},
  paint(el){
   const d=G.enD,K=G.enK,pr=Math.max(.01,G.enP-(G.enC==='d'?LIVE.slim:0)),zon=Math.min(K,G.enZ*ZON_KWH*G.enS/100),cost=(K-zon)*pr+zon*ZON_PRIJS,ere=K*d.ere,km=K/d.le*100,dsl=km*d.ld/100*d.dp,net=cost-ere,mx=Math.max(dsl,cost);
   setH(el.querySelector('.gout'),`<div class="gres"><b>${eur(net)}</b><span>stroom per jaar na ERE's · ${eur(net/K,3)} per kWh</span></div>
    <div class="gbl">${[['Diesel',dsl,`${nf(km)} km bij ${eur(d.dp,2)} per liter`,'dz'],['Stroom',cost,zon?`waarvan ${nf(zon)} kWh van eigen dak`:`${eur(pr,2)} per kWh`,'ok'],['ERE\'s',ere,`${eur(d.ere,2)} per kWh terug`,'hi']].map(r=>`<div class="gbr"><span>${r[0]}</span><i><b class="${r[3]}" style="width:${Math.max(1,r[1]/mx*100)}%"></b></i><em>${r[0]==='ERE\'s'?'− ':''}${eur(r[1])}</em><small>${r[2]}</small></div>`).join('')}</div>
    ${G.enC==='d'?`<p class="gwh">Met slim laden rekenen we met ${eur(LIVE.slim,2)} per kWh minder: het verschil tussen de goedkope uren en het daggemiddelde op de stroombeurs.</p>`:''}`)}},
 gtAr:{init(){const d=gDef();G.arA=Math.round(d.acc);G.arL=d.le;G.arD=Math.round(d.km/d.wd/5)*5;G.arS='w';G.arB='h';G.arR=10;
  return gRng('arD','Dagrit',20,1000,5,x=>nf(x)+' km')+gRng('arA','Bruikbare accu',30,900,5,x=>nf(x)+' kWh')+gRng('arL','Verbruik',10,200,1,x=>nf(x)+' kWh/100 km')+gSeg('arS','Seizoen',[['z','Zomer'],['v','Voorjaar'],['w','Winter'],['k','Vorst']])+gSeg('arB','Belading',[['l','Leeg'],['h','Half'],['v','Vol']])+gSeg('arR','Buffer bij aankomst',[[0,'Geen'],[10,'10%'],[20,'20%']])+'<div class="gout"></div>'},
  paint(el){
   const fs={z:1,v:1.08,w:1.2,k:1.32},fb={l:.88,h:1,v:1.12},use=s=>G.arL*fs[s]*fb[G.arB]/100,rg=s=>G.arA*(1-G.arR/100)/use(s),R=rg(G.arS),D=G.arD,mx=Math.max(R,D)*1.08;
   const kwh=(D-R)*use(G.arS);
   const why=D<=R?`Je dagrit past, met ${nf(R-D)} km over.`:`Je komt ${nf(D-R)} km tekort. Laad onderweg zo'n ${nf(Math.ceil(kwh/5)*5)} kWh: ongeveer ${gDur(kwh/300)} aan een snellader van 350 kW.`;
   setH(el.querySelector('.gout'),`<div class="gres"><b>${nf(R)} km</b><span>actieradius op deze dag</span></div>
    <div class="gsc" aria-hidden="true"><i class="${D<=R?'ok':'hi'}" style="width:${R/mx*100}%"></i><u class="d" style="left:${D/mx*100}%"><s>dagrit</s></u></div>
    <p class="gwh">${why}</p><p class="gsz">${[['z','Zomer'],['v','Voorjaar'],['w','Winter'],['k','Vorst']].map(s=>`<span${s[0]===G.arS?' class="on"':''}>${s[1]} <b>${nf(rg(s[0]))} km</b></span>`).join('')}</p>`)}},
 gtZe:{init(){zeDef();
  return `<div class="gc gpl"><span class="gl">Kenteken</span>${plateForm('D')}</div>`+gSeg('zeT','Voertuig',[['bestel','Bestelauto'],['bakwagen','Bakwagen'],['trekker','Trekker']])+gSeg('zeE','Euroklasse',[[4,'4 of lager'],[5,'5'],[6,'6']])+gRng('zeY','Eerste toelating',2005,2026,1,x=>String(x))+'<div class="gout"></div>'},
  paint(el){
   const[end,why]=zeRule();
   const yrs=[2025,2026,2027,2028,2029,2030,2031];
   setH(el.querySelector('.gout'),`<div class="gres"><b>${end?'Tot 1 januari '+end:'Geen toegang'}</b></div>
    <div class="gze" aria-hidden="true">${yrs.map(x=>`<span class="${end>x?'ok':'no'}">${x}</span>`).join('')}</div>
    <p class="gwh">${why} Een elektrisch voertuig mag er altijd in.</p>`);
   const m=$('gtZm');if(m&&m.dataset.on)GT.gtZm.paint(m)}},
 gtZm:{init(){G.zmY=2026;
  return`<div class="zmt">${gSeg('zmY','Jaar',[2025,2026,2027,2028,2029,2030].map(y=>[y,String(y)]))}</div>
  <div class="nlm zmm"><svg viewBox="0 0 613 724" role="group" aria-label="Kaart van Nederland met zero-emissiezones">${Object.values(NLP).map(d=>`<path d="${d}" class="zb"/>`).join('')}<g id="zmD">${ZES.map((z,i)=>{const[x,y]=nlXY(z[1],z[2]);return`<g class="zc" data-zc="${i}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" tabindex="0" role="button" aria-label="${z[0]}"><title>${z[0]}</title><circle r="20" class="zh"/><circle r="9" class="zd"/><text y="-18" text-anchor="middle">${z[0]}</text></g>`}).join('')}</g></svg><div class="nlp" id="zmP" aria-live="polite"></div></div>
  <div class="nlk"><span class="z1">Zone actief</span><span class="z0">Komt eraan</span><span>Stand oktober 2026</span></div>`},
  paint(el){
   const Y=G.zmY,on=z=>z[3]<=Y,n=ZES.filter(on).length,nw=ZES.filter(z=>z[3]===Y);
   el.querySelectorAll('[data-zc]').forEach(g=>{const z=ZES[+g.dataset.zc];g.classList.toggle('on',on(z));g.classList.toggle('sel',+g.dataset.zc===zeSel);g.setAttribute('aria-pressed',+g.dataset.zc===zeSel)});
   const sel=$('zmD').querySelector('.sel');if(sel)$('zmD').appendChild(sel);
   const chip=z=>`<button type="button" class="zch${on(z)?' on':''}${nw.includes(z)?' nw':''}" data-zsel="${ZES.indexOf(z)}">${z[0]}</button>`;
   let h;
   if(zeSel===null)h=`<div class="gres"><b>${n}</b><span>zones in ${Y}</span></div>${nw.length?`<p class="nlb">Erbij in ${Y}: ${nw.map(z=>z[0]).join(', ')}</p>`:''}<div class="zcl">${ZES.slice().sort((a,b)=>a[3]+a[4]/13-b[3]-b[4]/13).map(chip).join('')}</div>`;
   else{
    const z=ZES[zeSel],[end]=zeRule(),now=2026+9/12,st=z[3]+(z[4]-1)/12,started=st<=now,d=`1 ${ZEM[z[4]-1]} ${z[3]}`;
    const you=!end?'Met de diesel uit de check hieronder mag je deze zone niet in.':end<=z[3]?`Met de diesel uit de check hieronder kom je er niet in: jouw overgangsregeling loopt af voordat deze zone begint.`:`Met de diesel uit de check hieronder mag je er tot 1 januari ${end} in.`;
    h=`<h3>${z[0]}</h3><p class="nls ${started?'zl1':'zl0'}">${started?'Zone sinds '+d:'Zone vanaf '+d}</p>${z[5]?`<p>${z[5]}</p>`:''}<p>${you}</p><div class="nll">${gExt('Zonekaart en regels (Op weg naar ZES)','https://www.opwegnaarzes.nl/bedrijven/waar-komen-de-ze-zones')}</div><button type="button" class="lnk zmx" data-zsel="-1">Alle zones</button>`}
   setH($('zmP'),h)}},
 gtSb:{init(){G.sbT=vtype==='bakwagen'?($('cls').value==='N2'?'n2':'n3'):vtype;G.sbS=Math.min(2,Math.max(0,Math.round(v('gr'))||0));G.sbP=Math.min(700000,Math.max(20000,Math.round(gDef().pE/5000)*5000));
  return gSeg('sbT','Voertuig',[['trekker','Trekker'],['n3','Bakwagen N3'],['n2','Bakwagen N2'],['bestel','Bestelbus'],['bus','Bus']],1)+gSeg('sbS','Bedrijf',[[2,'Klein'],[1,'Middelgroot'],[0,'Groot']])+gRng('sbP','Prijs elektrisch excl. btw',20000,700000,5000,x=>eur(x))+'<div class="gout"></div>'},
  seg(k){if(k==='sbT'){G.sbP=VT[{n3:'bakwagen',n2:'bakwagen'}[G.sbT]||G.sbT].p.pE;gSet('sbP')}},
  paint(el){
   const truck=['trekker','n3','n2'].includes(G.sbT),cls=G.sbT==='n2'?'N2':'N3',az=AZT[cls][G.sbS],P=G.sbP,azB=Math.min(P*az[1],az[2]),mia=[P*.9*.36*.19,P*.9*.36*.258];
   const pv=VT[{n3:'bakwagen',n2:'bakwagen'}[G.sbT]||G.sbT].p,ere=pv.km*pv.le/100*pv.ere,mkb=G.sbS>0,spr=sprila(15200,!mkb);
   const row=(n,a,t,hi)=>`<div class="gsb${hi?' best':''}"><div><b>${n}</b><p>${t}</p></div><em>${a}</em></div>`;
   setH(el.querySelector('.gout'),`<div class="gsl">${truck?row('AanZET',eur(azB),`${nf(az[1]*100,1)}% van de chassisprijs, maximaal ${eur(az[2])}${cls==='N2'?', vanaf 10.000 kg':''}. Niet samen met de MIA.`,azB>=mia[1])+row('MIA',`${eur(mia[0])} – ${eur(mia[1]).replace('€ ','')}`,'Netto belastingvoordeel bij 19% of 25,8% vennootschapsbelasting. Alternatief voor AanZET.',azB<mia[1]):row('AanZET','Niet van toepassing','AanZET geldt alleen voor nieuwe vrachtwagens.')}
    ${row('SPRILA',eur(spr),`Voor een DC-laadpunt van 50 kW dat ${eur(15200)} kost: een vast bedrag van ${eur(mkb?9760:4880)}, maar maximaal ${mkb?'40':'20'}% van de kosten.`)}
    ${row('ERE\'s',eur(ere)+' per jaar',`Bij ${nf(pv.km)} km per jaar en ${eur(pv.ere,2)} per geladen kWh op eigen terrein.`)}
    ${G.sbS>0?row('KIA','Extra aftrek','Investeer je in een jaar een beperkt bedrag in bedrijfsmiddelen, dan krijg je extra aftrek, ook naast de MIA.'):''}
    ${row('Gemeente of provincie','Wisselend','Sommige gemeenten en provincies hebben eigen regelingen, vaak voor bestelauto\'s in steden met een zero-emissiezone.')}</div>`)}},
 gtHf:{init(){G.hfT=vtype==='bakwagen'?'bakwagen':'trekker';G.hfK=G.hfT===vtype&&v('kmH')?Math.min(200000,Math.max(5000,v('kmH'))):VT[G.hfT].p.kmH;
  return gSeg('hfT','Voertuig',[['trekker','Trekker'],['bakwagen','Bakwagen']])+gRng('hfK','Kilometers per jaar met heffing',5000,200000,1000,x=>nf(x)+' km')+'<div class="gout"></div>'},
  seg(k){if(k==='hfT'){G.hfK=VT[G.hfT].p.kmH;gSet('hfK')}},
  paint(el){
   const own=G.hfT===vtype,p=own?{tD:v('tD'),tE:v('tE')}:VT[G.hfT].p,d=G.hfK*p.tD,e=G.hfK*p.tE;
   setH(el.querySelector('.gout'),`<div class="gres"><b>${eur(d-e)}</b><span>minder heffing per jaar met elektrisch</span></div>
    <div class="gbl">${[['Diesel',d,p.tD,'dz'],['Elektrisch',e,p.tE,'ok']].map(r=>`<div class="gbr"><span>${r[0]}</span><i><b class="${r[3]}" style="width:${Math.max(1,r[1]/d*100)}%"></b></i><em>${eur(r[1])}</em><small>${eur(r[2],3)} per km</small></div>`).join('')}</div>`);
   setH($('gtTol'),`<table class="gtt"><thead><tr><th></th><th>Diesel</th><th>Elektrisch</th><th>Per 10.000 km</th></tr></thead><tbody>${TOL.map(c=>`<tr><th>${c[1]}</th><td>${eur(c[3],3)}</td><td>${eur(c[2],3)}</td><td>${eur((c[3]-c[2])*10000)}</td></tr>`).join('')}</tbody></table>`)}},
 gtFn:{init(){const d=gDef();G.fnP=Math.round(d.pE/5000)*5000;G.fnA=10;G.fnR=6;G.fnL=72;G.fnS=10;
  return gRng('fnP','Aanschafprijs excl. btw',20000,700000,5000,x=>eur(x))+gRng('fnA','Eigen inbreng',0,50,5,x=>x+'%')+gRng('fnR','Rente',0,12,.1,x=>nf(x,1)+'%')+gRng('fnL','Looptijd',24,120,12,x=>x+' maanden')+gRng('fnS','Slottermijn',0,40,5,x=>x+'%')+'<div class="gout"></div>'},
  paint(el){
   const P=G.fnP,L=P*(1-G.fnA/100),S=P*G.fnS/100,n=G.fnL,r=G.fnR/1200,pm=r?(L-S/Math.pow(1+r,n))*r/(1-Math.pow(1+r,-n)):(L-S)/n,int=pm*n+S-L;
   setH(el.querySelector('.gout'),`<div class="gres"><b>${eur(pm)}</b><span>per maand</span></div><p class="gwh">Over ${n/12} jaar betaal je ${eur(int)} rente${S?`, en aan het eind ${eur(S)} slottermijn`:''}. Exclusief btw, onderhoud en verzekering.</p>`)}},
 gtAc:{init(){const d=gDef();G.acA=Math.round(d.acc);G.acK=d.km;G.acL=d.le;G.acJ=d.jr;G.acM='m';
  return gRng('acK','Kilometers per jaar',5000,250000,5000,x=>nf(x)+' km')+gRng('acA','Bruikbare accu',30,900,5,x=>nf(x)+' kWh')+gRng('acJ','Leeftijd',1,12,1,x=>x+' jaar')+gSeg('acM','Laden',[['r','Vooral rustig'],['m','Gemengd'],['s','Veel snelladen']])+'<div class="gout"></div>'},
  paint(el){
   const m={r:.85,m:1,s:1.3}[G.acM],cyc=G.acK*G.acL/100/G.acA,s=y=>Math.max(.6,1-y*(.015+Math.min(400,cyc)*.00004*m)),R0=G.acA/G.acL*100,sj=s(G.acJ);
   const W=innerWidth<640?360:600,H=innerWidth<640?190:170,x=y=>34+y/12*(W-44),yy=f=>12+(1-f)/.4*(H-36);
   const pts=Array.from({length:13},(_,i)=>`${x(i).toFixed(1)},${yy(s(i)).toFixed(1)}`).join(' ');
   setH(el.querySelector('.gout'),`<div class="gres"><b>${nf(sj*100)}%</b><span>capaciteit na ${G.acJ} jaar · actieradius ± ${nf(R0*sj)} km in plaats van ${nf(R0)} km</span></div>
    <svg class="gch" viewBox="0 0 ${W} ${H}" aria-hidden="true">${[1,.9,.8,.7,.6].map(f=>`<line x1="34" x2="${W-10}" y1="${yy(f)}" y2="${yy(f)}" class="${f===.7?'gw7':''}"/><text x="28" y="${yy(f)+4}" text-anchor="end">${f*100}%</text>`).join('')}${[0,2,4,6,8,10,12].map(i=>`<text x="${x(i)}" y="${H-4}" text-anchor="middle">${i}</text>`).join('')}<text x="42" y="${yy(.7)-6}" class="gw7t">veelgebruikte garantiegrens</text><polyline points="${pts}"/><circle cx="${x(G.acJ)}" cy="${yy(sj)}" r="5"/></svg>
    <p class="gwh">Ongeveer ${nf(cyc)} volledige laadbeurten per jaar. Een indicatie: chemie, temperatuur en software maken veel verschil.</p>`)}},
 gtRb:{init(){const m=modelActive(),i=gPl(),kg=m&&m.gvw||i&&i.mass||{bakwagen:16000,trekker:20000}[vtype]||4250;G.rbF='e';G.rbM=Math.min(20000,Math.max(2000,Math.round(kg/250)*250));G.rbH=vtype==='trekker'?'j':'n';
  return gSeg('rbF','Aandrijving',[['e','Elektrisch'],['d','Diesel']])+gRng('rbM','Toegestane maximummassa',2000,20000,250,x=>nf(x)+' kg')+gSeg('rbH','Aanhanger',[['n','Nee'],['j','Ja']])+'<div class="gout"></div>'},
  paint(el){
   const e=G.rbF==='e',m=G.rbM,h=G.rbH==='j';let lic,why;
   if(m<=3500){lic=h?'B of BE':'B';why=h?'Met een zware aanhanger heb je BE nodig.':'Een gewoon rijbewijs is genoeg.'}
   else if(m<=4250&&e&&!h){lic='B';why='Een elektrische bestelauto tot 4.250 kg mag je met rijbewijs B rijden als je dat minstens twee jaar hebt. Het voertuig blijft een vrachtauto (N2): een snelheidsbegrenzer is verplicht en verboden voor vrachtauto\'s gelden ook voor jou. Check de voorwaarden bij het CBR.'}
   else if(m<=7500){lic=h?'C1E':'C1';why=(e&&m<=4250&&h?'Met een aanhanger geldt de uitzondering voor B niet. ':'')+'Rijd je beroepsmatig, dan heb je ook code 95 nodig.'}
   else{lic=h?'CE':'C';why='Rijd je beroepsmatig, dan heb je ook code 95 nodig.'}
   const tach=m<=3500?'Geen tachograaf nodig.':e&&m<=7500?'Geen tachograaf nodig zolang je binnen 100 km van je vestiging blijft. Houd je werktijden wel bij.':'Een tachograaf is verplicht.';
   setH(el.querySelector('.gout'),`<div class="gres"><b>Rijbewijs ${lic}</b></div><p class="gwh">${why}</p><p class="gwh">${tach}</p>`)}}
};
function gSet(k){const el=document.querySelector(`[data-gr="${k}"]`);if(!el)return;el.value=G[k];gFill(el)}
const gSig=()=>{const i=gPl();return JSON.stringify([gDef(),i&&i.k,$('cls').value,v('gr'),v('kmH'),v('tD'),v('tE'),$('calcModel').value])};
function gTool(id){const el=$(id),t=GT[id];if(!el||!t)return;const sg=id==='gtMap'||id==='gtZm'?'1':gSig();if(el.dataset.on!==sg){el.dataset.on=sg;el.innerHTML=t.init();el.querySelectorAll('[data-gr]').forEach(gFill);el.querySelectorAll('[data-plate]').forEach(f=>{const i=PL[f.dataset.plate];if(i&&i.k)f.elements.kt.value=plFmt(i.k);plPaint()})}t.paint(el)}
function gStPaint(){const d=gDone();setH($('gSt'),GSTEPS.map((s,i)=>`<li class="${d.has(i)?'done':''}"><button type="button" class="gck" data-gst="${i}" aria-pressed="${d.has(i)}" aria-label="${s[0]}: ${d.has(i)?'gedaan':'nog doen'}"></button><div><b>${s[0]}</b><p>${s[1]}</p><a href="${s[2]}">${s[3]}</a></div></li>`).join(''));gHub()}
function gHub(){const el=$('gTl');if(!el)return;const n=gDone().size;setH(el,GIDS.map(([k,t],i)=>`<li><a href="/overstapgids/${k}/"${i?'':' class="gsp"'}><small>${String(i+1).padStart(2,'0')}</small><b>${t}</b>${i?'':`<span>${n?`${n} van ${GSTEPS.length} gedaan`:`${GSTEPS.length} stappen`}</span>`}</a></li>`).join(''))}
function gShow(k){
 if(!GIDS.some(g=>g[0]===k))k='stappenplan';gid=k;
 document.querySelectorAll('.ga').forEach(a=>a.hidden=a.dataset.g!==k);
 const i=GIDS.findIndex(g=>g[0]===k),nx=GIDS[i+1],pv=GIDS[i-1];
 setH($('gRl'),GIDS.map(([g,t])=>`<a href="/overstapgids/${g}/"${g===k?' aria-current="page"':''}>${t}</a>`).join(''));
 setH($('gNx'),`${pv?`<a class="pv" href="/overstapgids/${pv[0]}/"><small>Vorige</small>${pv[1]}</a>`:'<span></span>'}${nx?`<a class="nx" href="/overstapgids/${nx[0]}/"><small>Volgende</small>${nx[1]}</a>`:''}`);
 if(k==='stappenplan')gStPaint();
 document.querySelectorAll(`.ga[data-g="${k}"] .gtool[id]`).forEach(t=>gTool(t.id));
 if(k==='heffing')gTool('gtHf');
 return GIDS[i][1];
}
document.addEventListener('click',e=>{
 const t=e.target;if(!t.closest)return;let x;
 if(x=t.closest('[data-gs]')){const k=x.dataset.gs,raw=x.dataset.v;G[k]=isNaN(+raw)?raw:+raw;x.parentNode.querySelectorAll('[data-gs]').forEach(b=>b.setAttribute('aria-pressed',b===x));const tl=x.closest('.gtool'),T=GT[tl.id];if(T.seg)T.seg(k);T.paint(tl);return}
 if(x=t.closest('[data-gst]')){const d=gDone(),i=+x.dataset.gst;d.has(i)?d.delete(i):d.add(i);try{localStorage.setItem(GKEY,JSON.stringify([...d]))}catch(err){}gStPaint();return}
 if(x=t.closest('[data-zc],[data-zsel]')){const i=+(x.dataset.zc??x.dataset.zsel);zeSel=i<0||i===zeSel?null:i;GT.gtZm.paint($('gtZm'));return}
 if(x=t.closest('[data-pv]')){nlSel=nlSel===x.dataset.pv?null:x.dataset.pv;nlPlace='';$('gDot').setAttribute('hidden','');nlPaint()}
});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('[data-pv],[data-zc]')){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}))}});
document.addEventListener('input',e=>{const x=e.target;if(!x.dataset||!x.dataset.gr)return;G[x.dataset.gr]=+x.value;gFill(x);const tl=x.closest('.gtool'),T=GT[tl.id];if(T.input)T.input(x.dataset.gr);T.paint(tl)});
document.addEventListener('submit',e=>{if(e.target.id!=='gPc')return;e.preventDefault();const q=e.target.elements.q.value.trim();if(q)nlFind(q)});
gHub();

document.querySelectorAll('.faq section>h2').forEach(h=>{const n=h.parentNode.querySelectorAll('details').length;h.insertAdjacentHTML('beforeend',` <small>${n} ${n===1?'vraag':'vragen'}</small>`);h.tabIndex=0;h.setAttribute('role','button');h.setAttribute('aria-expanded','false')});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('.faq section>h2')){e.preventDefault();e.target.click()}});
build();applyType('trekker');
if(fromURL())store('sod-used','1');else load();setUsed(!isFresh());route(true);
syncSupabase().then(syncExtra);
[['D','plk'],['E','plkE']].forEach(([k,id])=>{const n=plNorm($(id).value);if(!n)return;document.querySelectorAll(`[data-plate="${k}"]`).forEach(f=>f.elements.kt.value=plFmt(n));plLookup(k,n,false)});
// Nieuws: op de telefoon klapt een lang bericht pas open als je op de kop tikt.
document.addEventListener('click',e=>{const b=e.target.closest('.tlb');if(!b)return;const a=b.closest('.tli'),o=!a.classList.contains('open');a.classList.toggle('open',o);b.setAttribute('aria-expanded',o)});