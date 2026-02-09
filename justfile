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
    GITHUB_TOKEN=$(gh auth token) npx tsx src/index.ts

# Full CI check
ci: fmt lint typecheck test build
