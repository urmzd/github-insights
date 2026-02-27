# Changelog

## 0.4.6 (2026-02-27)

### Bug Fixes

- distinguish active vs popular projects in AI preamble prompt ([b7cef11](https://github.com/urmzd/github-metrics/commit/b7cef11780f0ae93242bc2dc3cebddf16e9b122b))

### Miscellaneous

- standardize GitHub Actions workflows ([1937089](https://github.com/urmzd/github-metrics/commit/1937089fc291b42821e0e3a8366dd17ed2ce1742))
- add sensitive paths to .gitignore ([006d95b](https://github.com/urmzd/github-metrics/commit/006d95bf711cf2a7fd0b083b86757a8546ca3533))


## 0.4.5 (2026-02-20)

### Bug Fixes

- increase vertical spacing between text labels and bar SVGs ([3ff1b0d](https://github.com/urmzd/github-metrics/commit/3ff1b0de497cad1c211f3e901f0e48132dacd536))


## 0.4.4 (2026-02-19)

### Bug Fixes

- separate labels and bars onto two lines to prevent text overlap ([f4bbe42](https://github.com/urmzd/github-metrics/commit/f4bbe42fc37015a7d0eced6ad8da55a59a5c22ca))


## 0.4.3 (2026-02-18)

### Bug Fixes

- use first-person AI prompts and show usernames in social badges ([f0d6afd](https://github.com/urmzd/github-metrics/commit/f0d6afdbfbc39766f53fbbac922e1b8edbfe360b))

### Refactoring

- move template preview READMEs to examples/ directory ([35bfaf0](https://github.com/urmzd/github-metrics/commit/35bfaf0472d01da4758b4424e614931f3d9b8c42))


## 0.4.2 (2026-02-17)

### Bug Fixes

- use gpt-4.1 model and fix lint warning in regex ([f369763](https://github.com/urmzd/github-metrics/commit/f369763f103ab0c55175cdcce8dfefe2e6ec5ce8))
- prevent conversational filler in AI-generated preamble ([d3c6e55](https://github.com/urmzd/github-metrics/commit/d3c6e5572cb088ae56c5b33f750dc972f52f4504))


## 0.4.1 (2026-02-14)

### Bug Fixes

- format chained method calls to satisfy biome formatter ([55cbf8f](https://github.com/urmzd/github-metrics/commit/55cbf8f6c13ab30b3c5bb0b0e636a0c232d8adad))
- strip markdown code fences from AI-generated preamble ([35d879e](https://github.com/urmzd/github-metrics/commit/35d879edbd11bf7e6a999efbca927d4c529f4881))

### Documentation

- sync README and CONTRIBUTING with recent code changes ([c696f13](https://github.com/urmzd/github-metrics/commit/c696f130159795f1be5510173763f7b4be56de7b))
- update badge examples in preamble generation prompt ([5548154](https://github.com/urmzd/github-metrics/commit/5548154b8b825ba2e7f10912d1393aa22fa936bf))

### Miscellaneous

- remove dist/ from version control ([f8ed3b3](https://github.com/urmzd/github-metrics/commit/f8ed3b3bf120603b768d00b345e4888482546df9))


## 0.4.0 (2026-02-11)

### Features

- remove GitHub badge from preamble and add generation date to attribution ([2cfd311](https://github.com/urmzd/github-metrics/commit/2cfd3111e1c876f28c0c51e69e0fa4f8e1ef2b33))

### Bug Fixes

- resolve biome format and lint errors in CI pipeline ([4eee052](https://github.com/urmzd/github-metrics/commit/4eee052eac7f761f3858284c5eb5c08cb7fd1e68))
- prevent text-bar overlap in expertise SVG ([22d3c45](https://github.com/urmzd/github-metrics/commit/22d3c45980934927a914509800d4b016c5b6b119))

### Miscellaneous

- add preamble regression tests for generateReadme ([894a653](https://github.com/urmzd/github-metrics/commit/894a653e0580e56d508de5d0380f1e30a371a2e7))
- update semantic-release action to v1 ([b2331d7](https://github.com/urmzd/github-metrics/commit/b2331d77511012e9aa44cedeb57c9903560582e2))
- gitignore _README.md temp artifact ([aa9fa57](https://github.com/urmzd/github-metrics/commit/aa9fa577b840a811e94a3bc5c2cac981e00fbbaf))


## 0.3.1 (2026-02-11)

### Bug Fixes

- use relative SVG paths in generated README ([d280808](https://github.com/urmzd/github-metrics/commit/d280808a2851d0e836a7bc528b64a487270744a4))


## 0.3.0 (2026-02-11)

### Features

- replace generate-readme flag with readme-path, add project docs ([07edd44](https://github.com/urmzd/github-metrics/commit/07edd440b432c06ee4bc4f1568a8dd8e6a7516ad))
- add proficiency scores to expertise bars and disable commit-push locally ([7f5413f](https://github.com/urmzd/github-metrics/commit/7f5413f2cba99869215731acceaed0b0e07eb572))

### Miscellaneous

- update biome schema to 2.3.14 and apply formatting fixes ([8bf1856](https://github.com/urmzd/github-metrics/commit/8bf18561e113819fa650dbf3993b038b84149307))
- update metrics ([26f3f66](https://github.com/urmzd/github-metrics/commit/26f3f6636518ba5429adb259dc9355d6520ed5db))


## 0.2.0 (2026-02-11)

### Features

- add force re-release support to release workflow ([46fbe6d](https://github.com/urmzd/github-metrics/commit/46fbe6d60483a818af58b70b3c80b7d8f216ca7d))

### Refactoring

- replace ESLint + Prettier with Biome ([9a98708](https://github.com/urmzd/github-metrics/commit/9a98708596a48f527ff846d8943d0c8955712fb6))

### Miscellaneous

- update metrics ([b98290c](https://github.com/urmzd/github-metrics/commit/b98290caa3fc4fe0dd67a682f9e7a7c6fa547c3c))


## 0.1.2 (2026-02-10)

### Bug Fixes

- move build steps to workflow and upload dist tarball as release artifact ([a553318](https://github.com/urmzd/github-metrics/commit/a5533186cd5da788afc460ca4e44dd08075a58de))

### Contributors

- @urmzd


## 0.1.1 (2026-02-10)

### Bug Fixes

- let semantic-release handle floating major-version tags natively ([4706c57](https://github.com/urmzd/github-metrics/commit/4706c5735fc2ed4979d4c0d4b75464ae13ff7ddc))

### Contributors

- @urmzd


## 0.1.0 (2026-02-10)

### Features

- replace hardcoded tech classification with AI-curated tech highlights ([ebcca06](https://github.com/urmzd/github-metrics/commit/ebcca0645e4fcd1446ff05c206d45df893c80ae9))
- initial implementation of github-metrics action ([6e99dfd](https://github.com/urmzd/github-metrics/commit/6e99dfd58ddc42ca3d936dbaecc289475af1e5de))

### Bug Fixes

- use node24 runtime for GitHub Actions compatibility ([7bf6836](https://github.com/urmzd/github-metrics/commit/7bf683645e781feb5d0e63ce1447e572e4db209b))
- add eslint config and fix lint errors ([e134c7e](https://github.com/urmzd/github-metrics/commit/e134c7eb785dddd07994663578b210f8e295eb04))

### Documentation

- move full dashboard SVG to end of README ([0ad66d0](https://github.com/urmzd/github-metrics/commit/0ad66d03f831c32a952be2cc286079bfbcfd96bc))
- add README, CONTRIBUTING, LICENSE and fix release workflow ([e82f406](https://github.com/urmzd/github-metrics/commit/e82f406b4568c41867930535b4da0be4663d9dfb))

### Miscellaneous

- stop tracking dist/ and let semantic-release build it ([f4e3d9f](https://github.com/urmzd/github-metrics/commit/f4e3d9f554cc46939511f6c8059aef8998e161d4))
- rebuild dist/ to match source ([150a848](https://github.com/urmzd/github-metrics/commit/150a84882f34c3a8f361b66e8a641861b57795a4))
- fix prettier formatting in 6 source files ([6776b08](https://github.com/urmzd/github-metrics/commit/6776b083965f1aafabfd8b5caf07cc5e23e70a1d))
- apply formatter and linter fixes ([3b53ce5](https://github.com/urmzd/github-metrics/commit/3b53ce5f54ceb4bcb75fb9cde48325e8a46a5968))

### Contributors

- @urmzd
