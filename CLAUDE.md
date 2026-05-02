# recipes.lsdmt.me

Personal recipe site. Astro static site auto-deployed to Cloudflare Pages.

## Project Structure

```
recipes/
├── src/
│   ├── content/
│   │   ├── recipes/<slug>.md       # ONE FILE PER RECIPE — schema-validated
│   │   └── content.config.ts       # Zod schema (in src/content.config.ts)
│   ├── pages/
│   │   ├── index.astro             # responsive grid + search/filter
│   │   └── recipes/[slug].astro    # detail page with serving scaler
│   ├── layouts/Layout.astro
│   ├── components/                 # (currently inline; expand if needed)
│   ├── lib/format.ts               # qty pretty-printer (½, ⅓, etc)
│   └── styles/global.css
├── public/images/recipes/<slug>.jpg  # AI-generated images
├── astro.config.mjs                  # site URL + trailingSlash + dir format
└── package.json
```

## Key Context

- **Host**: Cloudflare Pages, auto-deploy on push to `main`
- **Domain**: recipes.lsdmt.me (CNAME to `<project>.pages.dev`)
- **Build cmd**: `npm run build` → `dist/`
- **Node**: ≥22 (Astro 6 requirement)
- **Image source**: OpenAI `gpt-image-1` (1024×1024). Key in `~/command-center/.secrets.env` as `OPENAI_API_KEY`
- **Skill**: `~/.claude/skills/recipe-publish/SKILL.md` is the canonical add/update/delete entrypoint

## Recipe schema (frontmatter)

See `src/content.config.ts` for the authoritative Zod schema. Required fields: `title`, `description`, `servings`, `ingredients[]`, `createdAt`. The `ingredients` array MUST use the structured form (`{qty, unit, item, note}`) — never plain bullets — because client-side scaling depends on it. Use `qty: null` for "to taste" items.

## Body sections (markdown)

Body conventionally contains H2 sections in this order: **Equipment**, **Instructions** (numbered), **Notes**. The Shopping list is rendered automatically from frontmatter — don't repeat it in the body.

## Verification

```bash
npm run build   # schema errors fail loudly
npm run preview # http://localhost:4321 — confirm scaler + checkbox + print preview
```
