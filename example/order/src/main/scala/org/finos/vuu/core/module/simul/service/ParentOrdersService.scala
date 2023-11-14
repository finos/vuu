package org.finos.vuu.core.module.simul.service

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.module.simul.provider.ParentOrdersProvider
import org.finos.vuu.core.table.DataTable
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.net.rpc.RpcHandler
import org.finos.vuu.provider.Provider
import org.finos.vuu.viewport._

class ParentOrdersService(val table: DataTable, val provider: Provider) extends RpcHandler with StrictLogging {

  final val parentsProvider = provider.asInstanceOf[ParentOrdersProvider]

  def add10kRows(selection: ViewPortSelection, sessionId: ClientSessionId): ViewPortAction = {
    parentsProvider.model.createParentOrders(1_000)
    NoAction()
  }

  def add100kRows(selection: ViewPortSelection, sessionId: ClientSessionId): ViewPortAction = {
    parentsProvider.model.createParentOrders(10_000)
    NoAction()
  }

  def add1mRows(selection: ViewPortSelection, sessionId: ClientSessionId): ViewPortAction = {
    parentsProvider.model.createParentOrders(100_000)
    NoAction()
  }

  def add1RowPerSec(selection: ViewPortSelection, sessionId: ClientSessionId): ViewPortAction = {
    //pricesProvider.setSpeed(400)
    NoAction()
  }

  def add10RowsPerSec(selection: ViewPortSelection, sessionId: ClientSessionId): ViewPortAction = {
    //pricesProvider.setSpeed(400)
    NoAction()
  }

  def add100RowsPerSec(selection: ViewPortSelection, sessionId: ClientSessionId): ViewPortAction = {
    //pricesProvider.setSpeed(400)
    NoAction()
  }

  override def menuItems(): ViewPortMenu = ViewPortMenu("Root",
    ViewPortMenu("Add Rows By Count",
      new SelectionViewPortMenuItem("Add 10k Rows", "", this.add10kRows, "ADD_10K_ROWS"),
      new SelectionViewPortMenuItem("Add 100k Rows", "", this.add100kRows, "ADD_100K_ROWS"),
      new SelectionViewPortMenuItem("Add 1m Rows", "", this.add1mRows, "ADD_1M_ROWS")
    ),
    ViewPortMenu("Add Rows At Rate",
      new SelectionViewPortMenuItem("Add 1 row / sec", "", this.add1RowPerSec, "ADD_1ROW_PER_SEC"),
      new SelectionViewPortMenuItem("Add 10 rows / sec", "", this.add10RowsPerSec, "ADD_10ROW_PER_SEC"),
      new SelectionViewPortMenuItem("Add 100 rows / sec", "", this.add100RowsPerSec, "ADD_100ROW_PER_SEC")
    )
  )

}
