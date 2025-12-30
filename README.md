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

