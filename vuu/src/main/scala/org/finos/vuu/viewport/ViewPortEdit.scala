package org.finos.vuu.viewport

import org.finos.vuu.net.ClientSessionId

trait ViewPortEditAction extends ViewPortAction {}
case class ViewPortEditSuccess() extends ViewPortEditAction {}
case class ViewPortEditFailure(msg: String) extends ViewPortEditAction {}

case class ViewPortEditCellAction(filter: String, func: (String, String, Object, ViewPort, ClientSessionId) => ViewPortEditAction){
  final val rpcName = "VP_EDIT_CELL"
}

case class ViewPortDeleteCellAction(filter: String, func: (String, String, ViewPort, ClientSessionId) => ViewPortEditAction){
  final val rpcName = "VP_DELETE_CELL"
}

case class ViewPortAddRowAction(filter: String, func: (String, Map[String, Any], ViewPort, ClientSessionId) => ViewPortEditAction){
  final val rpcName = "VP_ADD_ROW"
}

case class ViewPortEditRowAction(filter: String, func: (String, Map[String, Any], ViewPort, ClientSessionId) => ViewPortEditAction){
  final val rpcName = "VP_EDIT_ROW"
}

case class ViewPortFormSubmitAction(filter: String, func: (ViewPort, ClientSessionId) => ViewPortAction){
  final val rpcName = "VP_FORM_SUBMIT"
}

case class ViewPortFormCloseAction(filter: String, func: (ViewPort, ClientSessionId) => ViewPortAction){
  final val rpcName = "VP_FORM_CLOSE"
}



