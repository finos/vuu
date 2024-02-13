package org.finos.vuu.example.rest.demoserver

import cats.effect.IO
import io.circe.generic.auto._
import org.finos.vuu.example.rest.model.Instrument
import org.http4s.circe.CirceEntityCodec.circeEntityEncoder
import org.http4s.HttpRoutes
import org.http4s.dsl.io._

import java.security.SecureRandom

object DemoRestService {
  val instrumentService: HttpRoutes[IO] = HttpRoutes.of[IO] {
    case GET -> Root / "instruments" => Ok(Range.inclusive(1, 1000).map(i => generateInstrument(i)).toList)
  }

  private def generateInstrument(id: Long): Instrument = RandomInstrument.create(id)
}

object RandomInstrument {
  private val currencies = List("AUD", "EUR", "GBP", "HKD", "SGD", "USD")
  private val alphabets = List("A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z")
  private val ricPostFixes = List("DE", "HK", "L", "MI", "N", "OQ")
  private val countryCodesForIsin = List("CA", "CH", "CN", "HK", "SG", "UK", "US", "XS")
  private val secureRandom = SecureRandom.getInstanceStrong

  def create(id: Long): Instrument = {
    val currency = randomItem(currencies)
    val ric = generateRic
    val isin = generateIsin
    Instrument(id = id, ccy = currency, isin = isin, ric = ric)
  }

  private def generateRic: String = {
    val ricLength = randomBetween(3, 4)
    val ricPrefix = Range.inclusive(1, ricLength).map(_ => randomItem(alphabets)).mkString("")
    val ricPostfix = randomItem(ricPostFixes)
    s"$ricPrefix.$ricPostfix"
  }

  private def generateIsin: String = {
    val countryCode = randomItem(countryCodesForIsin)
    val alphaNumIdentifier = generateAlphaNumericIsinIdentifier
    val checkDigit = randomDigit.toString

    List(countryCode, alphaNumIdentifier, checkDigit).mkString("")
  }

  private def generateAlphaNumericIsinIdentifier: String = {
    Range.inclusive(1, 9).foldLeft("")((acc, _) => {
      val nextChar = if (secureRandom.nextDouble() < 0.2) randomItem(alphabets) else randomDigit.toString
      acc + nextChar
    })
  }

  private def randomItem[T](l: List[T]): T = l(randomBetween(0, l.length - 1))
  private def randomDigit = randomBetween(0, 9)
  private def randomBetween(min: Int, max: Int): Int = min + secureRandom.nextInt(max + 1 - min)
}
