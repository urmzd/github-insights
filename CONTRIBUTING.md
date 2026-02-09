# Contributing

## Prerequisites

- Node.js 22 (see `.nvmrc`)
- npm

## Setup

```bash
npm ci
```

## Development Commands

| Command | Description |
|---|---|
| `npm run fmt` | Check formatting (Prettier) |
| `npm run fmt:fix` | Fix formatting |
| `npm run lint` | Lint source (ESLint) |
| `npm run typecheck` | Type-check (TypeScript) |
| `npm test` | Run tests (Vitest) |
| `npm run build` | Bundle to `dist/` (ncc) |
| `npm run generate` | Generate metrics locally |

## Local Generation

To generate metrics locally against your own GitHub profile:

```bash
GITHUB_TOKEN=$(gh auth token) npx tsx src/index.ts
```

This writes SVGs to `metrics/`.

## Project Structure

```
src/
  index.ts          Entry point (GitHub Action runner)
  api.ts            GitHub GraphQL queries
  metrics.ts        Aggregation, classification, and section definitions
  parsers.ts        Dependency manifest parsers
  svg-utils.ts      SVG primitives and text measurement
  theme.ts          Color palette and design tokens
  jsx-factory.ts    Minimal JSX runtime for SVG generation
  types.ts          TypeScript type definitions
  components/       SVG rendering components
    full-svg.tsx      Root SVG wrapper
    section.tsx       Section header/divider
    bar-chart.tsx     Horizontal bar charts
    donut-chart.tsx   Language donut chart
    stat-cards.tsx    Stat summary cards
    project-cards.tsx Signature project cards
    domain-cloud.tsx  Domain tag cloud
    contribution-cards.tsx  OSS contribution cards
    style-defs.tsx    Shared CSS-in-SVG styles
dist/               Bundled action output (committed)
metrics/            Generated SVG files
```

## Adding a New Visualization

1. Create a new component in `src/components/` (e.g., `my-chart.tsx`).
2. Export a render function that takes data and a `y` offset, returning `{ svg: string; height: number }`.
3. Register it in `buildSections()` in `src/metrics.ts` by pushing a new `SectionDef`.
4. Run `npm run build` to rebundle.

## CI Pipeline

The CI workflow runs these checks in order:

1. **Format** — `npm run fmt`
2. **Lint** — `npm run lint`
3. **Typecheck** — `npm run typecheck`
4. **Test** — `npm test`
5. **Integration** — `npm run build`, verify `dist/` is up-to-date, self-test the action

**Important:** If you change source files, run `npm run build` and commit the updated `dist/` directory. CI will fail if `dist/` is out of date.
