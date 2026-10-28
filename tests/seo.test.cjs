const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process');
const ROOT=path.join(__dirname,'..'),site='https://stekkerofdiesel.nl',source=fs.readFileSync(path.join(ROOT,'index.html'),'utf8'),routes=JSON.parse(source.match(/<script type="application\/json" id="seo">([\s\S]*?)<\/script>/)[1]).routes;
const file=p=>path.join(ROOT,p,'index.html'),read=p=>fs.readFileSync(file(p),'utf8');
const attr=(h,tag,a)=>h.match(new RegExp('<'+tag+'[^>]*'+a+'="([^"]+)"'))?.[1];
test('every language route has static localized metadata, a self-canonical and reciprocal alternates',()=>{
 const titles=new Set();for(const r of Object.values(routes))for(const l of ['nl','en']){const p=l==='en'?r.enPath:r.path,h=read(p),c=l==='en'?r.en:r;
 assert.match(h,new RegExp('<html lang="'+l+'"'));assert.ok(h.includes('<title>'+c.title.replace(/&/g,'&amp;')+'</title>'),p);assert.ok(h.includes('<link rel="canonical" href="'+site+p+'">'),p);
 for(const x of ['nl','en','x-default'])assert.ok(h.includes('hreflang="'+x+'" href="'+site+(x==='en'?r.enPath:r.path)+'"'),p+' alternate '+x);
 assert.ok(h.includes('<meta name="twitter:image" content="'+site+'/og.png">'),p+' twitter:image');assert.ok(c.title.includes('| Stekker of Diesel')||p==='/privacy/'||p==='/en/privacy/','Title zonder merk: '+p+' '+c.title);
 assert.ok(!titles.has(c.title),'Duplicate title '+c.title);titles.add(c.title);
 const data=JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);const page=data['@graph'].find(x=>x['@id']===site+p);assert.ok(page);assert.equal(page.inLanguage,l==='nl'?'nl-NL':'en');
 assert.ok(h.includes('href="'+r.path+'" data-lang="nl"'));assert.ok(h.includes('href="'+r.enPath+'" data-lang="en"'));
 }});
test('sitemap contains exactly the indexable canonical routes and all language pairs',()=>{
 const sm=fs.readFileSync(path.join(ROOT,'sitemap.xml'),'utf8'),urls=[...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);assert.equal(urls.length,Object.values(routes).filter(r=>!r.noindex).length*2);assert.equal(new Set(urls).size,urls.length);assert.match(sm,/xmlns:xhtml="http:\/\/www.w3.org\/1999\/xhtml"/);
 for(const r of Object.values(routes))for(const p of [r.path,r.enPath]){assert.equal(urls.includes(site+p),!r.noindex);if(r.noindex)assert.match(read(p),/name="robots" content="noindex,follow"/);}assert.doesNotMatch(sm,/\?s=|\?lang=|#/);
});
test('category pages contain the actual model cards before JavaScript and matching structured data',()=>{
 for(const r of Object.values(routes).filter(r=>r.category))for(const l of ['nl','en']){const p=l==='en'?r.enPath:r.path,h=read(p),visible=h.match(/<section class="page" data-page="modellen">([\s\S]*?)\n<\/section>/)[1],n=(visible.match(/<article class="mc/g)||[]).length;assert.ok(n>=8,p);const json=JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.equal(json['@graph'].find(x=>x['@type']==='CollectionPage').mainEntity.numberOfItems,n);assert.ok(visible.includes(l==='en'?r.en.name:r.name));assert.ok(visible.includes(l==='en'?r.en.advice:r.advice),p+' initial advice');}
});
test('first paint contains the homepage, local fonts and no unused advertising download',()=>{
 const explainer=read('/en/').match(/<div class="wrap home uv"[\s\S]*?<div class="wrap">/)[0];
 assert.match(explainer,/What Stekker of Diesel does/);assert.match(explainer,/Free, no account and no sales pitch/);assert.match(explainer,/Is an electric truck cheaper than a diesel/);assert.match(explainer,/href="\/en\/switching-guide\/zero-emission-zones\/"/);assert.doesNotMatch(explainer,/Wie een trekker|Gratis, zonder|Wat er verandert|Bij gemiddeld gebruik|Voor trekkers|Dat hangt af/);
 assert.match(source,/<html[^>]*class="fresh"/);assert.match(source,/<div class="home" id="home"><div class="wrap hA">/);assert.match(read("/en/"),/Electric or diesel\? Do the maths/);assert.doesNotMatch(source,/<(?:link|script)[^>]*(?:fonts\.googleapis\.com|fonts\.gstatic\.com|pagead2\.googlesyndication\.com)/);
 for(const m of source.matchAll(/url\((\/assets\/fonts\/[^)]+)\)/g))assert.ok(fs.existsSync(path.join(ROOT,m[1])),m[1]);
});
test('all executable scripts compile on both language entry points',()=>{
 for(const p of ['/','/en/','/modellen/bestelbussen/','/en/models/vans/'])for(const m of read(p).matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){if(/type="application\//.test(m[1]))continue;assert.doesNotThrow(()=>new vm.Script(m[2]),p);}
});
test('a rebuild preserves dates and produces identical sitemap and canonical entry files',()=>{
 const paths=['sitemap.xml','index.html','en/index.html','modellen/bestelbussen/index.html'],before=paths.map(p=>fs.readFileSync(path.join(ROOT,p),'utf8'));cp.execFileSync(process.execPath,[path.join(ROOT,'scripts/seo.mjs')],{env:{...process.env,SOD_BUILD_DATE:'2099-01-01'}});paths.forEach((p,i)=>assert.equal(fs.readFileSync(path.join(ROOT,p),'utf8'),before[i],p));
});
