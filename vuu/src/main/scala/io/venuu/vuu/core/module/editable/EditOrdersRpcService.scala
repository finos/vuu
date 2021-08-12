package io.venuu.vuu.core.module.editable

import com.typesafe.scalalogging.StrictLogging
import io.venuu.vuu.core.table.DataTable
import io.venuu.vuu.net.ClientSessionId
import io.venuu.vuu.net.rpc.RpcHandler
import io.venuu.vuu.provider.RpcProvider
import io.venuu.vuu.viewport._

class EditOrdersRpcService(val table: DataTable, val provider: RpcProvider) extends RpcHandler with StrictLogging {

  def showDetails(selection: ViewPortSelection,sessionId: ClientSessionId): ViewPortAction = {
    NoAction
  }

  def deleteRows(selection: ViewPortSelection,sessionId: ClientSessionId): ViewPortAction = {
    NoAction
  }

  def duplicate(selection: ViewPortSelection,sessionId: ClientSessionId) : ViewPortAction = {
    NoAction
  }

  def editCell(rowKey: String, key: String, value: Object, sessionId: ClientSessionId) : ViewPortAction = {
    NoAction
  }

  def editRow(key: String, row: Map[String, Object],sessionId: ClientSessionId) : ViewPortAction = {
    NoAction
  }

  def deleteAll(sessionId: ClientSessionId) : ViewPortAction = {
    NoAction
  }

  override def menuItems(): ViewPortMenu = {
    ViewPortMenu(
      ViewPortMenu("Insert",
          new SelectionViewPortMenuItem("Duplicate Row(s)", "", this.duplicate, "DUPLICATE")
      ),
      ViewPortMenu("Edit",
          new CellViewPortMenuItem("Edit Cell", "", this.editCell, "EDIT_CELL"),
          new RowViewPortMenuItem("Edit Row", "", this.editRow, "EDIT_ROW")
        ),
      ViewPortMenu("Delete",
          new SelectionViewPortMenuItem("Delete Row(s)", "", this.deleteRows, "DELETE_ROWS"),
          new TableViewPortMenuItem("Delete All Contents", "", this.deleteAll, "DELETE_ALL")
      ),
      new SelectionViewPortMenuItem("Show Details", filter = "", this.showDetails, "SHOW_DETAILS")
    )
  }

}
