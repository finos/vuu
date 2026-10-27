#!/bin/bash

# install required sdk packages
source "/usr/local/sdkman/bin/sdkman-init.sh"

# latest stable Maven (also what ./mvnw pins in .mvn/wrapper/maven-wrapper.properties)
sdk install maven 3.10.0
sdk default maven 3.10.0

# matches vuu.scala.version in the root pom.xml
sdk install scala 3.9.0
sudo chmod a+x /usr/local/sdkman/candidates/scala/current/bin/scala
