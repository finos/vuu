[![FINOS - Incubating](https://cdn.jsdelivr.net/gh/finos/contrib-toolbox@master/images/badge-incubating.svg)](https://community.finos.org/docs/governance/Software-Projects/stages/incubating)

# Vuu: The Realtime View Server

Welcome to Vuu. For full documentation, architecture diagrams, and deep dives, visit our documentation site:
👉 **[vuu.finos.org](https://vuu.finos.org/desktop/docs/introduction/intro)**

---

## Overview

This repository contains the source code for the **Vuu server** and a suite of **UI library packages**.

### ⚠️ Architectural Update: Networking & Hosting
We have recently decoupled the web hosting layer from the core Vuu engine to provide greater deployment flexibility:

* **WebSocket Layer:** This remains **built-in** to the Vuu server to handle high-performance, real-time data streaming.
* **HTTP Server:** Vuu **no longer** includes a built-in HTTP server for REST endpoints or static file hosting.

To establish a complete client session (e.g., from a UI), you need an external HTTP layer to supplement the Vuu WebSocket service. For a quick-start experience, we provide a **reference implementation using Vert.x** in the `examples/http2-server` folder.

---

## Installation - Client

The UI scripts all run from the vuu/vuu-ui directory.

```sh
#from top-level vuu repo (not vuu child directory in repo)
cd vuu-ui
npm install
npm run build
npm run build:app
```

The first build step (`npm run build`) builds the UI library packages, the packages are written to the `dist` folder.

The second step (`npm run build:app`) builds the sample application. Application bundles are written to `deployed_apps`. The UI library packages are dependencies of the application.

---

## Installation - Server

#### Prerequisites
See the [Development Docs](https://vuu.finos.org/desktop/docs/getting_started/developing) for required Java versions and dependencies.

The example client code has already been installed and is ready in `deployed_apps`

#### Linux & macOS
The steps below build the core and run the sample application, which provides the necessary HTTP endpoints to complement the Vuu WebSocket server.

```sh
# Clone the repository
git clone [https://github.com/finos/vuu.git](https://github.com/finos/vuu.git)

# Build both the core project and the examples
./mvnw install -DskipTests

# Navigate to the reference implementation in the examples folder
cd example/main 

# Start the example server (with HTTP REST endpoints and Vuu WebSocket)
../../mvnw exec:exec
```

#### Windows

This should be the same as Linux & macOS just with windows adjusted paths

#### IntelliJ

You may prefer to run the backend using the IntelliJ IDE instead of from the command line.

1. Install the Scala plugin: file -> settings -> plugins
2. Set project SDK version to 17: file -> project structure -> select an SDK -> require version 17
3. Enable 'Use plugin registry': file -> settings -> build, execution, deployment -> Maven
4. Open Maven tab on the right and click install on vuu-parent -> lifecycle -> install
5. In IntelliJ, select the 'SimulMain' run configuration config and click run.

### Accessing the UI

Once launched using one of the methods above, the demo app can be accessed at <https://localhost:8443/index.html>

---

## Installation - Alternative

While it is initially very convenient to be able to serve the Sample UI application directly from the Vuu server, in real-world scenarios the Vuu server is likely to be deployed independently of any UI. 

The demo can also be run in such a mode. The sample application has a modular architecture. The core functionality is driven by metadata provided by the connected Vuu server. This means it can be useful to run the sample application in a more realistic deployment setup or even when a real-world Vuu server implementation is under development. The sample application can be used to display and query the data tables from a running Vuu server instance. (This is only possible of course, with a vuu server instance that is not locked down for production with a full authentication solution).

To run the sample application this way, first deploy and start a Vuu server, then run the client build as described above. The Vuu server can be on a different machine , it will not be used to serve the client UI code.

Next use the following script to serve the sample UI application, it assumes the app is deployed at `./deployed_apps`. For the purposes or this illustration, we assume that the Vuu server is running on the local machine, on the default ports, though this is **not** required.

```
npm run launch:app -- --authurl https://localhost:8443/api --wsurl wss://localhost:8090/websocket
```

A Login screen will be displayed. The `authurl` will be used to _sign in_ to the Vuu server with the credentials entered and will yield an auth token. The auth token will then be used to open a websocket connection at `wsurl`. This works with the default example implementation of the Vuu server, because it performs no checks on the login credentials. The UI application is served by a local http server which proxies the auth request to the Vuu server to avoid CORS issues. Cross domain websocket requests are not subject to `same domain` restrictions.

## Usage example

```
Work In Progress!
```

## Roadmap

[Roadmap](https://vuu.finos.org/desktop/docs/roadmap)

## Contact

[Contact](https://vuu.finos.org/desktop/docs/contact)

## Contributing

For any questions, bugs or feature requests please open an [issue](https://github.com/finos/vuu/issues).

To submit a contribution:

1. Fork it (<https://github.com/finos/vuu/fork>)
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Read our [contribution guidelines](.github/CONTRIBUTING.md) and [Community Code of Conduct](https://www.finos.org/code-of-conduct)
4. Commit your changes (`git commit -am 'Add some fooBar'`)
5. Push to the branch (`git push origin feature/fooBar`)
6. Create a new Pull Request

_NOTE:_ Commits and pull requests to FINOS repositories will only be accepted from those contributors with an active, executed Individual Contributor License Agreement (ICLA) with FINOS OR who are covered under an existing and active Corporate Contribution License Agreement (CCLA) executed with FINOS. Commits from individuals not covered under an ICLA or CCLA will be flagged and blocked by the FINOS Clabot tool (or [EasyCLA](https://community.finos.org/docs/governance/Software-Projects/easycla)). Please note that some CCLAs require individuals/employees to be explicitly named on the CCLA.

_Need an ICLA? Unsure if you are covered under an existing CCLA? Email [help@finos.org](mailto:help@finos.org)_

## License

Copyright 2022 venuu-io

Distributed under the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0).

SPDX-License-Identifier: [Apache-2.0](https://spdx.org/licenses/Apache-2.0)
