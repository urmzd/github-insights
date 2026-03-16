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

- **Language breakdown** — donut chart of languages by bytes across all public repos
- **AI expertise analysis** — categorized skill bars with proficiency scores, powered by GitHub Models
- **AI preamble generation** — auto-generated profile introduction (or supply your own `PREAMBLE.md`)
- **Social badges** — auto-detected from your GitHub profile (website, Twitter, LinkedIn, etc.)
- **Contribution pulse** — commits, PRs, reviews, and active repos at a glance
- **Signature projects** — top repos by stars with descriptions
- **Open source contributions** — external repos you've contributed to
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
| `index-only` | When `true`, embeds only the combined `index.svg` in the generated README; when `false`, embeds each section SVG as a separate image (e.g., `metrics-languages.svg`, `metrics-expertise.svg`, etc.) | `true` |

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

> **Note:** The legacy config filename `.github-metrics.toml` (TOML format) is still supported but deprecated. Please migrate to `github-insights.yml`.

## AI Features

### Expertise Analysis

The action uses GitHub Models to analyze your languages, dependencies, topics, and repo READMEs, then produces categorized skill bars with proficiency scores. Requires the `models:read` permission on your token.

### Preamble Generation

When no custom preamble is provided, the action uses AI to generate a profile introduction. The generated preamble consists of 2-4 short paragraphs drawn from your profile bio, title, expertise areas, top languages, and notable projects. It uses a professional but friendly tone and does not include a heading.

The preamble ends with a row of shields.io social badges for any detected links — website, Twitter/X, LinkedIn, and other social accounts from your GitHub profile. A GitHub badge is not included since the README is already on GitHub.

To use your own text instead, create a `PREAMBLE.md` file in the repo root, or point to a custom file via the `preamble` field in `github-insights.yml`.

### Token Permissions

For AI features, your workflow needs:

```yaml
permissions:
  contents: write  # to commit generated files
  models: read     # for AI expertise analysis and preamble generation
```

## Templates

Four built-in templates control the generated README layout:

| Template | Description |
|----------|-------------|
| `classic` | Name heading, title blockquote, preamble, SVG metrics, bio footer |
| `modern` | Wave greeting, social badges, projects by activity (Active/Maintained/Inactive), GitHub Stats, expertise |
| `minimal` | First name heading, preamble, social badges, SVG metrics |
| `ecosystem` | Wave greeting, social badges, projects by purpose (Developer Tools/SDKs/Applications/Research), GitHub Stats, expertise |

Set via the `template` input (default: `classic`) or `github-insights.yml`:

```yaml
- uses: urmzd/github-insights@v1
  with:
    template: ecosystem
```

The **ecosystem** template groups projects into purpose-based tables using AI classification, matching the layout used by [urmzd's profile README](https://github.com/urmzd).

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
| `assets/insights/metrics-pulse.svg` | Contribution activity stats |
| `assets/insights/metrics-languages.svg` | Language breakdown donut chart |
| `assets/insights/metrics-expertise.svg` | AI-generated expertise bars |
| `assets/insights/metrics-complexity.svg` | Top projects by stars |
| `assets/insights/metrics-contributions.svg` | External open source contributions |
| `README.md` | Generated profile README (CI); `_README.md` locally |

## Agent Skill

This project ships an [Agent Skill](https://github.com/vercel-labs/skills) for use with Claude Code, Cursor, and other compatible agents.

**Install:**

```sh
npx skills add urmzd/github-insights
```

Once installed, use `/github-insights` to generate and customize SVG profile metrics.

---

<sub>Created using [@urmzd/github-insights](https://github.com/urmzd/github-insights)</sub>
