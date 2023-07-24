package org.finos.vuu.core.module.auths.service

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.{DataTable, EmptyRowData, RowWithData}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.net.rpc.RpcHandler
import org.finos.vuu.viewport.{NoAction, SelectionViewPortMenuItem, ViewPortAction, ViewPortMenu, ViewPortSelection}
import org.finos.vuu.core.module.auths.PermissionModule.ColumnNames._
import org.finos.vuu.core.module.auths.PermissionSet
import org.finos.vuu.core.module.auths.PermissionSet.{AlgoCoveragePermission, HighTouchPermission, SalesTradingPermission, SalesTradingPermissionString}

class PermissionsRpcService(val table: DataTable)(implicit clock: Clock) extends RpcHandler with StrictLogging {

  private def addPermission(mask: Int, selection: ViewPortSelection, sessionId: ClientSessionId): ViewPortAction = {
    val users = selection.rowKeyIndex.map({ case (key, _) => key }).toList
    users.foreach( user => {
      table.pullRow(user) match {
        case EmptyRowData =>
          logger.error("Could not find row for user:" + user)
        case row: RowWithData =>
          val permissions = row.get(Bitmask).asInstanceOf[Int]
          val newPermissions = PermissionSet.addRole(permissions, mask)
          table.processUpdate(user, RowWithData(user, Map(User -> user, Bitmask -> newPermissions)), clock.now())
      }
    })
    NoAction()
  }

  private def removePermission(mask: Int, selection: ViewPortSelection, sessionId: ClientSessionId): ViewPortAction = {
    val users = selection.rowKeyIndex.map({ case (key, _) => key }).toList
    users.foreach(user => {
      table.pullRow(user) match {
        case EmptyRowData =>
          logger.error("Could not find row for user:" + user)
        case row: RowWithData =>
          val permissions = row.get(Bitmask).asInstanceOf[Int]
          val newPermissions = PermissionSet.removeRole(permissions, mask)
          table.processUpdate(user, RowWithData(user, Map(User -> user, Bitmask -> newPermissions)), clock.now())
      }
    })
    NoAction()
  }


  override def menuItems(): ViewPortMenu = ViewPortMenu("AuthS",
    ViewPortMenu("Add Permission",
      new SelectionViewPortMenuItem("Sales", "", (sel, sess) => this.addPermission(SalesTradingPermission, sel, sess), "ADD_SALES_PERM"),
      new SelectionViewPortMenuItem("Algo", "", (sel, sess) => this.addPermission(AlgoCoveragePermission, sel, sess), "ADD_ALGO_PERM"),
      new SelectionViewPortMenuItem("High Touch", "", (sel, sess) => this.addPermission(HighTouchPermission, sel, sess), "ADD_HT_PERM")
    ),
    ViewPortMenu("Remove Permission",
      new SelectionViewPortMenuItem("Sales", "", (sel, sess) => this.removePermission(SalesTradingPermission, sel, sess), "REM_SALES_PERM"),
      new SelectionViewPortMenuItem("Algo", "", (sel, sess) => this.removePermission(AlgoCoveragePermission, sel, sess), "REM_ALGO_PERM"),
      new SelectionViewPortMenuItem("High Touch", "", (sel, sess) => this.removePermission(HighTouchPermission, sel, sess), "REM_HT_PERM")
    )
  )
}
