package io.venuu.vuu.core.module.editable

import com.typesafe.scalalogging.StrictLogging
import io.venuu.vuu.core.table.DataTable
import io.venuu.vuu.net.{RequestContext, RpcResponse, RpcSuccess}
import io.venuu.vuu.net.rpc.RpcHandler
import io.venuu.vuu.provider.RpcProvider
import io.venuu.vuu.viewport.{CellViewPortMenuItem, RowViewPortMenuItem, Selection, SelectionViewPortMenuItem, TableViewPortMenuItem, ViewPortMenu, ViewPortMenuItem, ViewPortSelectedIndices, ViewPortSelection}

class EditOrdersRpcService(val table: DataTable, val provider: RpcProvider) extends RpcHandler with StrictLogging {

  def deleteRows(selection: ViewPortSelection)(context: RequestContext) = {}

  def duplicate(selection: ViewPortSelection)(context: RequestContext) = {}

  def editCell(key: String, value: AnyRef)(context: RequestContext) = {}

  def editRow(key: String, row: Map[String, AnyRef])(context: RequestContext) = {}

  def deleteAll()(context: RequestContext) = {}

  override def menuItems(): ViewPortMenu = {
    ViewPortMenu(
      ViewPortMenu("Insert",
          new SelectionViewPortMenuItem("Duplicate Row(s)", "", this.duplicate)
      ),
      ViewPortMenu("Edit",
          new CellViewPortMenuItem("Edit Cell", "", this.editCell),
          new RowViewPortMenuItem("Edit Row", "", this.editRow)
        ),
      ViewPortMenu("Delete",
          new SelectionViewPortMenuItem("Delete Row(s)", "", this.deleteRows),
          new TableViewPortMenuItem("Delete All Contents", "", this.deleteAll)
      )
    )
  }

}
