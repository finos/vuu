package org.finos.vuu.net.rpc

import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.viewport.{ViewPortAction, ViewPortAddRowAction, ViewPortDeleteCellAction, ViewPortDeleteRowAction, ViewPortEditAction, ViewPortEditCellAction, ViewPortEditRowAction, ViewPortFormCloseAction, ViewPortFormSubmitAction}

import scala.collection.immutable.Map

trait EditRpcHandler {
  def deleteRowAction(): ViewPortDeleteRowAction
  def deleteCellAction(): ViewPortDeleteCellAction
  def addRowAction(): ViewPortAddRowAction
  def editCellAction(): ViewPortEditCellAction
  def editRowAction(): ViewPortEditRowAction
  def onFormSubmit(): ViewPortFormSubmitAction
  def onFormClose(): ViewPortFormCloseAction
}
