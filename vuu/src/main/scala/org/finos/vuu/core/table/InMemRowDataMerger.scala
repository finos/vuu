package org.finos.vuu.core.table

import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.datatype.EpochTimestamp

trait InMemRowDataMerger {

  def mergeLeftToRight(update: RowData, original: RowData): RowData

}

object InMemRowDataMerger {

  def apply(clock: Clock, defaultColumnNames: Set[String]): InMemRowDataMerger = InMemRowDataMergerImpl(clock, defaultColumnNames)

}

private case class InMemRowDataMergerImpl(clock: Clock, defaultColumnNames: Set[String]) extends InMemRowDataMerger {

  override def mergeLeftToRight(update: RowData, original: RowData): RowData = {
    update match {
      case u: RowWithData =>
        original match {
          case o: RowWithData => mergeWithDefaults(u, o)
          case EmptyRowData => updateWithDefaults(u)
        }
      case EmptyRowData => EmptyRowData
    }
  }

  private def updateWithDefaults(update: RowWithData): RowWithData = {
    val builder = Map.newBuilder[String, Any]
    builder.sizeHint(update.size + defaultColumnNames.size)
    builder ++= update.data

    val now = EpochTimestamp(clock.now())
    if (defaultColumnNames.contains(DefaultColumn.CREATED_TIME.name))
      builder += (DefaultColumn.CREATED_TIME.name -> now)
    if (defaultColumnNames.contains(DefaultColumn.LAST_UPDATED_TIME.name))
      builder += (DefaultColumn.LAST_UPDATED_TIME.name -> now)

    RowWithData(update.key, builder.result())
  }

  private def mergeWithDefaults(update: RowWithData, original: RowWithData): RowWithData = {
    val builder = Map.newBuilder[String, Any]
    builder.sizeHint(original.size + update.size)
    builder ++= original.data
    builder ++= update.data

    val now = EpochTimestamp(clock.now())
    if (defaultColumnNames.contains(DefaultColumn.LAST_UPDATED_TIME.name))
      builder += (DefaultColumn.LAST_UPDATED_TIME.name -> now)

    RowWithData(update.key, builder.result())
  }

}
