---
name: github-insights
description: >-
  Generate and customize SVG metrics visualizations for GitHub profile READMEs.
  Handles setup, configuration, theming, section selection, template choice,
  troubleshooting, and extending with new components or parsers.
  Use when users want to set up, customize, debug, or extend GitHub profile metrics.
argument-hint: [setup | customize | generate | debug | extend]
---

# GitHub Metrics — Agent Skill

Generate beautiful dark-themed SVG metrics for GitHub profile READMEs. Sections include language breakdowns (donut chart), AI expertise analysis (proficiency bars), contribution pulse (stat cards), contribution calendar (heatmap), signature projects (by stars), and open source contributions.

## Quick Reference

| Task | Command |
|------|---------|
| Generate locally | `npm run generate` (requires `gh auth login`) |
| Full CI check | `npm run ci` (fmt + lint + typecheck + test + build) |
| Build bundle | `npm run build` (ncc → `dist/`) |
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
- All three template previews are generated in `examples/{classic,modern,minimal}/`
- Both preamble variants (full + short) are generated for preview

## Configuration

### `github-insights.yml` (all fields optional)

```yaml
name: Display Name           # overrides GitHub profile name
pronunciation: pronunciation # shown as subscript in heading
title: Software Engineer     # blockquote under heading; guides AI expertise
desired_title: Senior SWE    # AI context only — biases expertise categories
bio: Short bio text.         # footer text in classic template
preamble: PREAMBLE.md        # path to custom preamble (bypasses AI generation)
template: classic            # "classic" | "modern" | "minimal"
sections:
  - pulse
  - languages
  - expertise
  - projects
  - contributions
  - calendar
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
| `index-only` | `true` | `true` = single combined SVG; `false` = individual section SVGs |
| `template` | `classic` | README template style |
| `sections` | (all) | Comma-separated section keys to include |

### Section keys

| Key | SVG filename | What it renders |
|-----|-------------|-----------------|
| `pulse` | `metrics-pulse.svg` | 4 stat cards: commits, PRs, reviews, active repos |
| `languages` | `metrics-languages.svg` | Donut chart of top 10 languages by bytes |
| `expertise` | `metrics-expertise.svg` | AI-generated proficiency bars by category |
| `projects` | `metrics-complexity.svg` | Top 5 repos by stars with descriptions |
| `calendar` | `metrics-calendar.svg` | GitHub contribution heatmap (1 year) |
| `contributions` | `metrics-contributions.svg` | External repos contributed to |

### Templates

- **`classic`** (default): Formal layout — `# Name`, blockquote title, full AI preamble (2–4 paragraphs), social badges, SVG metrics, bio footer, attribution.
- **`modern`**: Friendly — `# Hi, I'm {firstName} 👋`, short preamble, active/maintained/inactive project lists in markdown, selective SVG sections.
- **`minimal`**: Clean — `# {firstName}`, short preamble, social badges, SVG metrics, attribution.

## Architecture

### Execution flow

```
Inputs → Fetch (parallel) → AI calls (sequential) → Transform → Render sections → Write SVGs → Generate README → Commit
```

### Key source files

| File | Role |
|------|------|
| `src/index.ts` | Orchestration: fetch → transform → render → write → commit |
| `src/api.ts` | GitHub GraphQL queries + GitHub Models AI calls |
| `src/metrics.ts` | Data aggregation, complexity scoring, section building |
| `src/config.ts` | TOML config loading |
| `src/types.ts` | All TypeScript interfaces (`UserConfig`, `SectionDef`, `TemplateContext`, etc.) |
| `src/templates.ts` | Three README template functions + social badge builder |
| `src/theme.ts` | `THEME` colors, `LAYOUT` dimensions, `BAR_COLORS` palette |
| `src/parsers.ts` | Dependency manifest parsers (package.json, Cargo.toml, go.mod, etc.) |
| `src/components/` | SVG rendering components (custom JSX → SVG strings) |
| `src/jsx-factory.ts` | Custom `h()` / `Fragment()` JSX runtime (no React) |

### Component rendering pattern

Every component follows the same signature:

```ts
function renderXxx(data: ..., y: number): { svg: string; height: number }
```

Components return SVG string fragments and their rendered height. The `y` parameter is the vertical cursor; heights are accumulated to stack sections vertically.

### Theme constants (hardcoded in `src/theme.ts`)

```
THEME.bg       = "#0d1117"   (dark background)
THEME.cardBg   = "#161b22"   (card backgrounds)
THEME.border   = "#30363d"   (card borders)
THEME.link     = "#58a6ff"   (card titles - blue)
THEME.text     = "#c9d1d9"   (primary text)
THEME.secondary= "#8b949e"   (labels)
THEME.muted    = "#6e7681"   (values)

LAYOUT.width   = 808         (fixed SVG canvas width)
LAYOUT.padX    = 24
LAYOUT.padY    = 24
LAYOUT.sectionGap = 30
```

These are not configurable via inputs or TOML — changing them requires editing source.

## Extending

### Add a new section

1. Create `src/components/<name>.tsx` with a render function: `(data, y) => { svg, height }`
2. Import the custom JSX factory: `import { h, Fragment } from "../jsx-factory"`
3. Add the section key to `SECTION_KEYS` map in `src/metrics.ts`
4. Add a `SectionDef` entry in the `buildSections()` function in `src/metrics.ts`
5. Fetch any new data needed in `src/index.ts`
6. Add a `*.test.ts` file alongside the component
7. Update `action.yml` if new inputs are needed

### Add a new dependency parser

1. Implement `PackageParser` interface in `src/parsers.ts`:
   ```ts
   { filenames: string[]; parseDependencies(text: string): string[] }
   ```
2. Add it to the `PARSERS` array — it auto-registers in `PARSER_MAP`

### Add a new README template

1. Add a function to `src/templates.ts` matching `(ctx: TemplateContext) => string`
2. Register it in the `TEMPLATES` map
3. Add the name to the `TemplateName` union in `src/types.ts`

## Troubleshooting

### "Expertise section missing"
The expertise section only appears when the AI call succeeds. Check:
- Token has `models: read` permission
- The workflow has `permissions: models: read`
- GitHub Models endpoint is reachable

### "Calendar section missing"
Only rendered when contribution calendar data exists. The user must have public contributions.

### "Contributions section missing"
Only rendered when the user has contributed to external (non-owned) repositories in the past year.

### AI preamble is empty or generic
- The AI call uses `gpt-4.1` via GitHub Models — it needs diverse profile data to generate good output
- Provide `title` and `desired_title` in TOML config for better results
- Create a custom `PREAMBLE.md` to bypass AI entirely

### Local generation fails
- Ensure `gh auth login` is done and `gh auth token` returns a valid token
- Ensure Node.js 22+ (`node --version`)
- The `GITHUB_TOKEN` and `GITHUB_REPOSITORY_OWNER` env vars are set automatically by `npm run generate` via `gh`

### SVG looks wrong after changes
- Run `npm run build` to rebuild the `dist/` bundle — the action runs `dist/index.js`, not source directly
- SVG width is fixed at 808px; all layout math depends on this

## Code Style Rules

- TypeScript strict mode, ES modules
- Biome for formatting and linting (not ESLint/Prettier)
- Tests colocated as `*.test.ts` / `*.test.tsx` alongside source
- Custom JSX factory (`h`, `Fragment`) — NOT React
- All AI calls and contribution fetches are non-fatal (catch → return empty)
