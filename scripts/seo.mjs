// Generate crawlable Dutch and English pages with no server or build dependencies.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import render from './seo-render.cjs';
import {createAssetWriter,createShell,optimizePage} from './seo-assets.mjs';
const ROOT=path.join(path.dirname(fileURLToPath(import.meta.url)),'..'),SITE='https://stekkerofdiesel.nl',BRAND='Stekker of Diesel';
const src=fs.readFileSync(path.join(ROOT,'_src/index.html'),'utf8').replace(/\r\n/g,'\n'),{routes}=JSON.parse(src.match(/<script type="application\/json" id="seo">([\s\S]*?)<\/script>/)[1]);
const dictionary=JSON.parse(fs.readFileSync(path.join(ROOT,'data/translations.en.json'),'utf8')),runtime=fs.readFileSync(path.join(ROOT,'scripts/locale-runtime.js'),'utf8');
const translate=render.makeTranslator(dictionary,runtime),esc=render.esc,today=process.env.SOD_BUILD_DATE||new Date().toISOString().slice(0,10),cards={nl:render.modelRenderer(src,'nl'),en:render.modelRenderer(src,'en')};
const previous={};try{for(const m of fs.readFileSync(path.join(ROOT,'sitemap.xml'),'utf8').matchAll(/<loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod><!-- ([0-9a-f]+) -->/g))previous[m[1]]={date:m[2],hash:m[3]};}catch{}
// Non-indexable routes do not occur in the sitemap, but must have stable dates too.
const stateFile=path.join(ROOT,'_src/seo-build.json');
try{Object.assign(previous,JSON.parse(fs.readFileSync(stateFile,'utf8')))}catch{}
// Titel en beschrijving per voertuig komen uit het MODELMETA-blok in _src/index.html, zodat de browser dezelfde meta zet.
const M=vm.runInNewContext(src.match(/\/\* MODELMETA:[\s\S]*?\/\* \/MODELMETA \*\//)[0]+';({vMetaOf})');
const allGroups=cards.nl(null).groups;for(const g of allGroups){const top=g.top,name=top.b+' '+(top.fam||top.m),nl=M.vMetaOf(g,false),en=M.vMetaOf(g,true);routes['model/'+g.slug]={path:routes['modellen/'+top.c].path+g.slug+'/',enPath:routes['modellen/'+top.c].enPath+g.slug+'/',page:'model',category:top.c,modelSlug:g.slug,name,title:nl.title,desc:nl.desc,en:{name,title:en.title,desc:en.desc===top.n?translate(top.n):en.desc}}}
// Eén pagina per zero-emissiezone. Data en tekst komen uit het ZONEPAGINAS-blok in _src/index.html, zodat de browser dezelfde pagina tekent.
const Z=vm.runInNewContext(src.match(/\/\* ZONEPAGINAS:[\s\S]*?\/\* \/ZONEPAGINAS \*\//)[0]+';({ZES,zSlug,zMeta,zPage,zEsc})');
for(const z of Z.ZES){const s=Z.zSlug(z[0]),nl=Z.zMeta(z,false),en=Z.zMeta(z,true);routes['zone/'+s]={path:'/zero-emissiezone/'+s+'/',enPath:'/en/zero-emission-zone/'+s+'/',page:'zone',zone:z,...nl,en}}
const url=(r,l)=>SITE+(l==='en'?r.enPath:r.path),type=(k,r)=>r.page||(k.startsWith('gids/')?'gids':k);
function contentOf(h,k,r){const s=h.match(new RegExp('<section class="page" data-page="'+type(k,r)+'"[\\s\\S]*?\\n</section>'));if(!s)throw Error('Missing page '+k);if(type(k,r)!=='gids')return s[0];const a=s[0].match(new RegExp('<article class="ga" data-g="'+k.slice(5)+'"[\\s\\S]*?</article>'));if(!a)throw Error('Missing guide '+k);return a[0];}
function articleHeadline(k,l){const h=contentOf(src,k,routes[k]).match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g,'');return l==='en'?translate(h):h;}
function schema(k,r,l,date,models,model){const c=l==='en'?r.en:r,u=url(r,l),org={'@id':SITE+'/#org'},g=[
 {'@type':'Organization','@id':SITE+'/#org',name:BRAND,url:SITE+'/',logo:SITE+'/apple-touch-icon.png',email:'info@stekkerofdiesel.nl',address:{'@type':'PostalAddress',streetAddress:'Pierre Lallementstraat 44',addressLocality:'Amsterdam',addressCountry:'NL'},founder:[{'@type':'Person',name:'Jan Veraart'},{'@type':'Person',name:'Max van Dam'}]},
 {'@type':'WebSite','@id':SITE+'/#website',url:SITE+'/',name:BRAND,alternateName:'stekkerofdiesel.nl',inLanguage:['nl-NL','en'],publisher:org},
 {'@type':type(k,r)==='modellen'?'CollectionPage':k==='over'?'AboutPage':'WebPage','@id':u,url:u,name:c.title,description:c.desc,inLanguage:l==='nl'?'nl-NL':'en',isPartOf:{'@id':SITE+'/#website'},dateModified:date,primaryImageOfPage:{'@type':'ImageObject',url:SITE+'/og.png',width:1200,height:630},...(k==='calc'?{}:{breadcrumb:{'@id':u+'#breadcrumb'}})}];
 if(k!=='calc'){const crumbs=[[BRAND,SITE+(l==='en'?'/en/':'/')]];if(k.startsWith('gids/')||r.page==='zone')crumbs.push([l==='en'?routes.faq.en.name:routes.faq.name,url(routes.faq,l)]);if(r.page==='zone'){const gz=routes['gids/zero-emissiezones'];crumbs.push([l==='en'?gz.en.name:gz.name,url(gz,l)]);}if(r.category)crumbs.push([l==='en'?routes.modellen.en.name:routes.modellen.name,url(routes.modellen,l)]);if(r.page==='model'||r.sort){const cr=routes['modellen/'+r.category];crumbs.push([l==='en'?cr.en.name:cr.name,url(cr,l)]);}crumbs.push([c.name,u]);g.push({'@type':'BreadcrumbList','@id':u+'#breadcrumb',itemListElement:crumbs.map(([name,item],i)=>({'@type':'ListItem',position:i+1,name,item}))});}
 if(k==='calc'||k==='uitgebreid')g.push({'@type':'WebApplication',name:l==='en'?'Electric vs diesel cost calculator':'Kostencalculator elektrisch of diesel',url:u,applicationCategory:'BusinessApplication',operatingSystem:'Web',inLanguage:l,isAccessibleForFree:true,offers:{'@type':'Offer',price:'0',priceCurrency:'EUR'},publisher:org,description:c.desc});
 if(k.startsWith('gids/'))g.push({'@type':'Article',headline:articleHeadline(k,l),description:c.desc,mainEntityOfPage:{'@id':u},image:SITE+'/og.png',inLanguage:l,dateModified:date,author:org,publisher:org});
 if(k==='vloot')g.push({'@type':'Service','@id':u+'#service',name:l==='en'?'Fleet analysis: electrify your fleet':'Wagenparkanalyse: wagenpark elektrificeren',alternateName:l==='en'?['Fleet electrification advice','Vehicle fleet analysis','Fleet advice']:['Vlootanalyse','Wagenparkadvies','Wagenpark analyse','Wagenparkadvies elektrisch','Elektrisch wagenpark advies'],serviceType:l==='en'?'Fleet electrification planning':'Wagenpark elektrificeren',description:c.desc,provider:org,areaServed:{'@type':'Country',name:'Netherlands'},url:u});
 if(k==='vloot'){const faq=l==='en'?[
['Is a fleet analysis the same as fleet advice?','Almost. The fleet analysis is the calculation itself: per vehicle we set out costs, range, charging and replacement timing. The fleet advice is the plan that follows from it, with a replacement order and concrete steps. We deliver both in one engagement. A fleet analysis is also called a vehicle fleet analysis.'],
['What data do you need for a fleet analysis?','Your current vehicles, your annual mileage and daily routes, your energy and diesel prices and your charging locations. If you do not have everything to hand, we work with assumptions that we test together in the introductory meeting.'],
['What does a fleet analysis cost?','That depends on the number of vehicles and locations we work through. The introductory meeting is without obligation; after that you hear in advance what the analysis costs, before we start.'],
['Which vehicles is a fleet analysis suitable for?','For vans, rigid trucks, tractor units and buses, from a few vehicles to a complete fleet. Even if part of your fleet keeps running on diesel for now, the analysis shows where electric already pays off and where it does not yet.']]:[
['Is een wagenparkanalyse hetzelfde als wagenparkadvies?','Bijna. De wagenparkanalyse is de doorrekening zelf: per voertuig zetten we kosten, actieradius, laden en vervangmoment op een rij. Het wagenparkadvies is het plan dat daaruit volgt, met een vervangvolgorde en concrete stappen. Wij leveren beide in een traject. Een wagenparkanalyse wordt ook wel vlootanalyse genoemd.'],
['Welke gegevens heb je nodig voor een wagenpark analyse?','Je huidige voertuigen, je jaarkilometers en dagritten, je energie- en dieselprijzen en je laadlocaties. Heb je niet alles paraat, dan werken we met aannames die we samen toetsen in de kennismaking.'],
['Wat kost een wagenparkanalyse?','Dat hangt af van het aantal voertuigen en locaties dat we doorrekenen. De kennismaking is vrijblijvend; daarna hoor je vooraf wat de analyse kost, voordat we beginnen.'],
['Voor welke voertuigen is een wagenparkanalyse geschikt?','Voor bestelbussen, bakwagens, trekkers en bussen, van een paar voertuigen tot een complete vloot. Ook als een deel van je wagenpark voorlopig op diesel blijft rijden, laat de analyse zien waar elektrisch al loont en waar nog niet.']];
g.push({'@type':'FAQPage','@id':u+'#faq',mainEntity:faq.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))});}
if(models)g[2].mainEntity={'@type':'ItemList',numberOfItems:models.groups.length,itemListElement:models.groups.map((m,i)=>({'@type':'ListItem',position:i+1,name:m.top.b+' '+(m.top.fam||m.top.m),url:SITE+(l==='en'?routes['modellen/'+m.top.c].enPath:routes['modellen/'+m.top.c].path)+m.slug+'/'}))};
 if(model){const top=model.top;g.push({'@type':'Vehicle','@id':u+'#vehicle',name:top.b+' '+(top.fam||top.m),brand:{'@type':'Brand',name:top.b},description:c.desc,fuelType:'Electric',vehicleConfiguration:model.vs.map(m=>m.vl||m.m).join(', '),additionalProperty:model.vs.flatMap(m=>{const v=m.vl||m.m,en=l==='en',P=(n,value,unitText)=>value?[{'@type':'PropertyValue',name:v+' '+n,value,unitText}]:[];return[...P(en?'range':'actieradius',m.r,'km'),...P(en?'usable battery':'bruikbare accu',m.u,'kWh'),...P(en?'battery':'accu',m.u?0:(m.a||m.g),'kWh'),...P(en?'DC charging power':'snellaadvermogen',m.mcs||m.dc,'kW'),...P(en?'indicative price excl. VAT':'indicatieve prijs excl. btw',m.price,'EUR')]})});g[2].mainEntity={'@id':u+'#vehicle'};}
 return JSON.stringify({'@context':'https://schema.org','@graph':g}).replace(/</g,'\\u003c');}
function head(k,r,l,date,models,model){const c=l==='en'?r.en:r,u=url(r,l);return['<!--seo-->',`<title>${esc(c.title)}</title>`,`<meta name="description" content="${esc(c.desc)}">`,`<meta name="robots" content="${r.noindex?'noindex,follow':'index,follow,max-image-preview:large,max-snippet:-1'}">`,`<link rel="canonical" href="${u}">`,...['nl','en','x-default'].map(x=>`<link rel="alternate" hreflang="${x}" href="${url(r,x==='en'?'en':'nl')}">`),'<meta property="og:type" content="website">',`<meta property="og:site_name" content="${BRAND}">`,`<meta property="og:locale" content="${l==='en'?'en_GB':'nl_NL'}">`,`<meta property="og:locale:alternate" content="${l==='en'?'nl_NL':'en_GB'}">`,`<meta property="og:url" content="${u}">`,`<meta property="og:title" content="${esc(c.title)}">`,`<meta property="og:description" content="${esc(c.desc)}">`,`<meta property="og:image" content="${SITE}/og.png">`,'<meta property="og:image:width" content="1200">','<meta property="og:image:height" content="630">',`<meta property="og:image:alt" content="${BRAND}: ${esc(c.name)}">`,'<meta name="twitter:card" content="summary_large_image">',`<meta name="twitter:image" content="${SITE}/og.png">`,`<meta name="twitter:title" content="${esc(c.title)}">`,`<meta name="twitter:description" content="${esc(c.desc)}">`,`<script type="application/ld+json">${schema(k,r,l,date,models,model)}</script>`,'<!--/seo-->'].join('\n');}
function fill(h,id,content,tag='div'){const start=new RegExp('<'+tag+'\\b[^>]*\\bid="'+id+'"[^>]*>').exec(h);if(!start)throw Error('Missing rendering target '+id);const from=start.index+start[0].length,tokens=new RegExp('</?'+tag+'\\b[^>]*>','g');tokens.lastIndex=from;let depth=1,m;while(m=tokens.exec(h)){depth+=m[0].startsWith('</')?-1:1;if(!depth)return h.slice(0,from)+content+h.slice(m.index);}throw Error('Unclosed rendering target '+id);}
const app=src.match(/<script>([\s\S]*?)<\/script>/)[1],steps=vm.runInNewContext('('+app.match(/const GSTEPS=([\s\S]*?);\nconst GKEY/)[1]+')');
function body(k,r,l){const p=type(k,r);let h=src.replace(/<section class="page" data-page="([a-z]+)"( id="calc")?( hidden)?>/g,(_,x,id='')=>`<section class="page" data-page="${x}"${id}${x===p?'':' hidden'}>`);
 h=fill(h,'home',render.homeRenderer(src));
 h=h.replace(/<article class="ga" data-g="([a-z-]+)"( hidden)?>/g,(_,g)=>`<article class="ga" data-g="${g}"${p==='gids'&&g===k.slice(5)?'':' hidden'}>`);
 let models=null;if(p==='modellen'){models=cards[l](r.category,r.sort);h=fill(h,'mMore',((l==='en'?r.en.more:r.more)||[]).map(([href,t])=>`<a href="${href}">${esc(t)}</a>`).join(''));if(r.sort)h=h.replace(/(<select id="mSort"[^>]*>)([\s\S]*?)(<\/select>)/,(_,a,o,z)=>a+o.replace('<option value="'+r.sort+'">','<option value="'+r.sort+'" selected>')+z);h=fill(h,'mList',models.cards);h=fill(h,'mIntro',esc(r.intro||r.desc),'p');h=fill(h,'mAdvice',esc(r.advice||''),'p');h=fill(h,'mCat',[['all','Alle'],['trekker','Trekker'],['bakwagen','Bakwagen'],['bestel','Bestelbus'],['bus','Bus']].map(([cat,label])=>{const q=cat==='all'?routes.modellen:routes['modellen/'+cat];return`<a href="${q.path}" data-mcat="${cat}"${cat===(r.category||'all')?' aria-current="page"':''}>${label}</a>`}).join(''));h=h.replace(/(<span[^>]*id="mCount"[^>]*>)[\s\S]*?<\/span>/,(_,a)=>a+models.groups.length+' modellen</span>');h=h.replace(/(<section class="page" data-page="modellen"[^>]*>[\s\S]*?<h1[^>]*>)[\s\S]*?<\/h1>/,(_,a)=>a+esc(r.name)+'</h1>');}
 let model=null;if(p==='model'){model=cards[l](null).groups.find(g=>g.slug===r.modelSlug);if(!model)throw Error('Missing model '+r.modelSlug);const top=model.top,catRoute=routes['modellen/'+top.c];h=fill(h,'vTitle',esc(top.b+' '+(top.fam||top.m)),'h1');h=fill(h,'vIntro',esc(top.n),'p');h=fill(h,'vBody',cards[l].detail(model));h=fill(h,'vCrumb',`<a href="${l==='en'?routes.modellen.enPath:routes.modellen.path}">Voertuigen</a><span aria-hidden="true">/</span><a href="${l==='en'?catRoute.enPath:catRoute.path}">${esc(l==='en'?catRoute.en.name:catRoute.name)}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(top.b+' '+(top.fam||top.m))}</span>`,'nav');}
 h=fill(h,'gTl',Object.entries(routes).filter(([x])=>x.startsWith('gids/')).map(([key,g],i)=>`<li><a href="${g.path}"><small>${String(i+1).padStart(2,'0')}</small><b>${esc(g.name)}</b></a></li>`).join(''),'ol');
 h=fill(h,'gSt',steps.map((s,i)=>`<li><button type="button" class="gck" data-gst="${i}" aria-pressed="false" aria-label="${esc(s[0])}"></button><div><b>${esc(s[0])}</b><p>${esc(s[1])}</p><a href="${s[2]}">${esc(s[3])}</a></div></li>`).join(''),'ol');
 const zp=en=>({calc:url(routes.calc,en?'en':'nl').slice(SITE.length),gids:url(routes['gids/zero-emissiezones'],en?'en':'nl').slice(SITE.length),zone:s=>url(routes['zone/'+s],en?'en':'nl').slice(SITE.length),bestel:url(routes['modellen/bestel'],en?'en':'nl').slice(SITE.length),truck:url(routes['modellen/bakwagen'],en?'en':'nl').slice(SITE.length)});
 if(p==='zone'){const z=r.zone,en=l==='en',o=Z.zPage(z,en,zp(en)),f=routes.faq,gz=routes['gids/zero-emissiezones'];h=fill(h,'zArt',`<h1 tabindex="-1">${o.h1}</h1>`+o.body,'article');h=fill(h,'zCrumb',`<a href="${en?f.enPath:f.path}">${esc(en?f.en.name:f.name)}</a><span aria-hidden="true">/</span><a href="${en?gz.enPath:gz.path}">${esc(en?gz.en.name:gz.name)}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(z[0])}</span>`,'nav');}
 h=h.replace('<html lang="nl"','<html lang="'+l+'"'+(l==='en'?' data-static-lang="en"':''));
 h=h.replace(/<html\b[^>]*>/,tag=>/\bclass=/.test(tag)?tag:tag.replace('>',' class="fresh">'));
 if(l==='en'){const a=h.indexOf('<body>')+6,b=h.lastIndexOf('</body>');h=h.slice(0,a)+render.translateHTML(h.slice(a,b),translate,routes)+h.slice(b);}
 h=h.replace(/<a\b[^>]*\bdata-lang="(nl|en)"[^>]*>/g,(tag,x)=>tag.replace(/href="[^"]*"/,'href="'+(x==='en'?r.enPath:r.path)+'"').replace(/\saria-current="page"/g,'').replace(/>$/,x===l?' aria-current="page">':'>'));
 return{html:h,models,model};}
const writeAsset=createAssetWriter(ROOT),pending=[],schemas={nl:{},en:{}},entries=[],buildState={};
for(const [k,r]of Object.entries(routes)){
 if(!r.path||!r.enPath||!r.en?.title)throw Error('Incomplete bilingual route '+k);
 for(const l of ['nl','en']){
  let {html,models,model}=body(k,r,l);
  const u=url(r,l),hash=crypto.createHash('sha1').update(JSON.stringify(l==='en'?r.en:r)+contentOf(html,k,r)+(model?JSON.stringify(model.vs.map(m=>[m.id,m.r,m.price,m.u,m.g])):'')).digest('hex').slice(0,12);
  const date=previous[u]?.hash===hash?previous[u].date:today;
  buildState[u]={date,hash};
  schemas[l][new URL(u).pathname]=JSON.parse(schema(k,r,l,date,models,model));
  html=html.replace(/<!--seo-->[\s\S]*?<!--\/seo-->/,()=>head(k,r,l,date,models,model));
  pending.push({k,l,u,html});
  if(!r.noindex)entries.push(` <url><loc>${u}</loc><lastmod>${date}</lastmod><!-- ${hash} -->${['nl','en','x-default'].map(x=>`<xhtml:link rel="alternate" hreflang="${x}" href="${url(r,x==='en'?'en':'nl')}"/>`).join('')}</url>`);
 }
}
const shells=Object.fromEntries(['nl','en'].map(l=>[l,createShell(body('calc',routes.calc,l).html,l,writeAsset,schemas[l])]));
fs.writeFileSync(stateFile,JSON.stringify(buildState,null,2)+'\n');
for(const {k,l,u,html}of pending){
 const file=path.join(ROOT,new URL(u).pathname,'index.html');
 fs.mkdirSync(path.dirname(file),{recursive:true});
 fs.writeFileSync(file,optimizePage(html,k,shells[l],writeAsset,l));
}
// Verdwenen model- en zonepagina's (bv. hernoemd model) worden een doorverwijzing met noindex, zodat er geen losse dubbele pagina blijft staan.
const written=new Set(pending.map(x=>new URL(x.u).pathname));
const parents=new Set(pending.map(x=>new URL(x.u).pathname).filter(p=>/^\/(?:en\/)?(?:modellen|models|zero-emissiezone|zero-emission-zone)\/(?:[a-z-]+\/)?[a-z0-9-]+\/$/.test(p)).map(p=>p.replace(/[a-z0-9-]+\/$/,'')));
const lcp=(a,b)=>{let i=0;while(i<a.length&&a[i]===b[i])i++;return i};
const stub=(to,lang)=>`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="robots" content="noindex,follow"><link rel="canonical" href="${SITE}${to}"><meta http-equiv="refresh" content="0;url=${to}"><title>${BRAND}</title></head><body><a href="${to}">${SITE}${to}</a></body></html>\n`;
// Oude adressen die ooit in de sitemap stonden.
for(const [from,to] of Object.entries({'/restwaarde/':'/overstapgids/accu/','/en/residual-value/':'/en/switching-guide/battery-and-residual-value/'})){if(written.has(from))continue;const f=path.join(ROOT,from,'index.html');fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,stub(to,from.startsWith('/en/')?'en':'nl'))}
for(const dir of parents){
 const abs=path.join(ROOT,dir);if(!fs.existsSync(abs))continue;
 const live=fs.readdirSync(abs).filter(n=>written.has(dir+n+'/'));
 for(const n of fs.readdirSync(abs)){
  const p=dir+n+'/',f=path.join(abs,n,'index.html');
  if(written.has(p)||!fs.existsSync(f))continue;
  const best=live.map(x=>[x,lcp(x,n)]).sort((a,b)=>b[1]-a[1])[0],to=best&&best[1]>=Math.min(n.length,best[0].length)*.6?dir+best[0]+'/':written.has(dir)?dir:'/';
  fs.writeFileSync(f,stub(to,dir.startsWith('/en/')?'en':'nl'));
 }
}
fs.writeFileSync(path.join(ROOT,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'+entries.join('\n')+'\n</urlset>\n');
const fonts404=[...src.matchAll(/@font-face \{[^}]*?font-family: '(IBM Plex Sans|IBM Plex Sans Condensed)';[^}]*?unicode-range: U\+0000-00FF[^}]*\}/g)].map(m=>m[0].replace(/\s+/g,' ')).join('');
fs.writeFileSync(path.join(ROOT,'404.html'),`<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>Pagina niet gevonden | ${BRAND}</title><link rel="icon" href="/favicon.svg" type="image/svg+xml"><style>${fonts404}*{box-sizing:border-box}body{margin:0;font:17px/1.6 'IBM Plex Sans',system-ui,sans-serif;background:#F3F3F0;color:#15171A}header{border-bottom:1px solid #DCDCD7;background:#fff}header a{display:block;max-width:56rem;margin:0 auto;padding:16px 24px;font:600 20px 'IBM Plex Sans Condensed','Arial Narrow',sans-serif;color:#15171A;text-decoration:none}main{max-width:56rem;margin:0 auto;padding:12vh 24px 48px}small{font:500 12px 'IBM Plex Sans',sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#6B6F6A}h1{margin:.2em 0 .4em;font:600 40px/1.15 'IBM Plex Sans Condensed','Arial Narrow',sans-serif}h2{margin:2.4em 0 .3em;font:600 24px/1.2 'IBM Plex Sans Condensed','Arial Narrow',sans-serif}a{color:#0A8F5B}</style></head><body><header><a href="/">${BRAND}</a></header><main><small>404</small><h1>Deze pagina bestaat niet</h1><p>Ga naar de <a href="/">calculator</a>, <a href="/modellen/">elektrische modellen</a> of de <a href="/overstapgids/">overstapgids</a>.</p><section lang="en"><h2>Page not found</h2><p>Try the <a href="/en/">calculator</a>, <a href="/en/models/">electric models</a> or <a href="/en/switching-guide/">switching guide</a>.</p></section></main></body></html>`);
console.log(`${Object.keys(routes).length*2} bilingual pages generated; ${entries.length} canonical URLs in sitemap.`);
