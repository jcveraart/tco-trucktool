const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'_src/index.html'),'utf8');
const D=JSON.parse(fs.readFileSync(path.join(root,'data/translations.en.json'),'utf8'));
const runtime=fs.readFileSync(path.join(root,'scripts/locale-runtime.js'),'utf8');
function translator(lang){const c={document:{documentElement:{lang}},window:{},SOD_EN:D};vm.runInNewContext(runtime.slice(0,runtime.indexOf(' const seen='))+'})();',c);return c.window.sodText;}
const en=translator('en');
test('all executable inline scripts compile and reviewed translations are embedded',()=>{
 for(const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){if(/type="application\//.test(m[1]))continue;assert.doesNotThrow(()=>new vm.Script(m[2]));}
 const embedded=html.match(/const SOD_EN=([^\n]+);\n/)[1];assert.deepEqual(JSON.parse(embedded),D);
 assert.ok(html.replace(/\r\n/g,'\n').includes(runtime.replace(/\r\n/g,'\n')));assert.doesNotMatch(html,/sbp_[a-f0-9]{20}/);
});
test('both language number formats preserve calculation precision',()=>{
 const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
 const f=script.slice(script.indexOf('const $=id=>'),script.indexOf('const reduced='));
 const nf=lang=>vm.runInNewContext(f+';nf',{document:{documentElement:{lang}}});
 assert.equal(nf('nl')(42000),'42.000');assert.equal(nf('en')(42000),'42,000');
 assert.equal(nf('nl')(.25,2),'0,25');assert.equal(nf('en')(.25,2),'0.25');
});
test('brand names and Dutch source copy are preserved',()=>{
 const nl=translator('nl');for(const s of ['Stekker of Diesel','Volvo FH Aero Electric','IVECO S-eWay','EN','NL'])assert.equal(en(s),s);
 for(const s of Object.keys(D))assert.equal(nl(s),s);
});
test('dynamic outputs read as English with interpolated values intact',()=>{
 assert.equal(en('Wat als'),'What if');assert.equal(en('Elektrisch goedkoper vanaf'),'Electric is cheaper from');assert.equal(en('Goedkoper vanaf'),'Cheaper from');assert.equal(en('Periode'),'Period');
 assert.equal(en('Je dagrit past, met 120 km over.'),'Your daily route fits, with 120 km to spare.');
 assert.equal(en('Over 6 jaar betaal je € 5,000 rente, en aan het eind € 2,000 slottermijn. Exclusief btw, onderhoud en verzekering.'),'Over 6 years you pay € 5,000 in interest, plus a € 2,000 final payment. Excludes VAT, maintenance and insurance.');
 assert.equal(en('capaciteit na 6 jaar · actieradius ± 400 km in plaats van 500 km'),'capacity after 6 years · range about 400 km instead of 500 km');
 assert.equal(en('De RDW is nu niet bereikbaar. Probeer het later opnieuw.'),'RDW is currently unavailable. Please try again later.');
});
test('all fallback model descriptions and verified price notes have reviewed English copy',()=>{
 const models=JSON.parse(html.match(/const MODELS=(\[[\s\S]*?\]);/)[1]);
 for(const m of models){assert.ok(D[m.n],m.b+' '+m.m);if(m.pt&&m.pt.startsWith('Vanafprijs'))assert.ok(D[m.pt],m.m+' price note');}
 const prices=JSON.parse(fs.readFileSync(path.join(root,'data/vehicle_prices.json'),'utf8')).prices;
 for(const p of prices){assert.ok(D[p.indicative_price_text]);assert.equal(models.find(m=>(m.b+' '+m.m).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')===p.id).price,p.indicative_price_eur);}
});

