# GitHub Metrics

Generate SVG visualizations of your GitHub profile and embed them in your README.

![languages](metrics/metrics-languages.svg)

## Quick Start

Add this workflow to `.github/workflows/metrics.yml`:

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
      - uses: urmzd/github-metrics@v0
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

Push the workflow and trigger it manually, or wait for the next scheduled run. The action commits the generated SVGs to your repository.

## Inputs

| Input | Description | Default |
|---|---|---|
| `github-token` | GitHub token (needs repo read + `models:read` for AI domain analysis) | `${{ github.token }}` |
| `username` | GitHub username to generate metrics for | `${{ github.repository_owner }}` |
| `output-dir` | Directory to write SVG files to | `metrics` |
| `commit-push` | Whether to commit and push generated files | `true` |
| `commit-message` | Commit message for generated files | `chore: update metrics` |
| `commit-name` | Git user name for commits | `github-actions[bot]` |
| `commit-email` | Git user email for commits | `41898282+github-actions[bot]@users.noreply.github.com` |

## Token Permissions

The action requires these permissions on the workflow:

- **`contents: write`** — to commit and push generated SVGs
- **`models: read`** — used by the AI-powered domain analysis (extracts work domains from project READMEs)

Both are set via the `permissions` key in your workflow file (see Quick Start above).

## Generated Files

The action produces the following SVGs in your output directory:

| File | Description |
|---|---|
| `index.svg` | Combined dashboard with all sections |
| `metrics-domains.svg` | Work domains extracted from READMEs via AI |
| `metrics-languages.svg` | Top languages by bytes of code |
| `metrics-tech-stack.svg` | Frameworks, databases, and infrastructure |
| `metrics-complexity.svg` | Signature projects ranked by complexity score |
| `metrics-pulse.svg` | Contribution stats at a glance |
| `metrics-contributions.svg` | Open source contributions to external repos |

## Embedding in Your Profile README

Reference the generated SVGs with markdown image syntax:

```markdown
![GitHub Metrics](https://github.com/<username>/<username>/raw/main/metrics/index.svg)
```

Or embed individual sections:

```markdown
![Languages](https://github.com/<username>/<username>/raw/main/metrics/metrics-languages.svg)
![Tech Stack](https://github.com/<username>/<username>/raw/main/metrics/metrics-tech-stack.svg)
```

## Full Example

![metrics](metrics/index.svg)

## License

[Apache 2.0](LICENSE)
