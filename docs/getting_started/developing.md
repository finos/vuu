# Developing Vuu

## Prerequisites

1. Install IntelliJ Community Edition (latest version, tested with 2021.
2. Install SDKMan from the [website](https://sdkman.io/) or using your own mechanism
3. type>`sdk install java 11.0.12-open` and then >`sdk d java 11.0.12-open` to make sure you're using the correct one.
4. Clone the repo into a directory on your machine
5. Open the project as a Maven build by selecting the root pom.xml (make sure you select "enable adding maven modules, auto import etc..)
6. You should get one root module vuu-parent in a project list, select this
7. When the project opens you should have 3 sub-modules (vuu, toolbox and vuu-ui)

## Developing the client

If you are comfortable running the server in an IDE, you can follow the instructions above. If not
you can use the specific maven targets from the command line to run up the sample app.

You can install command line maven via any means you please, but sdkman makes it easy...

```bash
sdk install maven
```

## Installation - Server - Command Line

### Prerequisites

See the [Docs](https://vuu.finos.org/docs/getting_started/developing) for Java versions and install dependencies you need to have.

OS X & Linux:

```sh
#In your favourite code directory...
git clone https://github.com/finos/vuu.git
#cd into the repository
cd vuu
#run the maven compile step
mvn compile
#cd into vuu, child in repo
cd vuu
#The server should now be started on your machine with Simulation module
mvn exec:exec
```

Windows:

```sh
this should be the same as Linux & MacOS just with Windows adjusted paths
```

## Running the Vuu Server Simulation Module from IDE

1. Go to the SimulMain.scala, right click and run (add these into JVM args -Xmx10G -Xms5G)
2. Go to the SwingClientMain.scala, right click and run

## Installation - Client

You will need npm at version 16 or greater and yarn installed to build the client.

Please note, while we are in the process of making the ag-grid dependencies optional you will
need to run this command from the vuu/vuu-ui directory.

```sh
#in vuu repo (not vuu child directory in repo)
cd vuu-ui
yarn
yarn build
yarn buid:app
cd packages/electron
#this should open an electron window pointing at https://localhost:8443/index.html
yarn start
```

You should now be able to use a local browser to see the Vuu demo app. [localhost:8443](https://localhost:8443/index.html)

If you are getting certificate errors when you connect, set this browser setting in chrome:

```
chrome://flags/#allow-insecure-localhost (set to true)
```

## Developing the Vuu Book

We use [docusaurus](https://docusaurus.io/blog/2022/08/01/announcing-docusaurus-2.0) to generate the Vuu docs from markdown.
