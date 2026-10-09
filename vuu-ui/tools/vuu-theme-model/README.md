# vuu-theme-model

Build-time parser that produces a navigable JSON model of a
[Salt](https://saltdesignsystem.com) theme. The model drives the showcase
**Theme Browser** and is designed to be reused by a future theme editor and
VS Code extension (it is plain data and records the source location of every
declaration).

## Usage

```sh
# from vuu-ui
npm run build:theme-model

# or directly, for any Salt theme
node tools/vuu-theme-model/src/cli.ts \
  --entry path/to/css/theme-next.css \
  [--fallback path/to/css/theme.css] \
  [--name my-theme] [--out my-theme.json] [--pretty] [--verbose]
```

`npm run build:theme-model` writes `vuu-theme.json` and `salt-theme.json` to
`showcase/src/examples/ThemeBrowser/generated/` (gitignored).

The entry may be either a tree of files linked by `@import` (e.g.
`@vuu-ui/vuu-theme`) or a bundled file containing `/* css/... */` source marker
comments (e.g. `@salt-ds/theme`).

## What is modelled

Only the **shared foundations** (`css/foundations`) and the **next** theme
(`css/next/{foundations,palette,characteristics}`) are modelled. Legacy and
deprecated files are ignored.

Some next tokens reference tokens that are declared only in the legacy theme
(Salt's `theme-next.css` is designed to be loaded alongside `theme.css`).
Supplying `--fallback` resolves these. Only the tokens that are needed,
transitively, are pulled in, with `layer: "legacy"`.

| Concept     | Derived from                                                                                          |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| tier        | folder: `foundations` / `palette` / `characteristics`                                                 |
| group       | source file name, e.g. `actionable`                                                                   |
| axes        | selector conditions: `data-*` attributes (`mode`, `accent`, `corner`...) and `.*-density-*` classes   |
| scope       | a selector, canonicalised to base classes + axis conditions                                           |
| value       | raw source text, structural kind, `var()` references and source location (one value per scope)        |
| references  | `references` (what a token uses) and `referencedBy` (what uses a token)                               |
| category    | literal value kind, then name convention, then inherited through aliases (e.g. `color`, `shadow`)     |
| diagnostics | unresolved references, overrides within a scope, tokens declared in multiple files, complex selectors |

See [`src/theme-model-types.ts`](src/theme-model-types.ts) for the schema.

## Tests

```sh
cd tools/vuu-theme-model && npx vitest run
```
