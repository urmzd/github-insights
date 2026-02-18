# Build ncc bundle
build:
    npm run build

# Type-check
typecheck:
    npm run typecheck

# Lint
lint:
    npm run lint

# Format check
fmt:
    npm run fmt

# Format fix
fmt-fix:
    npm run fmt:fix

# Run tests
test:
    npm run test

# Generate metrics locally (requires gh auth)
generate:
    GITHUB_TOKEN=$(gh auth token) GITHUB_REPOSITORY_OWNER=$(gh api user --jq .login) npx tsx src/index.ts

# Generate metrics + preview all templates side by side (requires gh auth)
# Outputs: _README.md (primary), examples/classic.md, examples/modern.md, examples/minimal.md
preview-templates: generate

# Full CI check
ci: fmt lint typecheck test build
