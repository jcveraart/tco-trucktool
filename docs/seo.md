# SEO and publishing

`index.html` remains the source of the application. Its `seo` JSON block defines each page’s Dutch path, English path, titles, descriptions and category. The public site is generated with Node.js, without a server or package installation.

```
node scripts/i18n.cjs
node scripts/seo.mjs
node --test tests/*.test.cjs
node scripts/seo.mjs
```

Commit the source changes and generated output. The existing SEO workflow also regenerates the pages after changes to `index.html` or `scripts/seo.mjs`; its permissions are unchanged.

## URLs and languages

Dutch pages keep their existing paths. English pages use `/en/` and English slugs, for example `/en/models/vans/` and `/en/switching-guide/charging/`. Language is determined by the URL. A saved browser preference never changes the language of a canonical page. Old `?lang=en` links redirect in the browser, retaining calculation state and fragments.

The language links are real links. A normal click also carries the current calculation to the other language. Every generated page has a self-referencing canonical and reciprocal `nl`, `en` and `x-default` alternatives. Internal navigation stays in the selected language.

## Content and rendering

The homepage and model cards are rendered into the initial HTML using the application’s own renderer and default calculation. This preserves the first-paint layout and makes content available before JavaScript. English pages are translated at build time from the same reviewed dictionary used by the application. A snapshot prevents translated source text from being translated a second time during hydration.

Model category pages contain the actual category’s vehicles, configuration controls and a short explanation. They are not automatically created keyword pages. Keep every card’s existing battery, price and range assumptions; do not invent offers, reviews or ratings for structured data.

Structured data describes the organization, website, page, breadcrumb trail, guide articles and free calculator. Model lists use `CollectionPage` and `ItemList`. FAQ content is ordinary page content; do not promise FAQ rich results. Detailed personalized results are `noindex,follow` and excluded from the sitemap.

`lastmod` changes only when a page’s content or metadata changes. Repeated builds preserve dates. Font files are self-hosted under `assets/fonts/` with their SIL Open Font License files. Keep those assets when changing deployment. Advertising JavaScript loads only when an ad slot is configured.

## Keyword research (Google Autocomplete, October 2026)

Method: harvested 824 unique Dutch suggestions from Google's own autocomplete endpoint (`suggestqueries.google.com`, hl=nl, gl=nl) from 21 seed terms plus question prefixes and letter expansions. Suggestion order and recurrence are a popularity signal, not exact volumes. Findings applied to titles and guide content:

- **Kilometerheffing dominates.** Searchers say "kilometerheffing", not "vrachtwagenheffing": *kilometerheffing berekenen*, *hoeveel kilometerheffing vrachtwagen*, *wat kost kilometerheffing vrachtwagen*, *kilometerheffing welke wegen*, *hoe wordt kilometerheffing gecontroleerd*. The toll guide now leads with "kilometerheffing" and answers the roads and enforcement questions.
- **Range is asked per vehicle type, especially vans:** *elektrische bestelbus met grootste actieradius*, *welke elektrische bestelbus heeft de grootste actieradius*. The range guide names the actual longest-range models from the live catalogue.
- **Subsidy is asked as an amount:** *hoeveel subsidie elektrische vrachtwagen*. The grants guide heading now asks that question above the AanZET table.
- **Charging is asked as where/cost:** *waar elektrische vrachtwagen laden*, *wat kost het om een elektrische vrachtwagen op te laden*. Covered by the charging guide title and content.
- **"Vlootanalyse" itself is barely searched** (no autocomplete suggestions; Search Console shows only a handful of impressions). Demand exists as *wagenpark elektrisch* and *tco vrachtwagen*. Keep the fleet page, but let the homepage and calculator carry the TCO wording.
- Notable unmet demand for later: per-model searches (*elektrische vrachtwagen mercedes*, *actieradius elektrische volvo vrachtwagen*) — these argue for individual model pages, which do not exist yet.

Search Console (first data): queries *vlootanalyse*, *emissieloze vrachtauto laden*, *elektrische vrachtwagen actieradius*, *kilometerheffing vrachtwagens* show impressions but zero clicks, i.e. positions beyond the first results. Thin guide articles (170–250 words) against complete official pages are the main content gap; every generated page also ships the full app shell (~837 KB, content of all pages in every URL), which dilutes per-page relevance until the shell is split per route.

## Search Console

Submit `https://stekkerofdiesel.nl/sitemap.xml` in the existing property. After a deployment, inspect representative Dutch and English URLs, check the live page and request indexing where useful. A sitemap submission and an indexing request do not guarantee indexing or a position in search results.

Review these reports monthly: Pages (indexing and canonical issues), Sitemaps (fetch errors), Performance (query and landing-page impressions, clicks and CTR), and Core Web Vitals (when sufficient real-user data exists). Compare equivalent periods and filter by page and country. Use calculator starts, completed calculations and qualified enquiries as business outcomes; page views alone do not establish success.

## Hosting checks

Use the HTTPS apex domain consistently. In GitHub Pages settings, enable **Enforce HTTPS**. Check the DNS and certificate for `www` and let GitHub redirect it to the apex domain. These are hosting settings, not changes to HTML. Do not add JavaScript redirects as a replacement for proper HTTP redirects.

## Sources

- [Google: multilingual sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)
- [Google: localized page versions](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Google: JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google: canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [GitHub Pages: HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
- [GitHub Pages: custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
