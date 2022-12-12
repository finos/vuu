package org.finos.vuu.core.table.column

import org.finos.vuu.core.table.RowWithData

object CalculatedColumnFixture {

  def sampleRows(): List[RowWithData] = {
    val rows = List(
      RowWithData("NYC-0004", Map("tradeTime" -> 5l, "quantity" -> null, "ric" -> "AAPL.L", "orderId" -> "NYC-0004", "onMkt" -> false, "trader" -> "chris", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 101.50, "vwapPerf" -> -0.1234)),
      RowWithData("LDN-0001", Map("tradeTime" -> 2l, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "LDN-0001", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 101.50, "vwapPerf" -> 1.1234)),
      RowWithData("LDN-0002", Map("tradeTime" -> 1l, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0002", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 101.01, "vwapPerf" -> 1.1234)),
      RowWithData("LDN-0003", Map("tradeTime" -> 3l, "quantity" -> null, "ric" -> "VOD.L", "orderId" -> "LDN-0003", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 101.30, "vwapPerf" -> 1.1234)),
      RowWithData("LDN-0008", Map("tradeTime" -> 5l, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0008", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 106.00, "vwapPerf" -> 1.1234)),
      RowWithData("NYC-0002", Map("tradeTime" -> 6l, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "NYC-0002", "onMkt" -> false, "trader" -> "steve", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 102.00, "vwapPerf" -> 1.1234)),
      RowWithData("NYC-0010", Map("tradeTime" -> 6l, "quantity" -> null, "ric" -> "VOD.L", "orderId" -> "NYC-0010", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 110.00, "vwapPerf" -> 1.1234)),
      RowWithData("NYC-0011", Map("tradeTime" -> 6l, "quantity" -> null, "ric" -> "VOD/L", "orderId" -> "NYC-0011", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 109.00, "vwapPerf" -> 1.1234)),
      RowWithData("NYC-0012", Map("tradeTime" -> 6l, "quantity" -> null, "ric" -> "VOD\\L", "orderId" -> "NYC-0012", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 105.11, "vwapPerf" -> 1.1234)),
      RowWithData("NYC-0013", Map("tradeTime" -> 6l, "quantity" -> null, "ric" -> "VOD\\L", "orderId" -> "NYC-0013", "onMkt" -> true, "trader" -> "rahúl", "ccyCross" -> "$GBPUSD", "bid" -> 99.00, "ask" -> 122.00, "vwapPerf" -> 1.1234))
    )
    rows
  }

}
