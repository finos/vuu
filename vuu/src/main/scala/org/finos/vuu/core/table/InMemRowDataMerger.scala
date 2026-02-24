package org.finos.vuu.core.table

import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.datatype.EpochTimestamp

trait InMemRowDataMerger {

  def mergeLeftToRight(update: RowData, original: RowData): RowData

}

object InMemRowDataMerger {

  def apply(clock: Clock): InMemRowDataMerger = InMemRowDataMergerImpl(clock)

}

private case class InMemRowDataMergerImpl(clock: Clock) extends InMemRowDataMerger {

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
    builder.sizeHint(update.size + DefaultColumn.COUNT)
    builder ++= update.data

    val now = EpochTimestamp(clock.now())
    builder += (DefaultColumn.CREATED_TIME.name -> now)
    builder += (DefaultColumn.LAST_UPDATED_TIME.name -> now)

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

}
