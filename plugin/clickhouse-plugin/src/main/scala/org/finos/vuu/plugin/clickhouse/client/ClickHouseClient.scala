package org.finos.vuu.plugin.clickhouse.client

import com.clickhouse.client.api.Client
import com.clickhouse.client.api.query.Records
import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}
import org.finos.vuu.plugin.clickhouse.client.options.ClickHouseClientOptions

import java.util.concurrent.ExecutionException
import scala.util.Using

class ClickHouseClient(val options: ClickHouseClientOptions)
                      (using lifecycle: LifecycleContainer) extends LifecycleEnabled with StrictLogging {

  private val initializer = ClickHouseClientInitializer(options)
  @volatile private var client: Option[Client] = Option.empty

  lifecycle(this)

  def executeQuery[T](sql: String)(action: Records => T): T = {
    client match {
      case Some(c) =>
        val response = try {
          logger.trace(s"Executing query \"$sql\"")
          c.queryRecords(sql).get()
        } catch {
          case e: ExecutionException =>
            throw new RuntimeException(s"ClickHouse query execution failed for SQL: $sql", e.getCause)
          case e: Exception =>
            throw new RuntimeException(s"Unexpected error fetching records for SQL: $sql", e)
        }

        Using(response)(action).recover {
          case e: Exception =>
            throw new RuntimeException(s"Error processing query results for SQL: $sql", e)
        }.get

      case None =>
        throw new IllegalStateException("ClickHouse client is not initialized.")
    }
  }

  def executeUpdate(sql: String): Int = {
    client match {
      case Some(c) =>
        val response = try {
          logger.trace(s"Executing update \"$sql\"")
          c.query(sql).get()
        } catch {
          case e: ExecutionException =>
            throw new RuntimeException(s"ClickHouse update/DDL execution failed for SQL: $sql", e.getCause)
          case e: Exception =>
            throw new RuntimeException(s"Unexpected error executing update for SQL: $sql", e)
        }

        Using(response) { _ =>
          // ClickHouse native mutations/DDLs return execution metrics rather than JDBC row counts.
          // Returning 1 to indicate structural success.
          1
        }.recover {
          case e: Exception =>
            throw new RuntimeException(s"Error finalizing update execution for SQL: $sql", e)
        }.get

      case None =>
        throw new IllegalStateException("ClickHouse client is not initialized.")
    }
  }

  override def doStart(): Unit = synchronized {
    try {
      client = Some(initializer.create())
    } catch {
      case e: Exception =>
        logger.error("Failed to start ClickHouse client", e)
        throw e
    }
  }

  override def doStop(): Unit = synchronized {
    client.foreach { c =>
      try {
        c.close()
      } catch {
        case e: Exception => logger.warn("Error closing ClickHouse client", e)
      }
      client = None
    }
  }

  override def doInitialize(): Unit = {}
  override def doDestroy(): Unit = {}
  override val lifecycleId: String = "ClickHouseClient"
}

object ClickHouseClient {
  def apply(options: ClickHouseClientOptions)(using lifecycle: LifecycleContainer): ClickHouseClient =
    new ClickHouseClient(options)
}
