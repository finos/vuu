---
name: react-ui-components
description: "Use when creating React UI components in this repo, including package placement, TypeScript props, exports, showcase examples, and tests. Keywords: create ui component, new React UI component, TSX component, add component test, Playwright component test, Vitest test, showcase example."
---

# React UI Components Skill

## Purpose
Create production-ready React UI components that follow this monorepo's existing structure and test conventions.

## Use When
- You need a new ui component in a `packages/*` library.
- You are adding TSX component APIs.
- You need accompanying Playwright component coverage.
- You need a showcase example fixture for manual verification.

## Repo Conventions
- Place source in `packages/<package-name>/src/`.
- Export public API via `packages/<package-name>/src/index.ts`.
- Prefer named exports for components and related prop types.
- Keep showcase examples under `showcase/src/examples/...` and use those as test fixtures when appropriate.
- For local data-backed examples, use `LocalDataSourceProvider` from `@vuu-ui/vuu-data-test`.

## Workflow
1. Confirm target package and whether this is public API or internal-only.
2. Inspect sibling components in that package to match naming and prop patterns.
3. Implement the component in `src/` with typed props and minimal public surface area.
4. Add/update exports in `src/index.ts` only when the symbol should be public.
5. Add tests in the same style already used by that package.
6. Add or update showcase examples when behavior is visual or interaction-heavy.
7. Run focused tests first, then broaden only if needed.

## Component Rules
- use folder with lowercase hyphenated name, filename matches component name exactly, as does css file name
- css classname on root element of component matches component name exactly but with vuu prefix
- Use function components with explicit props interfaces.
- Keep component logic small; extract hooks/utilities when logic grows.
- Follow nearby file naming and folder structure.
- Do not change existing public APIs unless explicitly requested.
- Use Salt style packages for loading css (useComponentCssInjection and useWindow);
- use clsx to manage className, import as cx. Always allow custom className, which will be
used in combination with component className

## Accessibility Rules
- Prefer semantic HTML and existing accessibility patterns in neighboring components.
- Add keyboard support for non-native interactive elements.
- Preserve focus visibility and tab flow.
- Add aria attributes only when required.

## Testing Rules
- Unit behavior tests usually live in `packages/<package>/test/*.test.ts` and use Vitest.
- Unit tests are only for logic testing e.g. in utility functions. Prefer playwright component tests for UI Component testing.
- Component interaction tests in UI-heavy packages may live in `packages/<package>/src/__tests__/__component__/*.playwright.test.tsx`.
- Use showcase-backed fixtures for Playwright component tests where the package already does this.
- Avoid broad snapshot-only coverage; assert behaviors and user-visible outcomes.

## Validation Commands
- Run focused Vitest file, if appropriate: `npm exec vitest run <path-to-test-file>`
- Run focused Playwright component file: `npm exec -- playwright test -c playwright-ct.config.ts <path-to-playwright-test-file>`
- Use npm commands in this repo.

## Output Checklist
- Source updated in correct package path.
- Public export updated only if required.
- Tests added/updated in repo-standard location.
- Showcase example added/updated for visual behaviors when useful.
- Focused validation commands run and results reported.
