# SEO and publishing

`_src/index.html` is the editable source of the application. The root `index.html` is generated, just like the other routes. Its `seo` JSON block defines each page’s Dutch path, English path, titles, descriptions and category. The public site is generated with Node.js, without a server or package installation.

```
node scripts/i18n.cjs
node scripts/seo.mjs
node --test tests/*.test.cjs tests/*.test.mjs
node scripts/seo.mjs
```

Commit the source changes and generated output. The existing SEO workflow also regenerates the pages after changes to `_src/index.html`, build helpers or translation inputs; its permissions are unchanged.

## URLs and languages

Dutch pages keep their existing paths. English pages use `/en/` and English slugs, for example `/en/models/vans/` and `/en/switching-guide/charging/`. Language is determined by the URL. A saved browser preference never changes the language of a canonical page. Old `?lang=en` links redirect in the browser, retaining calculation state and fragments.

The language links are real links. A normal click also carries the current calculation to the other language. Every generated page has a self-referencing canonical and reciprocal `nl`, `en` and `x-default` alternatives. Internal navigation stays in the selected language.

## Content and rendering

The homepage and model cards are rendered into the initial HTML using the application’s own renderer and default calculation. This preserves the first-paint layout and makes content available before JavaScript. English pages are translated at build time from the same reviewed dictionary used by the application. A snapshot prevents translated source text from being translated a second time during hydration.

Model category pages contain the actual category’s vehicles, configuration controls and a short explanation. They are not automatically created keyword pages. Keep every card’s existing battery, price and range assumptions; do not invent offers, reviews or ratings for structured data.

Structured data describes the organization, website, page, breadcrumb trail, guide articles and free calculator. Model lists use `CollectionPage` and `ItemList`. FAQ content is ordinary page content; do not promise FAQ rich results. Detailed personalized results are `noindex,follow` and excluded from the sitemap.

`lastmod` changes only when a page’s content or metadata changes. Repeated builds preserve dates. Font files are self-hosted under `assets/fonts/` with their SIL Open Font License files. Keep those assets when changing deployment. Advertising JavaScript loads only when an ad slot is configured.

## Search intent

The direct Google Keyword Planner research of 29 October 2026 uses Netherlands volume bands, with Trends, search-result checks and a small Search Console baseline. Autocomplete suggestions are not search-volume measurements. See `docs/content-strategy.md` for the content mapping. Do not infer that one synonym dominates nationally from suggestion order or a few site impressions.

## Technical delivery

Every generated URL contains its own page content, and guide URLs contain only the selected guide. The editable single-file source remains in `_src/index.html`; it is excluded from GitHub Pages together with build helpers, tests and internal documentation.

Styles, the unchanged calculator code and the existing application shell are emitted as content-hashed files under `assets/site/`. They can be reused from browser cache across routes. Ordered deferred scripts restore missing application sections before initialization. This preserves existing calculator state and client-side navigation, while each initial HTTP response remains route-specific and readable without JavaScript. Hydration still downloads and restores the full application: the smaller HTML response does not mean a 95% reduction in first-visit total transfer or a measured Core Web Vitals improvement.

Canonical URLs, reciprocal language alternatives, social metadata, structured data and index/noindex remain generated for every route. Structured data and Twitter metadata now follow client-side navigation as well. Guide Article headlines match visible headings; the advice page also describes its actual service. No fabricated product offers, ratings or FAQ-rich-result promises are added.

`tests/technical-seo.test.cjs` checks every Dutch and English route, route isolation, real files and fragment targets, asset hashes, executable scripts and HTML byte budgets. CI builds the actual publication and runs both CJS and MJS test suites. Stable line endings keep generated assets consistent between Windows and Linux.

Old published hashed assets should be retained during deployments so cached HTML can still load its matching files. Do not manually edit generated assets. The stable authoring source and build helpers produce them.

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
