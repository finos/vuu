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
            customColumns = Columns.fromNames(
              "ric".string(),
              "description".string(),
              "currency".string(),
              "exchange".string(),
              "lotSize".double()
            ),
            options = TableDefOptions(
              joinFields = List("ric")
            )
          ),
          (table, vs) => new TestProvider(a, table)
        )
        .addTable(
          TableDef(
            name = "prices",
            keyField = "ric",
            customColumns = Columns.fromNames("ric".string(),
              "bid".double(),
              "ask".double(),
              "last".double(),
              "open".double(),
              "close".double(),
              "scenario".string()
            ),
            options = TableDefOptions(
              joinFields = List("ric"),
              autoSubscribe = true
            )
          ),
          (table, vs) => new TestProvider(a, table)
        )
        .addJoinTable( tableDefs =>
          JoinTableDef(
            name = "instrumentPrices",
            joinOptions = JoinTableDefOptions(),
            baseTable = tableDefs.get("TEST", "instruments"),
            joinColumns = Columns.allFrom(tableDefs.get("TEST", "instruments")) 
              ++ Columns.allFromExceptDefaultAnd(tableDefs.get("TEST", "prices"), "ric"),
            joins =
              JoinTo(
                table = tableDefs.get("TEST", "prices"),
                joinSpec = JoinSpec(left = "ric",
                  right = "ric",
                  LeftOuterJoin)
              )
          ))
        .asModule()
    }

}
