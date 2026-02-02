package org.finos.vuu.provider.join

import org.finos.vuu.core.table.{JoinTable, RowWithData}

sealed trait JoinTableUpdate { }

case class JoinTableUpdateRow(joinTable: JoinTable, rowUpdate: RowWithData) extends JoinTableUpdate {
  override def toString: String = s"JoinTableUpdateRow(table=${joinTable.name}, update=$rowUpdate)"
}

case class JoinTableDeleteRow(joinTable: JoinTable, key: String) extends JoinTableUpdate {
  override def toString: String = s"JoinTableDeleteRow(table=${joinTable.name}, key=$key)"
}
