# `@vuu-ui/portal-build`

`@vuu-ui/portal-build` is a reusable, JSON-configured build tool for portal
applications and Module Federation remote modules. It owns the Rsbuild, React,
CSS-inline, and Module Federation configuration while each application owns its
paths, entries, remotes, shared dependencies, and generated manifest values.

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

Set `"target": "remote-module"` to build a federated remote instead of a host.
The remote target emits the same standalone HTML bundle and Module Federation
runtime as the legacy remote-module builder:

```json
{
  "version": 1,
  "target": "remote-module",
  "paths": {
    "entry": "./src/index.tsx",
    "htmlTemplate": "../remote-module-template/index.html",
    "output": "../../dist_portal/example",
    "publicPath": "http://localhost:5002/"
  },
  "html": {
    "title": "example (standalone)"
  },
  "server": {
    "corsOrigins": ["http://localhost:5002"]
  },
  "moduleFederation": {
    "name": "example",
    "dts": false,
    "exposes": {
      "./Feature": "./src/Feature"
    },
    "shared": {
      "react": {
        "requiredVersion": "^19.2.3"
      },
      "@vuu-ui/core": {
        "singleton": true,
        "requiredVersion": "3.3.12",
        "strictVersion": true
      }
    }
  }
}
```

Remote `moduleFederation.exposes` requests beginning with `src/` are normalized
to `./src/` for Rspack. `publicPath` controls the runtime URL used to load
remote chunks, while `server.corsOrigins` controls development-server CORS.
Remote shared dependency versions may be explicit or use
`requiredVersion: "package"` when the dependency is declared by the consuming
application.

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

The package supports Node 20 and newer. The published package contains compiled
JavaScript and TypeScript declarations; the workspace source remains TypeScript
so it can be typechecked alongside the VUU sources.
