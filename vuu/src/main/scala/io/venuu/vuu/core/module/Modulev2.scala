package io.venuu.vuu.core.module

import io.venuu.vuu.api.{AutoSubscribeTableDef, JoinSpec, JoinTableDef, JoinTo, LeftOuterJoin, TableDef}
import io.venuu.vuu.core.table.{Columns, DataTable}
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

class TestRpcHandler extends RpcHandler{
}

class FieldDefString(str: String){
    def double() : String = {
      str + ":Double"
    }

  def long() : String = {
    str + ":Long"
  }

  def boolean() : String = {
    str + ":Boolean"
  }

  def char() : String = {
    str + ":Char"
  }


  def int() : String = {
    str + ":Int"
  }

  def string(): String = {
    str + ":String"
  }
}

abstract class Module {
  implicit def stringToFieldDef(s: String) = new FieldDefString(s)
}

object Modulev2 extends Module {

  def apply(a: String, x: Int): ViewServerModule ={

    ModuleFactory.withNamespace("SIMUL")
      .addTable(
          TableDef(
            name = "instruments",
            keyField = "ric",
            columns = Columns.fromNames("ric".string(),
                                        "description".string(),
                                        "currency".string(),
                                        "exchange".string(),
                                        "lotSize".double()
            ),
            joinFields = "ric"
            ),
          table => new TestProvider(a, table)
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
        table => new TestProvider(a, table)
      )
      .addJoinTable( tableDefs =>
          JoinTableDef(
                name = "instrumentPrices",
                baseTable = tableDefs.get("instruments"),
                joinColumns = Columns.allFrom(tableDefs.get("instruments")) ++
                              Columns.allFromExcept(tableDefs.get("prices"),
                               "ric"),
                joins =
                  JoinTo(
                    table = tableDefs.get("prices"),
                    joinSpec = JoinSpec(left = "ric",
                                        right = "ric",
                                        LeftOuterJoin)
                  ),
                joinFields = Seq()
              ))
      .addRpcHandler(new TestRpcHandler)
      .asModule()
  }
}
