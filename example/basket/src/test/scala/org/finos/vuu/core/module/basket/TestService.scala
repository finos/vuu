package org.finos.vuu.core.module.basket

import org.finos.vuu.net.rpc.{EditRpcHandler, RpcHandler}
import org.finos.vuu.viewport.{ViewPortAction, ViewPortAddRowAction, ViewPortDeleteCellAction, ViewPortEditCellAction, ViewPortEditRowAction, ViewPortEditSuccess, ViewPortFormCloseAction, ViewPortFormSubmitAction}

class TestService extends RpcHandler with EditRpcHandler {
  def sendBasketToMarket(): ViewPortAction = {
    println("test")
    ViewPortEditSuccess()
  }

  override def deleteCellAction(): ViewPortDeleteCellAction = ???

  override def addRowAction(): ViewPortAddRowAction = ???

  override def editCellAction(): ViewPortEditCellAction = ???

  override def editRowAction(): ViewPortEditRowAction = ???

  override def onFormSubmit(): ViewPortFormSubmitAction = ???

  override def onFormClose(): ViewPortFormCloseAction = ???
}
