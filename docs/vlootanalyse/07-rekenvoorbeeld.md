# 07 · Rekenvoorbeeld: drie bakwagens

Een kleine vloot, met de hand en met een LP doorgerekend, om te laten zien wat het model doet en waarom de vlootvragen (aansluiting, onderweg laden) het antwoord bepalen. Het laadschema is na te rekenen met [`rekenvoorbeeld.py`](rekenvoorbeeld.py) (open-source solver HiGHS, draait in een paar seconden).

---

## 1. De situatie

Distributiebedrijf, klein (onder 50 medewerkers), één depot met een kleinverbruikaansluiting van **3x80A, ongeveer 55 kW**. Drie diesel-bakwagens van 18 ton die vervangen moeten worden. Elke bakwagen rijdt elke werkdag dezelfde dienst:

| Dienst | Weg van het depot | Km per dag | Bijzonderheid |
| --- | --- | --- | --- |
| D1 | 06:00 tot 15:00 | 180 | |
| D2 | 05:00 tot 17:00 | 260 | Verplichte pauze 10:30 tot 11:15 bij een snellader op de route |
| D3 | 07:00 tot 16:00 | 120 | |

Gebouw: 20 kW overdag (07:00 tot 18:00), 5 kW 's nachts. Laadpunten: AC 22 kW.

Kandidaat elektrisch: een bakwagen met 300 kWh bruikbare accu (de standaard van de calculator). Ontwerpcapaciteit 85% daarvan (accu aan het eind van zijn leven): 255 kWh. Met 10% reserve onderin blijft **229,5 kWh** om mee te rijden.

Verbruik:

- voor de ritgeschiktheid (zware winterdag, inclusief 10% marge): **1,20 kWh/km**;
- voor de kosten (jaargemiddelde, zoals de calculator): **1,00 kWh/km**.

---

## 2. Laag 1: ritgeschiktheid

Op de zware winterdag:

| Dienst | Nodig | Past in 229,5 kWh? | Met laden in de pauze |
| --- | --- | --- | --- |
| D1 | 180 × 1,20 = 216 kWh | Ja, 13,5 kWh over | n.v.t. |
| D2 | 260 × 1,20 = 312 kWh | **Nee**, 82,5 kWh tekort | 45 min × 120 kW × 0,95 = 85,5 kWh erbij: **ja** |
| D3 | 120 × 1,20 = 144 kWh | Ja | n.v.t. |

