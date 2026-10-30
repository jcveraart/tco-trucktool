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
const url=(r,l)=>SITE+(l==='en'?r.enPath:r.path),type=(k,r)=>r.page||(k.startsWith('gids/')?'gids':k);
function contentOf(h,k,r){const s=h.match(new RegExp('<section class="page" data-page="'+type(k,r)+'"[\\s\\S]*?\\n</section>'));if(!s)throw Error('Missing page '+k);if(type(k,r)!=='gids')return s[0];const a=s[0].match(new RegExp('<article class="ga" data-g="'+k.slice(5)+'"[\\s\\S]*?</article>'));if(!a)throw Error('Missing guide '+k);return a[0];}
function articleHeadline(k,l){const h=contentOf(src,k,routes[k]).match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g,'');return l==='en'?translate(h):h;}
function schema(k,r,l,date,models){const c=l==='en'?r.en:r,u=url(r,l),org={'@id':SITE+'/#org'},g=[
 {'@type':'Organization','@id':SITE+'/#org',name:BRAND,url:SITE+'/',logo:SITE+'/apple-touch-icon.png',email:'info@stekkerofdiesel.nl'},
 {'@type':'WebSite','@id':SITE+'/#website',url:SITE+'/',name:BRAND,alternateName:'stekkerofdiesel.nl',inLanguage:['nl-NL','en'],publisher:org},
 {'@type':type(k,r)==='modellen'?'CollectionPage':'WebPage','@id':u,url:u,name:c.title,description:c.desc,inLanguage:l==='nl'?'nl-NL':'en',isPartOf:{'@id':SITE+'/#website'},dateModified:date,primaryImageOfPage:{'@type':'ImageObject',url:SITE+'/og.png',width:1200,height:630},...(k==='calc'?{}:{breadcrumb:{'@id':u+'#breadcrumb'}})}];
 if(k!=='calc'){const crumbs=[[BRAND,SITE+(l==='en'?'/en/':'/')]];if(k.startsWith('gids/'))crumbs.push([l==='en'?routes.faq.en.name:routes.faq.name,url(routes.faq,l)]);if(r.category)crumbs.push([l==='en'?routes.modellen.en.name:routes.modellen.name,url(routes.modellen,l)]);crumbs.push([c.name,u]);g.push({'@type':'BreadcrumbList','@id':u+'#breadcrumb',itemListElement:crumbs.map(([name,item],i)=>({'@type':'ListItem',position:i+1,name,item}))});}
 if(k==='calc'||k==='uitgebreid')g.push({'@type':'WebApplication',name:l==='en'?'Electric vs diesel cost calculator':'Kostencalculator elektrisch of diesel',url:u,applicationCategory:'BusinessApplication',operatingSystem:'Web',inLanguage:l,isAccessibleForFree:true,offers:{'@type':'Offer',price:'0',priceCurrency:'EUR'},publisher:org,description:c.desc});
 if(k.startsWith('gids/'))g.push({'@type':'Article',headline:articleHeadline(k,l),description:c.desc,mainEntityOfPage:{'@id':u},image:SITE+'/og.png',inLanguage:l,dateModified:date,author:org,publisher:org});
 if(k==='vloot')g.push({'@type':'Service','@id':u+'#service',name:l==='en'?'Fleet electrification advice':'Advies wagenpark elektrificeren',serviceType:l==='en'?'Fleet electrification planning':'Wagenpark elektrificeren',description:c.desc,provider:org,areaServed:{'@type':'Country',name:'Netherlands'},url:u});
 if(models)g[2].mainEntity={'@type':'ItemList',numberOfItems:models.groups.length,itemListElement:models.groups.map((m,i)=>({'@type':'ListItem',position:i+1,name:m.top.b+' '+(m.top.fam||m.top.m)}))};
 return JSON.stringify({'@context':'https://schema.org','@graph':g}).replace(/</g,'\\u003c');}
