package org.finos.vuu.plugin.clickhouse

import com.dimafeng.testcontainers.GenericContainer
import org.slf4j.LoggerFactory
import org.testcontainers.containers.GenericContainer as JavaGenericContainer
import org.testcontainers.containers.wait.strategy.Wait
import org.testcontainers.utility.{DockerImageName, MountableFile}

import java.util.UUID

class ClickHouseContainer(tag: String = "26.4") extends GenericContainer(
  ClickHouseContainer.createContainer(tag)
) {

  def getEndpoint: String =
    s"http://${container.getHost}:${container.getMappedPort(ClickHouseContainer.port)}"
  def getDefaultUsername: String = ClickHouseContainer.username
  def getDefaultPassword: String = ClickHouseContainer.password

  def getSecureEndpoint: String =
    s"https://${container.getHost}:${container.getMappedPort(ClickHouseContainer.securePort)}/"
  def getSecureUserName: String = ClickHouseContainer.secureUsername
  def getClientCertificatePath: String = ClickHouseContainer.clientCertificatePath
  def getClientKeyPath: String = ClickHouseContainer.clientCertificateKeyPath
  def getRootCertificatePath: String = ClickHouseContainer.rootCertificatePath;
}

object ClickHouseContainer {
  private val logger = LoggerFactory.getLogger(ClickHouseContainer.getClass)
  private val imageName = "clickhouse/clickhouse-server"
  private val port = 8123
  private val securePort = 8443
  private val username = "default"
  private val password: String = UUID.randomUUID().toString
  private val secureUsername = "java_backend_app"
  private val clientCertificatePath = "src/test/resources/certs/client.crt"
  private val clientCertificateKeyPath = "src/test/resources/certs/client.key"
  private val rootCertificatePath = "src/test/resources/certs/ca.crt"

  private def createContainer(tag: String): JavaGenericContainer[_] = {
    val c = new JavaGenericContainer(DockerImageName.parse(s"$imageName:$tag"))
    c.withExposedPorts(port, securePort)
    c.withEnv("CLICKHOUSE_USERNAME", username)
    c.withEnv("CLICKHOUSE_PASSWORD", password)
    c.withCopyFileToContainer(MountableFile.forClasspathResource("certs/server.crt", 0x1a4), "/etc/clickhouse-server/certs/server.crt")
    c.withCopyFileToContainer(MountableFile.forClasspathResource("certs/server.key", 0x1a4), "/etc/clickhouse-server/certs/server.key")
    c.withCopyFileToContainer(MountableFile.forClasspathResource("certs/ca.crt", 0x1a4), "/etc/clickhouse-server/certs/ca.crt")
    c.withCopyFileToContainer(MountableFile.forClasspathResource("clickhouse/logger.xml", 0x1a4), "/etc/clickhouse-server/config.d/logger.xml")
    c.withCopyFileToContainer(MountableFile.forClasspathResource("clickhouse/ssl.xml", 0x1a4), "/etc/clickhouse-server/config.d/ssl.xml")
    c.withCopyFileToContainer(MountableFile.forClasspathResource("clickhouse/users.xml", 0x1a4), "/etc/clickhouse-server/users.d/mtls_users.xml")
    c.waitingFor(Wait.forHttp("/ping").forPort(port).forStatusCode(200))
    c
  }

  def apply(tag: String = "26.4"): ClickHouseContainer = new ClickHouseContainer(tag)

}
