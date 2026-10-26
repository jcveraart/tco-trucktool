# Website languages

Dutch is served on the existing paths; English has its own URLs under `/en/`. For example, `/modellen/bestelbussen/` and `/en/models/vans/` are language counterparts. The URL controls the language so search engines and visitors receive consistent content. Old `?lang=en` and `?lang=nl` calculation links remain compatible through a state-preserving browser redirect.

The compact NL / EN links carry the current calculation when clicked normally and work as ordinary language links without JavaScript. Model names, brands, entered values and source URLs are preserved. English still uses Dutch market and regulatory assumptions, euros and kilometres.

English copy lives in `data/translations.en.json`. New static page metadata has both languages in the `seo` JSON block in `index.html`. The `scripts/locale-runtime.js` runtime translates dynamic calculator content. `scripts/seo-render.cjs` uses the same translation function and app renderers to build initial HTML. Already translated text is recorded before hydration to prevent double translation.

After changing copy, run `node scripts/i18n.cjs`, `node scripts/seo.mjs` and `node --test tests/*.test.cjs`. See [SEO and publishing](seo.md) for the full workflow. Keep the source dictionary, embedded dictionary and generated language pages in sync.
