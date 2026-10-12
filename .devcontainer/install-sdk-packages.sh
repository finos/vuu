#!/bin/bash

# install required sdk packages
source "/usr/local/sdkman/bin/sdkman-init.sh"

# latest stable Maven (also what ./mvnw pins in .mvn/wrapper/maven-wrapper.properties)
sdk install maven 3.9.16
sdk default maven 3.9.16

# matches vuu.scala.version in the root pom.xml
sdk install scala 3.3.8
sudo chmod a+x /usr/local/sdkman/candidates/scala/current/bin/scala
