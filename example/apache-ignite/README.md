[![FINOS - Incubating](https://cdn.jsdelivr.net/gh/finos/contrib-toolbox@master/images/badge-incubating.svg)](https://community.finos.org/docs/governance/Software-Projects/stages/incubating)

# Apache Ignite Sample

## Running VUU and Ignite server as single process
1. Open static main and set to run as ignite server
```scala
org.finos.vuu.example.ignite.IgniteVuuMain

val runAsIgniteServer = true

```
2. Run the static main

## Running VUU against Separate Ignite Server

How to run: 

1. Run Ignite Cluster Application (run config for IntelliJ checked in): 

```
org.finos.vuu.example.ignite.StartIgniteMain
```
or from command line : 
```shell
mvn exec:exec@ignite
```

2. Run loader process to populate orders...

```
org.finos.vuu.example.ignite.loader.IgniteOrderLoaderMain
```
or from command line :
```shell
mvn exec:exec@loader
```

3. Run the static main

```
org.finos.vuu.example.ignite.IgniteVuuMain

# required jdk 17 JVM args
  --add-opens=java.base/java.nio=ALL-UNNAMED --add-opens=java.base/jdk.internal.access=ALL-UNNAMED --add-opens=java.base/jdk.internal.misc=ALL-UNNAMED --add-opens=java.base/sun.nio.ch=ALL-UNNAMED --add-opens=java.base/sun.util.calendar=ALL-UNNAMED --add-opens=java.management/com.sun.jmx.mbeanserver=ALL-UNNAMED --add-opens=jdk.internal.jvmstat/sun.jvmstat.monitor=ALL-UNNAMED --add-opens=java.base/sun.reflect.generics.reflectiveObjects=ALL-UNNAMED --add-opens=jdk.management/com.sun.management.internal=ALL-UNNAMED --add-opens=java.base/java.io=ALL-UNNAMED --add-opens=java.base/java.nio=ALL-UNNAMED --add-opens=java.base/java.net=ALL-UNNAMED --add-opens=java.base/java.util=ALL-UNNAMED --add-opens=java.base/java.util.concurrent=ALL-UNNAMED --add-opens=java.base/java.util.concurrent.locks=ALL-UNNAMED --add-opens=java.base/java.util.concurrent.atomic=ALL-UNNAMED --add-opens=java.base/java.lang=ALL-UNNAMED --add-opens=java.base/java.lang.invoke=ALL-UNNAMED --add-opens=java.base/java.math=ALL-UNNAMED --add-opens=java.sql/java.sql=ALL-UNNAMED --add-opens=java.base/java.lang.reflect=ALL-UNNAMED --add-opens=java.base/java.time=ALL-UNNAMED --add-opens=java.base/java.text=ALL-UNNAMED --add-opens=java.management/sun.management=ALL-UNNAMED --add-opens java.desktop/java.awt.font=ALL-UNNAMED
```
or from command line :
```shell
mvn exec:exec@vuu
```

## License

Copyright 2022 finos

Distributed under the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0).

SPDX-License-Identifier: [Apache-2.0](https://spdx.org/licenses/Apache-2.0)
