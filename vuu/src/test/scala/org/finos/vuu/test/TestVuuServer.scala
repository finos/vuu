package org.finos.vuu.test

import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.provider.MockProvider
import org.finos.vuu.viewport.ViewPort

trait TestViewPort extends ViewPort{
  def getRpcService[TYPE]: TYPE = ???
  def getRpcProxyService[TYPE]: TYPE = ???
}

trait TestVuuServer {

  def start(): Unit
  def getProvider(module: String, table: String): MockProvider
  def createViewPort(module: String, tableName: String): TestViewPort
  def session: ClientSessionId
  def runOnce(): Unit

}
