package org.finos.vuu.provider.simulation

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.provider.Provider

class SimulatedInstrumentProvider(instruments: Array[Array[String]], table: DataTable) extends Provider with StrictLogging {

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

        logger.debug(s"[INSTRUMENTS] Adding row $rowData")

        table.processUpdate(ric, rowData)

      } else {
        logger.debug(s"dropped $row")
      }

    })

  }

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "simulatedInstrumentsProvider"
}
