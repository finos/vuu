package org.finos.vuu.viewport

import org.finos.vuu.net.ClientSessionId

@deprecated("#1790")
trait ViewPortEditAction extends ViewPortAction {}

@deprecated("#1790")
case class ViewPortEditSuccess() extends ViewPortEditAction {}

@deprecated("#1790")
case class ViewPortEditFailure(msg: String) extends ViewPortEditAction {}

@deprecated("#1790")
case class ViewPortEditCellAction(filter: String, func: (String, String, Object, ViewPort, ClientSessionId) => ViewPortEditAction){
  final val rpcName = "VP_EDIT_CELL"
}

@deprecated("#1790")
case class ViewPortDeleteCellAction(filter: String, func: (String, String, ViewPort, ClientSessionId) => ViewPortEditAction){
  final val rpcName = "VP_DELETE_CELL"
}

@deprecated("#1790")
case class ViewPortDeleteRowAction(filter: String, func: (String, ViewPort, ClientSessionId) => ViewPortEditAction){
  final val rpcName = "VP_DELETE_ROW"
}

@deprecated("#1790")
case class ViewPortAddRowAction(filter: String, func: (String, Map[String, Any], ViewPort, ClientSessionId) => ViewPortEditAction){
  final val rpcName = "VP_ADD_ROW"
}

@deprecated("#1790")
case class ViewPortEditRowAction(filter: String, func: (String, Map[String, Any], ViewPort, ClientSessionId) => ViewPortEditAction){
  final val rpcName = "VP_EDIT_ROW"
}

@deprecated("#1790")
case class ViewPortFormSubmitAction(filter: String, func: (ViewPort, ClientSessionId) => ViewPortAction){
  final val rpcName = "VP_FORM_SUBMIT"
}

@deprecated("#1790")
case class ViewPortFormCloseAction(filter: String, func: (ViewPort, ClientSessionId) => ViewPortAction){
  final val rpcName = "VP_FORM_CLOSE"
}



