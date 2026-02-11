# Contributing

## Project Structure

```
src/
  index.ts          # Entry point — orchestrates fetch, transform, render, write
  api.ts            # GitHub GraphQL/REST API calls + AI model calls
  metrics.ts        # Data aggregation and section definitions
  config.ts         # TOML config parsing (UserConfig)
  readme.ts         # Profile README generation
  parsers.ts        # Dependency manifest parsers
  types.ts          # Shared type definitions
  jsx-factory.ts    # Custom JSX factory for SVG rendering
  jsx.d.ts          # JSX type declarations
  theme.ts          # Theme constants (colors, fonts, spacing)
  svg-utils.ts      # SVG utility functions
  __fixtures__/
    repos.ts        # Test fixture data
  components/       # SVG rendering components
    full-svg.tsx    # Combines sections into a single SVG
    section.tsx     # Individual section renderer
    donut-chart.tsx # Language donut chart
    bar-chart.tsx   # Horizontal bar chart
    tech-highlights.tsx  # Expertise bars
    stat-cards.tsx  # Contribution stat cards
    project-cards.tsx    # Project cards
    contribution-cards.tsx # External contribution cards
    style-defs.tsx  # Shared SVG style definitions
```

## Adding a New Metric Section

1. If your section needs a new render component, create it in `src/components/`. It should export a function that takes data + a `y` offset and returns `{ svg: string, height: number }`.

2. Add your section to `buildSections` in `src/metrics.ts` (line ~91). Each section is a `SectionDef` (`src/types.ts:54`):

```typescript
sections.push({
  filename: "metrics-your-section.svg",
  title: "Your Section",
  subtitle: "Description of this section",
  renderBody: (y: number) => renderYourComponent(data, y),
});
```

3. The section is automatically included in the combined `index.svg` and written as a standalone SVG.

## Adding a Package Parser

Package parsers extract dependency names from manifest files so the AI expertise analysis can see what libraries you use.

1. Create a `PackageParser` implementation (`src/types.ts:113`):

```typescript
export const MyParser: PackageParser = {
  filenames: ["my-manifest.json"],
  parseDependencies(text) {
    // Parse and return dependency names
    return [];
  },
};
```

2. Add it to the `PARSERS` array in `src/parsers.ts` (line ~129).

3. Add the manifest filename to `MANIFEST_FILES` in `src/api.ts` (line ~13) so the API fetches it from repos.

## Adding Config Fields

1. Add the field to the `UserConfig` interface in `src/types.ts` (line ~126).

2. Add parsing logic in `parseUserConfig` in `src/config.ts` — follow the existing pattern of type-checking and trimming.

3. Use the new field wherever needed (e.g., in `src/index.ts`, `src/readme.ts`, or `src/metrics.ts`).

## Testing

- Tests use [Vitest](https://vitest.dev/) with `*.test.ts` and `*.test.tsx` naming conventions
- Use `.test.tsx` for tests that exercise JSX components (e.g., `src/components/section.test.tsx`)
- Run tests: `just test` or `npm test`
- Tests live alongside source files (e.g., `src/config.test.ts`, `src/components/donut-chart.test.tsx`)

## Code Style

- Enforced by [Biome](https://biomejs.dev/) — run `just fmt` to check, `just fmt-fix` to auto-fix
- Run `just ci` before submitting a PR to catch formatting, lint, type, and test issues
