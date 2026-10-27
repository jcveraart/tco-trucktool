# 06 · Parameters en standaardwaarden

Alle getallen die het model nodig heeft, met waar ze vandaan komen. Drie soorten:

- **Calculator:** dezelfde waarde als op stekkerofdiesel.nl (in `index.html` en Supabase, feitencheck 23 oktober 2026). Bij een wijziging op de site verandert de vlootanalyse mee; houd die twee gelijk.
- **Aanname:** een redelijke startwaarde die we per klant of na de eerste klanten bijstellen.
- **Klant:** komt altijd van de klant; geen standaardwaarde.

Bedragen exclusief btw. Stand van 27 oktober 2026; controleer regelingen en tarieven vóór elk rapport.

---

## Voertuigen per soort

Standaardwaarden van de calculator (`VT` in `index.html`). In een vlootanalyse vervangen we ze zoveel mogelijk door klantdata en de modellencatalogus.

| Parameter | Trekker | Bakwagen | Bestelbus | Bus | Eenheid |
| --- | --- | --- | --- | --- | --- |
| Kilometers per jaar | 100.000 | 50.000 | 30.000 | 70.000 | km |
| Waarvan op het heffingsnet | 75.000 | 40.000 | 0 | 0 | km |
| Inzetdagen | 250 | 250 | 230 | 300 | dagen per jaar |
| Afschrijvingstermijn | 6 | 7 | 5 | 10 | jaar |
| Restwaarde, diesel en elektrisch | 20 | 20 | 20 | 20 | % |
| Aanschaf diesel | 130.000 | 95.000 | 45.000 | 280.000 | € |
| Aanschaf elektrisch | 285.000 | 240.000 | 60.000 | 520.000 | € |
| Verbruik diesel | 30 | 25 | 9 | 32 | l/100 km |
| Verbruik elektrisch | 115 | 100 | 25 | 120 | kWh/100 km |
| Bruikbare accu | 540 | 300 | 70 | 450 | kWh |
| Verzekering diesel | 7.000 | 4.500 | 2.000 | 8.000 | €/jaar |
| Verzekering elektrisch | 9.500 | 6.500 | 2.500 | 10.000 | €/jaar |
| Onderhoud diesel | 0,12 | 0,10 | 0,06 | 0,20 | €/km |
| Onderhoud elektrisch | 0,08 | 0,06 | 0,04 | 0,14 | €/km |
| Meerkilometerprijs lease | 0,05 | 0,05 | 0,07 | 0,06 | €/km |

Plausibele bandbreedtes voor de controle van klantdata (grenzen van de invoervelden in de calculator): trekker 20 tot 45 l/100 km en 70 tot 180 kWh/100 km; accu's van 30 tot 900 kWh.

Per type (merk, model, uitvoering): accu bruikbaar en bruto, bereik, verbruik, DC- en MCS-laadvermogen, massa en indicatieve prijs uit de modellencatalogus (`data/vehicles_catalog.json`, `vehicle_models` in Supabase). Regels voor bruto en netto staan in [model-data.md](../model-data.md).

---

## Kilometerheffing en tol

**Nederlandse vrachtwagenheffing 2026** (calculator, `HEF`), per km op het heffingsnet:

| Toegestane maximummassa | Diesel (CO₂-klasse 1) | Zero-emissie (CO₂-klasse 5) |
| --- | --- | --- |
| tot 12 ton | 0,113 | 0,025 |
| 12 tot 18 ton | 0,160 | 0,035 |
| 18 tot 32 ton | 0,182 | 0,037 |
| boven 32 ton | 0,201 | 0,038 |

**Buitenland** (calculator, `TOL`), €/km:

| Gebied | Elektrisch | Diesel | Opmerking |
| --- | --- | --- | --- |
| Vlaanderen | 0,038 | 0,286 | Elektrisch tarief is een schatting |
| Wallonië | 0,205 | 0,205 | Indicatief |
| Frankrijk | 0,30 | 0,30 | Gemiddeld tarief tolwegen |
| Duitsland | 0 | 0,348 | Elektrisch vrijgesteld tot 1 juli 2031 |
| Italië | 0,20 | 0,20 | Gemiddeld |
| Polen | 0,13 | 0,13 | Gemiddeld |
| Oostenrijk | 0,119 | 0,572 | 2026, 4 of meer assen |

In het model per jaar: $`\tau^{H}_{m,y}`$ en $`\tau^{\text{tol}}_{m,\text{land},y}`$. Voor jaren na 2026 de tarieven van 2026 aanhouden tot er nieuwe zijn, of indexeren als scenario.

---

## Energie