Zonder onderweg laden is D2 met dit type dus rood; met laden in de pauze groen. Dat is de schakelaar "onderweg laden" uit [04 · Bedrijfsvarianten](04-bedrijfsvarianten.md#1-onderweg-laden), en in het model de parameter $`\Omega^{\text{rt}}`$.

Een controle die de voorbewerking alleen grof doet en het model precies: komt de accu van D2 vóór de pauze niet onder de reserve? D2 rijdt 5,5 uur vóór de pauze, verbruikt ongeveer 152,5 kWh en komt aan op 102,5 kWh. Laden tot hoogstens 80% (204 kWh) laat ruimte voor de 85,5 kWh. Na de pauze is er 159,5 kWh nodig en komt hij terug met 28,5 kWh, net boven de reserve van 25,5 kWh. Het LP vindt hetzelfde.

---

## 3. Laag 2: past het laden op het depot?

Per voertuig is genoeg tijd (D1 en D3 staan 15 uur, D2 12 uur op het depot; met 22 kW is dat ruim). De vraag is of het **samen** door de aansluiting past. Uitkomst van `rekenvoorbeeld.py` voor de zware winterdag:

| Scenario | Elektrisch | Laagst mogelijke piek (slim laden) | Piek bij dom laden | Past op 55 kW? |
| --- | --- | --- | --- | --- |
| A. Geen onderweg laden | D1, D3 | 32,6 kW | 64,0 kW | Slim: ja. Dom: nee |
| B. Laden in de pauze | D1, D2, D3 | 49,6 kW | 86,0 kW | Slim: ja, met 5,4 kW over. Dom: nee |
| D2 zonder onderweg laden | D2 | ondoenlijk | | |

*Dom laden* is: elk voertuig laadt bij aankomst op vol vermogen tot het vol is. Om 17:00 staan dan drie wagens op 22 kW plus 20 kW gebouw: 86 kW, ver boven de aansluiting. *Slim laden* (laadmanagement) spreidt het over de nacht en blijft onder 55 kW.

Dit is het soort uitkomst dat je per voertuig nooit ziet: drie wagens die elk "prima elektrisch kunnen", en een aansluiting die het alleen aankan als het laden gestuurd wordt. Zonder laadmanagement zou dit depot moeten verzwaren naar grootverbruik, wat in een gebied met netcongestie jaren kan duren.

---

## 4. Laag 3: de kosten

Per jaar, eenvoudig gerekend zoals de calculator (geen rente, afschrijving in 7 jaar tot 20% restwaarde, 250 werkdagen). Aannames: diesel 25 l/100 km tegen 2,03 €/l; stroom op het depot 0,25 €/kWh met 8% laadverlies; snelladen 0,55 €/kWh met 5% verlies; ERE 0,10 €/kWh over wat op eigen terrein in de accu gaat; onderhoud 0,10 en 0,06 €/km; verzekering 4.500 en 6.500 €/jaar; heffing over 80% van de kilometers tegen 0,182 en 0,037 €/km; aanschaf 95.000 en 240.000 euro; AanZET 29% (klein bedrijf, N3) = 69.600 euro.

| Per jaar | D1 diesel | D1 elektrisch | D2 diesel | D2 elektrisch | D3 diesel | D3 elektrisch |
| --- | --- | --- | --- | --- | --- | --- |
| Kilometers | 45.000 | 45.000 | 65.000 | 65.000 | 30.000 | 30.000 |
| Aanschaf (afschrijving na subsidie) | 10.857 | 17.486 | 10.857 | 17.486 | 10.857 | 17.486 |
| Energie (na ERE) | 22.837 | 7.728 | 32.988 | 14.268 | 15.225 | 5.152 |
| Onderhoud | 4.500 | 2.700 | 6.500 | 3.900 | 3.000 | 1.800 |
| Verzekering | 4.500 | 6.500 | 4.500 | 6.500 | 4.500 | 6.500 |
| Kilometerheffing | 6.552 | 1.332 | 9.464 | 1.924 | 4.368 | 888 |
| **Totaal** | **49.247** | **35.746** | **64.309** | **44.078** | **37.950** | **31.826** |
| **Besparing** | | **13.501** | | **20.231** | | **6.124** |

Bij D2 zit in de energie 7.625 kWh per jaar snelladen in de pauze (op een gemiddelde dag 30,5 kWh): 4.414 euro.

Laadpunten (aanname): AC 22 kW voor 2.500 euro per stuk geïnstalleerd, laadmanagement 3.000 euro, afgeschreven in 10 jaar, beheer 400 euro per laadpunt per jaar. Voor twee laadpunten 1.600 euro per jaar, voor drie 2.250 euro.

| Scenario | Besparing voertuigen | Laadpunten | **Netto besparing per jaar** |
| --- | --- | --- | --- |
| A. Geen onderweg laden (D1, D3 elektrisch) | 19.625 | 1.600 | **18.025** |
| B. Laden in de pauze (alle drie) | 39.856 | 2.250 | **37.606** |

Laden in de pauze toestaan is in dit voorbeeld bijna 20.000 euro per jaar waard. Dat getal hoort in het rapport naast de vraag die de klant zichzelf moet stellen: wil ik dat mijn chauffeur in de pauze laadt?

---

## 5. Wat het volledige model hier zou kiezen

In de notatie van [03 · Model](03-model.md), scenario B, jaar 1:

| Variabele | Waarde | Betekenis |
| --- | --- | --- |
| $`z_{v,1}`$ | 0 voor alle drie (verkocht eind jaar 0) | De diesels gaan eruit, mits de restwaarde dat niet tegenhoudt |
| $`b_{k,\text{depot},\text{koop},1}`$ | 3 | Drie elektrische bakwagens gekocht |
| $`x^{AZ}_{k,\text{depot},n}`$ | 3 | AanZET voor alle drie in de ronde vóór aankoop |
| $`\alpha_{j,k}`$ | 1 voor D1, D2, D3 | Alle diensten elektrisch |
| $`\sigma_{D2,k,\text{pauze}}`$ | 1 | D2 laadt in de pauze |
| $`\lambda_{j,k,\text{AC22}}`$ | 1 | Alle drie aan AC 22 kW |
| $`u_{\text{depot},\text{AC22},1}`$ | 3 | Drie laadpunten |
| $`g_{\text{depot},\ell_0,1}`$ | 1 | Huidige aansluiting blijft |
| $`P^{\text{pk}}`$ | 49,6 kW op de zware dag | Onder de 55 kW |

Het echte model rekent met contante waarden over 10 jaar, de restwaarde van de huidige diesels, en het beste jaar per voertuig. Als de diesels nog een paar jaar mee kunnen, kan het bijvoorbeeld D2 een jaar later vervangen omdat die het meeste oplevert maar de huidige diesel nog de hoogste restwaarde heeft; dat volgt uit de afweging, niet uit een vuistregel.

---

## 6. Wat dit voorbeeld laat zien

1. **Per voertuig klopt, samen niet.** Elk voertuig past, maar dom laden gaat over de aansluiting heen.
2. **Een bedrijfskeuze bepaalt het antwoord.** Onderweg laden ja of nee scheelt een derde voertuig en bijna 20.000 euro per jaar.
3. **Marges zijn eerlijk.** De winterdag met marge laat D1 nog maar 13,5 kWh over; dat is groen, maar het rapport zegt erbij dat een nog zwaardere dag krap wordt.
4. **De wiskunde blijft klein.** Het laadschema van dit voorbeeld heeft ongeveer duizend variabelen; HiGHS lost het in een fractie van een seconde op.
