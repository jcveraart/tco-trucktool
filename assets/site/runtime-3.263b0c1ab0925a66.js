/* ===== Metingen koppelen aan de calculator, modellen en pagina's ===== */
(()=>{
 const wrap=(name,before,after)=>{const o=window[name];if(typeof o!=='function')return;window[name]=function(...a){if(before)before(...a);const r=o.apply(this,a);if(after)after(...a);return r}};
 /* Paginaweergaven, tijd op de pagina (zichtbaar) en hoe ver er is gescrold */
 let cur=null,curPath=null,curTitle='',vis=0,since=performance.now(),depth=0,scrollMarks=new Set();
 const engaged=()=>Math.round((vis+(document.hidden?0:performance.now()-since))/1000);
 const scrolled=()=>{const h=document.documentElement.scrollHeight-innerHeight;depth=Math.max(depth,h>0?Math.min(100,Math.round(scrollY/h*100)):100);if(statOK()&&h>0)for(const percent of [25,50,75,90])if(depth>=percent&&!scrollMarks.has(percent)){scrollMarks.add(percent);track('scroll_depth',{percent})}};
 function leave(){if(cur)track('page_leave',{p:cur,sec:engaged(),depth},cur,{path:curPath,title:curTitle})}
 function view(){const path=location.pathname;if(page===cur&&path===curPath)return;leave();cur=page;curPath=path;curTitle=document.title;vis=0;since=performance.now();depth=0;scrollMarks=new Set();track('page_view',{p:page,hash:routeKey().slice(0,40)});scrolled()}
 wrap('route',null,view);view();
 addEventListener('scroll',()=>{if(!scrolled.t)scrolled.t=setTimeout(()=>{scrolled.t=0;scrolled()},400)},{passive:true});
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){vis+=performance.now()-since;leave();vis=0;depth=0;leaveFlush()}else since=performance.now();
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

 /* Fouten in de pagina, maximaal vijf per bezoek */
 let errs=0;addEventListener('error',e=>{if(errs++<5)track('js_error',{m:String(e.message).slice(0,200),src:String(e.filename||'').split('/').pop().slice(0,60),line:e.lineno})});
})();