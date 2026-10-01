package org.finos.vuu.core.module.price

import org.finos.vuu.core.table.TableContainer
import org.finos.vuu.net.rpc.{DefaultRpcHandler, RpcFunctionSuccess, RpcParams}
import org.finos.vuu.provider.Provider

/**
 * Generic (non-menu) RPC surface for BenchmarkTickProvider, so the Playwright
 * test harness can call startTicking/stopTicking/fireBurst with numeric
 * parameters via a plain RPC_REQUEST, the same way the JS harness's
 * window.__benchmark API works against the mocked data source.
 */
class BenchmarkPriceService(val table: org.finos.vuu.core.table.DataTable, val provider: Provider)
                            (implicit tableContainer: TableContainer) extends DefaultRpcHandler {

  private val tickProvider = provider.asInstanceOf[BenchmarkTickProvider]

  private def asInt(v: Any): Int = v match {
    case i: Int => i
    case l: Long => l.toInt
    case d: Double => d.toInt
    case f: Float => f.toInt
    case s: String => s.toInt
  }

  registerRpc("startTicking", (params: RpcParams) => {
    val updatesPerSecond = asInt(params.namedParams("updatesPerSecond"))
    val updatesPerMessage = asInt(params.namedParams.getOrElse("updatesPerMessage", 100))
    tickProvider.startTicking(updatesPerSecond, updatesPerMessage)
    RpcFunctionSuccess(None)
  })

  registerRpc("stopTicking", (_: RpcParams) => {
    tickProvider.stopTicking()
    RpcFunctionSuccess(None)
  })

  registerRpc("fireBurst", (params: RpcParams) => {
    val totalUpdates = asInt(params.namedParams("totalUpdates"))
    val updatesPerMessage = asInt(params.namedParams.getOrElse("updatesPerMessage", 100))
    val result = tickProvider.fireBurst(totalUpdates, updatesPerMessage)
    RpcFunctionSuccess(Some(Map(
      "totalUpdates" -> result.totalUpdates,
      "durationMs" -> result.durationMs,
      "updatesPerSecond" -> result.updatesPerSecond
    )))
  })

  registerRpc("getStreamStats", (_: RpcParams) => {
    val stats = tickProvider.getStreamStats
    RpcFunctionSuccess(Some(Map(
      "messagesSent" -> stats.messagesSent,
      "rowsUpdated" -> stats.rowsUpdated,
      "totalDriftMs" -> stats.totalDriftMs,
      "maxDriftMs" -> stats.maxDriftMs
    )))
  })

  registerRpc("resetStreamStats", (_: RpcParams) => {
    tickProvider.resetStreamStats()
    RpcFunctionSuccess(None)
  })

  registerRpc("resetDataset", (_: RpcParams) => {
    tickProvider.resetDataset()
    RpcFunctionSuccess(None)
  })
}
