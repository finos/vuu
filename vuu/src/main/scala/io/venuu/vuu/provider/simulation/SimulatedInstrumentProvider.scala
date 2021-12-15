package io.venuu.vuu.provider.simulation

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.core.table.{DataTable, RowWithData}
import io.venuu.vuu.provider.Provider

class SimulatedInstrumentProvider(instruments: Array[Array[String]], table: DataTable)(implicit timeProvider: Clock) extends Provider with StrictLogging {

  override def subscribe(key: String): Unit = ???

  override def doStart(): Unit = {

    instruments.foreach(row => {

      if (row.size >= 4) {
        val ric = row(0)
        val name = row(1)
        val gen1 = row(2)
        val gen2 = row(3)
        //val gen3 = row(4)

        val rowAsMap = Map("ric" -> ric, "description" -> name, "gen1" -> gen1, "gen2" -> gen2, "gen3" -> "")

        val rowData = RowWithData(ric, rowAsMap)

        logger.info(s"[INSTRUMENTS] Adding row $rowData")

        table.processUpdate(ric, rowData, timeProvider.now())

      } else {
        logger.info(s"dropped $row")
      }

    })

  }

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "simulatedInstrumentsProvider"
}
