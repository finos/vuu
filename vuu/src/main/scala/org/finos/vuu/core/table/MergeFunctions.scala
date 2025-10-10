package org.finos.vuu.core.table

object MergeFunctions {

  def mergeLeftToRight(update: RowData, data: RowData): RowData = {

    assert(update.key() == data.key(), s"check we're updating the same row ${update.key()} != ${data.key()}")

    var newData: RowData = data

    update match {
      case update: RowWithData =>
        update.data.foreach({ case (field, value) => newData = newData.set(field, value) })
    }

    newData
  }

  //  def mergeLeftToRight(update: RowWithData, data: RowWithData): RowWithData = {
  //
  //    assert(update.key == data.key, "check we're updating the same row")
  //
  //    var newData: RowWithData = data
  //
  //    update.data.foreach({case (field, value) => newData = newData.set(field, value) })
  //
  //    newData
  //  }

}
