/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 19/01/2016.

  */
package io.venuu.vuu.provider

import io.venuu.toolbox.time.Clock
import io.venuu.vuu.core.table.{DataTable, RowWithData}

class RpcProvider(table: DataTable)(implicit timeProvider: Clock) extends Provider {

  def tick(key: String, row: Map[String, Any]) = {
    table.processUpdate(key, new RowWithData(key, row), timeProvider.now())
  }

  def delete(key: String) = {
    table.processDelete(key)
  }

  def deleteAll() = {
    //table.processDelete(key)
  }

  protected def validateInput(key: String, row: Map[String, Any]) = {
    row.keys.foreach( key => if(!table.getTableDef.columnExists(key)) throw new Exception(s"Column ${key} doesn't exist in table"))
  }

  override def subscribe(key: String): Unit = {}
  override def doStop(): Unit = {}
  override def doStart(): Unit = {}
  override def doInitialize(): Unit = {}
  override def doDestroy(): Unit = {}
  override val lifecycleId: String = "rpc.provider." + table.getTableDef.name
}
