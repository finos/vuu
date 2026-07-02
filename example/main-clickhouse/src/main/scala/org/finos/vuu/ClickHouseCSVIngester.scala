package org.finos.vuu

import com.typesafe.scalalogging.StrictLogging

import java.net.URI
import java.net.http.HttpRequest.BodyPublishers
import java.net.http.{HttpClient, HttpRequest, HttpResponse}
import java.nio.charset.StandardCharsets
import java.nio.file.{Files, Path}
import java.util.Base64

object ClickHouseCSVIngester extends StrictLogging {

  private val httpClient = HttpClient.newHttpClient()

  def ingestCsvFile(endpoint: String, username: String, password: String,
                    tableName: String, columns: Seq[String], csvFile: Path): Unit = {
    val colsStr = columns.mkString("(", ",", ")")
    val query = s"INSERT INTO $tableName $colsStr FORMAT CSV"
    val uri = URI.create(s"$endpoint/?query=${java.net.URLEncoder.encode(query, "UTF-8")}")

    val fileSize = Files.size(csvFile)
    logger.info(s"Starting HTTP CSV Ingestion to table '$tableName' from file: $csvFile ($fileSize bytes)")

    val startTime = System.currentTimeMillis()

    val builder = HttpRequest.newBuilder()
      .uri(uri)
      .header("Content-Type", "text/csv")
      .POST(BodyPublishers.ofFile(csvFile))

    if (username != null && username.nonEmpty) {
      val cred = s"$username:${Option(password).getOrElse("")}"
      val encoded = Base64.getEncoder.encodeToString(cred.getBytes(StandardCharsets.UTF_8))
      builder.header("Authorization", s"Basic $encoded")
    }
    
    val response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString())

    val endTime = System.currentTimeMillis()
    val durationMs = endTime - startTime

    if (response.statusCode() == 200) {
      val durationSec = durationMs / 1000.0
      val throughputMb = (fileSize.toDouble / (1024.0 * 1024.0)) / (if (durationSec > 0) durationSec else 1.0)
      logger.info(s"Successfully ingested CSV into table '$tableName' in ${durationMs}ms (Throughput: ${f"$throughputMb%.2f"} MB/s)")
    } else {
      logger.error(s"ClickHouse HTTP Ingestion failed with code ${response.statusCode()} after ${durationMs}ms: ${response.body()}")
      throw new RuntimeException(s"ClickHouse HTTP Ingestion failed with code ${response.statusCode()}: ${response.body()}")
    }
  }
}
