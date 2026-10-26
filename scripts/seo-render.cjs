// Build-time rendering uses the same reviewed translations and card renderer as the app.
const vm=require('node:vm');
function makeTranslator(dictionary,runtime){const c={document:{documentElement:{lang:'en'}},window:{},SOD_EN:dictionary};const end=runtime.indexOf(' const seen=');if(end<0)throw Error('Locale runtime contract changed');vm.runInNewContext(runtime.slice(0,end)+'})();',c);return c.window.sodText;}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const decode=s=>s.replace(/&(?:amp|nbsp|lt|gt|quot|apos|#39|#x[0-9a-f]+|#\d+);/gi,x=>{const m={'&amp;':'&','&nbsp;':'\u00a0','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&#39;':"'"};return m[x]??String.fromCodePoint(parseInt(x.slice(2,-1).replace(/^x/i,''),/^&#x/i.test(x)?16:10));});
function localHref(href,routes,lang){if(!href.startsWith('/')||href.startsWith('//'))return href;const u=new URL(decode(href),'https://stekkerofdiesel.nl'),r=Object.values(routes).find(r=>r.path===u.pathname||r.enPath===u.pathname);return r?(lang==='en'?r.enPath:r.path)+u.search+u.hash:href;}
function translateHTML(html,t,routes){
 const stack=[],voids=new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));let out='',last=0;
 const tokens=/<!--[\s\S]*?-->|<(script|style|textarea|pre|code)\b[^>]*>[\s\S]*?<\/\1\s*>|<\/?[a-zA-Z](?:[^>"']|"[^"]*"|'[^']*')*>/gi;
 const text=s=>{if(stack.some(x=>x.skip))return s;const n=decode(s),model=stack.some(x=>x.model),v=model?n.replace(/\b([RSLP])-serie elektrisch\b/g,'$1-series Electric').replace(/nieuwe generatie/g,'next generation').replace(/\(Europa\)/g,'(Europe)'):t(n);return v===n?s:esc(v)};
 for(const m of html.matchAll(tokens)){out+=text(html.slice(last,m.index));let tag=m[0];last=m.index+tag.length;if(/^<!--|^<(script|style|textarea|pre|code)\b/i.test(tag)){out+=tag;continue}const name=tag.match(/^<\/?([\w-]+)/)[1].toLowerCase();if(/^<\//.test(tag)){const i=stack.map(x=>x.name).lastIndexOf(name);if(i>=0)stack.length=i;out+=tag;continue;}
 const skip=/\bdata-no-translate\b|\bdata-lang=|class="[^"]*\bmbrand\b/.test(tag),parentSkip=stack.some(x=>x.skip);
 tag=tag.replace(/\b(href|aria-label|title|placeholder|data-tt|alt)="([^"]*)"/g,(_,a,v)=>a+'="'+esc(a==='href'?localHref(v,routes,'en'):skip||parentSkip?decode(v):t(decode(v)))+'"');
 out+=tag;if(!voids.has(name)&&!tag.endsWith('/>'))stack.push({name,skip,model:/class="[^"]*\bmcn\b/.test(tag)});
 }return out+text(html.slice(last));
}
function modelRenderer(src,lang){
 const app=src.match(/<script>([\s\S]*?)<\/script>/)[1],fields=app.slice(app.indexOf('const FIELDS='),app.indexOf('const TOLC=')),format=app.slice(app.indexOf('const $=id=>'),app.indexOf('const reduced=')),records=app.slice(app.indexOf('const MODELS=['),app.indexOf('let mCat=')),helpers=app.slice(app.indexOf('const mU='),app.indexOf('function modelOptions')),cards=app.slice(app.indexOf('const mNorm='),app.indexOf('function mInfo'));
 const code=fields+'\nconst F={};FIELDS.forEach(f=>F[f[0]]=f);\n'+format+'\n'+records+'\n'+helpers+'\nlet mVar={},mSel=[];\n'+cards+'\n({MODELS,mGroups,mCard})';
 const c=vm.runInNewContext(code,{document:{documentElement:{lang}}});
 return cat=>{const list=c.MODELS.filter(m=>!cat||m.c===cat).sort((a,b)=>b.r-a.r||(a.b+' '+a.m).localeCompare(b.b+' '+b.m));const groups=c.mGroups(list),max=Math.max(...list.map(m=>m.r));return{models:list,groups,cards:groups.map(g=>c.mCard(g.k,g.vs,g.top,max)).join('')}};
}
function homeRenderer(src){
 const a=src.match(/<script>([\s\S]*?)<\/script>/)[1],fields=a.slice(a.indexOf('const FIELDS='),a.indexOf('const TOLC=')),defs=a.slice(a.indexOf('const VT='),a.indexOf('const $=id=>')),format=a.slice(a.indexOf('const $=id=>'),a.indexOf('const reduced=')),support=a.slice(a.indexOf('const T=()=>'),a.indexOf('const TIPS=')),calc=a.slice(a.indexOf('const CAT='),a.indexOf('const CATX=')),home=a.slice(a.indexOf('const HICON='),a.indexOf('let hPaint='));
 const icon=a.match(/const ICON=([\s\S]*?);\n/)[0],vcards=a.match(/const vcards=([^\n]+)\n/)[0];
 const document={documentElement:{lang:'nl'},addEventListener(){},getElementById(id){return{value:({reg:'az',cls:'N3',nw:'n'})[id]??this.values[id]??0,checked:id==='aERE'}}};
 const code=fields+'\n'+defs+'\n'+format+'\nlet hc=null;const values=Object.fromEntries(FIELDS.map(f=>[f[0],f[6]]));Object.assign(values,VT.trekker.p);document.values=values;const v=id=>+document.getElementById(id).value||0,ck=id=>document.getElementById(id).checked;\n'+support+'\n'+calc+'\n'+icon+'\n'+vcards+'\nconst plateForm=()=>"";\n'+home+'\n({html:homeHTML(),r:calc(),max:Math.max(hAt(HKM.trekker[1]).td,hAt(HKM.trekker[1]).te),eur})';
 const x=vm.runInNewContext(code,{document});let h=x.html;
 h=h.replace('id="hkD"></b>','id="hkD">'+x.eur(x.r.td)+'</b>').replace('id="hkE"></b>','id="hkE">'+x.eur(x.r.te)+'</b>').replace('id="hkT"></p>','id="hkT">Verschil: <b>'+x.eur(Math.abs(x.r.td-x.r.te))+'</b></p>');
 for(const [k,n]of [['d',x.r.td],['e',x.r.te]])h=h.replace('data-bar="'+k+'"','data-bar="'+k+'" style="width:'+Math.min(100,n/x.max*100)+'%"');
 return h.replace('data-vt="trekker" aria-checked="false"','data-vt="trekker" aria-checked="true"')+'<noscript><p class="wrap">De rekentool heeft JavaScript nodig. Je kunt de modellen en overstapgids ook zonder JavaScript bekijken.</p></noscript>';
}
module.exports={makeTranslator,translateHTML,modelRenderer,homeRenderer,localHref,esc};
