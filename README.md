[![FINOS - Incubating](https://cdn.jsdelivr.net/gh/finos/contrib-toolbox@master/images/badge-incubating.svg)](https://community.finos.org/docs/governance/Software-Projects/stages/incubating)

# Vuu

## The Realtime View Server

Welcome. We maintain a docusaurus site containing all the details of the project. Why not get started there:

<https://vuu.finos.org/desktop/docs/introduction/intro>

This repo contains the source code for the Vuu server as well as a suite of UI library packages. You can use some or all of these UI packages when building a UI application that consumes data from a Vuu server. Additionally, there is a sample application with both a Vuu server implementation and a UI. The instructions below provide guidance for building and starting both.

Note: the Vuu server includes an http server, this hosts both a websocket endpoint and a https rest endpoint, both of which are required to establish a client Vuu session (e.g. from a UI).
When the build for the UI sample application is run, the static files created by the build are written to the `deployed_apps` folder. As a convenience for runnng the sample application, the Vuu server can also serve these static files. This is handy for a demo or when experimenting with the code, but is not intended for production use. By default, the Vuu server sample implementation **is** configured to serve these files from the `deployed_apps` folder (the `webRoot` property is used for this). This means that out of the box, the sample application can be run buy following the instructions below.
The UI build should be run before starting up the Vuu server, as the server is configured to use the `deployed_apps` folder as a webRoot, and that folder is only created when the UI build runs.

## Installation - Server

### Vuu Server

#### Prerequisites

See the [Docs](https://vuu.finos.org/desktop/docs/getting_started/developing) for Java versions and dependencies you need.

#### OS X & Linux

```sh
#In your favourite code directory...
git clone https://github.com/finos/vuu.git
#cd into the repository
cd vuu
#run the maven compile step
mvn install
#cd into vuu, child in repo
cd example/main
#The server can now be started on your machine
mvn exec:exec
```

#### Windows

```sh
this should be the same as Linux & macos just with windows adjusted paths
```

#### Configuring IntelliJ

You may prefer to run the backend using the IntelliJ IDE, if so, you will need to follow the Client Installation above to ensure that the project has built correctly.

1. Install the Scala plugin: file -> settings -> plugins
2. Set project SDK version to 17: file -> project structure -> select an SDK -> require version 17
3. Enable 'Use plugin registry': file -> settings -> build, execution, deployment -> Maven
4. Open Maven tab on the right and click install on vuu-parent -> lifecycle -> install
5. In the terminal, navigate to

```sh
vuu-ui/sample-apps/app-vuu-example
```

6. Run

```sh
npm install
npm run build
```

7. In IntelliJ, select 'SimulMain' config and click run
8. If you get a 'certificate-unknown' error, set 'Allow invalid certificates for resources loaded from localhost' to 'Enabled' in your chrome settings

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

You can now open the demo app in your browser at <https://127.0.0.1:8443/index.html>

## Alternative demo configuration - build,deploy and run the Vuu server and Sample UI application independently.

While it is initially very convenient to be able to serve the Sample UI application directly from the Vuu server, in real-world scenarios the Vuu server is likely to be deployed independently of any UI. The demo can also be run in such a mode. The sample application has a modular architecture. The core functionality is driven by metadata provided by the connected Vuu server. This means it can be useful to run the sample application in a more realistic deployment setup or even when a real-world Vuu server implementation is under development. The sample application can be used to display and query the data tables from a running Vuu server instance. (This is only possible of course, with a vuu server instance that is not locked down for production with a full authentication solution).

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

## For VUU Core Developers

### Type of Test - Server Side

| Type                           | Used For                                                                                                                                    | Example / Naming convention                             |
|--------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------|
| End To End Tests (Server only) | Sending websocket message to server and assert on messages returned. Spin up real VUU server                                                | Tests that ends in WSApiTest                            |
| Scenario Tests                 | Test specific scenario that may span multiple ui / server interactions. Uses test VUU server and various helpers to write tests with ease   | No name convention. Extends VuuServerTestCase           |
| Functional Unit Tests          | Unit test logical group of classes to test an overall functional behaviour, show different ways the feature is intended to be used          | Tests that ends in FunctionalTest                       |
| Unit Tests                     | Good old plain vanilla unit tests                                                                                                           | Start with class name/subject of the test, ends in Test |
| Java Tests                     | Tests interfaces that can be called or extended by application that use the VUU in Java OR test for java application using VUU | Tests in vuu-java module or example/main-java module    |

### Changes in progress

> These are work in progress and intended to show the intention of the direction that it is heading. If decision is to take it forward, need to evolve it more and implement it for rest of the codebase. If decision is to reverse, should be removed to achieve consistency

| Change                                  | Description                                                                                    |
|-----------------------------------------|------------------------------------------------------------------------------------------------|
| UI and Server API review                | New websocket message types  https://github.com/finos/vuu/discussions/1447. See Messages.scala |
| RPC Handler registration and resolution | See https://github.com/finos/vuu/discussions/1503                                              | 
| Functional Error handling               | See https://github.com/finos/vuu/discussions/1504                                              |


## For Application Developers Using VUU

### Type of Test - Server Side

| Type                           | Used For                                                                                                                          | Example / Naming convention                   |
|--------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------|
| End To End Tests (Server only) | Sending websocket message to server and assert on messages returned. Spin up real VUU server                                      | Tests that ends in WSApiTest                  |
| Scenario Tests                 | Test specific scenario that may span multiple ui / server interactions. Uses test VUU server                                      | No name convention. Extends VuuServerTestCase |
| Java Tests                     | Tests interfaces that can be called or extended by application that use the library in Java Or test for java application using VUU | Tests in vuu-java module or example/main-java module    |

## License

Copyright 2022 venuu-io

Distributed under the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0).

SPDX-License-Identifier: [Apache-2.0](https://spdx.org/licenses/Apache-2.0)
