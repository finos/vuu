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
# Clone the repository
git clone [https://github.com/finos/vuu.git](https://github.com/finos/vuu.git)

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
* **Java 17+**
* The example client code has already been installed and is ready in `deployed_apps`

#### Linux & macOS

```sh
# From the root folder, build both the core project and the examples
./mvnw install -DskipTests

# Navigate to the reference implementation in the examples folder
cd example/main 

# Start the example server (with HTTP REST endpoints and Vuu WebSocket)
../../mvnw exec:exec
```

#### Windows

```sh
# From the root folder, build both the core project and the examples
mvnw.cmd install -DskipTests

# Navigate to the reference implementation in the examples folder
cd example\main 

# Start the example server (with HTTP REST endpoints and Vuu WebSocket)
..\..\mvnw.cmd exec:exec
```

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

## Advanced Installation

While serving the Sample UI application directly from the Vuu server is convenient for initial testing, real-world deployments typically decouple the UI from the server.

The Sample UI is designed with a **modular, metadata-driven architecture**. This allows the client to connect to any active Vuu server instance, making it an ideal setup for testing new server implementations or mimicking production environments.

### Prerequisites

Before running the UI in decoupled mode, ensure you have the following:

* **Active Vuu Server:** A running Vuu server instance (ensure it is not locked behind a production-grade authentication solution for this demo).
* **Built Client:** The UI must be built and located at `./deployed_apps`.
* **Network Access:** The Vuu server can be on a separate machine; it is not required to serve the client UI code.

### How to Launch

Execute the following command to serve the application locally and target your Vuu server.

> **Note:** This example assumes the Vuu server is running on `localhost` using default ports. Adjust the URLs accordingly for remote deployments.

```bash
npm run launch:app -- --authurl https://localhost:8443/api --wsurl wss://localhost:8090/websocket
```

### Authentication & Connection Flow
The application follows a standard handshake process to establish data streams:

1) Sign-In: A login screen will be displayed upon launch.
2) Auth Request: The credentials entered are sent to the --authurl.
3) Token Exchange: The Vuu server (using the default example implementation) validates the request and yields an Auth Token.
4) WebSocket Handshake: This token is then used to authorize and open a persistent websocket connection at the --wsurl.

### Technical Considerations
#### CORS and Proxying
To avoid "Same-Origin Policy" (CORS) issues during the authentication phase, the local HTTP server serving the UI proxies the auth request to the Vuu server.

#### WebSocket Connectivity
Cross-domain WebSocket requests are not subject to the same same-origin restrictions as standard HTTP requests. Therefore, the UI can establish a direct connection to the Vuu server's websocket port without additional proxy configuration.

---

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
