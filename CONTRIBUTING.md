# Contributing to Glyphrise

Thanks for helping improve Glyphrise, a focused editor for turning SVG icons
into polished 3D motion.

## Before you start

Please search existing issues first. For a substantial change, open an issue
to discuss the interaction or export implications before implementation.

## Development

Requirements are Node.js 24.x and pnpm 11.x. Install dependencies and start the
local app with:

```bash
pnpm install
pnpm dev
```

Before opening a pull request, run the checks documented in the README:

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
```

Changes to editor interactions should include focused unit or Playwright tests.
Please document browser-specific behavior, export-fidelity tradeoffs, and any
SVG compatibility changes in the pull request.

## Pull requests

Keep pull requests focused, describe the user-visible outcome, and include a
short screen recording or screenshot for visual changes. Avoid committing
generated build output, credentials, or local project files.
