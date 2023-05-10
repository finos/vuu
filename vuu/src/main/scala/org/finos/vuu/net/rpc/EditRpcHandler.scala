package org.finos.vuu.net.rpc

import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.viewport.{ViewPortAction, ViewPortEditAction, ViewPortEditCellAction, ViewPortEditRowAction, ViewPortFormSubmitAction}

import scala.collection.immutable.Map

trait EditRpcHandler {

  def editCellAction(): ViewPortEditCellAction
  def editRowAction(): ViewPortEditRowAction
  def onFormSubmit(): ViewPortFormSubmitAction
}
