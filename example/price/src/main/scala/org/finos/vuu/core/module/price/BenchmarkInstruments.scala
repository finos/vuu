package org.finos.vuu.core.module.price

/**
 * Mutable row model + generator/tick logic ported field-for-field and
 * call-for-call from the JS harness at
 * sample-apps/perf-benchmark/src/harness/instruments.ts, so that the same
 * seed produces the identical dataset and the same tick sequence produces
 * identical price movements on both the VUU and ag-grid sides of the
 * benchmark. The order of BenchmarkPrng.nextDouble() calls within generate()
 * and mutateTick() must match the JS source exactly - do not reorder.
 */
final class BenchmarkInstrument(
                                  val id: String,
                                  val ric: String,
                                  val symbol: String,
                                  val name: String,
                                  val exchange: String,
                                  val currency: String,
                                  var bid: Double,
                                  var ask: Double,
                                  var last: Double,
                                  var bidSize: Int,
                                  var askSize: Int,
                                  val open: Double,
                                  var volume: Int,
                                  var changePercent: Double
                                )

object BenchmarkInstruments {

  private val Exchanges = Array("NYSE", "NASDAQ", "LSE", "XETRA", "TSE", "HKEX")

  private val Currencies = Map(
    "NYSE" -> "USD", "NASDAQ" -> "USD", "LSE" -> "GBP",
    "XETRA" -> "EUR", "TSE" -> "JPY", "HKEX" -> "HKD"
  )

  private val Sectors = Array(
    "Technology", "Financials", "Energy", "Healthcare",
    "Industrials", "Consumer", "Materials", "Utilities"
  )

  private def round2(v: Double): Double = Math.round(v * 100) / 100.0

  private def roundPercent(v: Double): Double = Math.round(v * 10000) / 100.0

  def generate(count: Int, seed: Int = 42): Array[BenchmarkInstrument] = {
    val rnd = new BenchmarkPrng(seed)
    val rows = new Array[BenchmarkInstrument](count)
    for (i <- 0 until count) {
      val exchange = Exchanges(i % Exchanges.length)
      val mid = 10 + rnd.nextDouble() * 990
      val spread = 0.02 + rnd.nextDouble() * 0.3
      val bid = round2(mid - spread / 2)
      val ask = round2(mid + spread / 2)
      val open = round2(mid * (0.97 + rnd.nextDouble() * 0.06))
      val last = round2((bid + ask) / 2)
      val bidSize = Math.round(rnd.nextDouble() * 5000).toInt
      val askSize = Math.round(rnd.nextDouble() * 5000).toInt
      val volume = Math.round(rnd.nextDouble() * 5000000).toInt
      val changePercent = roundPercent((last - open) / open)
      rows(i) = new BenchmarkInstrument(
        id = s"INST-$i",
        ric = s"SYM$i.$exchange",
        symbol = s"SYM$i",
        name = s"${Sectors(i % Sectors.length)} Corp $i",
        exchange = exchange,
        currency = Currencies(exchange),
        bid = bid,
        ask = ask,
        last = last,
        bidSize = bidSize,
        askSize = askSize,
        open = open,
        volume = volume,
        changePercent = changePercent
      )
    }
    rows
  }

  def mutateTick(rnd: BenchmarkPrng, row: BenchmarkInstrument): Unit = {
    val spread = row.ask - row.bid
    val drift = (rnd.nextDouble() - 0.5) * 0.06
    val move = spread * 0.15 * (rnd.nextDouble() - 0.5) * 2 + drift
    val newBid = Math.max(0.01, round2(row.bid + move))
    val newAsk = Math.max(newBid + 0.01, round2(row.ask + move))
    row.bid = newBid
    row.ask = newAsk
    row.last = round2((newBid + newAsk) / 2)
    row.bidSize = Math.max(0, Math.round(row.bidSize + (rnd.nextDouble() - 0.5) * 200).toInt)
    row.askSize = Math.max(0, Math.round(row.askSize + (rnd.nextDouble() - 0.5) * 200).toInt)
    row.changePercent = roundPercent((row.last - row.open) / row.open)
  }

  def toFieldMap(row: BenchmarkInstrument): Map[String, Any] = Map(
    "ric" -> row.ric,
    "symbol" -> row.symbol,
    "name" -> row.name,
    "exchange" -> row.exchange,
    "currency" -> row.currency,
    "bid" -> row.bid,
    "ask" -> row.ask,
    "last" -> row.last,
    "bidSize" -> row.bidSize,
    "askSize" -> row.askSize,
    "open" -> row.open,
    "volume" -> row.volume,
    "changePercent" -> row.changePercent
  )
}
