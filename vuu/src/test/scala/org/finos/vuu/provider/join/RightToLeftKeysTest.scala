package org.finos.vuu.provider.join

import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class RightToLeftKeysTest extends AnyFeatureSpec with Matchers with GivenWhenThen {

  Feature("Managing mappings between Right Tables and Left Tables") {

    val leftTableName = "orders"
    val rightTableName = "prices"

    Scenario("Adding a new key mapping") {
      Given("an empty RightToLeftKeys store")
      val store = new RightToLeftKeys()
      val ric = "VOD.L"
      val orderId = "1"

      When("a new right key is added")
      store.addRightKey(rightTableName, ric, leftTableName, orderId, existingRightKey = null)

      Then("the left table keys should contain the new left key")
      val result = store.getLeftTableKeysForRightKey(rightTableName, ric, leftTableName)
      result.length shouldEqual 1
      result.contains(orderId) shouldBe true
    }

    Scenario("Updating an existing right key (Re-mapping)") {
      Given("a store with an existing mapping for ric")
      val store = new RightToLeftKeys()
      val ric = "VOD.L"
      val newRic = "BAES.L"
      val orderId = "1"

      store.addRightKey(rightTableName, ric, leftTableName, orderId, existingRightKey = null)

      When("the mapping is moved from ric to newRic")
      store.addRightKey(rightTableName, newRic, leftTableName, orderId, ric)

      Then("the ric mapping should be deleted")
      store.getLeftTableKeysForRightKey(rightTableName, ric, leftTableName).isEmpty shouldBe true

      And("the newRic should now map to the left key")
      store.getLeftTableKeysForRightKey(rightTableName, newRic, leftTableName).contains(orderId) shouldBe true
    }

    Scenario("Deleting a specific left key from a mapping") {
      Given("a right key associated with multiple left keys")
      val store = new RightToLeftKeys()
      val ric = "VOD.L"
      val orderId = "1"
      val orderId2 = "2"

      store.addRightKey(rightTableName, ric, leftTableName, orderId, existingRightKey = null)
      store.addRightKey(rightTableName, ric, leftTableName, orderId2, existingRightKey = null)

      When("one left key is deleted")
      store.deleteLeftKeyFromMapping(rightTableName, ric, leftTableName, orderId)

      Then("only the remaining left key should exist")
      val remaining = store.getLeftTableKeysForRightKey(rightTableName, ric, leftTableName)
      remaining.contains(orderId2) shouldBe true
      remaining.contains(orderId) shouldBe false
      remaining.length shouldBe 1
    }

    Scenario("Handling no-op updates when right key matches existing right key") {
      Given("a store with an existing mapping")
      val store = new RightToLeftKeys()
      val ric = "VOD.L"
      val orderId = "1"

      store.addRightKey(rightTableName, ric, leftTableName, orderId, existingRightKey = null)

      When("adding the same right key as the existing one")
      store.addRightKey(rightTableName, ric, leftTableName, orderId, ric)

      Then("the mapping should remain unchanged")
      val result = store.getLeftTableKeysForRightKey(rightTableName, ric, leftTableName)
      result.length shouldEqual 1
      result.contains(orderId) shouldBe true
    }
  }
}
