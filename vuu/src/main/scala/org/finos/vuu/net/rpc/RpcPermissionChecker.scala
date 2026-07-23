package org.finos.vuu.net.rpc

import org.finos.vuu.core.auths.VuuUser

trait RpcPermissionChecker {

  def isRpcAllowed(rpcName: String, vuuUser: VuuUser): Boolean
}

object AllowAllRpcPermissionChecker extends RpcPermissionChecker {

  override def isRpcAllowed(rpcName: String, vuuUser: VuuUser): Boolean = true
}
