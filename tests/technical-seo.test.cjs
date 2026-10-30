const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'_src/index.html'),'utf8');
const routes=JSON.parse(source.match(/<script type="application\/json" id="seo">([\s\S]*?)<\/script>/)[1]).routes;
const read=p=>fs.readFileSync(path.join(root,p,'index.html'),'utf8');
const routeType=k=>k.startsWith('gids/')?'gids':k.startsWith('modellen/')?'modellen':k;

test('all 50 URLs serve only their own page and guide before JavaScript',()=>{
 for(const [k,r]of Object.entries(routes))for(const p of [r.path,r.enPath]){
  const h=read(p),pages=[...h.matchAll(/<section class="page" data-page="([a-z]+)"/g)].map(m=>m[1]);
  assert.deepEqual(pages,[routeType(k)],p);
  if(k.startsWith('gids/'))assert.deepEqual([...h.matchAll(/<article class="ga" data-g="([a-z-]+)"/g)].map(m=>m[1]),[k.slice(5)],p);
  // The catalogue legitimately contains dozens of server-rendered vehicle cards.
  assert.ok(Buffer.byteLength(h)<(routeType(k)==='modellen'?180000:80000),p+' HTML budget');
  assert.doesNotMatch(h,/<style\b/);
  assert.doesNotMatch(h,/const MODELS=|const SOD_EN=/);
 }
});

test('all cached assets exist, their hashes match and application scripts compile',()=>{
 const assets=new Set();
 for(const r of Object.values(routes))for(const p of [r.path,r.enPath]){
  const h=read(p),scripts=[...h.matchAll(/<script([^>]*)src="(\/assets\/site\/[^\"]+)"[^>]*>/g)];
  assert.match(scripts[0][2],/shell-/); // Must restore DOM before any app initialization.
  assert.ok(scripts.every(m=>/\bdefer\b/.test(m[0])));
  for(const m of h.matchAll(/(?:src|href)="(\/assets\/site\/[^\"]+)"/g))assets.add(m[1]);
 }
 for(const asset of assets){
  const content=fs.readFileSync(path.join(root,asset),'utf8');
  assert.equal(crypto.createHash('sha256').update(content).digest('hex').slice(0,16),asset.split('.').at(-2));
  if(asset.endsWith('.js'))assert.doesNotThrow(()=>new vm.Script(content),asset);
 }
 const app=source.match(/<script>([\s\S]*?)<\/script>/)[1].trim();
 assert([...assets].some(a=>a.endsWith('.js')&&fs.readFileSync(path.join(root,a),'utf8')===app),'Calculator code must be copied byte-for-byte, not rewritten.');
});

test('published internal links, fragments and local dependencies resolve',()=>{
 const known=new Set(Object.values(routes).flatMap(r=>[r.path,r.enPath]));
 for(const r of Object.values(routes))for(const p of [r.path,r.enPath]){
  const h=read(p);
  for(const m of h.matchAll(/(?:href|src)="([^\"]+)"/g)){
   const link=m[1];if(!link.startsWith('/')||link.startsWith('//'))continue;
   const u=new URL(link,'https://stekkerofdiesel.nl');
   if(u.pathname.endsWith('/'))assert(known.has(u.pathname)||fs.existsSync(path.join(root,u.pathname,'index.html')),p+' -> '+link);
   else assert(fs.existsSync(path.join(root,u.pathname)),p+' -> '+link);
   if(u.hash&&known.has(u.pathname)){
    const id=decodeURIComponent(u.hash.slice(1));
    assert(read(u.pathname).includes('id="'+id+'"'),p+' fragment '+link);
   }
  }
 }
});

test('article schema matches the on-page heading and advice is represented as a service',()=>{
 for(const [k,r]of Object.entries(routes))for(const p of [r.path,r.enPath]){
  const h=read(p),g=JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  if(k.startsWith('gids/')){
   const headline=h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1].replace(/&amp;/g,'&');
   assert.equal(g.find(x=>x['@type']==='Article').headline,headline,p);
  }
  if(k==='vloot')assert(g.some(x=>x['@type']==='Service'&&x.provider['@id']==='https://stekkerofdiesel.nl/#org'));
 }
});

test('Dutch entry points do not download the English dictionary',()=>{
 const code=p=>fs.readFileSync(path.join(root,read(p).match(/<script id="sod-i18n" defer src="([^"]+)"/)[1]),'utf8');
 assert.match(code('/'),/const SOD_EN=\{\};/);
 assert.ok(Buffer.byteLength(code('/'))<20000);
 assert.doesNotMatch(code('/en/'),/const SOD_EN=\{\};/);
 assert.ok(code('/en/').includes('Electric or diesel'));
});
