default: check

# Install dependencies
install:
    npm ci

# Build the project
build:
    npm run build

# Run tests
test:
    npm run test

# Run linter
lint:
    npm run lint

# Format code
fmt:
    npm run fmt:fix

# Check formatting without modifying
check-fmt:
    npm run fmt

# Typecheck
typecheck:
    npm run typecheck

# Record showcase with teasr
record:
    teasr showme

# Quality gate: format + lint + typecheck + test
check: check-fmt lint typecheck test

# Full CI gate: format + lint + typecheck + build + test
ci: check-fmt lint typecheck build test
