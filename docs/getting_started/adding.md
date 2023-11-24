import { SvgDottySeparator } from "@site/src/components/SvgDottySeparator";

# Using binaries from Maven Repo

<SvgDottySeparator style={{marginBottom: 32}}/>

The Vuu binaries are hosted in Maven Central under the namespace: [org.finos.vuu](https://repo1.maven.org/maven2/org/finos/vuu/).

You can add them to your pom by referencing the parent pom directly.

```
    <dependency>
        <groupId>org.finos.vuu</groupId>
        <artifactId>vuu-parent</artifactId>
        <version>{check the latest version}</version>
    </dependency>

        <dependency>
        <groupId>org.finos.vuu</groupId>
        <artifactId>vuu-ui</artifactId>
        <version>{check the latest version}</version>
    </dependency>
```

Adding the javascript components:

```
Work in Progress....
```
