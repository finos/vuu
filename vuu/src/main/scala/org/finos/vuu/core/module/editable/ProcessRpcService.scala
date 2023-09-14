package org.finos.vuu.core.module.editable

import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.{DataTable, RowWithData, TableContainer}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.net.rpc.{EditRpcHandler, RpcHandler}
import org.finos.vuu.viewport.{OpenDialogViewPortAction, RenderComponent, SelectionViewPortMenuItem, ViewPortAction, ViewPortAddRowAction, ViewPortDeleteCellAction, ViewPortDeleteRowAction, ViewPortEditCellAction, ViewPortEditRowAction, ViewPortFormCloseAction, ViewPortFormSubmitAction, ViewPortMenu, ViewPortSelection, ViewPortTable}

class ProcessRpcService(val tableContainer: TableContainer)(implicit clock: Clock) extends RpcHandler{

  private final val FIX_SEQ_RESET_TABLE = "fixSequenceReset"

  private def openEditSeqNum(selection: ViewPortSelection, session: ClientSessionId): ViewPortAction = {

    val baseTable = tableContainer.getTable(FIX_SEQ_RESET_TABLE)

    val sessionTable = tableContainer.createSimpleSessionTable(baseTable, session)

    val row = selection.rowKeyIndex.keys.map(selection.viewPort.table.pullRow(_)).toList.head

    val processId = row.get("id").toString

    sessionTable.processUpdate(processId, RowWithData(processId, Map("process-id" -> processId, "sequenceNumber" -> 0)), clock.now())

    OpenDialogViewPortAction(ViewPortTable(sessionTable.name, sessionTable.tableDef.getModule().name), RenderComponent.InlineForm)
  }

  override def menuItems(): ViewPortMenu = ViewPortMenu("Admin",
    new SelectionViewPortMenuItem("Reset SeqNum", "", this.openEditSeqNum, "OPEN_EDIT_RESET_FIX")
  )
}
