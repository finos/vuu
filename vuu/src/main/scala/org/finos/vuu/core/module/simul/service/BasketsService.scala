package org.finos.vuu.core.module.simul.service

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.module.simul.provider.BasketsProvider
import org.finos.vuu.core.table.DataTable
import org.finos.vuu.net.rpc.RpcHandler
import org.finos.vuu.provider.Provider
import org.finos.vuu.viewport._

class BasketsService(val table: DataTable, val provider: Provider) extends RpcHandler with StrictLogging {

  final val basketsProvider = provider.asInstanceOf[BasketsProvider]


}
