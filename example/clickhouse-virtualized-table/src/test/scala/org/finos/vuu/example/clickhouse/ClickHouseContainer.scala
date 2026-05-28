package org.finos.vuu.example.clickhouse

import com.dimafeng.testcontainers.GenericContainer
import org.slf4j.LoggerFactory
import org.testcontainers.containers.wait.strategy.Wait
import org.testcontainers.utility.DockerImageName
import org.testcontainers.containers.GenericContainer as JavaGenericContainer
import org.testcontainers.containers.output.Slf4jLogConsumer

import java.util.UUID

class ClickHouseContainer(tag: String = "26.4") extends GenericContainer(
  ClickHouseContainer.createContainer(tag)
) {
  def getEndpoint: String = s"http://${container.getHost}:${container.getMappedPort(ClickHouseContainer.port)}"
  def getUsername: String = ClickHouseContainer.username
  def getPassword: String = ClickHouseContainer.password
}

object ClickHouseContainer {
  private val logger = LoggerFactory.getLogger(ClickHouseContainer.getClass)
  private val imageName = "clickhouse/clickhouse-server"
  private val port = 8123
  private val username = "default"
  private val password: String = UUID.randomUUID().toString

  private def createContainer(tag: String): JavaGenericContainer[_] = {
    val c = new JavaGenericContainer(DockerImageName.parse(s"$imageName:$tag"))
    c.withExposedPorts(port)
    c.withEnv("CLICKHOUSE_PASSWORD", password)
    c.waitingFor(Wait.forHttp("/ping").forStatusCode(200))
    c
  }

  def apply(tag: String = "26.4"): ClickHouseContainer = new ClickHouseContainer(tag)
}
