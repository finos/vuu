package org.finos.vuu.example.notifications.module

import _root_.org.finos.vuu.core.module.notifications.NotificationModule
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.ViewPortDef
import org.finos.vuu.core.filter.`type`.PermissionFilter
import org.finos.vuu.core.module.{DefaultModule, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.{DataTable, RowWithData, TableContainer}
import org.finos.vuu.example.notifications.provider.SimulatedNotificationsProvider
import org.finos.vuu.net.rpc.{DefaultRpcHandler, RpcFunctionResult, RpcFunctionSuccess, RpcParams}
import org.finos.vuu.provider.{Provider, ProviderContainer}

class DismissNotificationRpcHandler(table: DataTable)(implicit clock: Clock) extends DefaultRpcHandler {
  registerRpc("dismissNotification", this.dismissNotification)

  private def dismissNotification(params: RpcParams): RpcFunctionResult = {
    val username = params.ctx.user.name
    val vp = params.viewPort
    val selection = vp.getSelection
    
    selection.foreach { rowKey =>
      val row = table.pullRow(rowKey).asInstanceOf[RowWithData]
      val rowMap = row.data
      table.processUpdate(rowKey, RowWithData(rowKey, rowMap ++ Map("status" -> "dismissed", "dismissedBy" -> username)))
    }
    
    RpcFunctionSuccess(Some(Map("success" -> true, "dismissedCount" -> selection.size)))
  }
}

object SimulatedNotificationsModule extends DefaultModule {
  final val NAME = NotificationModule.NAME

  def apply()(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {
    // Example permission function: only show notifications where audience == "all" OR audience == currentUser
    val permissionFunc = (viewPort: org.finos.vuu.viewport.ViewPort, _: org.finos.vuu.core.table.TableContainer) => {
      val currentUser = viewPort.user.name
      // We can use PermissionFilter's Set-based Contains matching on the 'audience' column
      PermissionFilter("audience", Set("all", currentUser, "admin", "trader"))
    }

    val viewPortDefFactory = (table: DataTable, _: Provider, _: ProviderContainer, _: TableContainer) =>
      ViewPortDef(
        columns = table.getTableDef.getColumns,
        service = new DismissNotificationRpcHandler(table)(clock)
      )

    NotificationModule(
      (table, _) => new SimulatedNotificationsProvider(table),
      permissionFunc,
      viewPortDefFactory,
      "source:String", "priority:Int", "status:String", "dismissedBy:String"
    )
  }
}
