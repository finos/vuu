# Developing Vuu

## Developing the server

1) Install IntelliJ Community Edition (latest version, tested with 2021.3)
2) Install SDKMan from the [website](https://sdkman.io/) or using your own mechanism
3) type>```sdk install java 16.0.1-open``` and then >```sdk d java 16.0.1-open``` to make sure you're using the correct one.
4) Clone the repo into a directory on your machine
5) Open the project as a Maven build by selecting the root pom.xml (make sure you select "enable adding maven modules, auto import etc..)
6) You should get one root module vuu-parent in a project list, select this
7) When the project opens you should have 2 sub-modules (vuu and toolbox) 

## Running the Vuu Server Simulation Module

1) Go to the SimulMain.scala, right click and run (add these into JVM args -Xmx10G -Xms5G)
2) Go to the SwingClientMain.scala, right click and run

## Developing the client

If you are comfortable running the server in an IDE, you can follow the instructions above. If not
you can use the specific maven targets from the command line to run up the sample app. 

You can install command line maven via any means you please, but sdkman makes it easy...
```bash
sdk install maven
```

```bash
#after checking out the code, in project root dir
mvn clean compile
#then into the vuu subfolder
cd vuu
#run SimulMain using maven exec:exec plugin
mvn exec:exec
```



1) install node.js version 14+ and yarn
2) In a terminal, change directory into the ./vuu-ui folder
3) yarn install
4) type> ```yarn```
5) build the ui library packages
6) type> ```yarn build```
7) build the sample application
8) type> ```yarn build:app```


You should know be able to use a local browser to see the Vuu demo app. [localhost:8443](https://localhost:8443/index.html) 

If you are getting certificate errors when you connect, set this browser setting in chrome: 

```
chrome://flags/#allow-insecure-localhost (set to true)
```

## Developing the Vuu Book

We use the excellent [mdbook](https://github.com/rust-lang/mdBook) rust module for developing the Vuu book. To use this you first have to install rust, and 
then use the rust package manager cargo to install mdbook module. 

To build the book locally, run: 

```
mdbook build vuu-book
```

in the root vuu directory. 