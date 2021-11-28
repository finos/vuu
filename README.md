# vuu
### An open source view server implemented in Scala and HTML5

**How to get started**

1) install IntelliJ Community Edition (latest version, tested with 2020.3) 
2) install SDKMan (https://sdkman.io/)
3) type>```sdk install java 15.0.2-open``` and then >```sdk d java 15.0.2-open``` to make sure you're using the correct one. 
4) Clone the repo into a directory on your machine 
5) Open the project in maven by select the root pom.xml (make sure you select "enable adding maven modules, auto import etc..) 
6) you should get one root module vuu-parent in a project list, select this
7) when the project opens you should have 2 sub modules

**Running the View Server**

1) Go to the SimulMain.scala, right click and run (add these into JVM args -Xmx10G -Xms5G)
2) Go to the SwingClientMain.scala, right click and run


**Build the HTML client**

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

- 
 




