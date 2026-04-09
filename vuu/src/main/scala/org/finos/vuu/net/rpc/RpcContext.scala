package org.finos.vuu.net.rpc

sealed trait RpcContext { }

object GlobalContext extends RpcContext

case class ViewPortContext(viewPortId: String) extends RpcContext

case class ViewPortRowContext(viewPortId: String, rowKey: String) extends RpcContext
