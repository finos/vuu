package org.finos.vuu.example.rest.demoserver

import org.finos.vuu.example.rest.model.Instrument
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.scala.DefaultScalaModule
import io.vertx.core.json.JsonArray
import io.vertx.core.{Handler, Vertx}
import io.vertx.ext.web.{Router, RoutingContext}

import java.security.SecureRandom
import scala.util.Try

object InstrumentRouter {
  private final val DEFAULT_LIMIT = 1000

  private val objectMapper = new ObjectMapper()
  objectMapper.registerModule(DefaultScalaModule)

  def get(vertx: Vertx): Router = {
    val router = Router.router(vertx)
    router.get().handler(getAllHandler)
    router
  }

  private def getAllHandler: Handler[RoutingContext] = {
    ctx => {
      val limit = Try(ctx.queryParam("limit").get(0).toInt).toOption
      ctx.json(new JsonArray(objectMapper.writeValueAsString(generateInstruments(limit.getOrElse(DEFAULT_LIMIT)))))
    }
  }

  private def generateInstruments(number: Int): List[Instrument] =
    Range.inclusive(1, number).map(id => RandomInstrument.create(id)).toList
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
