package org.finos.vuu.viewport

case class ViewPortTable(table: String, module: String) {
  override def toString: String = module + ":" + table
}
