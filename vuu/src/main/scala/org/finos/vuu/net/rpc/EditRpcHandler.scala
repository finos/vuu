package org.finos.vuu.net.rpc

import org.finos.vuu.viewport.{ViewPortAddRowAction, ViewPortDeleteCellAction, ViewPortEditCellAction, ViewPortEditRowAction, ViewPortFormCloseAction, ViewPortFormSubmitAction}

trait EditRpcHandler {
  def deleteCellAction(): ViewPortDeleteCellAction
  def addRowAction(): ViewPortAddRowAction
  def editCellAction(): ViewPortEditCellAction
  def editRowAction(): ViewPortEditRowAction
  def onFormSubmit(): ViewPortFormSubmitAction
  def onFormClose(): ViewPortFormCloseAction
}
