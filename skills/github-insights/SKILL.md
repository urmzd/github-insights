---
name: github-insights
description: >-
  Generate and customize SVG metrics visualizations for GitHub profile READMEs.
  Handles setup, configuration, theming, section selection, template choice,
  troubleshooting, and extending with new components or parsers.
  Use when users want to set up, customize, debug, or extend GitHub profile metrics.
metadata:
  argument-hint: [setup | customize | generate | debug | extend]
---

# GitHub Insights — Agent Skill

Generate beautiful SVG metrics for GitHub profile READMEs. Sections include language velocity streamgraph, contribution rhythm radar chart, project constellation map, and open source impact trail. SVGs support light/dark theme switching and CSS animations.

## Quick Reference

| Task | Command |
|------|---------|
| Generate locally | `npm run generate` (requires `gh auth login`) |
| Full CI check | `npm run ci` (fmt + lint + typecheck + test + build) |
| Build bundle | `npm run build` (ncc -> `dist/`) |
| Run tests | `npm test` (vitest) |
| Type-check | `npm run typecheck` |
| Lint | `npm run lint` (biome) |
| Format fix | `npm run fmt:fix` |

## Setup Guide

### For a user's profile repo (`<username>/<username>`)

1. Create `.github/workflows/metrics.yml`:

```yaml
name: Metrics
on:
  schedule:
    - cron: "0 0 * * *"
  workflow_dispatch:

permissions:
  contents: write
  models: read

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: urmzd/github-insights@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

2. Optionally create `github-insights.yml` for customization (see Configuration below).
3. Run the workflow — it commits SVGs to `assets/insights/` and generates `README.md`.

### Local development

Requires Node.js 22+ and authenticated `gh` CLI.

```sh
npm install
npm run generate
```

Local mode differences:
- `commit-push` defaults to `false` (no git operations)
- README writes to `_README.md` (not `README.md`)
- All four template previews are generated in `examples/{classic,modern,minimal,ecosystem}/`

## Configuration

### `github-insights.yml` (all fields optional)

```yaml
name: Display Name           # overrides GitHub profile name
pronunciation: pronunciation # shown as subscript in heading
title: Software Engineer     # blockquote under heading
desired_title: Senior SWE    # AI context only
bio: Short bio text.         # footer text in classic template
preamble: PREAMBLE.md        # path to custom preamble (bypasses AI generation)
template: classic            # "classic" | "modern" | "minimal" | "ecosystem"
sections:
  - velocity
  - rhythm
  - constellation
  - impact
```

### Action inputs

| Input | Default | Description |
|-------|---------|-------------|
| `github-token` | `${{ github.token }}` | Needs `contents: write` + `models: read` |
| `username` | `${{ github.repository_owner }}` | GitHub login to generate metrics for |
| `output-dir` | `assets/insights` | Directory for SVG output files |
| `commit-push` | `true` (CI) / `false` (local) | Whether to commit and push |
| `commit-message` | `chore: update metrics` | Git commit message |
| `config-file` | `github-insights.yml` | Path to config file |
| `readme-path` | `README.md` (CI) / `_README.md` (local) | Set to `none` to skip |
| `template` | `showcase` | Section preset (`classic`, `modern`, `minimal`, `ecosystem`, `showcase`) |
| `sections` | (all) | Comma-separated section keys to include |

### Section keys

| Key | SVG filename | What it renders |
|-----|-------------|-----------------|
| `velocity` | `metrics-velocity.svg` | Streamgraph of language usage over 12 months |
| `rhythm` | `metrics-rhythm.svg` | 7-spoke radar chart + contribution stats |
| `constellation` | `metrics-constellation.svg` | Project map by language and complexity |
| `impact` | `metrics-impact.svg` | External contributions with impact bars |

### Templates

- **`classic`** (default): Formal layout — `# Name`, blockquote title, preamble, social badges, SVG metrics, bio footer.
- **`modern`**: Friendly — `# Hi, I'm {firstName}`, projects by activity, Project Map, GitHub Stats, Impact.
- **`minimal`**: Clean — `# {firstName}`, preamble, social badges, SVG metrics.
- **`ecosystem`**: Categorized — projects by purpose (Developer Tools/SDKs/Applications/Research), Project Map, GitHub Stats, Impact.

## Architecture

### Execution flow

```
Inputs -> Fetch (parallel) -> AI calls -> Transform -> Compute velocity/rhythm/constellation -> Render sections -> Write SVGs -> Generate README -> Commit
```

### Key source files

| File | Role |
|------|------|
| `src/index.ts` | Orchestration: fetch -> transform -> render -> write -> commit |
| `src/api.ts` | GitHub GraphQL queries + GitHub Models AI calls |
| `src/metrics.ts` | Data aggregation, velocity/rhythm/constellation computation, section building |
| `src/config.ts` | YAML/TOML config loading |
| `src/types.ts` | All TypeScript interfaces |
| `src/templates.ts` | Four README template functions + social badge builder |
| `src/theme.ts` | `THEME`/`THEME_LIGHT` colors, `LAYOUT` dimensions, `BAR_COLORS` palette |
| `src/components/` | SVG rendering components (custom JSX -> SVG strings) |

### Component rendering pattern

Every component follows the same signature:

```ts
function renderXxx(data: ..., y: number): { svg: string; height: number }
```

Components return SVG string fragments and their rendered height. The `y` parameter is the vertical cursor; heights are accumulated to stack sections vertically.

## Extending

### Add a new section

1. Create `src/components/<name>.tsx` with a render function: `(data, y) => { svg, height }`
2. Import the custom JSX factory: `import { h, Fragment } from "../jsx-factory"`
3. Add the section key to `SECTION_KEYS` map in `src/metrics.ts`
4. Add a `SectionDef` entry in the `buildSections()` function in `src/metrics.ts`
5. Fetch any new data needed in `src/index.ts`
6. Add a `*.test.tsx` file alongside the component

### Add a new README template

1. Add a function to `src/templates.ts` matching `(ctx: TemplateContext) => string`
2. Register it in the `TEMPLATES` map
3. Add the name to the `TemplateName` union in `src/types.ts`

## Troubleshooting

### "Velocity section is flat"
The streamgraph distributes per-repo commits using the contribution calendar's monthly activity weights. If there's no calendar data, velocity will be empty.

### "Constellation section missing"
Only rendered when there are projects with language data. Ensure repos have detectable languages.

### "Impact section missing"
Only rendered when the user has contributed to external (non-owned) repositories.

### AI preamble is empty or generic
- The AI call uses `gpt-4.1` via GitHub Models — it needs diverse profile data to generate good output
- Provide `title` in config for better results
- Create a custom `PREAMBLE.md` to bypass AI entirely

### Local generation fails
- Ensure `gh auth login` is done and `gh auth token` returns a valid token
- Ensure Node.js 22+ (`node --version`)

### SVG looks wrong after changes
- Run `npm run build` to rebuild the `dist/` bundle — the action runs `dist/index.js`, not source directly
- SVG width is fixed at 808px; all layout math depends on this
