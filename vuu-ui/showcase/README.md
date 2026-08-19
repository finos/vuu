# Vuu Showcase

Run `npm run showcase` from `vuu-ui` for development, or
`npm run showcase:prod` for a production build served at
`http://localhost:4173`.

The shell is an Rsbuild host. Examples are exposed by the
`showcase_examples` Module Federation remote at `/showcase-examples/`; the
shell keeps each selected example isolated in its existing iframe. Adding an
`.examples.tsx` or `.mdx` file below `src/examples` automatically adds a stable
remote expose and navigation descriptor.

Development uses one server at `http://localhost:4173`. The examples remote is
watched and rebuilt into the host's development output, then served by the host
at `/showcase-examples/`.
