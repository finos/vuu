package org.finos.vuu.core.auths

import org.finos.vuu.core.table.RowWithData

trait RowPermissionChecker {
  def canSeeRow(row: RowWithData): Boolean
}
