/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.
 *
 * Created by chris on 15/12/14.
 *
 */
package io.venuu.vuu.core.table

object MergeFunctions {

  def mergeLeftToRight(update: RowWithData, data: RowWithData): RowWithData = {

    assert(update.key == data.key, s"check we're updating the same row ${update.key} != ${data.key}")

    var newData: RowWithData = data

    update.data.foreach({ case (field, value) => newData = newData.set(field, value) })

    //println(">" + newData)

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
