package io.venuu.vuu.client.swing.gui

trait ViewPortContextProvider {
  def context(): ViewPortContext
  def setContext(viewPortContext: ViewPortContext)
  def toggleRenderer(): Unit
}
