package org.finos.vuu.core.filter

import org.finos.vuu.core.table.Column
import org.finos.vuu.viewport.{RowSource, ViewPortColumns}
import org.finos.toolbox.collection.array.ImmutableArray

trait Filter {
  def dofilter(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String]
}

object NoFilter extends Filter {
  override def dofilter(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = primaryKeys
}

case class LessThanFilter(column: Column, viewPortColumns: ViewPortColumns, compareValue: Double) extends Filter {

  override def dofilter(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = {
    val filteredKeys = primaryKeys.toArray.filter(key => {
      val row = source.pullRow(key, viewPortColumns)
      val value = row.get(column.name)

      value match {
        case d: Double => d < compareValue
        case d: Int => d < compareValue
        case d: Long => d < compareValue
        case d: Short => d < compareValue
        case _ => false
      }

    })

    ImmutableArray.from(filteredKeys)
  }

}

case class EqFilter(column: Column, viewPortColumns: ViewPortColumns, compareValue: String) extends Filter {

  override def dofilter(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = {
    val filteredKeys = primaryKeys.toArray.filter(key => {
      val row = source.pullRow(key, viewPortColumns)
      val value = row.get(column.name)
      (value != null && value.toString.equals(compareValue))
    })
    ImmutableArray.from(filteredKeys)
  }
}
