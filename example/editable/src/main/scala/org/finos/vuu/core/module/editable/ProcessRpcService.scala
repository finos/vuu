package org.finos.vuu.core.module.editable

import org.finos.vuu.core.table.{RowWithData, TableContainer}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.net.rpc.DefaultRpcHandler
import org.finos.vuu.viewport._

class ProcessRpcService(implicit val tableContainer: TableContainer) extends DefaultRpcHandler {

  private final val FIX_SEQ_RESET_TABLE = "fixSequenceReset"

  private def openEditSeqNum(selection: ViewPortSelection, session: ClientSessionId): ViewPortAction = {

    val baseTable = tableContainer.getTable(FIX_SEQ_RESET_TABLE)

    val sessionTable = tableContainer.createSimpleSessionTable(baseTable, session)

    val row = selection.rowKeyIndex.keys.map(selection.viewPort.table.pullRow(_)).toList.head

    val processId = row.get("id").toString

    sessionTable.processUpdate(processId, RowWithData(processId, Map("process-id" -> processId, "sequenceNumber" -> 0)))

    OpenDialogViewPortAction(ViewPortTable(sessionTable.name, sessionTable.tableDef.getModule().name), RenderComponent.InlineForm)
  }

  override def menuItems(): ViewPortMenu = ViewPortMenu("Admin",
    new SelectionViewPortMenuItem("Reset SeqNum", "", this.openEditSeqNum, "OPEN_EDIT_RESET_FIX")
  )
}
