# Website languages

The website supports Dutch (default) and English. The small NL / EN header control retains the calculation, model selection and current route. Explicit `?lang=nl` or `?lang=en` overrides the locally saved preference. Shared calculation links include the selected language.

Reviewed English copy lives in `data/translations.en.json`. Dutch copy remains beside its existing interface or data definition in `index.html`. Model names, brands, input values, code snippets and source URLs are preserved. Both languages use the same calculation and Dutch regulatory assumptions; English is a language option, not a change of country.

Number formatting follows the language: Dutch `42.000` and `0,25`, English `42,000` and `0.25`. Editable calculator values are parsed accordingly. Amounts remain in euros and distances in kilometres.

After changing English copy or `scripts/locale-runtime.js`, run:

```
node scripts/i18n.cjs
node --test tests/*.test.cjs
node scripts/seo.mjs
```

The existing SEO workflow regenerates all direct-entry pages from `index.html`. Keep the embedded dictionary in sync before committing. New or changed interface copy needs an English entry, including help text, error states and dynamic sentences. Put interpolated sentence patterns in the locale runtime. Do not translate model identifiers or canonical Supabase column names.

Vehicle price evidence is recorded separately in `data/vehicle_prices.json` and its numbered SQL migration. Prices refer to matching battery versions, exclude VAT, and retain original source and verification dates. A price on request is preferable to inventing a list price.
