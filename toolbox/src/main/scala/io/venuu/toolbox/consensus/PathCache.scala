/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.
  *
  * Created by chris on 13/10/2016.
  *
  */
package io.venuu.toolbox.consensus

import org.apache.curator.framework.recipes.cache.TreeCache

trait PathChangedListener{

}

trait PathCache {
  def createPath(path: String, data: Array[Byte]): PathCache
  def updatePath(path: String, data: Array[Byte]): PathCache
  def deletePath(path: String): PathCache
  //def setPath(path: String): PathCache
  def listeningTo: List[TreeCache]
  def connect(): PathCache
  def listenTo(path: String): PathCache
  def disconnect(): Unit
}
