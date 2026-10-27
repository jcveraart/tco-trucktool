const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const script=id=>html.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)</script>'))[1];
function browser(saved,{lang='nl',oldIds=false,hostname='example.test',search=''}={}){
 const now=Date.now(),storage=new Map(),elements={},listeners={},network=[],timers=new Map();let nextTimer=0,nextId=0;
 if(saved!==undefined)storage.set('sod-consent',typeof saved==='string'?saved:JSON.stringify(saved));
 if(oldIds)for(const k of ['sod-vid','sod-sid','sod-n'])storage.set(k,'old');
 for(const id of ['ck','ckK','ckText','ckO','ckS','ckA','ckSet'])elements[id]={hidden:true,open:false,checked:false,handlers:{},focus(){this.focused=true},showModal(){this.open=true},close(){this.open=false},addEventListener(k,f){this.handlers[k]=f}};
 const scripts=[];
 const c=vm.createContext({window:null,Date,URL,URLSearchParams,Map,Set,JSON,Number,Object,Array,Math,String,Boolean,Uint8Array,
  localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
  document:{documentElement:{lang,setAttribute(){},removeAttribute(){}},title:'Stekker of Diesel',referrer:'https://www.google.com/search?q=private@example.com',cookie:'',getElementById:id=>elements[id],addEventListener:(k,f)=>{listeners[k]=f},createElement:tag=>({tagName:tag}),head:{appendChild:s=>scripts.push(s)}},
  location:{search,pathname:'/',hash:'',hostname,host:hostname,origin:'https://'+hostname,href:'https://'+hostname+'/'+search},navigator:{language:lang},innerWidth:1200,
  crypto:{randomUUID:()=>`00000000-0000-4000-8000-${String(++nextId).padStart(12,'0')}`},
  matchMedia:()=>({matches:false}),addEventListener:(k,f)=>{listeners[k]=f},
  setTimeout:(f,ms)=>{const id=++nextTimer;timers.set(id,{f,ms});return id},clearTimeout:id=>timers.delete(id),
  SB_URL:'https://example.test',SB_KEY:'test-publishable-key',fetch:(url,o)=>{network.push({url,rows:JSON.parse(o.body)});return Promise.resolve({ok:true})}
 });c.window=c;vm.runInContext(script('consent-default'),c);vm.runInContext(script('meten'),c);
 const click=(key,kind='choice')=>listeners.click({target:{closest:s=>kind==='footer'&&s==='[data-cookies]'?{}:kind==='privacy'&&s==='[data-ck-privacy]'?{}:kind==='choice'&&s==='[data-ck]'?{dataset:{ck:key}}:null}});
 return{c,e:elements,storage,network,scripts,timers,now,click,state:()=>vm.runInContext('({consent,vid,sid,pend,evq})',c),commands:()=>Array.from(c.dataLayer,a=>Array.from(a))};
}
test('first visit immediately opens a modal with optional settings off and no visitor IDs',()=>{
 const b=browser(undefined,{oldIds:true});assert.equal(b.e.ck.open,true);assert.equal(b.e.ck.hidden,false);assert.equal(b.e.ckO.hidden,true);assert.equal(b.e.ckS.checked,false);assert.equal(b.e.ckA.checked,false);assert.equal(b.state().consent,null);assert.equal(b.network.length,0);
 for(const k of ['sod-vid','sod-sid','sod-n'])assert.equal(b.storage.has(k),false);
 let prevented=false;b.e.ck.handlers.cancel({preventDefault(){prevented=true}});assert.ok(prevented);assert.equal(b.state().consent,null);
});
test('rejecting optional cookies closes the dialog and persists a refusal without IDs',()=>{
 const b=browser();b.c.track('page_view');b.c.track('model_open',{id:'test'});b.click('no');assert.equal(b.e.ck.open,false);assert.deepEqual(JSON.parse(b.storage.get('sod-consent')).stat,false);assert.equal(b.state().consent.ads,false);
 b.c.flush();assert.ok(b.network.flatMap(x=>x.rows).every(r=>r.consent==='anon'&&r.visitor_id===null&&r.session_id===null));assert.ok(!b.network.flatMap(x=>x.rows).some(r=>r.event==='model_open'));assert.equal(b.storage.has('sod-vid'),false);
 const again=browser(b.storage.get('sod-consent'));assert.equal(again.e.ck.open,false);assert.equal(again.state().consent.stat,false);
});
test('accepting consent processes every pending event as consented, rather than treating callback indexes as anonymous flags',()=>{
 const b=browser();b.c.track('page_view');b.c.track('wizard_open',{step:'use'});b.c.track('model_open',{id:'test'});b.click('yes');b.c.flush();
 const rows=b.network.flatMap(x=>x.rows);for(const name of ['page_view','wizard_open','model_open']){const r=rows.find(x=>x.event===name);assert.ok(r,name);assert.equal(r.consent,'stat');assert.ok(r.visitor_id);assert.ok(r.session_id)}assert.ok(b.storage.has('sod-vid'));assert.equal(b.e.ck.open,false);
});
test('individual preferences and later withdrawal use the footer without losing the choice',()=>{
 const b=browser();b.click('set');assert.equal(b.e.ckO.hidden,false);assert.equal(b.e.ckS.checked,false);assert.equal(b.e.ckA.checked,false);b.e.ckS.checked=true;b.click('set');assert.equal(b.state().consent.stat,true);assert.equal(b.state().consent.ads,false);
 b.c.track('page_view');assert.ok(b.storage.has('sod-vid'));b.click(null,'footer');assert.equal(b.e.ck.open,true);assert.equal(b.e.ckS.checked,true);b.click('no');assert.equal(b.storage.has('sod-vid'),false);assert.equal(b.state().consent.stat,false);
});
test('expired, future-dated or malformed choices are ignored, while valid saved choices are respected',()=>{
 const now=Date.now();for(const saved of ['broken',{v:1,t:now,stat:true,ads:true},{v:2,t:now-3.16e10,stat:true,ads:true},{v:2,t:now+1e6,stat:true,ads:true},{v:2,t:now,stat:'false',ads:false},{v:2,t:now,stat:true},{v:99,t:now,stat:true,ads:true}])assert.equal(browser(saved).e.ck.open,true,JSON.stringify(saved));
 for(const stat of [true,false]){const b=browser({v:2,t:now-1000,stat,ads:false});assert.equal(b.e.ck.open,false);assert.equal(b.state().consent.stat,stat)}
});
test('English settings use English immediately, and reading privacy does not imply consent',()=>{
 const b=browser(undefined,{lang:'en'});assert.equal(b.e.ckSet.textContent,'Settings');b.click('set');assert.equal(b.e.ckSet.textContent,'Save choices');b.click(null,'privacy');assert.equal(b.e.ck.open,false);assert.equal(b.state().consent,null);assert.equal(b.storage.has('sod-consent'),false);
 const en=fs.readFileSync(path.join(root,'en/index.html'),'utf8').match(/<dialog class="ck"[\s\S]*?<\/dialog>/)[0];for(const s of ['Your privacy choices','Reject optional cookies','Accept all','Read our privacy policy','/en/privacy/'])assert.ok(en.includes(s),s);assert.doesNotMatch(en,/Jouw privacykeuze|Alleen noodzakelijk|Alles accepteren/);
});

