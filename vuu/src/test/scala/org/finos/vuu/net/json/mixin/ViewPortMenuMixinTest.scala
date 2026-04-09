package org.finos.vuu.net.json.mixin

import org.finos.vuu.net.json.mixin.ViewPortMenuMixin
import org.finos.vuu.viewport.{CellViewPortMenuItem, EmptyViewPortMenu, NoAction, RowViewPortMenuItem, SelectionViewPortMenuItem, TableViewPortMenuItem, ViewPortMenu, ViewPortMenuFolder, ViewPortRpcSuccess}
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.scala.DefaultScalaModule

class ViewPortMenuMixinTest extends AnyFeatureSpec with Matchers with GivenWhenThen {

  Feature("Check we can serialize and deserialize viewport menus"){

    val mapper = JsonMapper.builder()
      .addModule(DefaultScalaModule())
      .addMixIn(classOf[ViewPortMenu], classOf[ViewPortMenuMixin])
      .build()

    Scenario("SelectionViewPortMenuItem"){

      val menuItem = SelectionViewPortMenuItem("Duplicate Row(s)", "", (_,_) => ViewPortRpcSuccess, "DUPLICATE")

      val menuAsJson = mapper.writeValueAsString(menuItem)

      menuAsJson shouldEqual "{\"name\":\"Duplicate Row(s)\",\"filter\":\"\",\"rpcName\":\"DUPLICATE\",\"context\":\"selected-rows\"}"

      val result = mapper.readValue(menuAsJson, classOf[ViewPortMenu])
      result.isInstanceOf[SelectionViewPortMenuItem] shouldBe true

      val roundTripMenu = result.asInstanceOf[SelectionViewPortMenuItem]
      roundTripMenu.name shouldEqual menuItem.name
      roundTripMenu.filter shouldEqual menuItem.filter
      roundTripMenu.rpcName shouldEqual menuItem.rpcName
      roundTripMenu.func.apply(null, null) shouldEqual NoAction
    }

    Scenario("CellViewPortMenuItem") {

      val menuItem = CellViewPortMenuItem("Edit Cell", "", (_,_,_,_) => ViewPortRpcSuccess, "EDIT_CELL")

      val menuAsJson = mapper.writeValueAsString(menuItem)

      menuAsJson shouldEqual "{\"name\":\"Edit Cell\",\"filter\":\"\",\"rpcName\":\"EDIT_CELL\",\"context\":\"cell\",\"field\":\"*\"}"

      val result = mapper.readValue(menuAsJson, classOf[ViewPortMenu])
      result.isInstanceOf[CellViewPortMenuItem] shouldBe true

      val roundTripMenu = result.asInstanceOf[CellViewPortMenuItem]
      roundTripMenu.name shouldEqual menuItem.name
      roundTripMenu.filter shouldEqual menuItem.filter
      roundTripMenu.rpcName shouldEqual menuItem.rpcName
      roundTripMenu.func.apply(null, null, null, null) shouldEqual NoAction
    }

    Scenario("TableViewPortMenuItem") {

      val menuItem = TableViewPortMenuItem("Delete All Contents", "", _ => ViewPortRpcSuccess, "DELETE_ALL")

      val menuAsJson = mapper.writeValueAsString(menuItem)

      menuAsJson shouldEqual "{\"name\":\"Delete All Contents\",\"filter\":\"\",\"rpcName\":\"DELETE_ALL\",\"context\":\"grid\"}"

      val result = mapper.readValue(menuAsJson, classOf[ViewPortMenu])
      result.isInstanceOf[TableViewPortMenuItem] shouldBe true

      val roundTripMenu = result.asInstanceOf[TableViewPortMenuItem]
      roundTripMenu.name shouldEqual menuItem.name
      roundTripMenu.filter shouldEqual menuItem.filter
      roundTripMenu.rpcName shouldEqual menuItem.rpcName
      roundTripMenu.func.apply(null) shouldEqual NoAction
    }

    Scenario("RowViewPortMenuItem") {

      val menuItem = RowViewPortMenuItem("Edit Row", "", (_,_,_) => ViewPortRpcSuccess, "EDIT_ROW")

      val menuAsJson = mapper.writeValueAsString(menuItem)

      menuAsJson shouldEqual "{\"name\":\"Edit Row\",\"filter\":\"\",\"rpcName\":\"EDIT_ROW\",\"context\":\"row\"}"

      val result = mapper.readValue(menuAsJson, classOf[ViewPortMenu])
      result.isInstanceOf[RowViewPortMenuItem] shouldBe true

      val roundTripMenu = result.asInstanceOf[RowViewPortMenuItem]
      roundTripMenu.name shouldEqual menuItem.name
      roundTripMenu.filter shouldEqual menuItem.filter
      roundTripMenu.rpcName shouldEqual menuItem.rpcName
      roundTripMenu.func.apply(null, null, null) shouldEqual NoAction
    }

    Scenario("EmptyViewPortMenu") {

      val menuItem = EmptyViewPortMenu

      val menuAsJson = mapper.writeValueAsString(menuItem)

      menuAsJson shouldEqual "{\"name\":\"\"}"

      val result = mapper.readValue(menuAsJson, classOf[ViewPortMenu])
      result shouldBe EmptyViewPortMenu
    }

    Scenario("ViewPortMenuFolder") {

      val menuItem1 = EmptyViewPortMenu
      val menuItem2 = SelectionViewPortMenuItem("Duplicate Row(s)", "", (_,_) => ViewPortRpcSuccess, "DUPLICATE")
      val menuItem = ViewPortMenu.apply(menuItem1, menuItem2)

      val menuAsJson = mapper.writeValueAsString(menuItem)

      menuAsJson shouldEqual "{\"name\":\"ROOT\",\"menus\":[{\"name\":\"\"},{\"name\":\"Duplicate Row(s)\",\"filter\":\"\",\"rpcName\":\"DUPLICATE\",\"context\":\"selected-rows\"}]}"

      val result = mapper.readValue(menuAsJson, classOf[ViewPortMenu])
      result.isInstanceOf[ViewPortMenuFolder] shouldBe true

      val roundTripMenu = result.asInstanceOf[ViewPortMenuFolder]
      roundTripMenu.name shouldEqual menuItem.name

      roundTripMenu.menus.head shouldBe EmptyViewPortMenu
      roundTripMenu.menus(1).isInstanceOf[SelectionViewPortMenuItem] shouldBe true

      val roundTripItem2 = roundTripMenu.menus(1).asInstanceOf[SelectionViewPortMenuItem]
      roundTripItem2.name shouldEqual menuItem2.name
      roundTripItem2.filter shouldEqual menuItem2.filter
      roundTripItem2.rpcName shouldEqual menuItem2.rpcName
      roundTripItem2.func.apply(null, null) shouldEqual NoAction
    }

  }
}
