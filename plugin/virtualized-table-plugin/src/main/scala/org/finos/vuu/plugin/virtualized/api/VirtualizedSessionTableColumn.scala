package org.finos.vuu.plugin.virtualized.api

import org.finos.vuu.core.table.{Column, DataType, RowData}

object VirtualizedSessionTableColumn {

  def fromNames(names: Array[String]): Array[VirtualizedSessionTableColumn] =
    names.zipWithIndex.map({ case (nameAndDt, index) =>

      val splitDef = nameAndDt.split(":").toList

      splitDef match {
        case name :: dataType :: remoteName :: _ =>
          val dtClass = DataType.fromString(dataType)
          VirtualizedSessionTableColumn(name, index, dtClass, remoteName)
        case _ => throw new Exception(s"Invalid format: $nameAndDt")
      }

    })

}

case class VirtualizedSessionTableColumn(name: String, index: Int, dataType: Class[_], remoteName: String) extends Column {

  override def getData(data: RowData): Any = {
    data.get(name)
  }

  override def getDataFullyQualified(data: RowData): Any = getData(data)

  private lazy val hash: Int = name.hashCode * dataType.hashCode() * remoteName.hashCode

  override def hashCode(): Int = hash

  override def equals(obj: scala.Any): Boolean = {
    obj match {
      case other: VirtualizedSessionTableColumn =>
        this.name == other.name &&
          this.dataType == other.dataType &&
          this.remoteName == other.remoteName
      case _ => false
    }
  }
}
