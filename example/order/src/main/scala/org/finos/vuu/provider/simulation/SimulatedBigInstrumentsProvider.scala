package org.finos.vuu.provider.simulation

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.logging.LogAtFrequency
import org.finos.toolbox.thread.RunOnceLifeCycleRunner
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.provider.Provider

import scala.concurrent.duration.DurationInt
import scala.util.Random

class SimulatedBigInstrumentsProvider(table: DataTable)(implicit clock: Clock, lifecycle: LifecycleContainer) extends Provider with StrictLogging {

  private val runner: RunOnceLifeCycleRunner = new RunOnceLifeCycleRunner("simulInstrumentsProvider", () => build())

  lifecycle(this).dependsOn(runner)

  private val shouldLog = new LogAtFrequency(10000)

  override def subscribe(key: String): Unit = {}

  //def charMaker = ((48 to 57).toSeq ++ ( 65 to 90 )).map( i => i.toChar )
  def charMaker = (65 to 90).map(i => i.toChar)

  def suffixes = List(".L", ".N", ".OQ", ".AS", ".OE", ".MI", ".A", ".PA", ".MC", ".DE")
  //def suffixes  = List(".L", ".N", ".OQ", ".AS")

  def ricBuilder = for (c1 <- charMaker; c2 <- charMaker; c3 <- charMaker; suff <- suffixes) yield new String(Array(c1.toChar, c2.toChar, c3.toChar)) + suff

  private val random = new Random(1234)

  def mkRow(ric: String): Map[String, Any] = {

    val desc = if (ric.endsWith(".L")) " London PLC" else if (ric.endsWith(".N")) " Corporation" else if (ric.endsWith(".AS")) " B.V" else " Co."

    val ccy = random.nextInt(4) match {
      case 0 => "CAD"
      case 1 => "GBX"
      case 2 => "USD"
      case 3 => "EUR"
      case 4 => "GBP"
    }

    //val ccy = if(ric.endsWith(".L")) "GBX" else if(ric.endsWith(".N")) "USD" else if(ric.endsWith(".AS")) "EUR" else "USD"

    val exchange = if (ric.endsWith(".L")) "XLON/LSE-SETS" else if (ric.endsWith(".N")) "XNGS/NAS-GSM" else if (ric.endsWith(".AS")) "XAMS/ENA-MAIN" else "XNYS/NYS-MAIN"

    val bbg = if (ric.endsWith(".L")) ric.replace(".L", " LN") else if (ric.endsWith(".N")) ric.replace(".N", " US") else if (ric.endsWith(".AS")) ric.replace(".AS", " NL") else ric.replace(".", " ")

    val lotsize = random.nextInt(1000)

    Map("ric" -> ric, "description" -> (ric + desc), "currency" -> ccy, "exchange" -> exchange, "lotSize" -> lotsize, "bbg" -> bbg)
  }

  def build() = {

    clock.sleep(5.seconds.toMillis)

    val rics = ricBuilder

    val rows = rics.map(mkRow)

    var i = 0

    rows.foreach(row => {

      if (i % 10000 == 0) {
        clock.sleep(10)
        logger.debug(s"Loaded ${i} instruments")
      }

      table.processUpdate(row("ric").toString, RowWithData(row("ric").toString, row))

      i += 1
    })
  }


  override def doStart(): Unit = {
    //runner = new Runner("simulInstrumentsProvider", () => build(), runOnce = true  )
    //runner.runInBackground()
  }

  override def doStop(): Unit = {
    runner.stop()
  }

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "simulatedInstrumentsProvider"
}
