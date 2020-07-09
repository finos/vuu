/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.
 *
 * Created by chris on 09/06/2020.
 *
 */
package io.venuu.vuu.murmur.consensus

import com.typesafe.scalalogging.StrictLogging

trait PathListener extends StrictLogging {

  def onChildAdded(path: String, data: Array[Byte]) = {
    logger.info(s"onChildAdded Path = $path")
  }

  def onChildRemoved(path: String, data: Array[Byte]) = {
    logger.info(s"onChildRemoved Path = $path")
  }

  def onChildUpdated(path: String, data: Array[Byte]) = {
    logger.info(s"onChildUpdated Path = $path")
  }

  def onConnectionSuspended() = {
    logger.info(s"onConnectionSuspended")
  }
  def onConnectionLost() = {
    logger.info(s"onConnectionLost")
  }
  def onConnectionReconnected() = {
    logger.info(s"onConnectionReconnected")
  }
  def onInitialized() = {
    logger.info(s"onInitialized")
  }
}
