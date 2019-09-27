/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.
  *
  * Created by chris on 2019-09-27.
  *
  */
package io.venuu.vuu.core.module

import io.venuu.vuu.api.{AutoSubscribeTableDef, JoinSpec, JoinTableDef, JoinTo, LeftOuterJoin, TableDef}
import io.venuu.vuu.core.table.{Columns, DataTable, TableContainer}
import io.venuu.vuu.net.rpc.RpcHandler
import io.venuu.vuu.provider.Provider

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

    def apply(a: String, x: Int): ViewServerModule ={
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
            baseTable = tableDefs.get("instruments"),
            joinColumns = Columns.allFrom(tableDefs.get("instruments")) ++
                          Columns.allFromExcept(tableDefs.get("prices"), "ric"),
            joins =
              JoinTo(
                table = tableDefs.get("prices"),
                joinSpec = JoinSpec(left = "ric",
                  right = "ric",
                  LeftOuterJoin)
              ),
            joinFields = Seq()
          ))
        .addRpcHandler( vs => new TestRpcHandler(vs.tableContainer))
        .asModule()
    }

}
