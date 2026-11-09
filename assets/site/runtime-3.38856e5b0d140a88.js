/* ===== Metingen koppelen aan de calculator, modellen en pagina's ===== */
(()=>{
 const wrap=(name,before,after)=>{const o=window[name];if(typeof o!=='function')return;window[name]=function(...a){if(before)before(...a);const r=o.apply(this,a);if(after)after(...a);return r}};
 /* Paginaweergaven, tijd op de pagina (zichtbaar) en hoe ver er is gescrold */
 let perfPage=null,cur=null,curPath=null,curHash='',curTitle='',vis=0,since=performance.now(),depth=0,scrollMarks=new Set();
 const engaged=()=>Math.round((vis+(document.hidden?0:performance.now()-since))/1000);
 const scrolled=()=>{const h=document.documentElement.scrollHeight-innerHeight;depth=Math.max(depth,h>0?Math.min(100,Math.round(scrollY/h*100)):100);if(statOK()&&h>0)for(const percent of [25,50,75,90])if(depth>=percent&&!scrollMarks.has(percent)){scrollMarks.add(percent);track('scroll_depth',{percent})}};
 function leave(){if(cur)track('page_leave',{p:cur,hash:curHash,sec:engaged(),depth},cur,{path:curPath,title:curTitle})}
 function view(){const path=location.pathname;if(page===cur&&path===curPath)return;leave();cur=page;if(perfPage===null)perfPage=page;curPath=path;curHash=routeKey().slice(0,40);curTitle=document.title;vis=0;since=performance.now();depth=0;scrollMarks=new Set();track('page_view',{p:page,hash:routeKey().slice(0,40),taal:document.documentElement.lang||'nl'});scrolled()}
 wrap('route',null,view);view();
 addEventListener('scroll',()=>{if(!scrolled.t)scrolled.t=setTimeout(()=>{scrolled.t=0;scrolled()},400)},{passive:true});
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){perf();vis+=performance.now()-since;leave();vis=0;depth=0;leaveFlush()}else since=performance.now();
 });
 addEventListener('pagehide',leaveFlush);

 /* Invulvenster: stappen, afronden en afhaken */
 wrap('openWz',k=>track('wizard_open',{step:k||'use'}));
 wrap('go',null,k=>track('wizard_step',{step:wzStep,n:steps().findIndex(s=>s[0]===wzStep)+1}));
 wrap('closeWz',show=>{
  if(!show){track('wizard_close',{step:wzStep,seen:seen.size});return}
  const r=calcX(),d=r.td-r.te,m=modelActive();
  track('wizard_complete',{vt:vtype,km:r.km,jr:r.L,diff_year:Math.round(d),pct:Math.round(d/r.td*1000)/10,cheaper:d>=0?'e':'d',
   model:m?m.id:null,reg:reg(),opts:optSteps().filter(s=>optOn(s[0])).map(s=>s[0]).join(','),seen:seen.size,inputs:(({plk,plkE,...o})=>o)(stateObj())});
 });
 wrap('modelApply',id=>track('model_apply',{id,from:page}));
 wrap('reset',()=>track('reset',{vt:vtype}));

 /* Kliks */
 const ctaName=el=>el.closest('.bcta')?'board':el.id==='fcta'?'float':el.id==='wzOpen'?'sum_edit':el.closest('#sum')?'sum_row':el.closest('.rh')?'cost_row':el.closest('.toast')?'toast':el.closest('[data-add]')?'add':el.id||el.className.split(' ')[0]||'other';
 document.addEventListener('click',e=>{
  const t=e.target;if(!t.closest)return;let x;
  if(x=t.closest('[data-step],[data-add],[data-xgo]'))return track('cta_click',{cta:ctaName(x),step:x.dataset.step||x.dataset.add||(x.hasAttribute('data-xgo')?'uitgebreid':''),text:(x.textContent||'').trim().slice(0,60)});
  if(x=t.closest('[data-vt]')){if(x.dataset.vt!==vtype)track('vehicle_select',{vt:x.dataset.vt,from:vtype});return}
  if(x=t.closest('[data-u]'))return track('unit',{u:x.dataset.u});
  if(t.closest('[data-share]'))return track('share',{vt:vtype});
  if(t.closest('[data-print]'))return track('print',{vt:vtype});
  if(x=t.closest('.qi'))return track('tip_open',{tip:x.dataset.tip});
  if(x=t.closest('[data-mrow]')){if(!mOpen.has(x.dataset.mrow))track('model_open',{id:x.dataset.mrow});return}
  if(x=t.closest('[data-mvar]'))return track('model_variant',{id:x.dataset.mvid});
  if(x=t.closest('[data-mcat]'))return track('model_filter',{cat:x.dataset.mcat});
  if(t.closest('#mpB'))return track('model_picker',{});
  if(t.closest('#mGo')){track('model_compare',{ids:mSel.join(',')});mSel.forEach(id=>track('model_compare_item',{id}));return}
  if(x=t.closest('[data-jump]'))return track('faq_jump',{to:x.dataset.jump});
  if(x=t.closest('[data-nav],.foot nav a'))return track('nav',{to:x.getAttribute('href'),where:x.closest('.foot')?'foot':'top'});
  if((x=t.closest('a[href^="http"]'))&&x.host!==location.host)return track('outbound',{host:x.host,url:x.href.slice(0,200),p:page});
 },true);
 document.addEventListener('toggle',e=>{const d=e.target;if(d.tagName==='DETAILS'&&d.open){const s=d.querySelector('summary');track('details_open',{q:(s?s.textContent:'').trim().slice(0,100),p:page})}},true);
 document.addEventListener('change',e=>{const t=e.target;if(t.id==='mSort'||t.id==='mSoon')track('model_filter',{sort:$('mSort').value,soon:$('mSoon').checked})});
 let qT=0;document.addEventListener('input',e=>{if(e.target.id!=='mSearch')return;clearTimeout(qT);qT=setTimeout(()=>{const q=e.target.value.trim();if(q.length>1)track('model_search',{q:q.slice(0,60),n:document.querySelectorAll('#mList .mc').length})},1200)});

 /* Laadsnelheid (Core Web Vitals), één keer per geladen pagina */
 /* Alleen meten zolang de pagina zichtbaar is: een tab die op de achtergrond laadt (nieuw tabblad, link uit e-mail) schildert pas als je hem opent,
    dan telt de wachttijd anders mee als laadtijd. Bij vooraf laden (prerender) telt de tijd vanaf het openen. */
 const PF={v:2};let perfSent=false,hid=document.visibilityState==='hidden'?0:Infinity;
 const act=(()=>{try{return performance.getEntriesByType('navigation')[0].activationStart||0}catch(e){return 0}})(),rel=t=>Math.max(0,Math.round(t-act));
 try{for(const x of performance.getEntriesByType('visibility-state'))if(x.name==='hidden')hid=Math.min(hid,x.startTime)}catch(e){}
 addEventListener('visibilitychange',()=>{if(document.hidden)hid=Math.min(hid,performance.now())},true);
 if(hid===0)PF.bg=1;
 try{
  new PerformanceObserver(l=>{for(const x of l.getEntries())if(x.startTime<hid)PF.lcp=rel(x.startTime)}).observe({type:'largest-contentful-paint',buffered:true});
  let cls=0;new PerformanceObserver(l=>{for(const x of l.getEntries())if(!x.hadRecentInput)cls+=x.value;PF.cls=Math.round(cls*1000)/1000}).observe({type:'layout-shift',buffered:true});
  new PerformanceObserver(l=>{for(const x of l.getEntries())PF.inp=Math.max(PF.inp||0,Math.round(x.duration))}).observe({type:'event',buffered:true,durationThreshold:40});
 }catch(e){}
 function perf(){
  if(perfSent)return;perfSent=true;const n=performance.getEntriesByType&&performance.getEntriesByType('navigation')[0],o={p:perfPage||cur,...PF};
  if(n){o.ttfb=rel(n.responseStart);o.dcl=rel(n.domContentLoadedEventEnd);if(n.loadEventEnd)o.load=rel(n.loadEventEnd);o.nav=act?'prerender':n.type}
  track('perf',o,cur);
 }

 /* Elke klik op iets klikbaars, met plek op de pagina; drie kliks snel op dezelfde plek tellen als frustratie */
 const elNaam=el=>/^(SELECT|INPUT|TEXTAREA)$/.test(el.tagName)?(el.id||el.name||el.type):(el.getAttribute('aria-label')||el.getAttribute('title')||el.textContent||el.id||'').replace(/\s+/g,' ').trim().slice(0,50);
 let nKlik=0,rage=[];
 document.addEventListener('click',e=>{
  const t=e.target;if(!t.closest)return;
  const el=t.closest('a,button,summary,label,[role=button],[data-vt],[data-step],[data-mrow],[data-tip],input[type=checkbox],input[type=radio],input[type=range],select');
  const now=performance.now();rage=rage.filter(x=>now-x.t<1000&&Math.hypot(x.x-e.clientX,x.y-e.clientY)<40);rage.push({t:now,x:e.clientX,y:e.clientY});
  if(rage.length===3)track('rage',{p:cur,el:el?elNaam(el):t.tagName.toLowerCase()});
  if(!el||nKlik++>150)return;
  const h=document.documentElement.scrollHeight||1,href=el.tagName==='A'?(el.host===location.host?el.pathname+el.hash:el.host):undefined;
  track('klik',{p:cur,el:elNaam(el),tag:el.tagName.toLowerCase(),id:el.id||undefined,href,yp:Math.min(100,Math.round(e.pageY/h*100)),xp:Math.round(e.clientX/innerWidth*100)});
 });
 document.addEventListener('copy',()=>{let n=0;try{n=String(getSelection()).length}catch(e){}track('copy',{p:cur,len:n})});

 /* Fouten in de pagina, maximaal vijf per bezoek */
 let errs=0;addEventListener('error',e=>{if(errs++<5)track('js_error',{m:String(e.message).slice(0,200),src:String(e.filename||'').split('/').pop().slice(0,60),line:e.lineno})});
})();