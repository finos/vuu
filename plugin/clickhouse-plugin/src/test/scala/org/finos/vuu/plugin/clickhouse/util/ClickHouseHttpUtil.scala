package org.finos.vuu.plugin.clickhouse.util

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.plugin.clickhouse.ClickHouseContainer

import java.net.URI
import java.net.http.HttpRequest.BodyPublisher
import java.net.http.{HttpClient, HttpRequest, HttpResponse}
import java.util.Base64
import scala.util.Try

object ClickHouseHttpUtil extends StrictLogging {

  private val httpClient: HttpClient = HttpClient.newHttpClient()

  def executeUpdate(container: ClickHouseContainer,
                    query: String = "",
                    bodyPublisher: BodyPublisher,
                    contentType: String): Try[String] = {
    val uri = query match {
      case s: String => if (s.isEmpty) URI.create(s"${container.getEndpoint}") else {
        URI.create(s"${container.getEndpoint}/?query=${java.net.URLEncoder.encode(query, "UTF-8")}")
      }
    }

    val startTime = System.currentTimeMillis()

    val req = HttpRequest.newBuilder()
      .uri(uri)
      .header("Authorization", basicAuthHeader(container.getDefaultUsername, container.getDefaultPassword))
      .header("Content-Type", contentType)
      .POST(bodyPublisher)
      .build()

    Try {
      val resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString())
      val responseBody = resp.body()
      val endTime = System.currentTimeMillis()

      if (resp.statusCode() >= 200 && resp.statusCode() < 300) {
        logger.debug(s"Successfully executed $req in ${endTime - startTime}ms.")
        responseBody
      } else {
        val message = s"ClickHouse returned ${resp.statusCode()}: $responseBody for $req"
        logger.error(message)
        throw new RuntimeException(message)
      }
    }
  }

  private def basicAuthHeader(user: String, pass: String): String = {
    val token = s"$user:$pass"
    val encoded = Base64.getEncoder.encodeToString(token.getBytes("UTF-8"))
    s"Basic $encoded"
  }

}
