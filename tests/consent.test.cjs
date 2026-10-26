const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const script=id=>html.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)</script>'))[1];
function browser(saved,{lang='nl',oldIds=false}={}){
 const now=Date.now(),storage=new Map(),elements={},listeners={},network=[],timers=new Map();let nextTimer=0,nextId=0;
 if(saved!==undefined)storage.set('sod-consent',typeof saved==='string'?saved:JSON.stringify(saved));
 if(oldIds)for(const k of ['sod-vid','sod-sid','sod-n'])storage.set(k,'old');
 for(const id of ['ck','ckK','ckText','ckO','ckS','ckA','ckSet'])elements[id]={hidden:true,open:false,checked:false,handlers:{},focus(){this.focused=true},showModal(){this.open=true},close(){this.open=false},addEventListener(k,f){this.handlers[k]=f}};
 const c=vm.createContext({window:null,Date,URL,URLSearchParams,Map,Set,JSON,Number,Object,Array,Math,String,Boolean,Uint8Array,
  localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
  document:{documentElement:{lang,setAttribute(){},removeAttribute(){}},referrer:'',cookie:'',getElementById:id=>elements[id],addEventListener:(k,f)=>{listeners[k]=f}},
  location:{search:'',pathname:'/',hash:'',hostname:'example.test',host:'example.test'},navigator:{language:lang},innerWidth:1200,
  crypto:{randomUUID:()=>`00000000-0000-4000-8000-${String(++nextId).padStart(12,'0')}`},
  matchMedia:()=>({matches:false}),addEventListener:(k,f)=>{listeners[k]=f},
  setTimeout:(f,ms)=>{const id=++nextTimer;timers.set(id,{f,ms});return id},clearTimeout:id=>timers.delete(id),
  SB_URL:'https://example.test',SB_KEY:'test-publishable-key',fetch:(url,o)=>{network.push({url,rows:JSON.parse(o.body)});return Promise.resolve({ok:true})}
 });c.window=c;vm.runInContext(script('consent-default'),c);vm.runInContext(script('meten'),c);
 const click=(key,kind='choice')=>listeners.click({target:{closest:s=>kind==='footer'&&s==='[data-cookies]'?{}:kind==='privacy'&&s==='[data-ck-privacy]'?{}:kind==='choice'&&s==='[data-ck]'?{dataset:{ck:key}}:null}});
 return{c,e:elements,storage,network,timers,now,click,state:()=>vm.runInContext('({consent,vid,sid,pend,evq})',c)};
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
 const now=Date.now();for(const saved of ['broken',{v:1,t:now-3.16e10,stat:true,ads:true},{v:1,t:now+1e6,stat:true,ads:true},{v:1,t:now,stat:'false',ads:false},{v:1,t:now,stat:true},{v:99,t:now,stat:true,ads:true}])assert.equal(browser(saved).e.ck.open,true,JSON.stringify(saved));
 for(const stat of [true,false]){const b=browser({v:1,t:now-1000,stat,ads:false});assert.equal(b.e.ck.open,false);assert.equal(b.state().consent.stat,stat)}
});
test('English settings use English immediately, and reading privacy does not imply consent',()=>{
 const b=browser(undefined,{lang:'en'});assert.equal(b.e.ckSet.textContent,'Settings');b.click('set');assert.equal(b.e.ckSet.textContent,'Save choices');b.click(null,'privacy');assert.equal(b.e.ck.open,false);assert.equal(b.state().consent,null);assert.equal(b.storage.has('sod-consent'),false);
 const en=fs.readFileSync(path.join(root,'en/index.html'),'utf8').match(/<dialog class="ck"[\s\S]*?<\/dialog>/)[0];for(const s of ['Your privacy choices','Reject optional cookies','Accept all','Read our privacy policy','/en/privacy/'])assert.ok(en.includes(s),s);assert.doesNotMatch(en,/Jouw privacykeuze|Alleen noodzakelijk|Alles accepteren/);
});
