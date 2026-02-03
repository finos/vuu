package org.finos.vuu.core.table

import org.finos.vuu.api.{JoinSpec, JoinTableDef, JoinTo, LeftOuterJoin, TableDef, VisualLinks}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class JoinDataTableDataTest extends AnyFeatureSpec with Matchers {



  Feature("Test deletion of rows") {

    Scenario("Delete when row doesn't exist returns original") {
      val original = createData()

      val result = original.processDelete("Cake!")

      (result eq original) shouldBe true
    }

  }


  private def createData(): JoinDataTableData = {

    val ordersDef = TableDef(
      name = "orders",
      keyField = "orderId",
      columns = Columns.fromNames("orderId:String", "ric:String", "tradeTime:Long", "quantity:Double"),
      joinFields = "orderId", "ric")

    val instrumentDef = TableDef(
      name = "instruments",
      keyField = "ric",
      columns = Columns.fromNames("ric:String", "currency:String"),
      joinFields = "ric", "currency")

    val joinDef = JoinTableDef(
      name = "orderToInstrument",
      baseTable = ordersDef,
      joinColumns = Columns.allFrom(ordersDef) ++ Columns.allFromExceptDefaultAnd(instrumentDef, "ric"),
      joins =
        JoinTo(
          table = instrumentDef,
          joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
        ),
      links = VisualLinks(),
      joinFields = Seq("orderId")
    )
    
    JoinDataTableData.apply(joinDef)
    
  }

}
