package org.finos.vuu.core.module

import org.finos.vuu.api.*
import org.finos.vuu.core.table.{Columns, DataTable, TableContainer}
import org.finos.vuu.net.rpc.RpcHandler
import org.finos.vuu.provider.Provider

class TestProvider(x: String, dataTable: DataTable) extends Provider{
  override def subscribe(key: String): Unit = ???
  override def doStart(): Unit = ???
  override def doStop(): Unit = ???
  override def doInitialize(): Unit = ???
  override def doDestroy(): Unit = ???
  override val lifecycleId: String = "foo"
}

class TestRpcHandler(val tableContainer: TableContainer) extends RpcHandler{
}

object TestModule2 extends DefaultModule {

    def apply(a: String, x: Int)(implicit tableDefContainer: TableDefContainer): ViewServerModule ={
      ModuleFactory.withNamespace("TEST")
        .addTable(
          TableDef(
            name = "instruments",
            keyField = "ric",
            columns = Columns.fromNames(
              "ric".string(),
              "description".string(),
              "currency".string(),
              "exchange".string(),
              "lotSize".double()
            ),
            joinFields = "ric"
          ),
          (table, vs) => new TestProvider(a, table)
        )
        .addTable(
          AutoSubscribeTableDef(
            name = "prices",
            keyField = "ric",
            columns = Columns.fromNames("ric".string(),
              "bid".double(),
              "ask".double(),
              "last".double(),
              "open".double(),
              "close".double(),
              "scenario".string()
            ),
            joinFields = "ric"
          ),
          (table, vs) => new TestProvider(a, table)
        )
        .addJoinTable( tableDefs =>
          JoinTableDef(
            name = "instrumentPrices",
            baseTable = tableDefs.get("TEST", "instruments"),
            joinColumns = Columns.allFrom(tableDefs.get("TEST", "instruments")) 
              ++ Columns.allFromExceptDefaultAnd(tableDefs.get("TEST", "prices"), "ric"),
            joins =
              JoinTo(
                table = tableDefs.get("TEST", "prices"),
                joinSpec = JoinSpec(left = "ric",
                  right = "ric",
                  LeftOuterJoin)
              ),
            links = VisualLinks(),
            joinFields = Seq()
          ))
        .asModule()
    }

}
