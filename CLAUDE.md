# recipes.lsdmt.me

Personal recipe site at https://recipes.lsdmt.me. Astro static site, auto-deployed to Cloudflare Pages from `seanGSISG/recipes`. Includes installable PWA + Cook Mode for hands-free kitchen use.

## Project Structure

```
recipes/
├── src/
│   ├── content/
│   │   └── recipes/<slug>.md         # ONE FILE PER RECIPE — schema-validated
│   ├── content.config.ts             # Zod schema (instructions[] in frontmatter)
│   ├── pages/
│   │   ├── index.astro               # responsive grid + search/filter
│   │   └── recipes/[slug]/
│   │       ├── index.astro           # detail page (Shopping list + numbered Instructions + Cook button)
│   │       └── cook.astro            # Cook Mode → /recipes/<slug>/cook/
│   ├── layouts/
│   │   ├── Layout.astro              # site shell
│   │   └── CookLayout.astro          # fullscreen dark Cook Mode shell
│   ├── lib/
│   │   ├── format.ts                 # qty pretty-printer (½, ⅓, etc)
│   │   ├── md.ts                     # inline markdown (**bold**, *italic*) for instruction strings
│   │   ├── scale.ts                  # shared client-side serving scaler
│   │   ├── timer-detect.ts           # regex → wraps "5 min" mentions in clickable chips
│   │   └── cook-runtime.ts           # Cook Mode controller (steps + timers + wake-lock)
│   └── styles/
│       ├── global.css
│       └── cook.css                  # Cook Mode-only styles
├── public/
│   ├── images/recipes/<slug>.jpg     # AI-generated dish photos (gpt-image-1 jpeg)
│   ├── icon-192.png, icon-512.png, icon-512-maskable.png  # PWA icons
│   └── apple-touch-icon.png
├── docs/cook-on-hub-max.md           # phone + Hub Max kitchen workflow
├── scripts/gen-icons.mjs             # one-shot icon resizer (sharp)
├── astro.config.mjs                  # Astro + @vite-pwa/astro integration
├── .npmrc                            # legacy-peer-deps=true (vite-pwa peer caps at Astro 5)
└── .github/workflows/deploy.yml      # CF Pages auto-deploy via wrangler-action
```

## Key Context

- **Host**: Cloudflare Pages, auto-deploy on push to `main` (GHA → wrangler)
- **Domain**: recipes.lsdmt.me (CNAME to `recipes-6ts.pages.dev`); CF Access **Bypass** app `aae6a2fa-…` overrides the `*.lsdmt.me Services` wildcard so the site is fully public
- **Build cmd**: `npm run build` → `dist/` (vite-pwa emits `manifest.webmanifest`, `sw.js`, `workbox-*.js`)
- **Node**: ≥22 (Astro 6)
- **Image source**: OpenAI `gpt-image-1` (1024×1024, `output_format: "jpeg"`). Key in `~/command-center/.secrets.env` as `OPENAI_API_KEY`
- **Skill**: `~/.claude/skills/recipe-publish/SKILL.md` is the canonical add/update/delete entrypoint

## Recipe schema (frontmatter)

See `src/content.config.ts` for the authoritative Zod schema. **Required**: `title`, `description`, `servings`, `ingredients[]` (structured), `instructions[]` (string array), `createdAt`. The `ingredients` array MUST use the structured form (`{qty, unit, item, note}`) — never plain bullets — because client-side scaling depends on it. Use `qty: null` for "to taste" items.

The `instructions` array is the single source of truth for both the detail page numbered list and the Cook Mode step-at-a-time view. Each entry is one step; bold the action verb at the start (`"**Sauté the mushrooms.** While the water boils…"`).

## Body sections (markdown)

Body is now optional; holds context the cook page doesn't need:
- `## Equipment` — bulleted list
- `## Notes` — tips, substitutions, food-safety warnings, pairing suggestions

Shopping list and numbered instructions render automatically — never duplicate them in the body.

## Cook Mode

Route: `/recipes/<slug>/cook/`. Fullscreen dark UI, screen wake-lock active, swipe/keyboard nav (← → Space N P Esc), ingredients matched to each step automatically, time mentions ("5 min", "10-12 minutes") become clickable chips that fire chime + vibration + notification on completion. Designed to be cast from Android Chrome to a Nest Hub Max — phone is the controller, Hub is the readable display. See `docs/cook-on-hub-max.md`.

## PWA

`@vite-pwa/astro@1.2`. Installable via Chrome's "Add to Home screen". `display: standalone`, theme `#b04a2f`. Workbox precaches HTML/CSS/JS; recipe images runtime-cached (CacheFirst, 200 entries × 30 days). `navigateFallback: null` because every URL has a real precached HTML file. `legacy-peer-deps=true` in `.npmrc` because @vite-pwa/astro's peer dep caps at Astro 5.

## Verification

```bash
npm run build     # schema errors fail loudly; vite-pwa emits sw.js + manifest.webmanifest
npm run preview   # http://localhost:4321 — confirm scaler, Cook button, /cook/ page, timers
```
