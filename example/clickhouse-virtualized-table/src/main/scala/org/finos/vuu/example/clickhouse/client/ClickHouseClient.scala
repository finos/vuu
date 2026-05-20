package org.finos.vuu.example.clickhouse.client

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}
import org.finos.vuu.example.clickhouse.client.options.ClickHouseClientOptions
import java.sql.ResultSet

class ClickHouseClient(val options: ClickHouseClientOptions)
                      (implicit lifecycle: LifecycleContainer) extends LifecycleEnabled with StrictLogging {

  private val initializer = ClickHouseClientInitializer(options)
  @volatile private var dataSource: Option[com.clickhouse.jdbc.ClickHouseDataSource] = Option.empty

  lifecycle(this)

  def executeQuery[T](sql: String)(action: ResultSet => T): T = {
    dataSource match {
      case Some(ds) =>
        val connection = ds.getConnection()
        try {
          val statement = connection.createStatement()
          try {
            val resultSet = statement.executeQuery(sql)
            try {
              action(resultSet)
            } finally {
              resultSet.close()
            }
          } finally {
            statement.close()
          }
        } finally {
          connection.close()
        }
      case None => throw new IllegalStateException("ClickHouse client is not initialized.")
    }
  }

  def executeUpdate(sql: String): Int = {
    dataSource match {
      case Some(ds) =>
        val connection = ds.getConnection()
        try {
          val statement = connection.createStatement()
          try {
            statement.executeUpdate(sql)
          } finally {
            statement.close()
          }
        } finally {
          connection.close()
        }
      case None => throw new IllegalStateException("ClickHouse client is not initialized.")
    }
  }

  override def doStart(): Unit = synchronized {
    try {
      dataSource = Option(initializer.create())
    } catch {
      case e: Exception =>
        logger.error("Failed to start ClickHouse client", e)
        throw e
    }
  }

  override def doStop(): Unit = synchronized {
    dataSource = None
  }

  override def doInitialize(): Unit = {}
  override def doDestroy(): Unit = {}
  override val lifecycleId: String = "ClickHouseClient"
}

object ClickHouseClient {
  def apply(options: ClickHouseClientOptions)(implicit lifecycle: LifecycleContainer): ClickHouseClient =
    new ClickHouseClient(options)
}
