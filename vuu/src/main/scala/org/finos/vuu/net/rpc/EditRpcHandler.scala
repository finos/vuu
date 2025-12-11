package org.finos.vuu.net.rpc

import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.viewport.{ViewPortAction, ViewPortAddRowAction, ViewPortDeleteCellAction, ViewPortDeleteRowAction, ViewPortEditAction, ViewPortEditCellAction, ViewPortEditRowAction, ViewPortFormCloseAction, ViewPortFormSubmitAction}

import scala.collection.immutable.Map

@deprecated("#1790")
trait EditRpcHandler {
  @deprecated("#1790")
  def deleteRowAction(): ViewPortDeleteRowAction

  @deprecated("#1790")
  def deleteCellAction(): ViewPortDeleteCellAction

  @deprecated("#1790")
  def addRowAction(): ViewPortAddRowAction

  @deprecated("#1790")
  def editCellAction(): ViewPortEditCellAction

  @deprecated("#1790")
  def editRowAction(): ViewPortEditRowAction

  @deprecated("#1790")
  def onFormSubmit(): ViewPortFormSubmitAction

  @deprecated("#1790")
  def onFormClose(): ViewPortFormCloseAction
}
