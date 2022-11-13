package org.finos.vuu.core.filter

import org.finos.vuu.core.table.Column
import org.finos.vuu.viewport.RowSource
import org.finos.toolbox.collection.array.ImmutableArray

trait Filter {
  def dofilter(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String]
}

object NoFilter extends Filter {
  override def dofilter(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = primaryKeys
}

case class LessThanFilter(column: Column, compareValue: Double) extends Filter {

  override def dofilter(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = {
    val filteredKeys = primaryKeys.toArray.filter(key => {
      val row = source.pullRow(key, List(column))
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

case class EqFilter(column: Column, compareValue: String) extends Filter {

  override def dofilter(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = {
    val filteredKeys = primaryKeys.toArray.filter(key => {
      val row = source.pullRow(key, List(column))
      val value = row.get(column.name)
      (value != null && value.toString.equals(compareValue))
    })
    ImmutableArray.from(filteredKeys)
  }
}
