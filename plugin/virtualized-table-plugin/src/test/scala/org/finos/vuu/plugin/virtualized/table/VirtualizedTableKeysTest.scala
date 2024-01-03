package org.finos.vuu.plugin.virtualized.table

import org.finos.toolbox.collection.window.ArrayBackedMovingWindow
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class VirtualizedTableKeysTest extends AnyFeatureSpec with Matchers with GivenWhenThen{

  Feature("virtualized view port keys") {

    Scenario("test creating and populating virtualized viewport keys") {

      val data = Array("A", "B", "C", "D", "E", "F", "G", "H", "I", "J")

      When("We create a list of keys that we have loaded from our virtualized data source")

      val window = WindowedTableKeys(100)
      val keys = VirtualizedTableKeys(window, 100)

      data.zipWithIndex.foreach({case(key, index) =>  window.setAtIndex(index, key)})

      Then("we check if the length is correct")
      keys.length should equal(100)

      And("verify the keys we can load in range")
      keys.getAtIndex(0) should equal(Some("A"))
      keys.getAtIndex(9) should equal(Some("J"))
      keys.getAtIndex(10) should equal(None)
      keys.getAtIndex(99) should equal(None)

      val newKeys = keys.sliceTableKeys(7, 17)

      newKeys.length should equal(100)
      newKeys.get(9) should equal("J")
      newKeys.get(10) should be(null)

      val array = newKeys.iterator.toArray

      array.length should equal(10)
      array should equal(Array("H", "I", "J", null, null, null, null, null, null, null))
    }
  }

}
