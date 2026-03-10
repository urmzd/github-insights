# AGENTS.md

## Identity

You are an agent working on **github-metrics** — a GitHub Action that generates beautiful SVG metrics visualizations for GitHub profile READMEs. It produces language breakdowns, AI expertise analysis, contribution pulse, social badges, and signature projects.

## Architecture

TypeScript/Node.js GitHub Action using React JSX for SVG rendering.

| File | Role |
|------|------|
| `src/index.ts` | Main action entry point |
| `src/api.ts` | GitHub API interactions |
| `src/metrics.ts` | Metric calculation logic |
| `src/templates.ts` | SVG template generation |
| `src/config.ts` | Configuration parsing (`.github-metrics.toml`) |
| `src/readme.ts` | README generation |
| `src/types.ts` | Type definitions (`UserConfig`, etc.) |
| `src/components/` | 22+ component subdirectories for different metric types |
| `action.yml` | GitHub Action definition |

## Key Dependencies

- `@actions/core`, `@actions/exec`, `@actions/github` — GitHub Action SDK
- `smol-toml` — TOML config parsing
- `@vercel/ncc` — Bundle to `dist/`
- `vitest` — Testing
- `biome` — Linting and formatting

## Commands

| Task | Command |
|------|---------|
| Build | `just build` or `npm run build` (ncc bundle to dist/) |
| Test | `just test` or `npm run test` (vitest) |
| Type-check | `just typecheck` or `npm run typecheck` (tsc --noEmit) |
| Lint | `just lint` or `npm run lint` (biome check) |
| Format check | `just fmt` or `npm run fmt` |
| Format fix | `just fmt-fix` or `npm run fmt:fix` |
| Generate locally | `just generate` (requires `gh auth`) |
| Full CI | `just ci` (fmt + lint + typecheck + test + build) |

## Code Style

- TypeScript with strict mode, ES modules (`"type": "module"`)
- Biome for formatting and linting (not ESLint/Prettier)
- Node.js 22+ (`.nvmrc`)
- Tests colocated as `*.test.ts` alongside source files
- Components are React JSX returning SVG elements

## Output Files

| File | Description |
|------|-------------|
| `metrics/index.svg` | Combined visualization |
| `metrics/metrics-pulse.svg` | Contribution activity |
| `metrics/metrics-languages.svg` | Language donut chart |
| `metrics/metrics-expertise.svg` | AI expertise bars |
| `metrics/metrics-complexity.svg` | Top projects by stars |
| `metrics/metrics-contributions.svg` | External contributions |

## Adding a New Component

1. Create `src/components/<name>/` directory
2. Add the component as a React JSX function returning SVG elements
3. Add a corresponding `*.test.ts` file
4. Wire it into `src/templates.ts` and `src/metrics.ts`
5. Update `action.yml` if new inputs are needed
