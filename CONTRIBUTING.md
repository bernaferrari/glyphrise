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

## UI components and lint

Our shadcn components live in `components/ui` and are part of this codebase.
When several callers repeat the same appearance or spacing overrides, add a
variant or size to the shared component and migrate those callers together.
Keep existing defaults intact and check the rendered result.

The lint contracts allow callers to control layout. Unstyled `PopoverTrigger`,
`DialogTrigger`, `DialogClose`, and `ContextMenuTrigger` also allow appearance
classes because they do not supply a visual treatment. Styled components still
own their colors, spacing, and shape. Raw palette colors and arbitrary values
are checked on triggers too. Explicit `transition-[...]` property lists are
allowed so transitions can stay limited to the properties that change.

Keep lint at zero. Preserve computed timeline geometry and preview colors by
passing CSS custom properties to static classes. Use `cssLength` for lengths
that can be numeric, percentages, or `calc()` expressions. When adding named
Tailwind tokens or utilities, update the matching groups in `lib/utils.ts` so
`cn()` keeps font sizes, colors, shadows, and shape variants independent.

## Pull requests

Keep pull requests focused, describe the user-visible outcome, and include a
short screen recording or screenshot for visual changes. Avoid committing
generated build output, credentials, or local project files.
