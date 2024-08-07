[![FINOS - Incubating](https://cdn.jsdelivr.net/gh/finos/contrib-toolbox@master/images/badge-incubating.svg)](https://community.finos.org/docs/governance/Software-Projects/stages/incubating)

# Vuu

## The Realtime View Server

Welcome. We maintain a docusaurus site containing all the details of the project. Why not get started there:

<https://vuu.finos.org/desktop/docs/introduction/intro>

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
#The server should now be started on your machine
mvn exec:exec
```

#### Windows

```sh
this should be the same as Linux & macos just with windows adjusted paths
```

### Layout Server

Layout management requires persisting layouts. Layouts can either be persisted locally or remotely. The remote implementation requires spinning up a Springboot server instance, but is more robust and reflective of a real-world application.

#### Choosing local or remote

Changing whether local/remote is used is configured with the following flag:

1. Open `finos-vuu\vuu-ui\showcase\vite.config.js` (for Showcase), or `finos-vuu\vuu-ui\sample-apps\app-vuu-example\esbuild.mjs` (for sample app)
2. Set `"process.env.LOCAL"` flag to `true` for local, or `false` for remote

The local implementation is default. It uses browser local storage. If you have chosen the remote implementation, ensure you are running the remote server.

#### Running the remote server

You can run the remote server from IntelliJ or via CLI. Once running, use `http://localhost:8081/api/swagger` to review endpoints and contracts. It uses an in-memory H2 database, and can be accessed at `http://localhost:8081/api/h2-console`.

##### CLI

```sh
#from top-level vuu repo (not vuu child directory in repo)
cd layout-server
mvn spring-boot:run
```

##### From IntelliJ

1. Follow steps 3-5 outlined in 'Configuring IntelliJ' below
2. Select 'LayoutServer' config and click run

## Configuring IntelliJ

You may prefer to run the backend using the IntelliJ IDE, if so, you will need to follow the Client Installation above to ensure that the project has built correctly.

1. Install the Scala plugin: file -> settings -> plugins
2. Install Scala 2.13.10
3. Set project SDK version to 11: file -> project structure -> select an SDK -> require version 11
4. Enable 'Use plugin registry': file -> settings -> build, execution, deployment -> Maven
5. Open Maven tab on the right and click install on vuu-parent -> lifecycle -> install
6. In the terminal, navigate to

```sh
vuu-ui/sample-apps/app-vuu-example
```

7. Run

```sh
npm install
npm run build
```

8. In IntelliJ, select 'SimulMain' config and click run
9. If you get a 'certificate-unknown' error, set 'Allow invalid certificates for resources loaded from localhost' to 'Enabled' in your chrome settings

### IntelliJ Settings

In IntelliJ settings/Editor/Code Style/Java/Import Layout
- tick "Layout static imports separately
- apply the following order for imports
    - import all other imports
    - < blank line >
    - import javax.*
    - import java.*
    - < blank line >
    - import static all other imports 

## Installation - Client

The UI scripts all run from the vuu/vuu-ui directory.

```sh
#from top-level vuu repo (not vuu child directory in repo)
cd vuu-ui
npm install
npm run build
npm run build:app
```

You can now open the demo app in your browser at <https://127.0.0.1:8443/index.html>

Alternatively, you may choose to run the demo app in Electron. First install Electron in the tools/electron folder:

```sh
#from top-level vuu repo (not vuu child directory in repo)
cd vuu-ui/tools/electron
npm install
```

Then, back in vuu-ui, run the launch script"

```sh
#from vuu/vuu-ui
npm run launch:demo:electron
```

### VSCode Workspace Settings 
A set of VSCode settings is shared as workspace settings. In order to use the workspace settings the project needs to be opened in VSCode from vuu-ui/ folder.

Settings provided by the workspace currently cover:

- Prettier as default formatter

When using an IDE other than VSCode, the IDE settings should be set to match the workspace settings

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

