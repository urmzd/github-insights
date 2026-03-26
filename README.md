<p align="center">
  <h1 align="center">GitHub Insights</h1>
  <p align="center">
    Generate beautiful SVG insights visualizations for your GitHub profile README.
    <br /><br />
    <a href="https://github.com/urmzd/github-insights/releases">Install</a>
    &middot;
    <a href="https://github.com/urmzd/github-insights/issues">Report Bug</a>
    &middot;
    <a href="https://github.com/urmzd">Profile Demo</a>
  </p>
</p>

<p align="center">
  <a href="https://github.com/urmzd/github-insights/actions/workflows/ci.yml"><img src="https://github.com/urmzd/github-insights/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/urmzd/github-insights/actions/workflows/release.yml"><img src="https://github.com/urmzd/github-insights/actions/workflows/release.yml/badge.svg" alt="Release"></a>
  <a href="https://github.com/urmzd/github-insights/issues"><img src="https://img.shields.io/github/issues/urmzd/github-insights" alt="Issues"></a>
  <a href="https://github.com/urmzd/github-insights/pulls"><img src="https://img.shields.io/github/issues-pr/urmzd/github-insights" alt="Pull Requests"></a>
  <a href="https://github.com/urmzd/github-insights/blob/main/LICENSE"><img src="https://img.shields.io/github/license/urmzd/github-insights" alt="License"></a>
  <a href="https://www.npmjs.com/package/@urmzd/github-insights"><img src="https://img.shields.io/npm/v/@urmzd/github-insights" alt="npm version"></a>
</p>

## Showcase

<table>
<tr>
<td width="50%" align="center"><strong>SVG Output</strong></td>
<td width="50%" align="center"><strong>CLI / TUI</strong></td>
</tr>
<tr>
<td><img src="assets/insights/index.svg" alt="Example SVG output"></td>
<td><img src="showcase/demo.gif" alt="GitHub Insights TUI demo"></td>
</tr>
</table>

Run `npm run generate` locally for a full TUI experience with live phase tracking, spinners, and timing for each pipeline step.

## Features

- **Composable sections** — pick and order sections (`spotlight`, `velocity`, `rhythm`, `constellation`, `portfolio`, `impact`) or use a preset
- **Spotlight** — surfaces your most active projects using a composite heat score (commits, recency, stars)
- **Language Velocity** — streamgraph showing how your language usage has evolved over the past year
- **Contribution Rhythm** — radar chart revealing day-of-week commit patterns, plus stats (commits, PRs, reviews, streak)
- **Project Constellation** — visual map of projects positioned by language ecosystem and complexity, with connections between related repos
- **Portfolio** — full project list in a collapsible `<details>` tag, grouped by AI-classified category
- **Open Source Impact** — external contributions sorted by repo star count with logarithmic impact bars
- **AI preamble generation** — auto-generated profile introduction (or supply your own `PREAMBLE.md`)
- **AI project classification** — repos classified by status (active/maintained/inactive) and purpose (Developer Tools/SDKs/Applications/Research)
- **CLI / TUI** — local generation with an interactive terminal UI (Ink-based), live progress, and phase timing
- **Social badges** — auto-detected from your GitHub profile (website, Twitter, LinkedIn, etc.)
- **Dual theme** — SVGs automatically adapt to GitHub's light and dark mode via `prefers-color-scheme`
- **CSS animations** — subtle fade-in and scale animations on load
- **Configuration** — customize name, title, bio, sections, and more via `github-insights.yml`

## Quick Start

Create `.github/workflows/metrics.yml` in your profile repository (`<username>/<username>`):

```yaml
name: Metrics
on:
  schedule:
    - cron: "0 0 * * *" # daily
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

The action commits updated SVGs and a generated `README.md` to your repo automatically.

## Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `github-token` | GitHub token (needs `repo` read + `models:read` for AI) | `${{ github.token }}` |
| `username` | GitHub username to generate metrics for | `${{ github.repository_owner }}` |
| `output-dir` | Directory to write SVG files to | `assets/insights` |
| `commit-push` | Whether to commit and push generated files | `true` (CI) / `false` (local) |
| `commit-message` | Commit message for generated files | `chore: update metrics` |
| `commit-name` | Git user name for commits | `github-actions[bot]` |
| `commit-email` | Git user email for commits | `41898282+github-actions[bot]@users.noreply.github.com` |
| `config-file` | Path to config file | `github-insights.yml` |
| `readme-path` | Output path for the generated profile README (set to `none` to skip) | `README.md` (CI) / `none` (local) |
| `template` | Section preset (`classic`, `modern`, `minimal`, `ecosystem`, `showcase`) | `showcase` |
| `sections` | Comma-separated ordered list of sections (overrides `template`) | _(all)_ |

## Configuration

Create `github-insights.yml` (or `.yaml`) in your repo root:

```yaml
name: Your Name
pronunciation: your-name
title: Software Engineer
desired_title: Senior Software Engineer
bio: Building things on the internet.
preamble: PREAMBLE.md  # path to custom preamble (optional)
template: showcase     # section preset (optional)
sections:              # explicit section order (overrides template)
  - spotlight
  - velocity
  - rhythm
  - constellation
  - portfolio
  - impact
