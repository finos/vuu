package org.finos.vuu.provider.join

import org.finos.vuu.api.{JoinSpec, JoinTableDef, JoinTo, LeftOuterJoin, TableDef, VisualLinks}
import org.finos.vuu.core.table.Columns
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.util.HashMap as JHashMap

class JoinRelationsTest extends AnyFeatureSpec with Matchers with GivenWhenThen {

  Feature("Managing Join Relations") {

    val ordersDef = TableDef(
      name = "orders",
      keyField = "orderId",
      columns = Columns.fromNames("orderId:String", "trader:String", "ric:String", "tradeTime:Long", "quantity:Double"),
      joinFields = "ric", "orderId")

    val pricesDef = TableDef(
      name = "prices",
      keyField = "ric",
      columns = Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double"),
      joinFields = "ric")

    val joinDef = JoinTableDef(
      name = "orderPrices",
      baseTable = ordersDef,
      joinColumns = Columns.allFrom(ordersDef) ++ Columns.allFromExceptDefaultAnd(pricesDef, "ric"),
      joins =
        JoinTo(
          table = pricesDef,
          joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
        ),
      links = VisualLinks(),
      joinFields = Seq()
    )

    Scenario("Adding a new row join with valid data") {
      Given("a JoinRelations instance and a defined table structure")
      val joinRelations = new JoinRelations()
      val eventData = new JHashMap[String, Any]()
      eventData.put("ric", "VOD.L")
      val leftKey = "1"

      When("addRowJoins is called with valid event data")
      joinRelations.addRowJoins(joinDef, eventData, leftKey)

      Then("the join relation should be retrievable")
      val result = joinRelations.getJoinsForEvent(ordersDef.name, leftKey)
      result shouldNot be (null)

      And("it should contain the correct information")
      result.tableName shouldBe ordersDef.name
      result.leftKey shouldEqual leftKey
      result.toMap shouldEqual Map("orders._isDeleted" -> false, "orders.orderId" -> leftKey, "orders.ric" -> "VOD.L")
    }

    Scenario("Updating up old mappings when a foreign key value becomes null") {
      Given("an existing join relation")
      val joinRelations = new JoinRelations()
      val eventData = new JHashMap[String, Any]()
      eventData.put("ric", "VOD.L")
      val leftKey = "1"
      joinRelations.addRowJoins(joinDef, eventData, leftKey)

      When("the join column value is updated to null in the event")
      val updateData = new JHashMap[String, Any]()
      updateData.put("ric", null) // Represents a removal
      joinRelations.addRowJoins(joinDef, updateData, leftKey)

      Then("the internal RowJoin should reflect the deletion")
      val result = joinRelations.getJoinsForEvent(ordersDef.name, leftKey)
      result shouldNot be (null)

      And("it should contain the correct information")
      result.tableName shouldBe ordersDef.name
      result.leftKey shouldEqual leftKey
      result.toMap shouldEqual Map("orders._isDeleted" -> false, "orders.orderId" -> leftKey)
    }

    Scenario("Updating up old mappings when a foreign key value becomes another non null value") {
      Given("an existing join relation")
      val joinRelations = new JoinRelations()
      val eventData = new JHashMap[String, Any]()
      eventData.put("ric", "VOD.L")
      val leftKey = "1"
      joinRelations.addRowJoins(joinDef, eventData, leftKey)

      When("the join column value is updated to null in the event")
      val updateData = new JHashMap[String, Any]()
      updateData.put("ric", "BAES.L") // Represents an update
      joinRelations.addRowJoins(joinDef, updateData, leftKey)

      Then("the internal RowJoin should reflect the deletion")
      val result = joinRelations.getJoinsForEvent(ordersDef.name, leftKey)
      result shouldNot be(null)

      And("it should contain the correct information")
      result.tableName shouldBe ordersDef.name
      result.leftKey shouldEqual leftKey
      result.toMap shouldEqual Map("orders._isDeleted" -> false, "orders.orderId" -> leftKey, "orders.ric" -> "BAES.L")
    }

    Scenario("Deleting row joins") {
      Given("an existing join relation")
      val joinRelations = new JoinRelations()
      val eventData = new JHashMap[String, Any]()
      eventData.put("ric", "VOD.L")
      val leftKey = "1"
      joinRelations.addRowJoins(joinDef, eventData, leftKey)

      When("deleteRowJoins is triggered")
      joinRelations.deleteRowJoins(joinDef, leftKey)

      Then("the internal RowJoin should reflect the deletion")
      val result = joinRelations.getJoinsForEvent(ordersDef.name, leftKey)
      result shouldEqual null
    }
  }

}