test('GA4 loads once after statistics consent on the production host and is disabled immediately on withdrawal',()=>{
 const b=browser(undefined,{hostname:'stekkerofdiesel.nl'});assert.equal(b.scripts.length,0);b.click('set');b.e.ckS.checked=true;b.click('set');assert.equal(b.scripts.length,1);assert.match(b.scripts[0].src,/G-SH3XRBV17P$/);
 const config=b.commands().find(x=>x[0]==='config')[2];assert.equal(config.allow_google_signals,false);assert.equal(config.allow_ad_personalization_signals,false);assert.equal(config.send_page_view,false);assert.equal(config.cookie_expires,31536000);
 b.c.track('model_open',{id:'peugeot-e-partner'});const count=b.commands().filter(x=>x[0]==='event').length;assert.ok(count>0);b.click(null,'footer');b.click('no');b.c.track('model_open',{id:'opel-combo'});assert.equal(b.commands().filter(x=>x[0]==='event').length,count);assert.equal(b.c['ga-disable-G-SH3XRBV17P'],true);assert.equal(b.storage.has('sod-vid'),false);
 for(const hostname of ['localhost','example.test','stekkerofdiesel.nl.evil.test']){const local=browser(undefined,{hostname});local.click('yes');assert.equal(local.scripts.length,0)}
});