function head(k,r,l,date,models){const c=l==='en'?r.en:r,u=url(r,l);return['<!--seo-->',`<title>${esc(c.title)}</title>`,`<meta name="description" content="${esc(c.desc)}">`,`<meta name="robots" content="${r.noindex?'noindex,follow':'index,follow,max-image-preview:large,max-snippet:-1'}">`,`<link rel="canonical" href="${u}">`,...['nl','en','x-default'].map(x=>`<link rel="alternate" hreflang="${x}" href="${url(r,x==='en'?'en':'nl')}">`),'<meta property="og:type" content="website">',`<meta property="og:site_name" content="${BRAND}">`,`<meta property="og:locale" content="${l==='en'?'en_GB':'nl_NL'}">`,`<meta property="og:locale:alternate" content="${l==='en'?'nl_NL':'en_GB'}">`,`<meta property="og:url" content="${u}">`,`<meta property="og:title" content="${esc(c.title)}">`,`<meta property="og:description" content="${esc(c.desc)}">`,`<meta property="og:image" content="${SITE}/og.png">`,'<meta property="og:image:width" content="1200">','<meta property="og:image:height" content="630">',`<meta property="og:image:alt" content="${BRAND}: ${esc(c.name)}">`,'<meta name="twitter:card" content="summary_large_image">',`<meta name="twitter:image" content="${SITE}/og.png">`,`<meta name="twitter:title" content="${esc(c.title)}">`,`<meta name="twitter:description" content="${esc(c.desc)}">`,`<script type="application/ld+json">${schema(k,r,l,date,models)}</script>`,'<!--/seo-->'].join('\n');}
function fill(h,id,content,tag='div'){const start=new RegExp('<'+tag+'\\b[^>]*\\bid="'+id+'"[^>]*>').exec(h);if(!start)throw Error('Missing rendering target '+id);const from=start.index+start[0].length,tokens=new RegExp('</?'+tag+'\\b[^>]*>','g');tokens.lastIndex=from;let depth=1,m;while(m=tokens.exec(h)){depth+=m[0].startsWith('</')?-1:1;if(!depth)return h.slice(0,from)+content+h.slice(m.index);}throw Error('Unclosed rendering target '+id);}
const app=src.match(/<script>([\s\S]*?)<\/script>/)[1],steps=vm.runInNewContext('('+app.match(/const GSTEPS=([\s\S]*?);\nconst GKEY/)[1]+')');
function body(k,r,l){const p=type(k,r);let h=src.replace(/<section class="page" data-page="([a-z]+)"( id="calc")?( hidden)?>/g,(_,x,id='')=>`<section class="page" data-page="${x}"${id}${x===p?'':' hidden'}>`);
 h=fill(h,'home',render.homeRenderer(src));
 h=h.replace(/<article class="ga" data-g="([a-z-]+)"( hidden)?>/g,(_,g)=>`<article class="ga" data-g="${g}"${p==='gids'&&g===k.slice(5)?'':' hidden'}>`);
 let models=null;if(p==='modellen'){models=cards[l](r.category);h=fill(h,'mList',models.cards);h=fill(h,'mIntro',esc(r.intro||r.desc),'p');h=fill(h,'mAdvice',esc(r.advice||''),'p');h=fill(h,'mCat',[['all','Alle'],['trekker','Trekker'],['bakwagen','Bakwagen'],['bestel','Bestelbus'],['bus','Bus']].map(([cat,label])=>{const q=cat==='all'?routes.modellen:routes['modellen/'+cat];return`<a href="${q.path}" data-mcat="${cat}"${cat===(r.category||'all')?' aria-current="page"':''}>${label}</a>`}).join(''));h=h.replace(/(<span[^>]*id="mCount"[^>]*>)[\s\S]*?<\/span>/,(_,a)=>a+models.groups.length+' modellen</span>');h=h.replace(/(<section class="page" data-page="modellen"[^>]*>[\s\S]*?<h1[^>]*>)[\s\S]*?<\/h1>/,(_,a)=>a+esc(r.name)+'</h1>');}
 h=fill(h,'gTl',Object.entries(routes).filter(([x])=>x.startsWith('gids/')).map(([key,g],i)=>`<li><a href="${g.path}"><small>${String(i+1).padStart(2,'0')}</small><b>${esc(g.name)}</b></a></li>`).join(''),'ol');
 h=fill(h,'gSt',steps.map((s,i)=>`<li><button type="button" class="gck" data-gst="${i}" aria-pressed="false" aria-label="${esc(s[0])}"></button><div><b>${esc(s[0])}</b><p>${esc(s[1])}</p><a href="${s[2]}">${esc(s[3])}</a></div></li>`).join(''),'ol');
 h=h.replace('<html lang="nl"','<html lang="'+l+'"'+(l==='en'?' data-static-lang="en"':''));
 h=h.replace(/<html\b[^>]*>/,tag=>/\bclass=/.test(tag)?tag:tag.replace('>',' class="fresh">'));
 if(l==='en'){const a=h.indexOf('<body>')+6,b=h.lastIndexOf('</body>');h=h.slice(0,a)+render.translateHTML(h.slice(a,b),translate,routes)+h.slice(b);}
 h=h.replace(/<a\b[^>]*\bdata-lang="(nl|en)"[^>]*>/g,(tag,x)=>tag.replace(/href="[^"]*"/,'href="'+(x==='en'?r.enPath:r.path)+'"').replace(/\saria-current="page"/g,'').replace(/>$/,x===l?' aria-current="page">':'>'));
 return{html:h,models};}
const writeAsset=createAssetWriter(ROOT),pending=[],schemas={nl:{},en:{}},entries=[],buildState={};
for(const [k,r]of Object.entries(routes)){
 if(!r.path||!r.enPath||!r.en?.title)throw Error('Incomplete bilingual route '+k);
 for(const l of ['nl','en']){
  let {html,models}=body(k,r,l);
  const u=url(r,l),hash=crypto.createHash('sha1').update(JSON.stringify(l==='en'?r.en:r)+contentOf(html,k,r)).digest('hex').slice(0,12);
  const date=previous[u]?.hash===hash?previous[u].date:today;
  buildState[u]={date,hash};
  schemas[l][new URL(u).pathname]=JSON.parse(schema(k,r,l,date,models));
  html=html.replace(/<!--seo-->[\s\S]*?<!--\/seo-->/,()=>head(k,r,l,date,models));
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
fs.writeFileSync(path.join(ROOT,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'+entries.join('\n')+'\n</urlset>\n');
fs.writeFileSync(path.join(ROOT,'404.html'),`<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>Pagina niet gevonden | ${BRAND}</title><style>body{max-width:48rem;margin:15vh auto;padding:24px;font:18px/1.6 system-ui;background:#f3f3f0;color:#15171a}a{color:#07734a}h1{line-height:1.2}</style></head><body><p>${BRAND} · 404</p><h1>Deze pagina bestaat niet</h1><p>Ga naar de <a href="/">calculator</a>, <a href="/modellen/">elektrische modellen</a> of de <a href="/overstapgids/">overstapgids</a>.</p><section lang="en"><h2>Page not found</h2><p>Try the <a href="/en/">calculator</a>, <a href="/en/models/">electric models</a> or <a href="/en/switching-guide/">switching guide</a>.</p></section></body></html>`);
console.log(`${Object.keys(routes).length*2} bilingual pages generated; ${entries.length} canonical URLs in sitemap.`);
