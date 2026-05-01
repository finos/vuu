package org.finos.vuu.example.valkey

import com.dimafeng.testcontainers.GenericContainer
import org.slf4j.LoggerFactory
import org.testcontainers.containers.wait.strategy.Wait
import org.testcontainers.utility.DockerImageName
import org.testcontainers.containers.GenericContainer as JavaGenericContainer
import org.testcontainers.containers.output.Slf4jLogConsumer

class ValkeyContainer(tag: String = "8.0") extends GenericContainer(
  ValkeyContainer.createContainer(tag)
) {

  def getHost: String = container.getHost
  
  def getPort: Integer = container.getMappedPort(ValkeyContainer.port)
  
}

object ValkeyContainer {

  private val logger = LoggerFactory.getLogger(ValkeyContainer.getClass)
  val imageName = "valkey/valkey"
  val port = 6379

  private def createContainer(tag: String): JavaGenericContainer[_] = {
    val c = new JavaGenericContainer(DockerImageName.parse(s"$imageName:$tag"))
    c.withExposedPorts(port)
    c.waitingFor(Wait.forListeningPort())

    val logConsumer = new Slf4jLogConsumer(logger)
    c.withLogConsumer(logConsumer)
    
    c
  }

  def apply(tag: String = "8.0"): ValkeyContainer = new ValkeyContainer(tag)
}