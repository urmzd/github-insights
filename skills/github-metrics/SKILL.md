---
name: github-metrics
description: Generate SVG metrics visualizations for a GitHub profile README — language breakdowns, AI expertise, contribution pulse, and more. Use when setting up or customizing GitHub profile metrics.
argument-hint: [username]
---

# GitHub Metrics Generation

Generate GitHub profile metrics using `@urmzd/github-metrics`.

## Local Generation

```sh
just generate
```

This requires `gh` CLI to be authenticated. Outputs go to `metrics/` and `_README.md` (locally).

## Configuration

Create `.github-metrics.toml` in the repo root:

```toml
name = "Your Name"
pronunciation = "your-name"
title = "Software Engineer"
desired_title = "Senior Software Engineer"
bio = "Building things on the internet."
preamble = "PREAMBLE.md"
```

## GitHub Action Setup

```yaml
- uses: urmzd/github-metrics@main
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

Requires permissions: `contents: write`, `models: read` (for AI features).

## Development

```sh
just ci          # Full CI check
just build       # Build ncc bundle
just test        # Run vitest
just typecheck   # tsc --noEmit
just lint        # biome check
```
