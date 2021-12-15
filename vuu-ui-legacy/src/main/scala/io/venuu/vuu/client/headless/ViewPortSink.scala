/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.
  *
  * Created by chris on 18/10/2016.
  *
  */
package io.venuu.vuu.client.headless

import io.venuu.vuu.viewport.ViewPortRange

import java.util.concurrent.{ConcurrentHashMap, CopyOnWriteArrayList}


class SinkData(data: CopyOnWriteArrayList[Array[Any]]){
  def updateRow(index: Int, row: Array[Any]) = {
    data.set(index, row)
  }
}

class ViewPortSink(@volatile var vpId: String,
                   @volatile var table: String,
                   @volatile var columns: Array[String],
                   @volatile var range: ViewPortRange,
                   @volatile var version: Int,
                   @volatile var size: Int,
                   val data: SinkData) {



}

class ViewPortSinks(){

  private val sinksByVpId = new ConcurrentHashMap[String, ViewPortSink]()

  def contains(vpId: String): Boolean = sinksByVpId.contains(vpId)

  def add(vpId: String, data: ViewPortSink) = {
     sinksByVpId.put(vpId, data)
  }

  def getSinkData(vpId: String) = sinksByVpId.get(vpId)
}

