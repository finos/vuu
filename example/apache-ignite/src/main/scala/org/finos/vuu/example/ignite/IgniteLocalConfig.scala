package org.finos.vuu.example.ignite

import org.apache.ignite.configuration.{CacheConfiguration, DataStorageConfiguration, IgniteConfiguration}
import org.apache.ignite.kubernetes.configuration.KubernetesConnectionConfiguration
import org.apache.ignite.logger.slf4j.Slf4jLogger
import org.apache.ignite.spi.discovery.tcp.TcpDiscoverySpi
import org.apache.ignite.spi.discovery.tcp.ipfinder.kubernetes.TcpDiscoveryKubernetesIpFinder
import org.apache.ignite.spi.discovery.tcp.ipfinder.vm.TcpDiscoveryVmIpFinder
import org.apache.ignite.spi.metric.opencensus.OpenCensusMetricExporterSpi
import org.finos.vuu.example.ignite.IgniteLocalConfig._
import org.finos.vuu.example.ignite.schema.ChildOrderSchema
import org.slf4j.LoggerFactory

import java.util.concurrent.TimeUnit
import scala.concurrent.duration.Duration
import scala.jdk.CollectionConverters.IterableHasAsJava

object IgniteLocalConfig {
  private val logger = LoggerFactory.getLogger(IgniteLocalConfig.getClass)
  val parentOrderCacheName = "ParentOrders"
  val childOrderCacheName = "ChildOrders"

  def create(k8sEnvironment: Boolean = isK8s,
             clientMode: Boolean = true,
             persistenceEnabled: Boolean = false): IgniteLocalConfig = {
    logger.debug("K8s enabled : {}", k8sEnvironment)
    if (k8sEnvironment) {
      createConfig(k8sDiscovery(), clientMode, persistenceEnabled)
    } else {
      createConfig(localDiscovery(), clientMode, persistenceEnabled)
    }
  }

  private def createConfig(tcpDiscoverySpi: TcpDiscoverySpi = localDiscovery(), clientMode: Boolean, persistenceEnabled: Boolean): IgniteLocalConfig = {
    new IgniteLocalConfig(clientMode, persistenceEnabled, tcpDiscoverySpi)
  }

  private def localDiscovery(): TcpDiscoverySpi = {
    val ipFinder = new TcpDiscoveryVmIpFinder()
    ipFinder.setAddresses(List("127.0.0.1").asJavaCollection)
    val tcpDiscoverySpi = new TcpDiscoverySpi().setIpFinder(ipFinder)

    tcpDiscoverySpi
  }

  private def k8sDiscovery(): TcpDiscoverySpi = {
    logger.debug("Creating K8S config, Service : {}, NameSpace : {}", k8sServiceName, k8sServiceNamespace)
    val k8sConnectionConfig = new KubernetesConnectionConfiguration()
    k8sConnectionConfig.setNamespace(k8sServiceNamespace)
    k8sConnectionConfig.setServiceName(k8sServiceName)
    val ipFinder = new TcpDiscoveryKubernetesIpFinder(k8sConnectionConfig)
    val tcpDiscoverySpi = new TcpDiscoverySpi().setIpFinder(ipFinder)

    tcpDiscoverySpi
  }

  private def isK8s: Boolean = "true" == Option(System.getenv("KUBERNETES-ENV")).getOrElse("false").toLowerCase

  private def k8sServiceNamespace: String = System.getenv("NAMESPACE")

  private def k8sServiceName: String = System.getenv("SERVICE-NAME")

  private def igniteWorkDir: String = Option(System.getenv("IGNITE-WORKDIR")).getOrElse(System.getProperty("java.io.tmpdir"))

  private def backupCount: Integer = Option(System.getenv("BACKUP-COUNT")).map(it => Integer.valueOf(it)).getOrElse(0)
}


class IgniteLocalConfig(private val clientMode: Boolean,
                        private val persistenceEnabled: Boolean,
                        private val tcpDiscoverySpi: TcpDiscoverySpi,
                        private val metricConfig: MetricConfig = MetricConfig.defaultMetricsConfig()) {
  def igniteConfiguration(): IgniteConfiguration = {
    logger.debug(s"Ignite Client mode = $clientMode, Persistence Enabled = $persistenceEnabled, TcpDiscovery = $tcpDiscoverySpi")
    val cfg = new IgniteConfiguration()

    cfg.setGridLogger(new Slf4jLogger())
    cfg.setClientMode(clientMode)
    cfg.setPeerClassLoadingEnabled(true)
    cfg.setWorkDirectory(igniteWorkDir)
    val metricExporterSpi = new OpenCensusMetricExporterSpi
    metricExporterSpi.setPeriod(metricConfig.exporterPeriod.toMillis)
    cfg.setMetricExporterSpi(metricExporterSpi)

    cfg.setCacheConfiguration(
      createParentOrderCacheConfig(),
      createChildOrderCacheConfig()
    )

    cfg.setDataStorageConfiguration(
      createDataStorageConfig()
    )

    cfg.setDiscoverySpi(tcpDiscoverySpi)

    cfg
  }

  private def createChildOrderCacheConfig(): CacheConfiguration[?, ?] = {
    val cacheConfiguration = new CacheConfiguration()

    cacheConfiguration.setQueryEntities(List(ChildOrderSchema.queryEntity).asJavaCollection)
    cacheConfiguration.setName(childOrderCacheName)
    cacheConfiguration.setBackups(backupCount)
  }

  private def createParentOrderCacheConfig(): CacheConfiguration[?, ?] = {
    val cacheConfiguration = new CacheConfiguration()
    cacheConfiguration.setName(parentOrderCacheName)
    cacheConfiguration.setBackups(backupCount)
  }

  private def createDataStorageConfig(): DataStorageConfiguration = {
    val storageConfiguration = new DataStorageConfiguration()

    storageConfiguration.getDefaultDataRegionConfiguration.setPersistenceEnabled(persistenceEnabled)

    storageConfiguration
  }

  def metricsPort: Int = metricConfig.port
}

object MetricConfig {
  def defaultMetricsConfig(): MetricConfig = {
    new MetricConfig
  }
}

class MetricConfig(val port: Int = Option(System.getenv("METRICS_PORT")).getOrElse("8091").toInt,
                   val exporterPeriod: Duration = Duration.create(1, TimeUnit.SECONDS)) {
}
