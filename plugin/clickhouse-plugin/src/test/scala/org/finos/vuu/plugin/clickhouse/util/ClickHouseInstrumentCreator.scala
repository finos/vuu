package org.finos.vuu.plugin.clickhouse.util

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.plugin.clickhouse.ClickHouseContainer

import java.net.http.HttpRequest.BodyPublishers
import java.net.http.{HttpClient, HttpRequest}

object ClickHouseInstrumentCreator extends StrictLogging {

  private val httpClient = HttpClient.newHttpClient()

  def createInstrumentData(container: ClickHouseContainer, totalCount: Int): Unit = {

    logger.info("Dropping existing instruments table")

    ClickHouseHttpUtil.executeUpdate(
      container = container,
      bodyPublisher = HttpRequest.BodyPublishers.ofString(s"DROP TABLE IF EXISTS instruments"),
      contentType = "text/plain; charset=utf-8"
    )

    logger.info("Creating new instruments table...")

    ClickHouseHttpUtil.executeUpdate(
      container = container,
      bodyPublisher = HttpRequest.BodyPublishers.ofString(
        """
          |CREATE TABLE IF NOT EXISTS instruments
          |(
          |  instrument_id Int64,
          |  ric String,
          |  exchange String,
          |  currency String
          |)
          |ENGINE = MergeTree() ORDER BY instrument_id
          |""".stripMargin
      ),
      contentType = "text/plain; charset=utf-8"
    )

    val tempDir = java.nio.file.Paths.get("target/temp-csv")
    java.nio.file.Files.createDirectories(tempDir)
    val tempFile = java.nio.file.Files.createTempFile(tempDir, "instruments", ".csv")

    logger.info(s"Creating instrument file with $totalCount rows at $tempFile...")

    val fos = new java.io.FileOutputStream(tempFile.toFile)
    val bos = new java.io.BufferedOutputStream(fos, 8 * 1024 * 1024) // 8MB buffer
    val writer = new java.io.BufferedWriter(new java.io.OutputStreamWriter(bos, "UTF-8"))
    try {
      var currentId = 1
      while (currentId <= totalCount) {
        val stringId = currentId.toString
        writer.write(stringId)
        writer.write(",ric-")
        writer.write(stringId)
        writer.write(",exchange-")
        writer.write(stringId)
        writer.write(",currency-")
        writer.write(stringId)
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
        query = "INSERT INTO instruments (instrument_id, ric, exchange, currency) FORMAT CSV",
        bodyPublisher = BodyPublishers.ofFile(tempFile),
        contentType = "text/csv"
      )
    } finally {
      java.nio.file.Files.deleteIfExists(tempFile)
    }

    logger.info("Load complete.")

  }

}