```

All fields are optional. The `UserConfig` type in `src/types.ts` defines the full schema.

## AI Features

### Preamble Generation

When no custom preamble is provided, the action uses AI to generate a profile introduction. The generated preamble consists of 1-2 sentences drawn from your profile bio, title, top languages, and notable projects. It uses a professional but friendly tone.

To use your own text instead, create a `PREAMBLE.md` file in the repo root, or point to a custom file via the `preamble` field in `github-insights.yml`.

### Project Classification

The action uses GitHub Models to classify repositories by maintenance status (active/maintained/inactive) and purpose category (Developer Tools, SDKs, Applications, Research & Experiments), with AI-generated summaries for each project.

### Token Permissions

For AI features, your workflow needs:

```yaml
permissions:
  contents: write  # to commit generated files
  models: read     # for AI project classification and preamble generation
```

## Sections

The generated README is composed from configurable sections. Control which sections appear and in what order via `github-insights.yml` or the `sections` action input:

| Section | Type | Description |
|---------|------|-------------|
| `spotlight` | text | Top 3-5 projects ranked by activity heat score |
| `velocity` | svg | Language Velocity streamgraph |
| `rhythm` | svg | Contribution Rhythm radar chart |
| `constellation` | svg | Project Constellation map |
| `portfolio` | text | Full project list in a collapsible `<details>` tag, grouped by category |
| `impact` | svg | Open Source Impact trail |

**Default** (all sections):
```yaml
sections:
  - spotlight
  - velocity
  - rhythm
  - constellation
  - portfolio
  - impact
```

**Minimal example** (just stats):
```yaml
sections:
  - velocity
  - rhythm
```

Or via the action input:
```yaml
- uses: urmzd/github-insights@main
  with:
    sections: spotlight,velocity,rhythm
```

### Spotlight Heat Score

The spotlight section surfaces your most active projects using a composite score:

- **Commit boost**: `min(commitsLastYear, 50) * 2` — rewards sustained activity, caps at 50
- **Recency bonus**: `max(0, 90 - daysSincePush) / 3` — decays over 90 days
- **Star boost**: `log2(stars + 1) * 5` — logarithmic, doesn't dominate

This scoring is designed to be inclusive of entry-level developers — even a few recent commits will surface a project.

### Template Presets

The `template` input maps to predefined section lists:

| Preset | Sections |
|--------|----------|
| `showcase` (default) | `spotlight, velocity, rhythm, constellation, portfolio, impact` |
| `ecosystem` | `spotlight, velocity, rhythm, constellation, portfolio, impact` |
| `modern` | `spotlight, velocity, rhythm, constellation, impact` |
| `classic` | `velocity, rhythm, constellation, impact` |
| `minimal` | `velocity, rhythm` |

The `sections` input overrides `template` when both are specified.

## Local Development

### Prerequisites

- Node.js 22+
- `gh` CLI (authenticated) for local generation

### Commands

```sh
npm run ci          # full CI check (fmt, lint, typecheck, test, build)
npm run generate    # generate metrics locally (TUI with live progress)
npm run showcase    # record a terminal demo GIF via teasr
npm run build       # build ncc bundle
npm test            # run tests
npm run typecheck   # type-check
npm run lint        # lint
npm run fmt         # format check
npm run fmt:fix     # format fix
```

> **Note:** When running locally (outside CI), `commit-push` defaults to `false` and `readme-path` defaults to `none` (skipped), so `npm run generate` will not overwrite your project README or push commits. A preview is generated at `examples/default/README.md`.

## Output Files

| File | Description |
|------|-------------|
| `assets/insights/index.svg` | Combined visualization with all sections |
| `assets/insights/metrics-velocity.svg` | Language Velocity streamgraph |
| `assets/insights/metrics-rhythm.svg` | Contribution Rhythm radar + stats |
| `assets/insights/metrics-constellation.svg` | Project Constellation map |
| `assets/insights/metrics-impact.svg` | Open Source Impact trail |
| `README.md` | Generated profile README (CI only) |
| `examples/default/README.md` | Local preview (generated by `npm run generate`) |
| `showcase/demo.gif` | Terminal demo recording (generated by `npm run showcase`) |

## Agent Skill

This project ships an [Agent Skill](https://github.com/vercel-labs/skills) for use with Claude Code, Cursor, and other compatible agents.

Available as portable agent skills in [`skills/`](skills/).

Once installed, use `/github-insights` to generate and customize SVG profile metrics.

---

<sub>Created using [@urmzd/github-insights](https://github.com/urmzd/github-insights)</sub>
