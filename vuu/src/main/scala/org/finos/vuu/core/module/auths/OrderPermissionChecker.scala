package org.finos.vuu.core.module.auths

import org.finos.vuu.core.VuuServer
import org.finos.vuu.core.auths.RowPermissionChecker
import org.finos.vuu.core.table.{DataTable, RowData, RowWithData}
import org.finos.vuu.viewport.ViewPort

class OrderPermissionChecker(val vp: ViewPort) extends RowPermissionChecker{

  def runOnce(): Unit = {

  }

  override def canSeeRow(row: RowData): Boolean = ???

  override def hashCode(): Int = {
      37 * vp.id.hashCode
  }
}
