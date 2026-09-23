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
portal-build --all-config ./portal-build-all.json
portal-build --all-config ./portal-build-all.json --local
portal-build --all-config ./portal-build-all.json --target module-admin
```

The config path is resolved from the current working directory. All paths in
the config are resolved relative to the directory containing that config, so
the package does not depend on a repository layout.

## Building a complete portal

Use a project-level `portal-build-all.json` when one command should build a
host and its configured remote modules. Targets run in declaration order, and
the order is stable for both the CLI and API. `--local` selects the host's
local entry and manifest; remote-module targets always use their remote build.
Use `--target <name>` to build one configured target.

```json
{
  "version": 1,
  "shared": {
    "react": {
      "requiredVersion": "package",
      "singleton": true,
      "strictVersion": true
    },
    "react-dom": {
      "requiredVersion": "package",
      "singleton": true,
      "strictVersion": true
    }
  },
  "targets": [
    {
      "name": "portal-host",
      "packageDir": "./portal-examples/portal-host",
      "config": "./portal-build.json",
      "target": "host"
    },
    {
      "name": "module-admin",
      "packageDir": "./portal-examples/module-admin",
      "config": "./portal-build.json",
      "target": "remote-module",
      "shared": {
        "@vuu-ui/core": {
          "singleton": true,
          "strictVersion": true
        }
      }
    }
  ]
}
```

`packageDir` is resolved relative to the project-level config and `config` is
resolved relative to that package directory. The declared target kind must
match the individual JSON config, so a miswired project fails before any
build starts. Project-level `shared` declarations are inherited by every
target. They are deep-merged per dependency in this order:
project defaults, the standalone target config's `moduleFederation.shared`,
then the target's optional `shared` exceptions. Later declarations override
only the fields they specify, so a target can change `strictVersion` without
repeating its required version or singleton setting. Standalone
`portal-build.json` files remain complete and behave the same when invoked
directly. The API equivalent is `buildPortalAll({ configPath, mode,
targetName })`; `createPortalBuildAllPlan` exposes the validated deterministic
plan without running Rsbuild.

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

Set `"target": "application"` for a standalone portal application that is not
a Module Federation container. It uses the same entry, HTML, output, React, and
CSS-inline build settings without emitting a federation container or manifest.

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
    "build": "portal-build --all-config ./portal-build-all.json",
    "build:local": "portal-build --config ./portal-build.json --local"
  }
}
```

Individual remote modules can still use their own package script:

```json
{
  "scripts": {
    "build:module-admin": "portal-build --config ./portal-build.json"
  }
}
```

The package supports Node 20 and newer. The published package contains compiled
JavaScript and TypeScript declarations; the workspace source remains TypeScript
so it can be typechecked alongside the VUU sources.