test('enabling statistics later sends the current page exactly once without waiting for navigation',()=>{
 const b=browser(undefined,{hostname:'stekkerofdiesel.nl'});b.c.page='calc';b.click('no');b.click(null,'footer');b.e.ckS.checked=true;b.click('set');assert.equal(b.commands().filter(x=>x[0]==='event'&&x[1]==='page_view').length,1);b.click(null,'footer');b.click('set');assert.equal(b.commands().filter(x=>x[0]==='event'&&x[1]==='page_view').length,1);
});

test('GA4 drops form contents, number plates, raw search terms, error messages and private URL parameters',()=>{
 const b=browser(undefined,{hostname:'stekkerofdiesel.nl',search:'?utm_source=newsletter&utm_medium=email&utm_campaign=autumn-2026&s=private-share-state&email=private@example.com'});b.c.track('page_view');b.click('yes');
 b.c.track('wizard_complete',{vt:'bestel',model:'peugeot-e-partner',jr:5,seen:5,inputs:{plk:'AB123C',name:'Private Person'},email:'private@example.com',diff_year:1234});
 b.c.track('model_search',{q:'Private Person AB123C private@example.com',n:1});b.c.track('js_error',{m:'private@example.com',line:42});
 const ga=b.commands().filter(x=>x[0]==='config'||x[0]==='event'),text=JSON.stringify(ga);for(const privateValue of ['private-share-state','private@example.com','AB123C','Private Person','diff_year','inputs'])assert.ok(!text.includes(privateValue),privateValue);
 const config=ga.find(x=>x[0]==='config')[2];assert.equal(config.campaign_source,'newsletter');assert.equal(config.campaign_medium,'email');assert.equal(config.campaign_name,'autumn-2026');assert.equal(config.page_location,'https://stekkerofdiesel.nl/');assert.equal(config.page_referrer,'https://www.google.com/');
 const completed=ga.find(x=>x[0]==='event'&&x[1]==='calculator_complete');assert.equal(completed[2].model_id,'peugeot-e-partner');assert.equal(completed[2].vehicle_type,'bestel');
});

test('queued page views retain their own URL context and successful leads contain only the lead type',()=>{
 const b=browser(undefined,{hostname:'stekkerofdiesel.nl'});b.c.location.href='https://stekkerofdiesel.nl/modellen/?q=private@example.com';b.c.track('page_view',{},'modellen');b.c.location.href='https://stekkerofdiesel.nl/overstapgids/laden/';b.c.track('page_view',{},'gids');b.click('yes');
 const views=b.commands().filter(x=>x[0]==='event'&&x[1]==='page_view');assert.equal(views[0][2].page_location,'https://stekkerofdiesel.nl/modellen/');assert.equal(views[1][2].page_location,'https://stekkerofdiesel.nl/overstapgids/laden/');
 b.c.track('fleet_request_sent',{name:'Private Person',email:'private@example.com',fleet_size:'1-10'});const lead=b.commands().find(x=>x[0]==='event'&&x[1]==='generate_lead');assert.equal(lead[2].lead_type,'fleet_analysis');assert.ok(!JSON.stringify(lead).includes('Private Person'));assert.ok(!JSON.stringify(lead).includes('private@example.com'));
});

test('navigation between two guides or two model categories creates distinct page views',()=>{
 const calls=[],c=vm.createContext({window:null,page:'gids',location:{pathname:'/overstapgids/laden/'},document:{title:'Laden',hidden:false,documentElement:{scrollHeight:2000},addEventListener(){}},innerHeight:800,scrollY:0,performance:{now:()=>1000},route(){},routeKey:()=>'',statOK:()=>true,track:(...a)=>calls.push(a),leaveFlush(){},addEventListener(){},setTimeout(){}});c.window=c;
 const source=script('meten-koppelen');vm.runInContext(source.slice(0,source.indexOf(' /* Invulvenster:'))+'})();',c);
 c.location.pathname='/overstapgids/netcongestie/';c.document.title='Netcongestie';c.route();c.page='modellen';c.location.pathname='/modellen/bestelbussen/';c.route();c.location.pathname='/modellen/bussen/';c.route();c.route();assert.equal(calls.filter(a=>a[0]==='page_view').length,4);
 assert.equal(calls.find(a=>a[0]==='page_leave')[3].path,'/overstapgids/laden/');
});
