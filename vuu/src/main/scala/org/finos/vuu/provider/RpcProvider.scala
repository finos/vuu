package org.finos.vuu.provider

import org.finos.vuu.core.table.{DataTable, RowWithData}

class RpcProvider(table: DataTable) extends Provider {

  def tick(key: String, row: Map[String, Any]) = {
    table.processUpdate(key, RowWithData(key, row))
  }

  def delete(key: String) = {
    table.processDelete(key)
  }

  def deleteAll() = {
    //table.processDelete(key)
  }

  protected def validateInput(key: String, row: Map[String, Any]) = {
    row.keys.foreach(key => if (!table.getTableDef.columnExists(key)) throw new Exception(s"Column ${key} doesn't exist in table"))
  }

  override def subscribe(key: String): Unit = {}

  override def doStop(): Unit = {}

  override def doStart(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "rpc.provider." + table.getTableDef.name
}
