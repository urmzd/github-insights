# Changelog

## 3.7.1 (2026-04-06)

### Bug Fixes

- remove redundant inline metadata from showcase template ([7770fd7](https://github.com/urmzd/github-insights/commit/7770fd7809447bccd5155ed2758b2c34c585000f))

### Miscellaneous

- exclude dist and dist-cli from GitHub language stats ([fad0e9b](https://github.com/urmzd/github-insights/commit/fad0e9b8213f103046a26e63546593e847c28304))
- **deps**: bump actions/create-github-app-token from 1 to 3 ([0d58d0b](https://github.com/urmzd/github-insights/commit/0d58d0b25ca77621108dd857ab2413994502af51))

[Full Changelog](https://github.com/urmzd/github-insights/compare/v3.7.0...v3.7.1)


## 3.7.0 (2026-04-05)

### Features

- exclude non-code languages and add JSON export option (#21) ([1569f22](https://github.com/urmzd/github-insights/commit/1569f2299ac8ee3a1a19dee52a2cb1fb228d0486))

[Full Changelog](https://github.com/urmzd/github-insights/compare/v3.6.0...v3.7.0)


## 3.6.0 (2026-04-05)

### Features

- add fail-fast option and typed error codes (#18) ([2d111d9](https://github.com/urmzd/github-insights/commit/2d111d9ba86fe94b44e6a2a67da35bc789565a55))

[Full Changelog](https://github.com/urmzd/github-insights/compare/v3.5.0...v3.6.0)


## 3.5.0 (2026-04-05)

### Features

- add heuristic fallbacks for spotlight and portfolio when AI is unavailable (#17) ([528d890](https://github.com/urmzd/github-insights/commit/528d8901577353af29607fc666d50f602a0971d7))

### Documentation

- sync README and metadata with current source code (#16) ([44abc5f](https://github.com/urmzd/github-insights/commit/44abc5fda7d8be764c661c80987af20588c87385))

[Full Changelog](https://github.com/urmzd/github-insights/compare/v3.4.0...v3.5.0)


## 3.4.0 (2026-04-05)

### Features

- configurable AI prompts with template files (#15) ([a982e34](https://github.com/urmzd/github-insights/commit/a982e346eff567a24bb283151863b01e52cc1d55))

[Full Changelog](https://github.com/urmzd/github-insights/compare/v3.3.2...v3.4.0)


## 3.3.2 (2026-04-01)

### Documentation

- clean up legacy references and add branch protection note ([a0f0a03](https://github.com/urmzd/github-insights/commit/a0f0a03e182913d322058e31f29a513eb4fe8e56))

### Refactoring

- normalize action.yml metadata field order ([556dbbc](https://github.com/urmzd/github-insights/commit/556dbbc9d2f5c78d8a3b34a0b68b8c8ac5658d1e))

### Miscellaneous

- upgrade node version from 22 to 24 (#13) ([567f95b](https://github.com/urmzd/github-insights/commit/567f95b55afdd64b0b950af18908bd06b42bed3c))
- update sr action from v2 to v3 ([2336aa3](https://github.com/urmzd/github-insights/commit/2336aa3cd28d8792ef1515e19882725ce0a3812a))

[Full Changelog](https://github.com/urmzd/github-insights/compare/v3.3.1...v3.3.2)


## 3.3.1 (2026-03-29)

### Refactoring

- **components**: rewrite project constellation to render bars ([e77e665](https://github.com/urmzd/github-insights/commit/e77e6657c51a7fc360d7a85d01b7f22985a7e107))
- **metrics**: update constellation layout to bar-based grouping ([23d3ac1](https://github.com/urmzd/github-insights/commit/23d3ac18bec26f15342b7686268f56253f85be28))
- **types**: rename ConstellationNode to ConstellationBar ([619b920](https://github.com/urmzd/github-insights/commit/619b92096cccd5c1b1bdb15cbf790bfea5cf3b78))

### Miscellaneous

- standardize sr.yaml and add justfile — refactor bump, clean config ([58f397c](https://github.com/urmzd/github-insights/commit/58f397ca6671593d900c9425aef49c33e8d7e468))
- **sr**: update hooks and release configuration ([35630a4](https://github.com/urmzd/github-insights/commit/35630a41549949f21188a50871d83f8da8bc3b21))
- **assets**: regenerate visualization SVGs ([ab54a2a](https://github.com/urmzd/github-insights/commit/ab54a2a6c1d2011292466f293e837503d32d5204))
- **metrics**: update constellation test data structure ([6f07f66](https://github.com/urmzd/github-insights/commit/6f07f668de0421bea1b682df7f7f8af80ebca998))

[Full Changelog](https://github.com/urmzd/github-insights/compare/v3.3.0...v3.3.1)


## 3.3.0 (2026-03-27)

### Features

- add CLI binary, install script, and updated README ([0839939](https://github.com/urmzd/github-insights/commit/08399396a060ca20c8e6cf17c6d71f1dd2a3c264))
- add CLI init command, Zod config validation, and commander ([a5c5f68](https://github.com/urmzd/github-insights/commit/a5c5f680feb710e8c79abd0ec00a3c4662260e3f))

### Miscellaneous

- fix biome formatting and remove unused variable ([525c8ab](https://github.com/urmzd/github-insights/commit/525c8ab713bc277a290cb645d80c41b269e055d3))

[Full Changelog](https://github.com/urmzd/github-insights/compare/v3.2.0...v3.3.0)


## 3.2.0 (2026-03-26)

### Features

- exclude archived repos from portfolio by default ([4b857ad](https://github.com/urmzd/github-insights/commit/4b857ad42d8ae1194cd492448db0b4d3cbd3a0f9))

### Documentation

- update README with showcase layout and new features ([fa5540e](https://github.com/urmzd/github-insights/commit/fa5540e244ba5e50afd9a00c25d19e915b472080))

### Miscellaneous

- rename action and add author for GitHub Marketplace publishing ([985ae83](https://github.com/urmzd/github-insights/commit/985ae83535bd65f6c9941d96d655834c46b276ef))

[Full Changelog](https://github.com/urmzd/github-insights/compare/v3.1.0...v3.2.0)


## 3.1.0 (2026-03-26)

### Features

- **scripts**: add showcase command ([7b7935a](https://github.com/urmzd/github-insights/commit/7b7935a1fa2923022692fa0462e9b1b73c14eef5))

### Documentation

- **readme**: add CLI/TUI section with demo ([2d679e0](https://github.com/urmzd/github-insights/commit/2d679e0e484ec90fbf7b6f2541baed73708ad754))

### Refactoring

- **components**: add JSX pragma directives ([c6ae263](https://github.com/urmzd/github-insights/commit/c6ae263d1282805d08557e4ea96b303a484ffe3c))
- add CLI/TUI interface and simplify templates ([a4a8476](https://github.com/urmzd/github-insights/commit/a4a84768453b1bfa494d13320ee64d10550fdaab))

### Miscellaneous

- **assets**: regenerate visualization SVGs ([e2f4323](https://github.com/urmzd/github-insights/commit/e2f43234561ace76711a9f8c0c70f0cf4ad5bfc8))
- **teasr**: configure terminal recording for showcase ([39ab498](https://github.com/urmzd/github-insights/commit/39ab4981b062dd9e18112e64d714a316e886acbe))
- use sr-releaser GitHub App for release workflow ([23c1f79](https://github.com/urmzd/github-insights/commit/23c1f79f6940cab9c23cc32b54b6c1a81794238a))

[Full Changelog](https://github.com/urmzd/github-insights/compare/v3.0.0...v3.1.0)


## 3.0.0 (2026-03-26)

### Breaking Changes

- rename project to github-insights with YAML config and new output dir ([36a72d8](https://github.com/urmzd/github-insights/commit/36a72d821cdb382d7802cdd3a434c2a23e6085cd))
- remove justfile build tool ([2f033da](https://github.com/urmzd/github-insights/commit/2f033daf30932885b79d2130b25ef42c3dfb8c68))

### Features

- **templates**: add AI metadata, descriptive alt text, and section structure ([4fa6b40](https://github.com/urmzd/github-insights/commit/4fa6b40ce07b8887e7f03d8a6917aef9061ef9e9))
- add visualization components and centralized types ([059b201](https://github.com/urmzd/github-insights/commit/059b201d1e5af97fd77c1bb9cb5809237dff7cd7))
- **components**: add new metrics visualization components ([0c703a6](https://github.com/urmzd/github-insights/commit/0c703a6d21774bd04a190454ec14eb4c873d4331))
- **theme**: add light mode support and update layout metrics ([681ea16](https://github.com/urmzd/github-insights/commit/681ea164769f1dd23502274be6ddb1041c2c5767))
- separate archived/legacy projects into dedicated sections across all templates ([c4d0ba0](https://github.com/urmzd/github-insights/commit/c4d0ba048490700e3d6702b1cbb296fa333ac671))
- **templates**: add ecosystem template and project categorization ([50eb545](https://github.com/urmzd/github-insights/commit/50eb545ec6a8afe7755fa9d0f5d6f6ef0156ce41))
- **api**: add retry mechanism for rate-limited API requests ([eef89d3](https://github.com/urmzd/github-insights/commit/eef89d3c5870f075e1798852c57ce9e86150bb00))
- enrich project display with AI summaries, h3 headings, and complexity ranking ([592eac4](https://github.com/urmzd/github-insights/commit/592eac4627c5c7f85df07f0eda23f1c4c86b5d35))
- **types**: add complexity fields to ProjectItem ([4799855](https://github.com/urmzd/github-insights/commit/47998557952bc9860d4d7166d0e57ce1cc96d859))
- **index**: prioritize projects by technical complexity ([b2df859](https://github.com/urmzd/github-insights/commit/b2df859ba4af8cf494e700fe771d49a3440e3b70))
- **metrics**: add project complexity scoring ([7722d95](https://github.com/urmzd/github-insights/commit/7722d95cafd0a1f8970d966f2711bb359ab9d4d0))
- **examples**: generate template examples in subdirectories ([6d1f9c2](https://github.com/urmzd/github-insights/commit/6d1f9c2ce0e15c3a8206040795251d160457057d))
- **metrics**: classify projects by commit activity ([1d82009](https://github.com/urmzd/github-insights/commit/1d82009f36ab1126b038484846c1c6a54bd891d4))
- **api**: fetch commit contributions by repository ([90fdc0d](https://github.com/urmzd/github-insights/commit/90fdc0da4997e22337b8cb71a8efd0dbcce8af14))
- publish to npm on release ([10baa8e](https://github.com/urmzd/github-insights/commit/10baa8e4db2340f7c724023f20b550001bd0ad50))
- remove GitHub badge from preamble and add generation date to attribution ([6b2c559](https://github.com/urmzd/github-insights/commit/6b2c559f8cb23a5f28a8b2b342628ca9079a0b60))
- replace generate-readme flag with readme-path, add project docs ([e1b8ccf](https://github.com/urmzd/github-insights/commit/e1b8ccf13c97ca90b6f86854f6aba2918e2f5a2e))
- add proficiency scores to expertise bars and disable commit-push locally ([5234526](https://github.com/urmzd/github-insights/commit/52345268d402b729f6b625f0fc615eb0b317271c))
- add force re-release support to release workflow ([e177fe1](https://github.com/urmzd/github-insights/commit/e177fe1df45fcf61e68226fe6bedc5cf0ba29a7d))
- replace hardcoded tech classification with AI-curated tech highlights ([6110ebf](https://github.com/urmzd/github-insights/commit/6110ebfd486c8f0ad4a47719fb0075279823cb91))
- initial implementation of github-metrics action ([f673d23](https://github.com/urmzd/github-insights/commit/f673d235b1243bda166f1b3a75c730be3594a406))

### Bug Fixes

- **ci**: apply biome formatting to readme test assertions ([b6daf6d](https://github.com/urmzd/github-insights/commit/b6daf6d4c92e95e902a30186ad4ea1a0b2d2174e))
- **ci**: apply biome formatting to config.ts ([5813708](https://github.com/urmzd/github-insights/commit/58137089d5ba1e331e2f5cc53ede03b299e61d07))
- **ci**: upgrade npm to latest for trusted publishing support ([3be958b](https://github.com/urmzd/github-insights/commit/3be958bf1b6b37fe9be28d3578ed519f652c4a7b))
- add repository field to package.json for npm trusted publishing ([6295436](https://github.com/urmzd/github-insights/commit/6295436efc7300c72011ecf703aaa549c0ec6e19))
- **ci**: set package.json version from sr output before npm publish ([f0fd07a](https://github.com/urmzd/github-insights/commit/f0fd07a2a2fcb8432a668366e1e765035a69e5de))
- **ci**: add registry-url for npm trusted publishing ([e926bd2](https://github.com/urmzd/github-insights/commit/e926bd2cb7cce7e970be462bd6bee0c1b47ec0c5))
- **release**: use npm trusted publishing and add Apache-2.0 license field ([baeb000](https://github.com/urmzd/github-insights/commit/baeb000d3156154b6d742c97a272108401d3176b))
- **ci**: collapse varDefs chain to single line for biome compliance ([07f9e04](https://github.com/urmzd/github-insights/commit/07f9e04dc3c61a7d5eb195936c1b48a7801e30ce))
- **ci**: format long lines in metrics.ts for biome compliance ([e95bd11](https://github.com/urmzd/github-insights/commit/e95bd113463df7d21c10a6f99ece1e5fdc1a6bc0))
- **ci**: format long lines in metrics.test.ts for biome compliance ([bf122a2](https://github.com/urmzd/github-insights/commit/bf122a220f1cadf7b9d80a1f5358dff231a50f7c))
- use npm trusted publishing with OIDC instead of token ([9879e82](https://github.com/urmzd/github-insights/commit/9879e824e095a876b56c9aba444829739bf6e4a8))
- distinguish active vs popular projects in AI preamble prompt ([35f6cd5](https://github.com/urmzd/github-insights/commit/35f6cd50f51223b0fac907ed2c33255ef5603a9d))
- increase vertical spacing between text labels and bar SVGs ([a289b65](https://github.com/urmzd/github-insights/commit/a289b653a412eae1826b2fd2b813dff564acefc5))
- separate labels and bars onto two lines to prevent text overlap ([5def528](https://github.com/urmzd/github-insights/commit/5def528df87a2644ec968a61d4b9a954334e648a))
- use first-person AI prompts and show usernames in social badges ([878ab84](https://github.com/urmzd/github-insights/commit/878ab840ec51a7c4e13f015ecfe0f59eac0c9ad7))
- use gpt-4.1 model and fix lint warning in regex ([ceed632](https://github.com/urmzd/github-insights/commit/ceed63262b47d12f4ebb3f62923627cc9a26b491))
- prevent conversational filler in AI-generated preamble ([6f03dcb](https://github.com/urmzd/github-insights/commit/6f03dcb8c9189aa68fc3aa98402ec7618e9d0c59))
- format chained method calls to satisfy biome formatter ([da066a8](https://github.com/urmzd/github-insights/commit/da066a865a9441121ea66c7ba9e4c80ba73a495f))
- strip markdown code fences from AI-generated preamble ([29941e1](https://github.com/urmzd/github-insights/commit/29941e194fe6f382269ab834035c43e856043d57))
- resolve biome format and lint errors in CI pipeline ([79281d7](https://github.com/urmzd/github-insights/commit/79281d7d944446d06e91679b2d6f44ba81e553dc))
- prevent text-bar overlap in expertise SVG ([cd67a6d](https://github.com/urmzd/github-insights/commit/cd67a6da3986d1b5b64bfc528cdf78b1371341da))
- use relative SVG paths in generated README ([24bb865](https://github.com/urmzd/github-insights/commit/24bb8658fef6bfbd853af912dc91ee7d80e2e4c7))
- move build steps to workflow and upload dist tarball as release artifact ([cde3095](https://github.com/urmzd/github-insights/commit/cde3095638dfc98f823ecdb0ac2018383642d324))
- let semantic-release handle floating major-version tags natively ([b649c58](https://github.com/urmzd/github-insights/commit/b649c58c6c284f85a1107bd5962181cf0510880c))
- use node24 runtime for GitHub Actions compatibility ([68d7854](https://github.com/urmzd/github-insights/commit/68d78547e0aa72af79f3eb0625df75e591b1f6ff))
- add eslint config and fix lint errors ([ff71ad0](https://github.com/urmzd/github-insights/commit/ff71ad0103890ffa5e30904a25d10b8143fd3d27))

### Documentation

- update profile README and example documentation ([bc7be4a](https://github.com/urmzd/github-insights/commit/bc7be4a0d8127c163a8c860d7518b579f8efcf8d))
- **skills**: align SKILL.md with agentskills.io spec ([8190352](https://github.com/urmzd/github-insights/commit/8190352ce1d5b9b8a075091c114df4ebe060abee))
- **examples**: regenerate example documentation outputs ([2f795a8](https://github.com/urmzd/github-insights/commit/2f795a85a3894c1c62049407292abae97cab1329))
- **assets**: regenerate default visualization assets ([f7b3f60](https://github.com/urmzd/github-insights/commit/f7b3f60ffbce4b80e77ede1dd6a8c8bfc5739f80))
- add example visualization assets for metrics documentation ([f7dfd6c](https://github.com/urmzd/github-insights/commit/f7dfd6c1e64571a8a92c4e9d4f4593082291cf30))
- **skill**: update GitHub Insights branding and section definitions ([468768b](https://github.com/urmzd/github-insights/commit/468768b7c2646361e6f653207b3499f6a8bbd342))
- **contributing**: clarify file descriptions and remove brittle line references ([374f274](https://github.com/urmzd/github-insights/commit/374f27491981498e267695d3ef8e5e03b1949527))
- update documentation for new metrics visualization system ([6d65494](https://github.com/urmzd/github-insights/commit/6d65494f4901068a636ea18525c41e8ba6e171bd))
- **examples**: update example outputs with new metrics visualizations ([639729d](https://github.com/urmzd/github-insights/commit/639729da839ad65283f848dc392ae62105451d4f))
- **example**: add ecosystem template example ([61e942b](https://github.com/urmzd/github-insights/commit/61e942be4c2a077e8f5b567ad9f24749ecb0c3ef))
- document template system and options ([7e47da3](https://github.com/urmzd/github-insights/commit/7e47da30eaeec29441c7e616ce812cb470c0b814))
- **skill**: comprehensive rewrite of github-metrics agent skill ([ea7212f](https://github.com/urmzd/github-insights/commit/ea7212f389b3911fbb7d5cc2534073268f1b34f5))
- replace just commands with npm run across all documentation ([0d21636](https://github.com/urmzd/github-insights/commit/0d21636786d207d2082f68504933b1978b68b5f7))
- add AGENTS.md and agent skill for Claude Code ([e0dd48e](https://github.com/urmzd/github-insights/commit/e0dd48e8cc1d79b98d8f892bd8e89b6313944ff5))
- sync README and CONTRIBUTING with recent code changes ([1e0ef6d](https://github.com/urmzd/github-insights/commit/1e0ef6d523284225f3f3ccc90789ac852c4b42d5))
- update badge examples in preamble generation prompt ([4f4f265](https://github.com/urmzd/github-insights/commit/4f4f2659659119661649bd4d75230d2b6dc68a8f))
- move full dashboard SVG to end of README ([3b9c14f](https://github.com/urmzd/github-insights/commit/3b9c14fa9eb6be98e55ed92d45c79d5b45c24131))
- add README, CONTRIBUTING, LICENSE and fix release workflow ([6c0b27e](https://github.com/urmzd/github-insights/commit/6c0b27ed41968a02139b9cd690eb87fc3fb20a55))

### Refactoring

- **metrics**: adjust constellation layout padding ([9582374](https://github.com/urmzd/github-insights/commit/958237409d87483357a0361ff059676d4636407c))
- **impact-trail**: adjust language label positioning and row height ([d1b4570](https://github.com/urmzd/github-insights/commit/d1b4570adaa469cf8409ce2143b5b1e7ddc62c74))
- **components**: remove language group labels from constellation ([e426b2b](https://github.com/urmzd/github-insights/commit/e426b2bf5fa1e32aea444da641beb1ba6146079d))
- **components**: remove unused parameter from map function in language-velocity ([82e765e](https://github.com/urmzd/github-insights/commit/82e765e138f0941e3c416052805bb88de0abfad3))
- **metrics**: remove unused projects parameter from buildSections ([935b60f](https://github.com/urmzd/github-insights/commit/935b60f3eaaf97628cc2c2d0ef6c6bf6eaa752d6))
- **contribution-rhythm**: remove most active day display ([22972df](https://github.com/urmzd/github-insights/commit/22972df883a9d42c90087bfe0d0218ee3c83ca6a))
- **core**: migrate to new metrics and visualization pipeline ([3d7766d](https://github.com/urmzd/github-insights/commit/3d7766d9c18ef76cfb9ad1048fa28a6e4901afad))
- **templates**: update readme generation for new metrics ([e8a460c](https://github.com/urmzd/github-insights/commit/e8a460c08401e1f3830055a5f5dca54354752c04))
- **rendering**: simplify section rendering with new component system ([eda1f53](https://github.com/urmzd/github-insights/commit/eda1f5316802afd8a586a35f979bc1f089259e8e))
- **api**: remove deprecated expertise analysis fetching ([e64d19c](https://github.com/urmzd/github-insights/commit/e64d19c4614b3f1f2731ed3d4c1360de1bcf85c8))
- **metrics**: implement new metric computation functions ([ec1530e](https://github.com/urmzd/github-insights/commit/ec1530ea40bdc6ab80218911d31e4aa3fa8c963e))
- **types**: update types for new metrics visualization system ([0046f35](https://github.com/urmzd/github-insights/commit/0046f35cf14acfeb7b8face348021db708018afe))
- remove legacy metrics/ path references and migrate to assets/insights ([f49cc64](https://github.com/urmzd/github-insights/commit/f49cc64ad37cf73ef993543945afe6a9cd78c1b1))
- **api**: extract graphql client and refactor fetch functions ([0e3850d](https://github.com/urmzd/github-insights/commit/0e3850d27e8cfe3831e35b1606fa4709abe449d8))
- move template preview READMEs to examples/ directory ([0deddc1](https://github.com/urmzd/github-insights/commit/0deddc1ec66b475bba6e775cbe3c894e31edf954))
- replace ESLint + Prettier with Biome ([4ba4068](https://github.com/urmzd/github-insights/commit/4ba4068568068415b962cdd99237a31332466c7a))

### Miscellaneous

- update semantic-release action to sr@v2 ([b812af8](https://github.com/urmzd/github-insights/commit/b812af8ee5cffdde97360fa5bd5c04c9e17ab9dd))
- **ci**: update githooks configuration ([b920931](https://github.com/urmzd/github-insights/commit/b9209315f227a2c88fe0e8bc7b3f7c6657b65c41))
- regenerate compiled artifacts ([ed339a1](https://github.com/urmzd/github-insights/commit/ed339a19df2aa4599580be620510597ac2e84580))
- **contribution-rhythm**: remove trailing whitespace ([34bfcfa](https://github.com/urmzd/github-insights/commit/34bfcfa2800d8f50c185cffa7f3f81859053727c))
- **hooks**: configure git hooks for code validation ([0a4e778](https://github.com/urmzd/github-insights/commit/0a4e778e69d93e6fcc16ea4c80309908efb645a4))
- rebuild distribution with calendar-weighted monthly distributions ([9108bff](https://github.com/urmzd/github-insights/commit/9108bff98c2a29c53d5d7e1b8efb3ef702a9621a))
- **test**: consolidate test assertion to single line ([b769338](https://github.com/urmzd/github-insights/commit/b7693380ea57f701eafbd1ec4a115b173aa905dc))
- **metrics**: reformat totalWeight calculation for readability ([696bb8e](https://github.com/urmzd/github-insights/commit/696bb8ed46c7c835cf85bcb2e30f7d0efe03b2dd))
- remove outdated metrics example files ([8426742](https://github.com/urmzd/github-insights/commit/8426742f5bdcf8319d66bea91421e2a53e40f32e))
- **full-svg**: update test expectations for new rendering pattern ([4072294](https://github.com/urmzd/github-insights/commit/407229444dc699dd0ab966cc7dcc17fe78efb808))
- remove teasr demo configuration ([5a09539](https://github.com/urmzd/github-insights/commit/5a095398e057326cf4f21ce9c7c889fcdb6cd4ed))
- rebuild distribution for new visualization system ([a6b8117](https://github.com/urmzd/github-insights/commit/a6b8117df0dc52bcd9482a8214022b6915891c22))
- update test expectations for new metrics system ([95b8100](https://github.com/urmzd/github-insights/commit/95b8100580b405f4bde0b24073a2f54c92120a06))
- **components**: remove deprecated visualization components ([a5829b9](https://github.com/urmzd/github-insights/commit/a5829b97577cf6c89fb131409b6f7bea462cde7e))
- bump version to 2.0.0 after npm publish ([4619e1a](https://github.com/urmzd/github-insights/commit/4619e1a4675211a2090da610355ec8ae5c34fadd))
- rebuild dist bundle for github-insights rename ([52ef66b](https://github.com/urmzd/github-insights/commit/52ef66be7e187ae180049cbbd1fb55f85f6006d4))
- sync package-lock.json after @types/node update ([e142a62](https://github.com/urmzd/github-insights/commit/e142a6280dd7e428850ef7b548f136b3db90dea3))
- upgrade @types/node from ^20 to ^24 ([662294e](https://github.com/urmzd/github-insights/commit/662294ea51fdc2eac6def436b4e9f219b4c859f5))
- rebuild and regenerate all example outputs ([39a79fa](https://github.com/urmzd/github-insights/commit/39a79fad0fe2b2ea622bbe3481d001c911b94ce0))
- standardize project files and README header ([fec5a8d](https://github.com/urmzd/github-insights/commit/fec5a8dff92dc81bb1668a298dc652770cb301e8))
- regenerate dist bundle and example metrics ([9445ecf](https://github.com/urmzd/github-insights/commit/9445ecf9345aa5a64e4eee5a0a7c9248198800c6))
- **metrics**: update project sorting tests for complexity ranking ([26493fb](https://github.com/urmzd/github-insights/commit/26493fbab2f0675b62a9105a94b06eee8061c575))
- **metrics**: update generated metrics ([19b67e2](https://github.com/urmzd/github-insights/commit/19b67e279f6c4ba34012959a8cc5df78a9c7be80))
- standardize GitHub Actions workflows ([937c5fb](https://github.com/urmzd/github-insights/commit/937c5fbe51f3f696d31616b7c0d2dbf46b1263cd))
- add sensitive paths to .gitignore ([db54124](https://github.com/urmzd/github-insights/commit/db541241a71acb4c4fb6300e2139ac3acc8f0f10))
- remove dist/ from version control ([81ecb1a](https://github.com/urmzd/github-insights/commit/81ecb1a08c2e92c528612cc3387289e083c3458f))
- add preamble regression tests for generateReadme ([6398a13](https://github.com/urmzd/github-insights/commit/6398a13dbf46b47b4d7ddaa68e2774b85fdd61a4))
- update semantic-release action to v1 ([dc6e490](https://github.com/urmzd/github-insights/commit/dc6e490912e6acabdcaff3db2a83426a803ec0fd))
- gitignore _README.md temp artifact ([93f8502](https://github.com/urmzd/github-insights/commit/93f8502b0d6a7c7b40494efd82b8554fb506903c))
- update biome schema to 2.3.14 and apply formatting fixes ([f1a0600](https://github.com/urmzd/github-insights/commit/f1a060091bc99e8ff1132363d8e2e4b1cdbd873f))
- update metrics ([1a36de7](https://github.com/urmzd/github-insights/commit/1a36de7892b23f662eded8501bb9b19f2e4dbb75))
- update metrics ([064378c](https://github.com/urmzd/github-insights/commit/064378c7dc97651bca2242cff8fc8e8af2889c5d))
- stop tracking dist/ and let semantic-release build it ([c4959ee](https://github.com/urmzd/github-insights/commit/c4959ee381770650f91f085deca7cacc144e600d))
- rebuild dist/ to match source ([46224b3](https://github.com/urmzd/github-insights/commit/46224b37e4e3d86777512ba1fcdfdb747a395053))
- fix prettier formatting in 6 source files ([b2b2241](https://github.com/urmzd/github-insights/commit/b2b22416163d5cadafe3e819cdab5ec492d794db))
- apply formatter and linter fixes ([9ea6254](https://github.com/urmzd/github-insights/commit/9ea62542efd3480cc0980979d879de12aed92530))

[Full Changelog](https://github.com/urmzd/github-insights/compare/v2.4.0...v3.0.0)


## 2.4.0 (2026-03-24)

### Features

- **templates**: add AI metadata, descriptive alt text, and section structure ([5c371b5](https://github.com/urmzd/github-insights/commit/5c371b52e8d1c29d001cc15e0dc715690d3657a9))

### Documentation

- **examples**: regenerate example documentation outputs ([6696f57](https://github.com/urmzd/github-insights/commit/6696f57a9088a325daff30b6a694f6631beb65a6))
- **assets**: regenerate default visualization assets ([790231c](https://github.com/urmzd/github-insights/commit/790231c8c6fcdd07fe300443138d6f0cd96637aa))

[Full Changelog](https://github.com/urmzd/github-insights/compare/v2.3.0...v2.4.0)


## 2.3.0 (2026-03-23)

### Features

- add visualization components and centralized types ([b770442](https://github.com/urmzd/github-insights/commit/b77044202eb1e366f4d0b84902de8bfa3854a135))

### Documentation

- add example visualization assets for metrics documentation ([9870e5c](https://github.com/urmzd/github-insights/commit/9870e5c76894511e73a0c2984185436f8f09555b))

### Miscellaneous

- **ci**: update githooks configuration ([683e0e2](https://github.com/urmzd/github-insights/commit/683e0e208f15b6431fc51d35781fb0694ae1f405))

[Full Changelog](https://github.com/urmzd/github-insights/compare/v2.2.0...v2.3.0)


## 2.2.0 (2026-03-22)

### Features

- **components**: add new metrics visualization components ([ffd507f](https://github.com/urmzd/github-insights/commit/ffd507f323026bc7221f87be717dc25512e7a0b7))
- **theme**: add light mode support and update layout metrics ([6f3d029](https://github.com/urmzd/github-insights/commit/6f3d0291e21596268e3cb99e206838b17cd7f0b4))

### Documentation

- **skill**: update GitHub Insights branding and section definitions ([e4d16aa](https://github.com/urmzd/github-insights/commit/e4d16aab59906e8a49d1ba2cf11a90dbf9d4528b))
- **contributing**: clarify file descriptions and remove brittle line references ([acf814b](https://github.com/urmzd/github-insights/commit/acf814b8a3b1fa9e9755037bc67c67e43be9e7e1))
- update documentation for new metrics visualization system ([ae4bd64](https://github.com/urmzd/github-insights/commit/ae4bd6470ce53105a857da612b891d14026e0f2f))
- **examples**: update example outputs with new metrics visualizations ([e20b83e](https://github.com/urmzd/github-insights/commit/e20b83eed00cc828fda4ca39dff68103df8bdf53))

### Refactoring

- **components**: remove language group labels from constellation ([fdc10e5](https://github.com/urmzd/github-insights/commit/fdc10e507cf4be3576eb76e45c542a58b59172c3))
- **components**: remove unused parameter from map function in language-velocity ([7c0e10f](https://github.com/urmzd/github-insights/commit/7c0e10f0931499c9416e785d25a5c99b252ab1df))
- **metrics**: remove unused projects parameter from buildSections ([c377064](https://github.com/urmzd/github-insights/commit/c377064e830e6daf0d6975f6860f74f6cb6b4f79))
- **contribution-rhythm**: remove most active day display ([bca985a](https://github.com/urmzd/github-insights/commit/bca985ab0281646f1c2451eda7417888cad42935))
- **core**: migrate to new metrics and visualization pipeline ([dd8e668](https://github.com/urmzd/github-insights/commit/dd8e668c4e42477bd655dd17eeeacdbf80d59003))
- **templates**: update readme generation for new metrics ([4dbc556](https://github.com/urmzd/github-insights/commit/4dbc5562f385fe9626796b04926400a796763265))
- **rendering**: simplify section rendering with new component system ([719e884](https://github.com/urmzd/github-insights/commit/719e884f26fb13b29f8202a9065b06271c409259))
- **api**: remove deprecated expertise analysis fetching ([9d98640](https://github.com/urmzd/github-insights/commit/9d98640d72877284ded5c9d9498f1c9ac8f824c3))
- **metrics**: implement new metric computation functions ([5026fa8](https://github.com/urmzd/github-insights/commit/5026fa8c19ca8b08dc1b6f35cc0749843d68086a))
- **types**: update types for new metrics visualization system ([6f195bb](https://github.com/urmzd/github-insights/commit/6f195bbf5aa165b4c26b07fb732beab4bb98a87c))

### Miscellaneous

- regenerate compiled artifacts ([c3222b2](https://github.com/urmzd/github-insights/commit/c3222b2433ba2122517ac2696eb37c7187759abe))
- **contribution-rhythm**: remove trailing whitespace ([c8c53f9](https://github.com/urmzd/github-insights/commit/c8c53f9c9b4f5de360e7e7186152281f692ebf7f))
- **hooks**: configure git hooks for code validation ([ed97a29](https://github.com/urmzd/github-insights/commit/ed97a29c56e9f7f0d8018c66e804cc70ab5e266d))
- rebuild distribution with calendar-weighted monthly distributions ([2334ed1](https://github.com/urmzd/github-insights/commit/2334ed1fb9f58c8bfaf2222ed1c8e8e80f623df7))
- **test**: consolidate test assertion to single line ([75b18a5](https://github.com/urmzd/github-insights/commit/75b18a5e1e7199e3692963e448fa7f537673f39c))
- **metrics**: reformat totalWeight calculation for readability ([13547a3](https://github.com/urmzd/github-insights/commit/13547a3447ea1589859390d001751be2f310963f))
- remove outdated metrics example files ([f5bf142](https://github.com/urmzd/github-insights/commit/f5bf14238372750eb712bcc9144c0a20cdfbef42))
- **full-svg**: update test expectations for new rendering pattern ([a692e6c](https://github.com/urmzd/github-insights/commit/a692e6c33c3a68ef6d8491d87ba9a070455a355e))
- remove teasr demo configuration ([6c64e56](https://github.com/urmzd/github-insights/commit/6c64e56cada6ca59e98a1963e6c799ebdaa600c3))
- rebuild distribution for new visualization system ([a543b8f](https://github.com/urmzd/github-insights/commit/a543b8f7386c49552f840d1b5d4129a87ffdced4))
- update test expectations for new metrics system ([b421284](https://github.com/urmzd/github-insights/commit/b4212845cce3e2e3f8791c43c22af9f5e212ec41))
- **components**: remove deprecated visualization components ([1a8c9b4](https://github.com/urmzd/github-insights/commit/1a8c9b46c275cc96552efdf818e69657bc6c6c0d))

[Full Changelog](https://github.com/urmzd/github-insights/compare/v2.1.0...v2.2.0)


## 2.1.0 (2026-03-18)

### Features

- separate archived/legacy projects into dedicated sections across all templates ([6327c64](https://github.com/urmzd/github-insights/commit/6327c64e568b5f25affc7a2f2a90a01c49c37ee6))

[Full Changelog](https://github.com/urmzd/github-insights/compare/v2.0.1...v2.1.0)


## 2.0.1 (2026-03-17)

### Bug Fixes

- **ci**: apply biome formatting to readme test assertions ([1b69cc1](https://github.com/urmzd/github-insights/commit/1b69cc1eb806f17e44d8ca04c11cc48afb19d1da))

### Refactoring

- remove legacy metrics/ path references and migrate to assets/insights ([cd2c961](https://github.com/urmzd/github-insights/commit/cd2c961f5ea3032e5676ad070d4960c0a4232b54))

[Full Changelog](https://github.com/urmzd/github-insights/compare/v2.0.0...v2.0.1)


## 2.0.0 (2026-03-16)

### Breaking Changes

- rename project to github-insights with YAML config and new output dir ([9dbca28](https://github.com/urmzd/github-insights/commit/9dbca28f23f8ab8984b1d389f26f32dffa6c579a))

### Bug Fixes

- **ci**: apply biome formatting to config.ts ([4bc0821](https://github.com/urmzd/github-insights/commit/4bc08217885522ee7503dcc526b02315ca42da5e))

### Miscellaneous

- bump version to 2.0.0 after npm publish ([a4eb533](https://github.com/urmzd/github-insights/commit/a4eb533728cf27e0acb55eda1e3cdf4c99031f83))
- rebuild dist bundle for github-insights rename ([d9e563b](https://github.com/urmzd/github-insights/commit/d9e563bb81a85e33dc1a882402189743cdec83a8))

[Full Changelog](https://github.com/urmzd/github-insights/compare/v1.2.4...v2.0.0)


## 1.1.0 (2026-03-15)

### Features

- enrich project display with AI summaries, h3 headings, and complexity ranking ([93fdeed](https://github.com/urmzd/github-metrics/commit/93fdeed2c6277d29b8d65b69fb790ac8ec0eeaaf))

### Documentation

- **skill**: comprehensive rewrite of github-metrics agent skill ([4d641fd](https://github.com/urmzd/github-metrics/commit/4d641fd664190993cb0c4408d0eca35fd7cca41e))

[Full Changelog](https://github.com/urmzd/github-metrics/compare/v1.0.1...v1.1.0)


## 1.0.1 (2026-03-15)

### Bug Fixes

- **release**: use npm trusted publishing and add Apache-2.0 license field ([d181940](https://github.com/urmzd/github-metrics/commit/d181940db6debce9ffa0f4628a1c1f7db8bf48c4))

[Full Changelog](https://github.com/urmzd/github-metrics/compare/v1.0.0...v1.0.1)


## 1.0.0 (2026-03-15)

### Breaking Changes

- remove justfile build tool ([d126632](https://github.com/urmzd/github-metrics/commit/d126632c949d8081fc186aaa2c63ee44803b13f1))

### Features

- **types**: add complexity fields to ProjectItem ([638df32](https://github.com/urmzd/github-metrics/commit/638df328c8d58a2c51ca26709e1f6e7453d26d1b))
- **index**: prioritize projects by technical complexity ([58ddc2a](https://github.com/urmzd/github-metrics/commit/58ddc2ac8a49bacd78e46da4a4d3356f16c5e4b0))
- **metrics**: add project complexity scoring ([1e1a729](https://github.com/urmzd/github-metrics/commit/1e1a7298cd6a457f2235d56994968bf3973f208c))

### Bug Fixes

- **ci**: collapse varDefs chain to single line for biome compliance ([912a9d9](https://github.com/urmzd/github-metrics/commit/912a9d9290ae77d125161dbcd4bfcdb3633753ef))
- **ci**: format long lines in metrics.ts for biome compliance ([60a9ae1](https://github.com/urmzd/github-metrics/commit/60a9ae1089c69251a478771db5eea01be74c2261))

### Documentation

- replace just commands with npm run across all documentation ([09675e5](https://github.com/urmzd/github-metrics/commit/09675e580974eb25740122da3f1797ce07cd7ba7))
- add AGENTS.md and agent skill for Claude Code ([a7d6d05](https://github.com/urmzd/github-metrics/commit/a7d6d05045017429ec20394e222f895f1682df1c))

### Refactoring

- **api**: extract graphql client and refactor fetch functions ([62642d8](https://github.com/urmzd/github-metrics/commit/62642d81f9f5e4c0c687b59f7381df509ae49090))

### Miscellaneous

- regenerate dist bundle and example metrics ([59d7737](https://github.com/urmzd/github-metrics/commit/59d77373779e5ca51d8200bdcff36dbb8d185666))
- **metrics**: update project sorting tests for complexity ranking ([004e14f](https://github.com/urmzd/github-metrics/commit/004e14f2b27455905801aba4967fc4860ca020cc))

[Full Changelog](https://github.com/urmzd/github-metrics/compare/v0.6.0...v1.0.0)


## 0.6.0 (2026-03-05)

### Features

- **examples**: generate template examples in subdirectories ([ff257e2](https://github.com/urmzd/github-metrics/commit/ff257e29045c5ae046a9d0a604b0fa91162fdca9))
- **metrics**: classify projects by commit activity ([59d11a9](https://github.com/urmzd/github-metrics/commit/59d11a91faab801ad18859443a399a2a969b8cc1))
- **api**: fetch commit contributions by repository ([42c2e2e](https://github.com/urmzd/github-metrics/commit/42c2e2ea50283305eb085d1b04ba87b115a06bee))

### Bug Fixes

- **ci**: format long lines in metrics.test.ts for biome compliance ([d889d64](https://github.com/urmzd/github-metrics/commit/d889d64870f1a3728d006c061d6f05a86b7bd449))

### Miscellaneous

- **metrics**: update generated metrics ([cdde265](https://github.com/urmzd/github-metrics/commit/cdde2657eb36d624fba5a96af1ba6ddb4a030dca))


## 0.5.1 (2026-02-27)

### Bug Fixes

- use npm trusted publishing with OIDC instead of token ([dc81e99](https://github.com/urmzd/github-metrics/commit/dc81e993cfd3e7fdf777a5282d713364936713df))

### Miscellaneous

- **release**: v0.5.0 [skip ci] ([da30654](https://github.com/urmzd/github-metrics/commit/da306547f0a9c9ca8bb5e05ff89c973f3b4043b2))


## 0.5.0 (2026-02-27)


## 0.5.0 (2026-02-27)

### Features

- publish to npm on release ([152067e](https://github.com/urmzd/github-metrics/commit/152067e5f9c01100da7d1f6ac01544e92e30c26b))


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
