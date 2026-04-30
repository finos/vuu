package org.finos.vuu.example.valkey

import org.finos.vuu.example.valkey.ValkeyContainer.{imageName, port}
import org.testcontainers.containers.GenericContainer
import org.testcontainers.containers.wait.strategy.Wait
import org.testcontainers.utility.DockerImageName

trait ValkeyContainer {

  def getConnectionString: String

}

object ValkeyContainer {

  val imageName = "docker.io/valkey/valkey"
  val port = 6379

  def apply(tag: String = "8.0"): ValkeyContainer = {
    ValkeyContainerImpl(DockerImageName.parse(s"$imageName:$tag"))
  }
}

private case class ValkeyContainerImpl(dockerImageName: DockerImageName) 
  extends GenericContainer(dockerImageName) with ValkeyContainer {

  dockerImageName.assertCompatibleWith(DockerImageName.parse(imageName))

  this.withExposedPorts(port)
  this.waitingFor(Wait.forListeningPort())

  override def getConnectionString: String = s"valkey://$getHost:${getMappedPort(port)}"
}
