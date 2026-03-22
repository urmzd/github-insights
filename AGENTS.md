# AGENTS.md

## Identity

You are an agent working on **github-insights** — a GitHub Action that generates beautiful SVG metrics visualizations for GitHub profile READMEs. It produces language velocity streamgraphs, contribution rhythm radar charts, project constellation maps, and open source impact trails.

## Architecture

TypeScript/Node.js GitHub Action using JSX for SVG string rendering (no React — custom `h()` factory).

| File | Role |
|------|------|
| `src/index.ts` | Main action entry point |
| `src/api.ts` | GitHub API interactions + AI (preamble, project classification) |
| `src/metrics.ts` | Metric calculation (velocity, rhythm, constellation, sections) |
| `src/templates.ts` | README template generation (classic, modern, minimal, ecosystem) |
| `src/config.ts` | Configuration parsing (`github-insights.yml`) |
| `src/readme.ts` | README generation |
| `src/types.ts` | Type definitions (`UserConfig`, `TemplateContext`, etc.) |
| `src/theme.ts` | Theme colors (dark + light), layout constants |
| `src/components/` | SVG rendering components |
| `action.yml` | GitHub Action definition |

### SVG Components

| Component | File | Output |
|-----------|------|--------|
| Language Velocity | `language-velocity.tsx` | Stacked area streamgraph of language usage over 12 months |
| Contribution Rhythm | `contribution-rhythm.tsx` | 7-spoke radar chart + summary stats |
| Project Constellation | `project-constellation.tsx` | Node-link map by language ecosystem and complexity |
| Impact Trail | `impact-trail.tsx` | External contributions with logarithmic star bars |
| Section Header | `section.tsx` | Reusable section headers and dividers |
| Style Defs | `style-defs.tsx` | CSS styles, animations, light/dark theme media query |
| Full SVG | `full-svg.tsx` | Combines sections into index.svg |

## Key Dependencies

- `@actions/core`, `@actions/exec`, `@actions/github` — GitHub Action SDK
- `smol-toml` — TOML config parsing
- `@vercel/ncc` — Bundle to `dist/`
- `vitest` — Testing
- `biome` — Linting and formatting

## Commands

| Task | Command |
|------|---------|
| Build | `npm run build` (ncc bundle to dist/) |
| Test | `npm test` (vitest) |
| Type-check | `npm run typecheck` (tsc --noEmit) |
| Lint | `npm run lint` (biome check) |
| Format check | `npm run fmt` |
| Format fix | `npm run fmt:fix` |
| Generate locally | `npm run generate` (requires `gh auth`) |
| Full CI | `npm run ci` (fmt + lint + typecheck + test + build) |

## Code Style

- TypeScript with strict mode, ES modules (`"type": "module"`)
- Biome for formatting and linting (not ESLint/Prettier)
- Node.js 22+ (`.nvmrc`)
- Tests colocated as `*.test.ts` / `*.test.tsx` alongside source files
- Components use JSX that compiles to SVG strings via custom `h()` factory

## Output Files

| File | Description |
|------|-------------|
| `assets/insights/index.svg` | Combined visualization |
| `assets/insights/metrics-velocity.svg` | Language Velocity streamgraph |
| `assets/insights/metrics-rhythm.svg` | Contribution Rhythm radar + stats |
| `assets/insights/metrics-constellation.svg` | Project Constellation map |
| `assets/insights/metrics-impact.svg` | Open Source Impact trail |

## Adding a New Component

1. Create `src/components/<name>.tsx`
2. Export a render function: `(data, y) => RenderResult`
3. Add a corresponding `*.test.tsx` file
4. Wire it into `src/metrics.ts` (add to `buildSections()`)
5. Update `SECTION_KEYS` in `metrics.ts`
6. Update templates in `src/templates.ts` if it needs template-specific placement
