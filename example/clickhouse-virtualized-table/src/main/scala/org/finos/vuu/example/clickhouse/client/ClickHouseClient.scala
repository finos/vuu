package org.finos.vuu.example.clickhouse.client

import com.clickhouse.client.api.Client
import com.clickhouse.client.api.query.{QueryResponse, Records}
import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}
import org.finos.vuu.example.clickhouse.client.options.ClickHouseClientOptions

import java.sql.ResultSet

class ClickHouseClient(val options: ClickHouseClientOptions)
                      (implicit lifecycle: LifecycleContainer) extends LifecycleEnabled with StrictLogging {

  private val initializer = ClickHouseClientInitializer(options)
  @volatile private var client: Option[Client] = Option.empty

  lifecycle(this)

  def executeQuery[T](sql: String)(action: Records => T): T = {
    client match {
      case Some(c) =>
        val response = c.queryRecords(sql).get()
        try {
          action(response)
        } finally {
          response.close()
        }
      case None => throw new IllegalStateException("ClickHouse client is not initialized.")
    }
  }

  def executeUpdate(sql: String): Int = {
    client match {
      case Some(c) =>
        val response = c.query(sql).get()
        try {
          // ClickHouse native mutations/DDLs return execution metrics rather than JDBC row counts.
          // You can inspect response.getMetrics if needed. Returning 1 to indicate success.
          1
        } finally {
          response.close()
        }
      case None => throw new IllegalStateException("ClickHouse client is not initialized.")
    }
  }

  override def doStart(): Unit = synchronized {
    try {
      client = Option(initializer.create())
    } catch {
      case e: Exception =>
        logger.error("Failed to start ClickHouse client", e)
        throw e
    }
  }

  override def doStop(): Unit = synchronized {
    client.foreach(_.close())
    client = None
  }

  override def doInitialize(): Unit = {}
  override def doDestroy(): Unit = {}
  override val lifecycleId: String = "ClickHouseClient"
}

object ClickHouseClient {
  def apply(options: ClickHouseClientOptions)(implicit lifecycle: LifecycleContainer): ClickHouseClient =
    new ClickHouseClient(options)
}
