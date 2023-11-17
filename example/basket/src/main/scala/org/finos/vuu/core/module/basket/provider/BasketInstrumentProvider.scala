package org.finos.vuu.core.module.basket.provider

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.thread.RunOnceLifeCycleRunner
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.basket.csv.CsvStaticLoader
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.provider.DefaultProvider

class BasketInstrumentProvider(val table: DataTable)(implicit lifecycle: LifecycleContainer, clock: Clock) extends DefaultProvider {

  private val runner = new RunOnceLifeCycleRunner("BasketInstrumentProvider", runOnce)

  lifecycle(this).dependsOn(runner)

  def runOnce(): Unit = {
    val baskets = CsvStaticLoader.load
    val rows = baskets.map(basketId => {
      val list = CsvStaticLoader.loadConstituent(basketId)
      list.map(row => {
        val ric = row("Symbol").toString
        val bbg = if (ric.endsWith(".L")) ric.replace(".L", " LN") else if (ric.endsWith(".N")) ric.replace(".N", " US") else if (ric.endsWith(".AS")) ric.replace(".AS", " NL") else ric.replace(".", " ")
        val exchange = if (ric.endsWith(".L")) "XLON/LSE-SETS" else if (ric.endsWith(".N")) "XNGS/NAS-GSM" else if (ric.endsWith(".AS")) "XAMS/ENA-MAIN" else "XNYS/NYS-MAIN"
        val lotsize = 1000

        val ccy = basketId match {
          case ".FTSE100" => "UBD"
          case ".HSI" => "HKD"
          case ".NASDAQ100" => "USD"
          case ".SP500" => "EUR"
          case _ => "USD"
        }
        Map("ric" -> ric, "description" -> ric, "currency" -> ccy, "exchange" -> exchange, "lotSize" -> lotsize, "bbg" -> bbg)

      })
    }).flatMap(_.toList)

    rows.foreach(row => {
      table.processUpdate(row("ric").toString, RowWithData(row("ric").toString, row), System.currentTimeMillis())
    })
  }

  override val lifecycleId: String = "org.finos.vuu.core.module.basket.provider.BasketInstrumentProvider"
}
