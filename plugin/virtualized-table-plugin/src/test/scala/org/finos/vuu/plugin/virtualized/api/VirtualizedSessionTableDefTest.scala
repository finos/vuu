package org.finos.vuu.plugin.virtualized.api

import org.finos.vuu.plugin.virtualized.VirtualizedTablePluginType
import org.finos.vuu.plugin.virtualized.table.range.NoRangeOptions
import org.scalamock.scalatest.MockFactory
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class VirtualizedSessionTableDefTest extends AnyFeatureSpec
  with Matchers
  with GivenWhenThen
  with MockFactory {

  Feature("Virtualized Session Table Definitions") {

    Scenario("Creating a SimpleVirtualizedSessionTableDef") {
      Given("a table name, a key field, and a mock virtualized column")
      val tableName = "orders"
      val keyField = "orderId"
      val mockColumn = mock[VirtualizedSessionTableColumn]
      val columns = Array(mockColumn)

      When("a SimpleVirtualizedSessionTableDef is instantiated")
      val simpleDef = SimpleVirtualizedSessionTableDef(tableName, keyField, columns)

      Then("it should correctly map the remote table name and key field to the local values")
      simpleDef.getRemoteTableName shouldBe tableName
      simpleDef.getRemoteKeyField shouldBe keyField

      And("it should return the correct plugin type and remote columns")
      simpleDef.pluginType shouldBe VirtualizedTablePluginType
      simpleDef.getRemoteColumns shouldBe columns

      And("the inherited base fields should also match")
      simpleDef.name shouldBe tableName
      simpleDef.keyField shouldBe keyField

      And("it should have no default columns by default")
      simpleDef.includeDefaultColumns shouldBe false

      And("it should have no range options by default")
      simpleDef.rangeOptions shouldBe NoRangeOptions
    }

    Scenario("Creating an AliasedVirtualizedSessionTableDef") {
      Given("local and remote table configurations alongside a mock virtualized column")
      val localName = "local_orders"
      val localKeyField = "local_id"
      val remoteName = "remote_orders"
      val remoteKeyField = "remote_id"
      val mockColumn = mock[VirtualizedSessionTableColumn]
      val columns = Array(mockColumn)

      When("an AliasedVirtualizedSessionTableDef is instantiated")
      val aliasedDef = AliasedVirtualizedSessionTableDef(
        remoteName = remoteName,
        tableName = localName,
        remoteKeyField = remoteKeyField,
        tableKeyField = localKeyField,
        remoteColumns = columns
      )

      Then("it should override getRemoteTableName and getRemoteKeyField with the remote values")
      aliasedDef.getRemoteTableName shouldBe remoteName
      aliasedDef.getRemoteKeyField shouldBe remoteKeyField

      And("the inherited base fields should correctly reflect the local values")
      aliasedDef.name shouldBe localName
      aliasedDef.keyField shouldBe localKeyField

      And("it should return the correct plugin type and remote columns")
      aliasedDef.pluginType shouldBe VirtualizedTablePluginType
      aliasedDef.getRemoteColumns shouldBe columns

      And("it should have no default columns by default")
      aliasedDef.includeDefaultColumns shouldBe false

      And("it should have no range options by default")
      aliasedDef.rangeOptions shouldBe NoRangeOptions
    }


  }
}