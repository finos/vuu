package org.finos.vuu.example.valkey

import com.dimafeng.testcontainers.GenericContainer
import org.testcontainers.containers.wait.strategy.Wait
import org.testcontainers.utility.DockerImageName
import org.testcontainers.containers.{GenericContainer => JavaGenericContainer}

class ValkeyContainer(tag: String = "8.0") extends GenericContainer(
  ValkeyContainer.createContainer(tag)
) {

  def getConnectionString: String = {
    val host = container.getHost
    val mappedPort = container.getMappedPort(ValkeyContainer.port)
    s"valkey://$host:$mappedPort"
  }
}

object ValkeyContainer {
  val imageName = "valkey/valkey"
  val port = 6379

  private def createContainer(tag: String): JavaGenericContainer[_] = {
    val c = new JavaGenericContainer(DockerImageName.parse(s"$imageName:$tag"))
    c.withExposedPorts(port)
    c.waitingFor(Wait.forListeningPort())
    c
  }

  def apply(tag: String = "8.0"): ValkeyContainer = new ValkeyContainer(tag)
}