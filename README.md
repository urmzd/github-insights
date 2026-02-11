# GitHub Metrics

Generate beautiful SVG metrics visualizations for your GitHub profile README.

![Example output](metrics/index.svg)

## Features

- **Language breakdown** — donut chart of languages by bytes across all public repos
- **AI expertise analysis** — categorized skill bars with proficiency scores, powered by GitHub Models
- **AI preamble generation** — auto-generated profile introduction (or supply your own `PREAMBLE.md`)
- **Social badges** — auto-detected from your GitHub profile (website, Twitter, LinkedIn, etc.)
- **Contribution pulse** — commits, PRs, reviews, and active repos at a glance
- **Signature projects** — top repos by stars with descriptions
- **Open source contributions** — external repos you've contributed to
- **Configuration** — customize name, title, bio, and more via `.github-metrics.toml`

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
      - uses: urmzd/github-metrics@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

The action commits updated SVGs and a generated `README.md` to your repo automatically.

## Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `github-token` | GitHub token (needs `repo` read + `models:read` for AI) | `${{ github.token }}` |
| `username` | GitHub username to generate metrics for | `${{ github.repository_owner }}` |
| `output-dir` | Directory to write SVG files to | `metrics` |
| `commit-push` | Whether to commit and push generated files | `true` (CI) / `false` (local) |
| `commit-message` | Commit message for generated files | `chore: update metrics` |
| `commit-name` | Git user name for commits | `github-actions[bot]` |
| `commit-email` | Git user email for commits | `41898282+github-actions[bot]@users.noreply.github.com` |
| `config-file` | Path to TOML config file | `.github-metrics.toml` |
| `readme-path` | Output path for the generated profile README (set to `none` to skip) | `README.md` (CI) / `_README.md` (local) |
| `index-only` | Embed only the combined `index.svg`; when `false`, embeds each section SVG individually | `true` |

## Configuration

Create `.github-metrics.toml` in your repo root:

```toml
name = "Your Name"
pronunciation = "your-name"
title = "Software Engineer"
desired_title = "Senior Software Engineer"
bio = "Building things on the internet."
preamble = "PREAMBLE.md"  # path to custom preamble (optional)
```

All fields are optional. The `UserConfig` type in `src/types.ts` defines the full schema.

## AI Features

### Expertise Analysis

The action uses GitHub Models to analyze your languages, dependencies, topics, and repo READMEs, then produces categorized skill bars with proficiency scores. Requires the `models:read` permission on your token.

### Preamble Generation

If no `PREAMBLE.md` file is found (or configured via `preamble` in config), the action generates a profile introduction using AI. To use your own text, create a `PREAMBLE.md` in the repo root.

### Token Permissions

For AI features, your workflow needs:

```yaml
permissions:
  contents: write  # to commit generated files
  models: read     # for AI expertise analysis and preamble generation
```

## Local Development

### Prerequisites

- Node.js 22+
- [just](https://github.com/casey/just) command runner
- `gh` CLI (authenticated) for local generation

### Commands

```sh
just ci          # full CI check (fmt, lint, typecheck, test, build)
just generate    # generate metrics locally (uses gh auth token)
just build       # build ncc bundle
just test        # run tests
just typecheck   # type-check
just lint        # lint
just fmt         # format check
just fmt-fix     # format fix
```

> **Note:** When running locally (outside CI), `commit-push` defaults to `false` and `readme-path` defaults to `_README.md`, so `just generate` will not overwrite your project README or push commits.

## Output Files

| File | Description |
|------|-------------|
| `metrics/index.svg` | Combined visualization with all sections |
| `metrics/metrics-pulse.svg` | Contribution activity stats |
| `metrics/metrics-languages.svg` | Language breakdown donut chart |
| `metrics/metrics-expertise.svg` | AI-generated expertise bars |
| `metrics/metrics-complexity.svg` | Top projects by stars |
| `metrics/metrics-contributions.svg` | External open source contributions |
| `README.md` | Generated profile README (CI); `_README.md` locally |

---

<sub>Created using [@urmzd/github-metrics](https://github.com/urmzd/github-metrics)</sub>
