package org.finos.vuu.plugin.clickhouse.util

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.plugin.clickhouse.ClickHouseContainer

import java.net.http.HttpRequest

object ClickhouseJoinDataCreator extends StrictLogging {

  def createTables(container: ClickHouseContainer,
                   instrumentCount: Int,
                   orderCount: Int): Unit = {
    //Create simple tables
    ClickHouseInstrumentCreator.createInstrumentData(container, instrumentCount)
    ClickHouseOrderCreator.createOrderData(container, orderCount)

    //Create join tables
    createOrderInstrumentJoinTable(container)
  }

  private def createOrderInstrumentJoinTable(container: ClickHouseContainer): Unit = {
    logger.info("Dropping existing enriched_orders VIEW...")

    ClickHouseHttpUtil.executeUpdate(
      container = container,
      bodyPublisher = HttpRequest.BodyPublishers.ofString(s"DROP VIEW IF EXISTS enriched_orders"),
      contentType = "text/plain; charset=utf-8"
    )

    logger.info("Creating new enriched_orders view...")

    ClickHouseHttpUtil.executeUpdate(
      container = container,
      bodyPublisher = HttpRequest.BodyPublishers.ofString(
        """
          |CREATE VIEW IF NOT EXISTS enriched_orders AS
          |SELECT
          |   o.*,
          |   i.ric,
          |   i.exchange,
          |   i.currency AS instrument_currency
          |FROM order_history AS o
          |LEFT JOIN instruments AS i
          |ON o.instrument_id = i.instrument_id
          |""".stripMargin
      ),
      contentType = "text/plain; charset=utf-8"
    )
  }

}
