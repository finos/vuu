package org.finos.vuu.core.table

import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.datatype.EpochTimestamp

trait InMemRowDataMerger {

  def mergeLeftToRight(update: RowData, original: RowData): RowData

}

object InMemRowDataMerger {

  def apply(clock: Clock, includeDefaultColumns: Boolean): InMemRowDataMerger = InMemRowDataMergerImpl(clock, includeDefaultColumns)

}

private case class InMemRowDataMergerImpl(clock: Clock, includeDefaultColumns: Boolean) extends InMemRowDataMerger {

  override def mergeLeftToRight(update: RowData, original: RowData): RowData = {
    update match {
      case u: RowWithData =>
        original match {
          case o: RowWithData => if (includeDefaultColumns) mergeWithDefaults(u, o) else mergeWithoutDefaults(u, o)
          case EmptyRowData => if (includeDefaultColumns) updateWithDefaults(u) else updateWithoutDefaults(u)
        }
      case EmptyRowData => EmptyRowData
    }
  }

  private def updateWithDefaults(update: RowWithData): RowWithData = {
    val builder = Map.newBuilder[String, Any]
    builder.sizeHint(update.size + DefaultColumn.COUNT)
    builder ++= update.data

    val now = EpochTimestamp(clock.now())
    builder += (DefaultColumn.CREATED_TIME.name -> now)
    builder += (DefaultColumn.LAST_UPDATED_TIME.name -> now)

    RowWithData(update.key, builder.result())
  }

  private def updateWithoutDefaults(update: RowWithData): RowWithData = {
    val builder = Map.newBuilder[String, Any]
    builder.sizeHint(update.size + DefaultColumn.COUNT)
    builder ++= update.data

    RowWithData(update.key, builder.result())
  }

  private def mergeWithDefaults(update: RowWithData, original: RowWithData): RowWithData = {
    val builder = Map.newBuilder[String, Any]
    builder.sizeHint(original.size + update.size)
    builder ++= original.data
    builder ++= update.data

    val now = EpochTimestamp(clock.now())
    builder += (DefaultColumn.LAST_UPDATED_TIME.name -> now)

    RowWithData(update.key, builder.result())
  }

  private def mergeWithoutDefaults(update: RowWithData, original: RowWithData): RowWithData = {
    val builder = Map.newBuilder[String, Any]
    builder.sizeHint(original.size + update.size)
    builder ++= original.data
    builder ++= update.data

    RowWithData(update.key, builder.result())
  }

}
