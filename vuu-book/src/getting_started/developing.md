# Developing Vuu

##Developing the server

1) Install IntelliJ Community Edition (latest version, tested with 2020.3)
2) Install SDKMan (https://sdkman.io/)
3) type>```sdk install java 15.0.2-open``` and then >```sdk d java 15.0.2-open``` to make sure you're using the correct one.
4) Clone the repo into a directory on your machine
5) Open the project as a Maven build by selecting the root pom.xml (make sure you select "enable adding maven modules, auto import etc..)
6) You should get one root module vuu-parent in a project list, select this
7) When the project opens you should have 2 sub modules (vuu and toolbox) 

##Running the Vuu Server Simulation Module

1) Go to the SimulMain.scala, right click and run (add these into JVM args -Xmx10G -Xms5G)
2) Go to the SwingClientMain.scala, right click and run

##Developing the client

1) install node.js version 14+ and yarn
2) In a terminal, change directory into the ./vuu-ui folder
3) yarn install
4) type> ```yarn```
5) build the ui library packages
6) type> ```yarn build```
7) build the sample application
8) change directory into ./vuu-ui/packages/app-vuu-example
9) type> ```yarn build```
10) run the sample application
11) type> ```yarn start```


You should know be able to use a local browser to see the Vuu demo app. 
