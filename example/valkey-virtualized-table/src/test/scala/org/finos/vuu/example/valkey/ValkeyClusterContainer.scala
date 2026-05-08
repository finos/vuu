package org.finos.vuu.example.valkey

import org.slf4j.LoggerFactory
import org.testcontainers.containers.GenericContainer
import org.testcontainers.containers.output.Slf4jLogConsumer
import org.testcontainers.containers.wait.strategy.Wait
import org.testcontainers.images.builder.ImageFromDockerfile

class ValkeyClusterContainer
  extends GenericContainer[ValkeyClusterContainer](
    new ImageFromDockerfile()
      .withFileFromClasspath("Dockerfile", "Dockerfile")
      .withFileFromClasspath("entrypoint.sh", "entrypoint.sh")
  ) {

  val internalPorts: Set[Int] = Set(7000, 7001, 7002, 17000, 17001, 17002)

  withExposedPorts(internalPorts.toSeq.map(Int.box): _*)

  //withLogConsumer(new Slf4jLogConsumer(logger))

  waitingFor(Wait.forLogMessage(".*Valkey cluster is ready!.*", 1))

  def getPort: Int = getMappedPort(7000)

  def getHostAndPortMapper: (String, Int) => (String, Int) = (host: String, port: Int) => {
    if (internalPorts.contains(port)) {
      (getHost, getMappedPort(port))      
    } else {
      (host, port)
    }
  }

  def getClusterSize: Int = 3
}