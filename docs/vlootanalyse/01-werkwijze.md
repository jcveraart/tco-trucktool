# 01 · Werkwijze: van aanvraag tot vlootplan

Stand 27 oktober 2026. De eerste versie is een begeleide analyse, geen automatische online vlootoptimizer. De geteste referentie staat in [05](05-oplossen.md); de toekomstige strategie in [03](03-model.md).

## 1. Wat we leveren

| Product | Benodigde gegevens | Verdedigbare uitkomst |
|---|---|---|
| Kostenoriëntatie | Voertuigen, jaar-km, verbruik, contracten/offertes | TCO-bandbreedte en meetvragen; geen groen actieradiusoordeel |
| Begeleide pilot | Eén depot, vergelijkbare voertuigen, vaste of begrensde routegroepen, echte ritten en laadvensters | Ritgeschiktheid met voorwaarden, laadplan, kosten/kasstromen en uitzonderingen |
| Vlootplan | Pilotgegevens plus meterdata, netcontract, bewezen uitvoering en chronologische validatie | Onderbouwde vervangvolgorde en uitvoeringsstappen, na menselijke controle |
| Monitoring | Nieuwe meetdata en vastgestelde afspraken | Plan versus praktijk en herberekening; geen ongevraagde werknemersmonitoring |

Start bij voorkeur met 5–20 voertuigen die regelmatig op één depot terugkomen. Dit is een gekozen scope, geen universele marktgrens. Internationaal meerdaags werk, thuisladen, complexe koeling/PTO en batterij/zon vragen aanvullende gegevens en eigen tests. Zet klantdata, offertes en prijsafspraken niet in deze openbare repository.

## 2. Het traject in tien stappen

| Stap | Werk | Bewijs/uitkomst |
|---|---|---|
| 0 | Aanvraag opvolgen | Verantwoordelijke medewerker en bevestigde melding/werkvoorraad |
| 1 | Kennismaking en scope | Beslisvraag, geschikte eerste inzetgroep, onbekende voorwaarden |
| 2 | Voorstel en data-afspraken | Product, prijs, planning, privacyrollen en bevoegdheden |
| 3 | Beveiligde data-intake | Originele bestanden, eenheden, tijdzone, dekking en herkomst |
| 4 | Opschonen | Versiebeheer, kwaliteitsrapport en expliciete correcties |
| 5 | Kosten- en ritscreening | Bevestigd/geschat/onbekend; alternatieven en meetvragen |
| 6 | Laadplan en financiële scenario's | Fysieke connectoren, werkelijke netgrens, kasstromen |
| 7 | Replay en onafhankelijke controle | Alle beschikbare opeenvolgende dagen en verklaarde uitzonderingen |
| 8 | Praktijkcontrole, rapport en bespreking | Passende proefrit/laadsessie en tweede beoordelaar |
| 9 | Nazorg | Afspraken voor uitvoering, meting en actualisatie |

### Stap 0: aanvraag

De website slaat contactaanvragen op in `fleet_requests`. De database-insert bewijst geen e-mailmelding of opvolging. Controleer vóór klantwerving de daadwerkelijk uitgerolde RLS, een ontvangst-ID, meldingen en een eigenaar van de werkvoorraad. De belofte van reactie binnen één werkdag moet organisatorisch worden gedekt.

Een client-side honeypot is geen serverbeveiliging. Een productie-intake vraagt een serverfunctie met validatie, begrenzing van aanvragen en idempotentie. De referentie is geen implementatie van die infrastructuur; verifieer dit afzonderlijk voor livegebruik.

### Stap 1: kennismaking

Bepaal de beslisvraag, uitvoeringen, planningsgroepen, rijpatroon en werkelijk beschikbare reserve/charterdekking. Stop of beperk de scope als ritten, technische eigenschappen of laadlocaties niet bevestigd kunnen worden. Een interessante kostenbesparing rechtvaardigt geen onhaalbare rit.

### Stap 2: voorstel en afspraken

Leg scope, output, beperkingen, prijs, verwacht overleg en benodigde data vast. Een doorlooptijd start na bruikbare intake, niet automatisch bij het eerste contact. Een volledig vlootplan in één dag is een te meten verbeterdoel; de oorspronkelijke trajectinschatting telde al circa 12–21 werkuren vóór nazorg.

### Stap 3: data-intake

Gebruik de sjablonen uit [02](02-data.md). Laat bronbestanden ongewijzigd en bewaar afgeleide versies met reden en datum. Bestanden gaan via afgeschermde, klantgebonden opslag, niet via analytics of de openbare repository.

### Stap 4: opschonen

Reconcilieer voertuigen, kilometers, tankvolumes en energiemeting. Gaten worden gemarkeerd en niet als nulverbruik of stilstand ingevuld. Laat belangrijke aannames door de klant bevestigen.

### Stap 5: quickscan

Kostenoriëntatie kan met jaargegevens. Dagelijkse ritgeschiktheid vereist ritten/stops en passende uitvoeringsgegevens. Een fictieve langste dag uit een factor op gemiddelde km is geen haalbaarheidsbewijs.

### Stap 6: optimalisatie en scenario's

Vergelijk eerst concrete plannen. Minimaal: basis, geen ERE, geen subsidie, lagere laadprestatie, zwaardere dag, kritieke lader uit en upgrade later. Extra wachttijd is alleen toegestaan als de hele dienst en de klanttijdvensters opnieuw worden gecontroleerd.

