package org.finos.vuu.net.row

case class RowUpdate(vpVersion: String, viewPortId: String, vpSize: Int, rowIndex: Int, rowKey: String,
                     updateType: RowUpdateType, ts: Long, selected: Int, data: Array[Any])

