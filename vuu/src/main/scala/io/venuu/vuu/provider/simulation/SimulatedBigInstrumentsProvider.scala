/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 18/11/2015.

  */
package io.venuu.vuu.provider.simulation

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.logging.LogAtFrequency
import io.venuu.toolbox.thread.RunOnceLifeCycleRunner
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.core.table.{DataTable, RowWithData}
import io.venuu.vuu.provider.Provider

import scala.util.Random

class SimulatedBigInstrumentsProvider(table: DataTable)(implicit timeProvider: Clock, lifecycle:  LifecycleContainer) extends Provider with StrictLogging {

  private var runner: RunOnceLifeCycleRunner = new RunOnceLifeCycleRunner( "simulInstrumentsProvider", () => build() )

  lifecycle(this).dependsOn(runner)

  private val shouldLog = new LogAtFrequency(10000)

  override def subscribe(key: String): Unit = {}

  def charMaker = ( 65 to 90 ).map( i => i.toChar )
  //def charMaker = ( 65 to 66 ).map( i => i.toChar )

  def suffixes  = List(".L", ".N", ".OQ", ".AS")

  def ricBuilder = for( c1 <- charMaker; c2 <- charMaker ; c3 <- charMaker; suff <- suffixes) yield new String(Array(c1.toChar, c2.toChar, c3.toChar ) ) + suff

  private val random = new Random(1234)

  def mkRow(ric: String): Map[String, Any] = {

    val desc = if(ric.endsWith(".L")) " London PLC" else if(ric.endsWith(".N")) " Corporation" else if(ric.endsWith(".AS")) " B.V" else " Co."

    val ccy = random.nextInt(4) match {
      case 0 => "CAD"
      case 1 => "GBX"
      case 2 => "USD"
      case 3 => "EUR"
      case 4 => "GBP"
    }

    //val ccy = if(ric.endsWith(".L")) "GBX" else if(ric.endsWith(".N")) "USD" else if(ric.endsWith(".AS")) "EUR" else "USD"

    val exchange = if(ric.endsWith(".L")) "XLON/LSE-SETS" else if(ric.endsWith(".N")) "XNGS/NAS-GSM" else if(ric.endsWith(".AS")) "XAMS/ENA-MAIN" else "XNYS/NYS-MAIN"

    val lotsize = random.nextInt(1000)

    Map("ric"  -> ric, "description" -> (ric + desc), "currency" -> ccy, "exchange" -> exchange, "lotSize" -> lotsize)

  }

  def build() = {
    val rics = ricBuilder

    val rows = rics.map(mkRow(_))

    var i = 0

    rows.foreach( row => {

      if(i % 10000 == 0)    {
        Thread.sleep(10)
        logger.info(s"Loaded ${i} instruments")
      }

      table.processUpdate(row.get("ric").get.toString, RowWithData(row.get("ric").get.toString, row), System.currentTimeMillis())

      i += 1
    } )
  }


  override def doStart(): Unit = {
    //runner = new Runner("simulInstrumentsProvider", () => build(), runOnce = true  )
    //runner.runInBackground()
  }

  override def doStop(): Unit = {runner.stop()}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "simulatedInstrumentsProvider"
}
