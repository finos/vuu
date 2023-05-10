package org.finos.vuu.viewport

import org.finos.vuu.net.ClientSessionId

trait ViewPortEditAction extends ViewPortAction {}
case class ViewPortEditSuccess() extends ViewPortEditAction {}
case class ViewPortEditFailure(msg: String) extends ViewPortEditAction {}

case class ViewPortEditCellAction(val filter: String, val func: (String, String, Object, ViewPort, ClientSessionId) => ViewPortEditAction){
  final val rpcName = "VP_EDIT_CELL"
}

case class ViewPortEditRowAction(val filter: String, val func: (String, Map[String, Any], ViewPort, ClientSessionId) => ViewPortEditAction){
  final val rpcName = "VP_EDIT_ROW"
}

case class ViewPortFormSubmitAction(val filter: String, val func: (ViewPort, ClientSessionId) => ViewPortAction){
  final val rpcName = "VP_FORM_SUBMIT"
}



