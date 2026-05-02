# recipes.lsdmt.me

Personal recipe collection — clean, minimal, scaleable.

Live at **https://recipes.lsdmt.me**

## Features

- Markdown-driven content (one file per recipe in `src/content/recipes/`)
- Structured ingredient data → live serving size adjustment in the UI
- Print-friendly stylesheet (only the recipe; no nav, no chrome)
- Light/dark theme based on system preference
- AI-generated dish photos
- Auto-deploy to Cloudflare Pages on push to `main`

## Add a recipe

Use the `recipe-publish` Claude Code skill — it accepts pasted recipes, URLs to fetch, or dish descriptions to research, generates the image, structures the markdown, and pushes.

Manually: drop a markdown file in `src/content/recipes/` matching the schema in `src/content.config.ts`.

## Local dev

```bash
npm install
npm run dev    # http://localhost:4321
npm run build  # validates schema and generates static site
```

## Stack

Astro 6 · Cloudflare Pages · TypeScript strict · zero runtime dependencies on the client.
