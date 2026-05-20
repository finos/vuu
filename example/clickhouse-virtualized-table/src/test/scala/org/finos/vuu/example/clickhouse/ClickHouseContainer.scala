package org.finos.vuu.example.clickhouse

import com.dimafeng.testcontainers.GenericContainer
import org.slf4j.LoggerFactory
import org.testcontainers.containers.wait.strategy.Wait
import org.testcontainers.utility.DockerImageName
import org.testcontainers.containers.GenericContainer as JavaGenericContainer
import org.testcontainers.containers.output.Slf4jLogConsumer

class ClickHouseContainer(tag: String = "23.8") extends GenericContainer(
  ClickHouseContainer.createContainer(tag)
) {
  def getHost: String = container.getHost
  def getPort: Integer = container.getMappedPort(ClickHouseContainer.port)
}

object ClickHouseContainer {
  private val logger = LoggerFactory.getLogger(ClickHouseContainer.getClass)
  val imageName = "clickhouse/clickhouse-server"
  val port = 8123

  private def createContainer(tag: String): JavaGenericContainer[_] = {
    val c = new JavaGenericContainer(DockerImageName.parse(s"$imageName:$tag"))
    c.withExposedPorts(port)
    c.waitingFor(Wait.forHttp("/ping").forStatusCode(200))

    val logConsumer = new Slf4jLogConsumer(logger)
    c.withLogConsumer(logConsumer)
    c
  }

  def apply(tag: String = "23.8"): ClickHouseContainer = new ClickHouseContainer(tag)
}