### Stap 7: controle

Doe chronologische replay op een periode buiten de kalibratie waar mogelijk. Iedere uitzondering krijgt reden, noodoplossing, beschikbare capaciteit en kosten. De norm wordt per klant gekozen; 97% is geen automatisch groen oordeel.

### Stap 8: rapport en bespreking

Vergelijk ten minste één passende praktijkdienst en laadsessie met het plan voordat het als gevalideerd klantadvies wordt gepresenteerd. Een tweede beoordelaar controleert input, oplossing en formulering van de conclusie.

### Stap 9: nazorg

Leg vast wanneer offertes, prijzen, routes en regels opnieuw worden gecontroleerd. Monitoring gebruikt nieuwe gegevens alleen binnen de afgesproken doelen en toegang.

## 3. Vragenlijst kennismaking

Vraag naar doel en beslisdatum; eigendom, lease-einde en inbegrepen diensten; werkelijke uitvoeringen, payload en opbouw; vaste/flexibele routegroepen; normale en uitzonderlijke dagen; toegestane laadplekken; reservewagens en charterafspraken; netcontract en meterdata; beschikbare exports en verantwoordelijke voor aanlevering.

Bepaal bedrijfsgrootte met de toepasselijke mkb-regels, inclusief balanstotaal en partner-/verbonden ondernemingen. Alleen FTE en omzet is onvoldoende. Vraag rechtsvorm en fiscale benutbaarheid als belastingvoordeel in de vergelijking komt.

## 4. Opbouw van het rapport

1. Besluit en belangrijkste voorwaarden, met een eerstvolgende stap.
2. Beschikbare data, ontbrekende gegevens en correcties.
3. Ritgeschiktheid en de concrete niet-passende dagen.
4. Laadplan op gewone en zware dagen, aansluiting en connectoren.
5. Jaar-TCO, NCW, kasstromen en maximale financieringsbehoefte, duidelijk onderscheiden.
6. Subsidie-/contractvoorwaarden met bron en datum.
7. Scenario's, nooddekking en kosten van uitzonderingen.
8. Uitvoeringsstappen, proefresultaten en actualisatiemoment.
9. Bijlage met volledige invoer-, model- en bronversies.

Toon geen bedragen op de euro als onderliggende offertes ontbreken. Onbekende data krijgen een vraag of voorwaardelijk oordeel.

## 5. Controlelijst voor oplevering

- Originele bronnen en versies zijn herleidbaar; ontbrekende voertuigen/ritten/intervalmetingen verklaard.
- Voertuiguitvoering, AC/DC-acceptatie, payload, opbouw en prijsgrondslag bevestigd.
- Tijdas, eenheden en bestaande zon/EV-lading zijn gecontroleerd.
- Reserve is een expliciet geheel aantal of bevestigde externe dekking.
- Geen fictieve meerkilometers bij koop of verdwenen leaseverplichtingen op de horizon.
- Geen gratis fallback op extreme dagen.
- Chronologische energiebalans, laadvensters, connectoren en netgrens onafhankelijk geverifieerd.
- Geen subsidie of ERE als gegarandeerd inkomen zonder aanspraak/contract.
- Uitzonderingen zijn verklaard, beschikbaar gedekt en geprijsd.
- Praktijkcontrole en tweede beoordeling vastgelegd.

## 6. Privacy, afspraken en aansprakelijkheid

Ritgegevens met voertuigcodes kunnen nog steeds herleidbaar zijn. Vraag alleen noodzakelijke gegevens; geen chauffeursnamen of volledige GPS-sporen als ritsamenvattingen volstaan. Een code is pseudonimisering, geen automatische anonimiteit.

Wie doel en middelen bepaalt, bepaalt de privacyrol. Leg per opdracht vast of Stekker of Diesel verwerker, verantwoordelijke of een andere rol heeft. Een verwerkersovereenkomst alleen maakt de gegevensverstrekking niet automatisch rechtmatig. Beoordeel doelen, bevoegdheid, toegang, subverwerkers, bewaartermijn en verwijdering met de klant. [EU-uitleg rollen](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/application-gdpr_en).

Bewaar klantdata afgeschermd en gescheiden van site/analytics. Test verwijderen van originele én afgeleide bestanden en regel back-ups. Laat voorwaarden en aansprakelijkheidsafspraken juridisch beoordelen; een generieke limiet tot factuurbedrag is geen vaststaand passend beding voor iedere opdracht.

Onafhankelijkheid blijft expliciet: geen ongemelde merkvoorkeur of commissie. Vergoedingen en samenwerking worden vooraf duidelijk gemaakt.

## 7. Gereedschap

Python en de geteste referentie voor deelberekeningen; een afgeschermde productieomgeving voor klantwerk; versieerbare invoer en rapporten; onafhankelijke controle. HiGHS kan commercieel worden gebruikt onder zijn licentie. De beperkte/academische Gurobi-licentie is geen commerciële productielicentie.

## 8. Groeipad

De poorten zijn bewijsstukken, geen vaste belofte van een paar weken: eerst consistente referentietests; dan bruikbare import en kwaliteitsrapport; dan twee begeleide pilots met praktijkcontrole; vervolgens gemeten tijd, correcties, klantbesluit en kostprijs. Automatiseer pas de stappen die daarin bewezen zijn. Zie [08](08-correcties-en-acceptatie.md).

