package org.finos.vuu.example.rest.client

import io.circe.generic.auto._
import cats.effect.IO
import cats.effect.unsafe.implicits.global
import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.example.rest.RestClient
import org.finos.vuu.example.rest.client.Http4sBlazeClient.rawClient
import org.finos.vuu.example.rest.model.Instrument
import org.http4s.Uri
import org.http4s.blaze.client.BlazeClientBuilder
import org.http4s.circe.CirceEntityCodec.circeEntityDecoder

object Http4sBlazeClient {
  private val rawClient = BlazeClientBuilder[IO].resource

  def apply(baseUrl: String): Http4sBlazeClient = {
    val baseUri = Uri.fromString(baseUrl).getOrElse(throw new Exception(s"Incorrectly formatted base url passed: $baseUrl"))
    new Http4sBlazeClient(baseUri)
  }
}

class Http4sBlazeClient(baseUri: Uri) extends RestClient with StrictLogging {
  private def withPath(path: String): Uri = {
    baseUri.withPath(Uri.Path.unsafeFromString(path))
  }

  override def getInstruments: List[Instrument] = {
    rawClient.use { client => client.expect[List[Instrument]](withPath("/instruments")) }.unsafeRunSync()
  }
}
