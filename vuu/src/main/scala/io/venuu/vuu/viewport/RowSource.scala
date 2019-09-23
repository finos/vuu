/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.

 * Created by chris on 15/12/14.

 */
package io.venuu.vuu.viewport

import io.venuu.toolbox.ImmutableArray
import io.venuu.vuu.core.table._

trait RowProcessor{
  def processColumn(column: Column, value: Any)
  def missingRow()
  def missingRowData(rowKey: String, column: Column)
}

/**
  * A session listener is a special type of table, it processes all update notifications from the source table
  * and forwards them onto the viewport. This is for use in Session tables mainly GroupBy session tables.
  *
  */
trait SessionListener{
  //def processRawUpdate(rowKey: String, rowUpdate: RowWithData, timeStamp: Long): Unit
  //def processRawDelete(rowKey: String): Unit
}

trait RowSource extends KeyedObservable[RowKeyUpdate]{
  def name: String
  def readRow(key: String, columns:List[String], processor: RowProcessor): Unit
  def primaryKeys: ImmutableArray[String]
  def pullRow(key: String, columns: List[Column]): RowData
  def pullRowAsArray(key: String, columns: List[Column]): Array[Any]
  def asTable: DataTable
//  def addSessionListener(listener: SessionListener): Unit
//  def removeSessionListener(listener: SessionListener): Unit
}
