package org.finos.vuu.example.valkey

import com.typesafe.scalalogging.StrictLogging
import io.lettuce.core.{LettuceFutures, RedisFuture}
import io.lettuce.core.cluster.api.async.RedisAdvancedClusterAsyncCommands
import org.finos.vuu.example.valkey.client.ValkeyClient
import org.finos.vuu.example.valkey.common.ShardRouter
import org.scalatest.BeforeAndAfterAll
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.util.concurrent.TimeUnit
import scala.jdk.CollectionConverters.*

class ValkeyTestBase extends AnyFeatureSpec with BeforeAndAfterAll with Matchers with StrictLogging {

  protected final val container: ValkeyClusterContainer = ValkeyClusterContainer()
  protected final val orderHSetName = "order"
  private final val maxInFlight = 50_000
  private final val batchSize = 5_000

  override def beforeAll(): Unit = {
    super.beforeAll()
    container.start()
  }

  override def afterAll(): Unit = {
    container.stop()
    super.afterAll()
  }

  protected def insertOrders(client: ValkeyClient,
                              keys: Array[String]): Unit = {
    val connection = client.getConnection.get
    connection.setAutoFlushCommands(false)

    val futures = new java.util.ArrayList[RedisFuture[_]](maxInFlight)
    val async = connection.async()

    var i = 0
    while (i < keys.length) {
      val shardedKey = ShardRouter.shardedKey(orderHSetName, keys(i))
      futures.add(async.hset(shardedKey, "trader", "mikey"))

      if (i % batchSize == 0) {
        connection.flushCommands()
      }

      i += 1
    }

    // Final flush
    connection.flushCommands()
    connection.setAutoFlushCommands(true);
    LettuceFutures.awaitAll(30, TimeUnit.SECONDS, futures.asScala.toSeq: _*)
  }

  protected def iterateOrders(client: ValkeyClient,
                             keys: Array[String]): Unit = {

  }

}

