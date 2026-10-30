// Keep the static response specific to its route. Restore the existing application
// shell before its unchanged scripts run, so calculator state and SPA navigation work.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function createAssetWriter(root) {
 const directory=path.join(root,'assets','site');fs.mkdirSync(directory,{recursive:true});
 return (label,extension,content)=>{
  const hash=crypto.createHash('sha256').update(content).digest('hex').slice(0,16);
  const name=`${label}.${hash}.${extension}`;
  fs.writeFileSync(path.join(directory,name),content);
  return '/assets/site/'+name;
 };
}

const sections=html=>[...html.matchAll(/<section class="page" data-page="([a-z]+)"[^>]*>[\s\S]*?\n<\/section>/g)];
export function createShell(html,lang,write,schemas={}){
 const pages=Object.fromEntries(sections(html).map(m=>[m[1],m[0]]));
 const payload=JSON.stringify(pages).replace(/</g,'\\u003c');
 const code=`window.SOD_PAGE_SCHEMA=${JSON.stringify(schemas).replace(/</g,'\\u003c')};\n(()=>{const pages=${payload};const app=document.getElementById('app');for(const [key,markup]of Object.entries(pages)){let page=app.querySelector('.page[data-page="'+key+'"]');if(!page){const t=document.createElement('template');t.innerHTML=markup;page=t.content.firstElementChild;page.hidden=true;app.append(page)}else if(key==='gids'){const t=document.createElement('template');t.innerHTML=markup;for(const article of t.content.querySelectorAll('article[data-g]'))if(!page.querySelector('article[data-g="'+article.dataset.g+'"]')){article.hidden=true;page.querySelector('.gm').append(article)}}}})();`;
 return write('shell-'+lang,'js',code);
}

export function optimizePage(html,key,shell,write){
 const page=key.startsWith('gids/')?'gids':key.startsWith('modellen/')?'modellen':key;
 html=html.replace(/<section class="page" data-page="([a-z]+)"[^>]*>[\s\S]*?\n<\/section>/g,(markup,name)=>{
  if(name!==page)return '';
  if(page==='gids')return markup.replace(/<article class="ga" data-g="([a-z-]+)"[^>]*>[\s\S]*?<\/article>/g,(article,guide)=>guide===key.slice(5)?article:'');
  return markup;
 });
 // This is required before all deferred application scripts, not an async race.
 html=html.replace('<script id="meten">',`<script defer src="${shell}"></script>\n<script id="meten">`);
 let scriptNumber=0,styleNumber=0;
 html=html.replace(/<style([^>]*)>([\s\S]*?)<\/style>/g,(_,attrs,css)=>{
  const href=write('styles-'+(++styleNumber),'css',css.trim());
  return `<link rel="stylesheet" href="${href}"${attrs}>`;
 });
 html=html.replace(/<script([^>]*)>([\s\S]*?)<\/script>/g,(markup,attrs,code)=>{
  if(/\b(?:src|type)=/.test(attrs)||/id="(?:sod-language|consent-default)"/.test(attrs)||!code.trim())return markup;
  const src=write('runtime-'+(++scriptNumber),'js',code.trim());
  return `<script${attrs} defer src="${src}"></script>`;
 });
 return html.replace(/[\t ]+$/gm,'');
}
