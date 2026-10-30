# Technische SEO-audit — 30 oktober 2026

## Uitgevoerd

- Alle 25 routes in Nederlands en Engels gecontroleerd: 50 HTML-documenten, waarvan 48 in de sitemap. De uitgebreide persoonlijke berekening blijft `noindex,follow`.
- Iedere HTTP-respons bevat de eigen pagina, met alleen het betreffende gidsartikel. De andere app-secties worden uit een gedeeld bestand hersteld vóór de bestaande applicatie start.
- Gedeelde CSS en JavaScript staan in bestanden met inhoudshashes. Scripts laden in vaste volgorde met `defer`. Eerste inhoud, cataloguskaarten, koppen en links zijn beschikbaar zonder JavaScript.
- Nederlandse pagina's laden alleen de taalbediening zonder de Engelse woordenlijst: het betreffende script is 9.045 in plaats van 244.869 bytes. Engelse pagina's behouden de volledige vertaling; de taalwissel is in de browser getest.
- De homepage-HTML daalde van 914.132 bytes in de openbare nulmeting naar circa 43.600 bytes, ongeveer 95% kleiner vóór compressie. De laadgids bevat circa 38.100 bytes HTML; de volledige catalogus circa 143.700 bytes vanwege de echte voertuigkaarten.
- Dit is geen reductie van 95% in het totale eerste bezoek: de volledige app wordt nog geladen en hersteld. De gedeelde code kan bij vervolgbezoeken en andere routes uit de browsercache komen. GitHub Pages bepaalt de HTTP-cacheduur.
- Zelfverwijzende canonicals, wederzijdse hreflang-verwijzingen en index/noindex zijn gecontroleerd. Social metadata en structured data volgen nu ook navigatie binnen de app.
- Article-headlines sluiten aan op de zichtbare gidstitel. De adviespagina beschrijft de daadwerkelijk aangeboden dienst met Service-structured data. Er zijn geen reviews, prijzen of beoordelingen verzonnen.
- Alle interne paden, fragmenten en lokale afhankelijkheden worden gecontroleerd. Een onbekend publiek pad retourneert een echte HTTP 404.
- `_src`, helpers, tests en documentatie zijn uitgesloten van de publieke GitHub Pages-build. De klantpagina's en rapportfunctie blijven beschikbaar.
- De publicatie- en testworkflow gebruiken nu alle bron- en vertaalinputs. Zowel CJS- als MJS-tests draaien mee. Een bouwmanifest houdt wijzigingsdatums ook voor noindex-routes stabiel.
- De applicatiecode is vergeleken met de voorgaande publicatie. Alleen twee regels voor het bijwerken van metadata zijn gewijzigd; de calculator, voorbeeldparameters en voertuigdata zijn niet aangepast.

## Google-controles

Search Console toonde op 30 oktober een succesvol gelezen `/sitemap.xml` met 48 ontdekte pagina's, laatst gelezen op dezelfde dag. Een nieuwe dubbele sitemapinzending is daarom niet nodig.

Het pagina-indexeringsrapport vermeldde als rapportupdate 23 oktober 2026 en meldde één geïndexeerde pagina en acht keer 'Gecrawld - momenteel niet geïndexeerd'. Voorbeelden bevatten crawldatums van 24 en 25 oktober. Dit is achterlopende rapportage, geen actuele telling van alle 48 landingspagina's en geen bewezen technische blokkade. De uitgebreide berekening is bovendien bewust niet voor indexering bedoeld.

De afzonderlijke URL-inspectie bevestigt dat `/vlootanalyse/` al geïndexeerd is. De live test op 30 oktober om 12:08 meldt 'URL is beschikbaar voor Google' en 'Pagina kan worden geïndexeerd', met één geldig broodkruimelitem. De nieuwe technische opbouw is dus ook door Google's eigen fetch gecontroleerd.

De [PageSpeed-nulmeting op mobiel](https://pagespeed.web.dev/analysis/https-stekkerofdiesel-nl/ve4th0yduf?form_factor=mobile) gaf prestaties 94, toegankelijkheid 100, praktische tips 100 en SEO 100. LCP en FCP waren afgerond 2,2 s, TBT 0 ms en CLS 0. Dit is één laboratoriummeting met gesimuleerd mobiel apparaat en langzaam 4G, geen veldmeting of rankinggarantie. PageSpeed en Search Console hadden onvoldoende echte gebruikersgegevens voor een Core Web Vitals-oordeel.

De [meting na publicatie op mobiel](https://pagespeed.web.dev/analysis/https-stekkerofdiesel-nl/7ms8w0lw2a?form_factor=mobile), om 12:08, gaf prestaties **97**, toegankelijkheid **100**, praktische tips **100** en SEO **100**. LCP en FCP waren afgerond **1,7 s**, TBT **10 ms**, CLS **0** en Speed Index **4,3 s**. Scores kunnen tussen runs schommelen; deze twee metingen bewijzen geen gegarandeerd effect bij alle bezoekers.

De publieke nacontrole heeft alle 50 pagina's en 17 bestanden/statuscontroles zonder fouten afgerond. Canonicals, index/noindex, pagina-isolatie en lokale bestanden zijn gecontroleerd op de daadwerkelijk gepubliceerde responses. Bron, helpers, tests en documentatie geven publiek 404; robots.txt en sitemap.xml geven 200. De GitHub-testworkflow slaagt met 36 tests; de calculator is ook volledig doorlopen tot en met de uitgebreide resultaten.

PageSpeed noemt nog cacheduur, renderblokkerende CSS en ongebruikte CSS/JavaScript als verbetermogelijkheden. GitHub Pages bepaalt de cacheheaders. De volledige interactieve applicatie wordt nog hersteld voor navigatie en berekeningen; deze audit claimt geen volledige uitsplitsing van alle code per functie of een perfecte prestatiescore. Zulke verdere wijzigingen vragen een aanvullende afweging tussen complexiteit, regressierisico en gemeten opbrengst.

## Open punt: domein en HTTPS

De apex `https://stekkerofdiesel.nl/` heeft een werkende HTTPS-verbinding. HTTP geeft nog 200 in plaats van een HTTPS-redirect. `https://www.stekkerofdiesel.nl/` faalt certificaatvalidatie. Het huidige CNAME-record voor `www` verwijst naar `stekkerofdiesel.nl`; GitHub schrijft een directe verwijzing naar `jcveraart.github.io` voor.

GitHub weigert momenteel `https_enforced=true` met 'The certificate has not finished being issued'; de certificaatstatus is `dns_changed`. Er is niets geforceerd of omzeild. De eigenaar heeft aangegeven de Strato/DNS-correctie nu niet te willen uitvoeren. Deze instelling is dus niet als opgelost gerapporteerd. Pas na een gewenste DNS-correctie en succesvolle certificaatuitgifte kan HTTPS worden afgedwongen en kunnen alle vier domeinvarianten opnieuw worden gecontroleerd.

## Praktische grens

Technische geschiktheid maakt indexering en rankings niet afdwingbaar. Volg na hercrawlen de landingspagina's en Nederlandse zoekopdrachten. Gebruik afgeronde berekeningen en gekwalificeerde aanvragen als resultaat; een Lighthouse-score is geen maat voor omzet of concurrentiekracht. Bouw inhoudelijke autoriteit met betrouwbare bronnen en echte deskundigheid, zonder betaalde linkspam of automatische dunne pagina's.

## Officiële referenties

- [Google: JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google: Article-structured data](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Google: pagina-ervaring](https://developers.google.com/search/docs/appearance/page-experience)
- [Google: sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [GitHub: domeinconfiguratie](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [GitHub: HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
