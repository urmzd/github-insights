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

![Example output](assets/insights/index.svg)

## Features

- **Language Velocity** — streamgraph showing how your language usage has evolved over the past year
- **Contribution Rhythm** — radar chart revealing day-of-week commit patterns, plus stats (commits, PRs, reviews, streak)
- **Project Constellation** — visual map of projects positioned by language ecosystem and complexity, with connections between related repos
- **Open Source Impact** — external contributions sorted by repo star count with logarithmic impact bars
- **AI preamble generation** — auto-generated profile introduction (or supply your own `PREAMBLE.md`)
- **AI project classification** — repos classified by status (active/maintained/inactive) and purpose (Developer Tools/SDKs/Applications/Research)
- **Social badges** — auto-detected from your GitHub profile (website, Twitter, LinkedIn, etc.)
- **Dual theme** — SVGs automatically adapt to GitHub's light and dark mode via `prefers-color-scheme`
- **CSS animations** — subtle fade-in and scale animations on load
- **Configuration** — customize name, title, bio, and more via `github-insights.yml`

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
| `readme-path` | Output path for the generated profile README (set to `none` to skip) | `README.md` (CI) / `_README.md` (local) |
| `index-only` | When `true`, embeds only the combined `index.svg` in the generated README; when `false`, embeds each section SVG as a separate image | `true` |

## Configuration

Create `github-insights.yml` (or `.yaml`) in your repo root:

```yaml
name: Your Name
pronunciation: your-name
title: Software Engineer
desired_title: Senior Software Engineer
bio: Building things on the internet.
preamble: PREAMBLE.md  # path to custom preamble (optional)
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

## Templates

Four built-in templates control the generated README layout:

| Template | Description |
|----------|-------------|
| `classic` | Name heading, title blockquote, preamble, SVG metrics, bio footer |
| `modern` | Wave greeting, projects by activity (Active/Maintained/Inactive), Project Map, GitHub Stats, Impact |
| `minimal` | First name heading, preamble, social badges, SVG metrics |
| `ecosystem` | Wave greeting, projects by purpose (Developer Tools/SDKs/Applications/Research), Project Map, GitHub Stats, Impact |

Set via the `template` input (default: `classic`) or `github-insights.yml`:

```yaml
- uses: urmzd/github-insights@main
  with:
    template: ecosystem
```

## Local Development

### Prerequisites

- Node.js 22+
- `gh` CLI (authenticated) for local generation

### Commands

```sh
npm run ci          # full CI check (fmt, lint, typecheck, test, build)
npm run generate    # generate metrics locally (uses gh auth token)
npm run build       # build ncc bundle
npm test            # run tests
npm run typecheck   # type-check
npm run lint        # lint
npm run fmt         # format check
npm run fmt:fix     # format fix
```

> **Note:** When running locally (outside CI), `commit-push` defaults to `false` and `readme-path` defaults to `_README.md`, so `npm run generate` will not overwrite your project README or push commits.

## Output Files

| File | Description |
|------|-------------|
| `assets/insights/index.svg` | Combined visualization with all sections |
| `assets/insights/metrics-velocity.svg` | Language Velocity streamgraph |
| `assets/insights/metrics-rhythm.svg` | Contribution Rhythm radar + stats |
| `assets/insights/metrics-constellation.svg` | Project Constellation map |
| `assets/insights/metrics-impact.svg` | Open Source Impact trail |
| `README.md` | Generated profile README (CI); `_README.md` locally |

## Agent Skill

This project ships an [Agent Skill](https://github.com/vercel-labs/skills) for use with Claude Code, Cursor, and other compatible agents.

Available as portable agent skills in [`skills/`](skills/).

Once installed, use `/github-insights` to generate and customize SVG profile metrics.

---

<sub>Created using [@urmzd/github-insights](https://github.com/urmzd/github-insights)</sub>
