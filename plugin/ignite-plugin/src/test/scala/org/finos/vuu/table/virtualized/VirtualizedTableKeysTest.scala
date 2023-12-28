package org.finos.vuu.table.virtualized

import org.finos.toolbox.collection.window.ArrayBackedMovingWindow
import org.finos.vuu.core.table.RowData
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class VirtualizedTableKeysTest extends AnyFeatureSpec with Matchers with GivenWhenThen{

  Feature("virtualized view port keys") {

    Scenario("test creating and populating virtualized viewport keys") {

      val keys = new VirtualizedTableKeys(10)

      When("We create a list of keys that we have loaded from our virtualized data source")
      keys.setDataInRange(100, 0, 10, Array("A", "B", "C", "D", "E", "F", "G", "H", "I", "J"))

      Then("we check if the length is correct")
      keys.length should equal(100)

      And("verify the keys we can load in range")
      keys.getAtIndex(0) should equal(Some("A"))
      keys.getAtIndex(9) should equal(Some("J"))
      keys.getAtIndex(10) should equal(None)
      keys.getAtIndex(99) should equal(None)

    }
  }

}
