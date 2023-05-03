package org.finos.vuu.core.module.auths

import org.finos.vuu.core.auths.RowPermissionChecker
import org.finos.vuu.core.table.{DataTable, RowWithData}

class OrderPermissionChecker(val permissionsTable: DataTable) extends RowPermissionChecker{
  override def canSeeRow(row: RowWithData): Boolean = {



  }
}
