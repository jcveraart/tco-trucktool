/* ===== Toestemming, metingen en A/B-tests =====
   Events gaan naar de eigen tabel web_events in Supabase (zie docs/analytics.md).
   Zonder toestemming: geen ID's en geen opslag, alleen een anonieme paginaweergave en de gemaakte keuze. */
const GA_ID='G-SH3XRBV17P';/* Eigen GA4-webstream; alleen op het productiedomein en na statistiektoestemming. */
/* A/B-tests: id: {v: varianten, on: actief}. Variant 'a' is het origineel; zonder toestemming zie je altijd 'a'.
   Gebruik ab('id') in de code of [data-ab-id="b"] in CSS. Resultaten: view analytics.ab_resultaten. */
const EXPERIMENTS={
 /* 'cta-tekst':{v:['a','b'],on:false}, */
};
const CK_VER=2,CK_KEY='sod-consent';
let consent=window.SOD_CONSENT||null,vid=null,sid=null,pend=[],evq=[],evT=0,expo=new Set(),gaOn=false;
const store=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){}return null};
const uuid=()=>crypto.randomUUID?crypto.randomUUID():'10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));
const statOK=()=>!!(consent&&consent.stat);
/* GA ontvangt alleen gecontroleerde events, nooit invoervelden, kentekens, ruwe IP's of de query van een deellink. */
const GA_CONTEXT=new WeakMap(),GA_EVENTS={
 page_view:'page_view',page_leave:'page_leave',scroll_depth:'scroll_depth',
 wizard_open:'calculator_start',wizard_step:'calculator_step',wizard_complete:'calculator_complete',wizard_close:'calculator_abandon',
 cta_click:'cta_click',vehicle_select:'vehicle_select',model_open:'model_open',model_variant:'model_variant',model_apply:'model_apply',model_compare:'model_compare',model_compare_item:'model_compare_item',model_filter:'model_filter',model_search:'model_search',model_picker:'model_picker',
 nav:'navigation_click',outbound:'outbound_click',details_open:'details_open',faq_jump:'guide_navigation',tip_open:'help_open',share:'share',print:'print',reset:'calculator_reset',unit:'unit_change',
 scenario_save:'scenario_save',scenario_swap:'scenario_swap',quote_open:'quote_open',fleet_cta_click:'fleet_interest',
 fleet_request_sent:'generate_lead',quote_sent:'generate_lead',pdf_email:'generate_lead',plate_lookup:'vehicle_lookup',embed_copy:'embed_copy',js_error:'site_error',logo_toggle:'logo_toggle'
};
const gaProduction=()=>/^(www\.)?stekkerofdiesel\.nl$/.test(location.hostname);
const gaToken=x=>typeof x==='string'&&/^[a-z0-9][a-z0-9_-]{0,99}$/i.test(x)?x:undefined;
const gaCampaign=x=>typeof x==='string'&&/^[a-z][a-z0-9._ -]{0,79}$/i.test(x)&&!/[0-9]{7}/.test(x)?x:undefined;
function gaPage(context={}){let u;try{u=new URL(context.path||location.href,location.href)}catch(e){return{}}return{page_location:u.origin+u.pathname,page_title:String(context.title||document.title||'Stekker of Diesel').slice(0,200),page_referrer:LAND.ref?'https://'+LAND.ref+'/':'',site_language:document.documentElement.lang==='en'?'en':'nl'}}
function gaEvent(e){
 if(!gaOn||!statOK()||window['ga-disable-'+GA_ID]||!GA_EVENTS[e.event])return;
 const p=e.props||{},g={send_to:GA_ID,...gaPage(GA_CONTEXT.get(e)),page_group:gaToken(e.page)||'other'};
 const token=(key,value)=>{const t=gaToken(value);if(t!==undefined)g[key]=t},num=(key,value,min,max)=>{if(typeof value==='number'&&Number.isFinite(value))g[key]=Math.max(min,Math.min(max,value))};
 token('vehicle_type',p.vt);token('calc_step',p.step);token('model_id',p.id||p.model);token('cta_location',p.cta);token('category',p.cat);token('sort_order',p.sort);token('help_topic',p.tip);token('guide_section',p.to);
 if(e.event==='model_search')num('result_count',p.n,0,1000);
 if(e.event==='model_compare')num('model_count',typeof p.ids==='string'?p.ids.split(',').length:0,0,3);
 if(e.event==='wizard_complete'){token('cheaper_powertrain',p.cheaper);num('steps_seen',p.seen,0,20);num('ownership_years',p.jr,1,20)}
 if(e.event==='wizard_close')num('steps_seen',p.seen,0,20);
 if(e.event==='page_leave'){num('visible_seconds',p.sec,0,86400);num('scroll_percent',p.depth,0,100);num('engagement_time_msec',typeof p.sec==='number'?p.sec*1000:undefined,0,86400000)}
 if(e.event==='scroll_depth')num('scroll_percent',p.percent,0,100);
 if(e.event==='outbound'&&typeof p.host==='string'&&/^[a-z0-9.-]+$/i.test(p.host))g.link_domain=p.host.slice(0,100);
 if(e.event==='nav'){try{const u=new URL(p.to,location.href);if(u.origin===location.origin)g.destination_path=u.pathname}catch(err){}}
 if(e.event==='plate_lookup'){token('vehicle_type',p.vt);token('powertrain',p.kind);num('vehicle_year',p.year,1950,2100)}
 if(e.event==='js_error')num('error_line',p.line,0,100000);
 if(GA_EVENTS[e.event]==='generate_lead')g.lead_type={fleet_request_sent:'fleet_analysis',quote_sent:'model_quote',pdf_email:'calculation_pdf'}[e.event];
 if(e.event==='page_view')gtag('config',GA_ID,{...gaPage(GA_CONTEXT.get(e)),update:true,send_page_view:false});
 gtag('event',GA_EVENTS[e.event],g);
}
const LAND=(()=>{const q=new URLSearchParams(location.search),o={};['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(k=>{const x=q.get(k);if(x)o[k]=x.slice(0,80)});
 let r='';try{const u=new URL(document.referrer);if(u.host!==location.host)r=u.host}catch(e){}o.ref=r;o.land=(location.hash.slice(1)||location.pathname.replace(/^\/|\/$/g,'').replace(/^overstapgids(\/|$)/,(m,x)=>x?'gids/':'faq')).slice(0,40)||'calc';
 o.mobile=matchMedia('(pointer:coarse)').matches;o.vw=innerWidth;o.lang=(navigator.language||'').slice(0,10);return o})();
const fnv=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
function ab(id){
 const x=EXPERIMENTS[id];if(!x||!x.on||!statOK()||!vid)return'a';
 const v=x.v[fnv(vid+':'+id)%x.v.length];
 if(!expo.has(id)){expo.add(id);track('ab_exposure',{exp:id,var:v})}
 return v;
}
function abAll(){const o={};if(statOK()&&vid)Object.keys(EXPERIMENTS).forEach(id=>{const x=EXPERIMENTS[id];if(x.on)o[id]=x.v[fnv(vid+':'+id)%x.v.length]});return o}
function abMark(){const o=abAll();Object.keys(EXPERIMENTS).forEach(id=>{if(o[id])document.documentElement.setAttribute('data-ab-'+id,o[id]);else document.documentElement.removeAttribute('data-ab-'+id)})}
/* Een sessie loopt door zolang er binnen 30 minuten iets gebeurt, ook over tabbladen heen */
function session(){
 const now=Date.now();let s=null;try{s=JSON.parse(store('sod-sid')||'null')}catch(e){}
 const fresh=!s||!(now-s.t<18e5);if(fresh)s={id:uuid(),n:0};s.t=now;if(fresh)s.n=(+store('sod-n')||0)+1;
 store('sod-sid',JSON.stringify(s));if(fresh)store('sod-n',String(s.n));sid=s.id;return fresh?s.n:0;
}
function track(ev,props={},pg,context){
 const e={client_ts:new Date().toISOString(),event:ev,page:pg||(typeof page==='string'?page:null),props};
 GA_CONTEXT.set(e,context||{path:location.href,title:document.title});
 if(!consent){pend.push(e);return}
 send(e);
}
function send(e,anon){
 if(!anon&&statOK()){
  if(!vid)vid=store('sod-vid');if(!vid){vid=uuid();store('sod-vid',vid)}
  const n=session();
  if(n)evq.push({client_ts:e.client_ts,event:'session_start',page:e.page,consent:'stat',visitor_id:vid,session_id:sid,props:Object.assign({n},LAND),experiments:abAll()});
  evq.push(Object.assign(e,{consent:'stat',visitor_id:vid,session_id:sid,experiments:abAll()}));
  gaEvent(e);
 }else{
  if(e.event!=='page_view'&&e.event!=='consent')return;
  const p=e.event==='page_view'?{ref:LAND.ref,mobile:LAND.mobile,utm_source:LAND.utm_source}:e.props;
  evq.push(Object.assign(e,{props:p,consent:'anon',visitor_id:null,session_id:null,experiments:{}}));
 }
 clearTimeout(evT);if(evq.length>=20)flush();else evT=setTimeout(flush,3000);
}
function flush(){
 clearTimeout(evT);if(!evq.length||typeof SB_URL==='undefined')return;
 const rows=evq.splice(0,40);
 try{fetch(SB_URL+'/rest/v1/web_events?columns=client_ts,event,page,consent,visitor_id,session_id,props,experiments',{method:'POST',keepalive:true,
  headers:{apikey:SB_KEY,Authorization:'Bearer '+SB_KEY,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(rows)}).catch(()=>{})}catch(e){}
 if(evq.length)flush();
}
function loadGA(){
 if(!GA_ID||!statOK()||!gaProduction())return;window['ga-disable-'+GA_ID]=false;if(gaOn)return;gaOn=true;
 const s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+GA_ID;s.onerror=()=>{gaOn=false};document.head.appendChild(s);
 const config={...gaPage(),send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,cookie_expires:31536000,cookie_flags:'SameSite=Lax;Secure'};
 for(const [key,param]of [['utm_source','campaign_source'],['utm_medium','campaign_medium'],['utm_campaign','campaign_name'],['utm_content','campaign_content']]){const v=gaCampaign(LAND[key]);if(v)config[param]=v}
 gtag('js',new Date());gtag('config',GA_ID,config);
}
function dropIds(){
 if(GA_ID)window['ga-disable-'+GA_ID]=true;
 ['sod-vid','sod-sid','sod-n'].forEach(k=>store(k,null));vid=sid=null;
 document.cookie.split(';').map(c=>c.split('=')[0].trim()).filter(n=>/^_ga/.test(n)).forEach(n=>{[location.hostname,'.'+location.hostname.replace(/^www\./,'')].forEach(d=>{document.cookie=`${n}=; Max-Age=0; path=/; domain=${d}`})});
}
/* via: 'banner', 'settings' of 'tcf' (de toestemmingsmelding van Google, als die in AdSense aan staat) */
function setConsent(c,via){
 const previouslyAllowed=statOK(),queuedView=pend.some(e=>e.event==='page_view');
 const changed=!consent||consent.stat!==!!c.stat||consent.ads!==!!c.ads;
 consent={v:CK_VER,stat:!!c.stat,ads:!!c.ads,t:Date.now()};
 if(GA_ID)window['ga-disable-'+GA_ID]=!consent.stat;
 if(via!=='tcf'&&via!=='load'){
  store(CK_KEY,JSON.stringify(consent));
  const g=b=>b?'granted':'denied';
  gtag('consent','update',{ad_storage:g(consent.ads),ad_user_data:g(consent.ads),ad_personalization:g(consent.ads),analytics_storage:g(consent.stat)});
 }
 const a=window.adsbygoogle=window.adsbygoogle||[];a.requestNonPersonalizedAds=consent.ads?0:1;a.pauseAdRequests=0;
 if(consent.stat){vid=store('sod-vid')||vid;loadGA()}else dropIds();
 abMark();
 if(changed&&via!=='load')track('consent',{stat:consent.stat,ads:consent.ads,via});
 pend.splice(0).forEach(e=>send(e));
 if(consent.stat&&!previouslyAllowed&&!queuedView&&via!=='load'&&typeof page==='string')track('page_view',{p:page});
 if(changed&&typeof render==='function'&&typeof page==='string')render();
}
/* Melding */
const ckEl=document.getElementById('ck');
function ckHide(){if(ckEl.open)ckEl.close();ckEl.hidden=true}
ckEl.addEventListener('cancel',e=>{if(!consent)e.preventDefault();else ckHide()});
function ckShow(settings){
 if(window.__sodTcf&&window.googlefc&&googlefc.showRevocationMessage){googlefc.showRevocationMessage();return}
 document.getElementById('ckS').checked=statOK();document.getElementById('ckA').checked=!!(consent&&consent.ads);
 document.getElementById('ckO').hidden=!settings;document.getElementById('ckSet').textContent=document.documentElement.lang==='en'?(settings?'Save choices':'Settings'):(settings?'Bewaar keuze':'Instellingen');
 ckEl.hidden=false;if(!ckEl.open)ckEl.showModal();document.getElementById(settings?'ckS':'ckK').focus();
}
document.addEventListener('click',e=>{
 if(e.target.closest('[data-ck-privacy]')){ckHide();return}
 if(e.target.closest('[data-cookies]')){ckShow(true);return}
 const b=e.target.closest('[data-ck]');if(!b)return;const k=b.dataset.ck,o=document.getElementById('ckO');
 if(k==='set'&&o.hidden){ckShow(true);return}
 if(k==='set')setConsent({stat:document.getElementById('ckS').checked,ads:document.getElementById('ckA').checked},'settings');
 else setConsent({stat:k==='yes',ads:k==='yes'},'banner');
 ckHide();
});
/* Staat de melding van Google (TCF) aan, dan volgt de site die keuze en blijft de eigen melding weg */
function tcfWatch(){
 if(typeof window.__tcfapi!=='function')return false;if(window.__sodTcf)return true;window.__sodTcf=true;ckHide();
 __tcfapi('addEventListener',2,(d,ok)=>{
  if(!ok||!d||(d.eventStatus!=='tcloaded'&&d.eventStatus!=='useractioncomplete'))return;
  if(d.gdprApplies===false){setConsent({stat:true,ads:true},'tcf');return}
  const p=(d.purpose&&d.purpose.consents)||{};setConsent({stat:!!(p[1]&&p[8]),ads:!!(p[1]&&p[3]&&p[4])},'tcf');
 });
 return true;
}
if(consent)setConsent(consent,'load');
else{dropIds();if(!tcfWatch())ckShow(false)}
addEventListener('load',()=>tcfWatch());
/* Wie de pagina verlaat zonder te kiezen, telt alleen mee als anonieme paginaweergave */
function leaveFlush(){if(!consent)pend.splice(0).forEach(e=>send(e,true));flush()}