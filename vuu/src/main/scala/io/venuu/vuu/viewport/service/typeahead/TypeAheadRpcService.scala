package io.venuu.vuu.viewport.service.typeahead

import io.venuu.vuu.core.index.StringIndexedField
import io.venuu.vuu.core.table.{DataTable, DataType}
import io.venuu.vuu.net.rpc.RpcHandler
import io.venuu.vuu.viewport.{ErrorViewPortAction, TypeAheadColumnResultsAction, ViewPortAction}

import scala.jdk.CollectionConverters._

class TypeAheadRpcService(final val table: DataTable) extends RpcHandler {

    def startsWith(columnName: String, starts: String): ViewPortAction = {

      val asColumn = table.getTableDef.columnForName(columnName)

      if(asColumn == null){
        ErrorViewPortAction(s"Column ${columnName} not found")
      }else{
        table.indexForColumn(asColumn) match {
          case Some(ix: StringIndexedField) if asColumn.dataType == DataType.StringDataType =>
            if(starts.isEmpty)
              TypeAheadColumnResultsAction(ix.keys())
            else {
              TypeAheadColumnResultsAction(ix.keys().filter( colValue => colValue.startsWith(starts)))
            }
          case _ =>
            ErrorViewPortAction(s"Column ${columnName} is not a string or does not have an index")
        }
      }
    }
}
