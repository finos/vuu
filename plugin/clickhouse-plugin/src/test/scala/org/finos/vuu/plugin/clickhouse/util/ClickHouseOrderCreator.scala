package org.finos.vuu.plugin.clickhouse.util

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.plugin.clickhouse.ClickHouseContainer

import java.net.http.HttpRequest.BodyPublishers
import java.net.http.{HttpClient, HttpRequest}

object ClickHouseOrderCreator extends StrictLogging {

  private val httpClient = HttpClient.newHttpClient()

  def createOrderData(container: ClickHouseContainer, totalCount: Int): Unit = {

    logger.info("Dropping existing order_history table...")

    ClickHouseHttpUtil.executeUpdate(
      container = container,
      bodyPublisher = HttpRequest.BodyPublishers.ofString(s"DROP TABLE IF EXISTS order_history"),
      contentType = "text/plain; charset=utf-8"
    )

    logger.info("Creating new order_history table...")

    ClickHouseHttpUtil.executeUpdate(
      container = container,
      bodyPublisher = HttpRequest.BodyPublishers.ofString(
        """
          |CREATE TABLE IF NOT EXISTS order_history (
          |  order_id Int64,
          |  quantity Int32,
          |  price Int64,
          |  side String,
          |  trader String,
          |  time DateTime64(9, 'UTC')
          |) ENGINE = MergeTree() ORDER BY order_id
          |""".stripMargin
      ),
      contentType = "text/plain; charset=utf-8"
    )

    val tempDir = java.nio.file.Paths.get("target/temp-csv")
    java.nio.file.Files.createDirectories(tempDir)
    val tempFile = java.nio.file.Files.createTempFile(tempDir, "order_history", ".csv")

    logger.info(s"Creating order_history file with $totalCount rows at $tempFile...")

    val fos = new java.io.FileOutputStream(tempFile.toFile)
    val bos = new java.io.BufferedOutputStream(fos, 8 * 1024 * 1024) // 8MB buffer
    val writer = new java.io.BufferedWriter(new java.io.OutputStreamWriter(bos, "UTF-8"))
    try {
      val now = java.time.Instant.now()
        .toString
        .replace("T", " ")
        .replace("Z", "")

      var currentId = 1
      while (currentId <= totalCount) {
        val side = if (currentId % 2 == 0) "Buy" else "Sell"
        val price = currentId * 10_000_000L
        val quantity = currentId
        writer.write(currentId.toString)
        writer.write(',')
        writer.write(quantity.toString)
        writer.write(',')
        writer.write(price.toString)
        writer.write(',')
        writer.write(side)
        writer.write(",trader-")
        writer.write(currentId.toString)
        writer.write(',')
        writer.write(now)
        writer.write(System.lineSeparator())
        currentId += 1
      }
    } finally {
      writer.close()
    }

    logger.info("File created. Uploading...")

    try {
      ClickHouseHttpUtil.executeUpdate(
        container = container,
        query = "INSERT INTO order_history (order_id, quantity, price, side, trader, time) FORMAT CSV",
        bodyPublisher = BodyPublishers.ofFile(tempFile),
        contentType = "text/csv"
      )
    } finally {
      java.nio.file.Files.deleteIfExists(tempFile)
    }

    logger.info("Load complete.")

  }

}
