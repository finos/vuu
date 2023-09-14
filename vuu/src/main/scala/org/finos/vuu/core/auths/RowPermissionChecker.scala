package org.finos.vuu.core.auths

import org.finos.vuu.core.table.RowData

trait RowPermissionChecker {
  def canSeeRow(row: RowData): Boolean
}