| Parameter | Waarde | Soort | Toelichting |
| --- | --- | --- | --- |
| Dieselprijs | 2,03 €/l | Calculator (live, CBS 19-10-2026) | Excl. btw. Tabel `live_prices` in Supabase. |
| Stroom op eigen terrein | 0,25 €/kWh | Calculator | Klantcontract heeft voorrang. |
| Korting slim laden | 0,03 €/kWh | Calculator | Alleen in de calculator; in het model volgt het voordeel uit het laadschema. |
| ERE-opbrengst | 0,10 €/kWh | Calculator | Netto, per kWh geleverd aan het voertuig op eigen geregistreerde laadpunten. |
| Openbaar snelladen | 0,55 €/kWh | Calculator | Per aanbieder of abonnement verschillend. |
| Tijdverlies onderweg laden | 6 min per 100 km | Calculator | Alleen voor de quickscan; het model rekent met de laadkansen zelf. |
| Kosten stilstand chauffeur en wagen | 60 €/uur | Calculator | $`c^{\text{chf}}`$ in het model. |
| Zonnepanelen opbrengst | 900 kWh per kWp per jaar | Calculator (PVGIS) | Profiel per dag uit de dagopbrengst. |
| Kostprijs eigen zonnestroom | 0,06 €/kWh | Calculator | Voor de quickscan; het model rekent de investering zelf. |
| CO₂ diesel | 3,27 kg/l | Calculator (bron tot wiel) | $`\gamma^D`$ |
| CO₂ grijze stroom | 0,48 kg/kWh | Calculator | $`\gamma^E`$; lager bij groene stroom of eigen zon. |

---

## Laadinfrastructuur en net

| Parameter | Waarde | Soort | Toelichting |
| --- | --- | --- | --- |
| Investering laadpaal (voorbeeld) | 15.200 € | Calculator | Voorbeeld voor een DC-laadpunt. |
| Netaansluiting en voorbereiding | 5.000 € | Calculator | |
| Onderhoud en beheer per laadpunt | 400 €/jaar | Calculator | $`O^{\text{lp}}`$ |
| Vaste netkosten | 600 €/jaar | Calculator | Extra vaste kosten van een aansluiting. |
| AC 22 kW, geïnstalleerd | 2.500 € | Aanname | Offertes vragen. |
| Laadmanagement depot | 3.000 € | Aanname | |
| Levensduur laadpunt | 10 jaar | Aanname | $`\text{LT}_q`$ |
| Rendement net naar accu, depot | 0,92 | Aanname | $`\eta^c_q`$; AC meestal iets lager dan DC. |
| Rendement snelladen | 0,95 | Aanname | $`\eta^c_s`$ |

**Aansluitwaarden ter oriëntatie** (driefase, 400 V, $`P \approx \sqrt{3} \cdot 400 \cdot I`$):

| Aansluiting | Vermogen |
| --- | --- |
| 3x25A | ca. 17 kW |
| 3x35A | ca. 24 kW |
| 3x50A | ca. 35 kW |
| 3x63A | ca. 44 kW |
| 3x80A (grootste kleinverbruik) | ca. 55 kW |
| Grootverbruik | opgegeven in kVA (bijvoorbeeld 160, 250, 400, 630, 1.000 kVA); in kW ongeveer gelijk |

Kosten en tarieven van verzwaring, kW-maximum en gecontracteerd vermogen ($`I^{\text{net}}`$, $`F^{\text{net}}`$, $`\theta^{\max}`$, $`\theta^{\text{ctr}}`$) verschillen per netbeheerder: uit het tarievenblad van de netbeheerder van de klant. Wachttijd $`y^{\min}`$: uit wat de netbeheerder de klant heeft gezegd, anders uit de capaciteitskaart, als scenario.

---

## Subsidies en fiscaal

**AanZET 2026** (calculator, `AZT`): percentage van de aanschafprijs, met een maximum per voertuig, $`S^{AZ} = \min(\text{pct} \cdot \text{Pr}, \max)`$.

| Bedrijfsgrootte | N3 (boven 12 ton) | N2 (vanaf 10.000 kg) |
| --- | --- | --- |
| Groot | 11,1%, max 43.900 € | 6,1%, max 15.200 € |
| Middelgroot | 21%, max 83.200 € | 12%, max 29.900 € |
| Klein of non-profit | 29%, max 115.200 € | 14,8%, max 36.900 € |

Bedrijfsgrootte: groot vanaf 250 FTE of meer dan 50 miljoen omzet; middelgroot onder 250 FTE en onder 50 miljoen; klein onder 50 FTE en onder 10 miljoen. De najaarsronde 2026 (29 september tot 16 oktober) is gesloten; de volgende ronde wordt rond half maart 2027 verwacht. Aanvragen vóór de koopovereenkomst. Kans op toekenning $`\rho_n`$: aanname per ronde (overtekening).

