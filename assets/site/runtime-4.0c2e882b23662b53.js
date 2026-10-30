/* ===== Elke berekening opslaan (tabel calc_runs in Supabase, zie docs/analytics.md) =====
   Na het invulvenster en na elke aanpassing (als het 4 seconden stil is) gaan alle invoer, het voertuig en de uitkomst naar Supabase.
   Zonder toestemming voor statistieken zonder bezoekers- en sessie-ID. Het kenteken zelf (plk, plkE) gaat nooit mee, alleen de RDW-gegevens. */
(()=>{
 const reeks=uuid(),PLK=['plk','plkE'];let nr=0,last='',tmr=0;
 const rnd=(x,d=0)=>typeof x==='number'&&isFinite(x)?Math.round(x*10**d)/10**d:x;
 const cats=o=>Object.fromEntries(Object.entries(o).filter(e=>typeof e[1]==='number').map(([k,x])=>[k,rnd(x)]));
 function invoer(){
  const o={};document.querySelectorAll(':is(#calc,#wz) input[id],:is(#calc,#wz) select[id]').forEach(e=>{
   if(e.classList.contains('slin')||e.name==='kt'||PLK.includes(e.id))return;
   o[e.id]=e.type==='checkbox'?e.checked:(e.type==='range'||e.type==='number')&&e.value!==''?+e.value:e.value;
  });return o;
 }
 const kt=i=>i&&!i.err?{vt:i.vt,eu:i.eu,merk:i.merk,model:i.model,jaar:i.first?i.first.getFullYear():null,massa:i.mass,combinatie:i.combo,euro:i.euro,elektrisch:i.el,verbruik:i.lpk,catalogusprijs:i.cat}:null;
 function snap(trigger){
  const r=calcX(),pb=payback(r),m=modelActive(),bd=band(),kb=kmBreak(),d=r.td-r.te;
  return{
   client_ts:new Date().toISOString(),consent:statOK()?'stat':'anon',visitor_id:statOK()?vid:null,session_id:statOK()?sid:null,
   reeks,nr:++nr,trigger,modus:page==='uitgebreid'?'uitgebreid':'simpel',vt:vtype,model_id:m?m.id:null,km:rnd(r.km),jaren:rnd(r.L),
   goedkoper:Math.abs(d)/r.td<.005?'gelijk':d>0?'e':'d',verschil_jaar:rnd(d),
   invoer:invoer(),gewijzigd:Object.keys(stateObj()).filter(k=>!PLK.includes(k)),
   voertuig:{soort:T().w,model:m?mName(m):null,diesel:$('dw').value==='h'?'huidig':'nieuw',elektrisch:$('nw').value==='n'?'nieuw':'gebruikt',
    lease:{diesel:lsOn('D')?(lqOn('D')?'offerte':'schatting'):null,elektrisch:lsOn('E')?(lqOn('E')?'offerte':'schatting'):null,diesel_maand:lsOn('D')?rnd(lpNow('D')):null,elektrisch_maand:lsOn('E')?rnd(lpNow('E')):null},
    kenteken_diesel:kt(PL.D),kenteken_elektrisch:kt(PL.E),tol:[...tolSel],bandbreedte:Object.fromEntries(Object.entries(SR).map(([k,x])=>[k,x.map(y=>rnd(y,2))]))},
   uitkomst:{diesel_jaar:rnd(r.td),elektrisch_jaar:rnd(r.te),diesel_km:rnd(r.td/r.km,3),elektrisch_km:rnd(r.te/r.km,3),pct:rnd(d/r.td*100,1),
    diesel:cats(r.D),elektrisch:cats(r.E),terugverdien_jaar:pb.be===null?null:rnd(pb.be,2),meerprijs:rnd(pb.gap),besparing_gebruik_jaar:rnd(pb.sv),
    goedkoper_vanaf_km:kb===null?null:rnd(kb),bandbreedte_jaar:bd?bd.map(y=>rnd(y)):null,co2_ton:rnd(r.co2d-r.co2e,1)},
   bron:{ref:LAND.ref,utm_source:LAND.utm_source||null,mobile:LAND.mobile,vw:LAND.vw}
  };
 }
 function save(trigger){
  clearTimeout(tmr);tmr=0;
  if((page!=='calc'&&page!=='uitgebreid')||!touched||$('wz').open)return;
  let row;try{row=snap(trigger)}catch(e){return}
  const key=JSON.stringify([row.modus,row.vt,row.invoer,row.voertuig]);if(key===last)return;last=key;
  try{fetch(SB_URL+'/rest/v1/calc_runs',{method:'POST',keepalive:true,headers:{apikey:SB_KEY,Authorization:'Bearer '+SB_KEY,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(row)}).catch(()=>{})}catch(e){}
 }
 const o=window.render,c=window.closeWz;
 window.render=function(...a){const x=o.apply(this,a);clearTimeout(tmr);tmr=setTimeout(()=>save('aanpassing'),4000);return x};
 window.closeWz=function(show,...a){const x=c.call(this,show,...a);if(show)save('invulvenster');return x};
 addEventListener('pagehide',()=>{if(tmr)save('aanpassing')});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&tmr)save('aanpassing')});
})();