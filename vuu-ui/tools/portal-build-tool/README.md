# `@vuu-ui/portal-build`

`@vuu-ui/portal-build` is a reusable, JSON-configured build tool for portal
applications. It owns the Rsbuild, React, CSS-inline, and Module Federation
configuration while each application owns its paths, entries, remotes, shared
dependencies, and generated manifest values.

The package exposes `buildPortal` for JavaScript/TypeScript build scripts and a
`portal-build` CLI:

```sh
portal-build --config ./portal-build.json
portal-build --config ./portal-build.json --local
portal-build --config ./portal-build.json --rsdoctor
```

The config path is resolved from the current working directory. All paths in
the config are resolved relative to the directory containing that config, so
the package does not depend on a repository layout.

## Configuration

```json
{
  "version": 1,
  "paths": {
    "htmlTemplate": "./public/index.html",
    "output": "./dist",
    "entries": {
      "remote": "./src/index.tsx",
      "local": "./src/local-index.tsx"
    },
    "preEntry": "@vuu-ui/vuu-theme/index.css"
  },
  "manifest": {
    "filename": "./config.json",
    "remote": {
      "ssl": true,
      "authUrl": "https://localhost:8080"
    },
    "local": {
      "ssl": false
    }
  },
  "moduleFederation": {
    "name": "host",
    "remoteType": "module",
    "remotes": {},
    "shared": {
      "react": {
        "requiredVersion": "package",
        "singleton": true,
        "strictVersion": true
      }
    }
  },
  "cssInline": {
    "include": ["/packages/"],
    "exclude": [".stories.tsx"]
  }
}
```

`requiredVersion: "package"` reads the version from the application
`package.json`. Use `package:<dependency-name>` when a federated request and
the package dependency have different names, for example
`@vuu-ui/core/portal` with `package:@vuu-ui/core`. A build variant can override
`entry`, `output`, `manifest`, or `moduleFederation` under `builds.local` or
`builds.remote`. If no local manifest is provided, the remote manifest is
used.

## Publishing and consuming

From the package directory, publish the package with the normal npm workflow:

```sh
npm publish --access public
```

An independent portal application can then install and invoke it from its own
package:

```sh
npm install @vuu-ui/portal-build
```

```json
{
  "scripts": {
    "build": "portal-build --config ./portal-build.json",
    "build:local": "portal-build --config ./portal-build.json --local"
  }
}
```

The package requires Node 22.6 or newer because its CLI and API are distributed
as TypeScript source, matching the Node-based TypeScript scripts used by VUU.