**MIA en Vamil** (calculator): MIA-aftrek 36% over 90% van de aanschafprijs, voordeel = aftrek × Vpb-tarief (19% of 25,8%). Niet te combineren met AanZET. Elektrische bestelbussen staan niet op de Milieulijst 2026. Vamil-percentage en Milieulijstcode per jaar nagaan bij RVO.

**SPRILA 2026** (calculator): vast bedrag per laadpunt, voor een DC-laadpunt van 50 kW 9.760 € (mkb) of 4.880 € (groot), begrensd op 40% respectievelijk 20% van de kosten, minimaal 2.500 €. Andere vermogens: bedragen uit de regeling.

**Overige regels om per klant na te gaan** (niet als vast getal in het model):

- extra toegestane massa voor zero-emissievrachtwagens (voor $`\phi`$, laadvermogen);
- rijbewijs B voor elektrische bestelbussen tot 4.250 kg en de voorwaarden daarvoor;
- overgangsregels zero-emissiezones per euroklasse (zie de [gids](https://stekkerofdiesel.nl/overstapgids/zero-emissiezones/)).

---

## Financiering

| Parameter | Waarde | Soort |
| --- | --- | --- |
| Gefinancierd deel | 80% | Calculator |
| Rente lening | 6% | Calculator |
| Rendement eigen geld | 4% | Calculator |
| Rekenrente $`r`$ | 0,8 × 6% + 0,2 × 4% = **5,6%** | Afgeleid; klant kan eigen waarde geven |
| Opslag bij geschatte leaseprijs | 7% | Calculator (beheer, risico, marge) |

---

## Prijzen en prijspaden

Het model rekent per jaar met een prijspad. Standaard reëel (zonder inflatie) met een reële rekenrente; drie paden als scenario's:

| Grootheid | Laag | Basis | Hoog | Opmerking |
| --- | --- | --- | --- | --- |
| Diesel | −15% | huidige prijs, plus accijnswijziging 2027 als die doorgaat | +15% | Accijnsvoorstel 2027 wordt 12 november 2026 besloten (zie de [nieuwspagina](https://stekkerofdiesel.nl/nieuws/)). |
| ETS2 op diesel vanaf 2028 | lage CO₂-prijs | middel | hoge CO₂-prijs | Aanname: opslag ≈ CO₂-prijs × 2,65 kg CO₂ per liter (uitlaat). |
| Stroom depot | −20% | contract klant | +30% | Bij dynamisch: profiel per representatieve dag. |
| Snelladen | −10% | 0,55 €/kWh | +20% | |
| Restwaarde elektrisch na afschrijvingstermijn | 10% | 20% | 30% | Grootste onzekerheid in de TCO van elektrische vrachtwagens. |
| Aanschaf elektrisch | −5% per jaar | −2% per jaar | gelijk | Prijsdaling door schaal; aanname. |

---

## Modelaannames (te kalibreren)

| Parameter | Waarde | Symbool | Toelichting |
| --- | --- | --- | --- |
| Tijdstap | 15 minuten | $`\Delta t`$ | Strategisch eventueel 60 minuten. |
| Representatieve dagen | 6 tot 12, plus 4 extreem | $`\mathcal{D}`$ | Zie [02 · Data](02-data.md#6-representatieve-dagen). |
| Horizon | 10 jaar | $`H`$ | |
| Ontwerp-gezondheid accu | 0,85 | $`h_m`$ | Accu aan het eind van de inzet. |
| Laagste laadtoestand | 0,10 | $`\underline{u}_m`$ | Reserve bij aankomst. |
| Hoogste laadtoestand depot | 1,00 | $`\overline{u}_m`$ | Van de bruikbare capaciteit. |
| Hoogste laadtoestand onderweg | 0,80 | $`\overline{u}^{\text{rt}}_m`$ | |
| Knikpunt laadcurve | 0,80 | $`\kappa_m`$ | DC; bij AC 22 kW nauwelijks relevant. |
| Wintertoeslag verbruik | 15 tot 30% bij 0 °C | $`\beta_4`$ | Hoger voor stadsdistributie en bestelbussen. |
| Marge ritgeschiktheid | 10% | | Alleen voor haalbaarheid, niet voor kosten. |
| Reservevoertuigen | 5% | $`r^{\text{res}}_m`$ | Onderhoud en storing. |
| Effectief snellaadvermogen | 0,8 × min(lader, voertuig) × beschikbaarheid | $`P^{\text{rt}}_s`$ | Beschikbaarheid 0,7 zonder, 1,0 met reservering. |
| Maximale omrijafstand naar snellader | 5 km | | |
| Kleurgrenzen ritgeschiktheid | groen vanaf 97%, oranje vanaf 85% | | |
| Optimaliteitsgat | 1% | | |
