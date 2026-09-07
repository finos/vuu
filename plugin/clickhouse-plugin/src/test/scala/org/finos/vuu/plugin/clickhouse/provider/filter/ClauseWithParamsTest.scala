package org.finos.vuu.plugin.clickhouse.provider.filter

import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class ClauseWithParamsTest extends AnyFeatureSpec with GivenWhenThen with Matchers {

  Feature("ClauseWithParams AND combination logic") {

    Scenario("Combining NoFilter with other clauses") {
      Given("a NoFilter instance and a standard clause")
      val noFilter = NoFilter
      val standard = ClauseWithParams("a = 1", Map("p1" -> "val1"))

      When("NoFilter.and(standard) is called")
      val result1 = noFilter.and(standard)

      Then("it should evaluate directly to the standard clause")
      result1 shouldBe standard

      When("standard.and(NoFilter) is called")
      val result2 = standard.and(noFilter)

      Then("it should return the original standard clause unmodified")
      result2 shouldBe standard
    }

    Scenario("Combining NoResults with other clauses") {
      Given("a NoResults instance and a standard clause")
      val noResults = NoResults
      val standard = ClauseWithParams("b = 2", Map("p2" -> 2))

      When("NoResults.and(standard) is called")
      val result1 = noResults.and(standard)

      Then("it should evaluate to NoResults")
      result1 shouldBe NoResults

      When("standard.and(NoResults) is called")
      val result2 = standard.and(noResults)

      Then("it should evaluate to NoResults")
      result2 shouldBe NoResults
    }

    Scenario("Combining two standard clauses with distinct parameters") {
      Given("two standard clauses with non-empty parameters")
      val clause1 = ClauseWithParams("x = 10", Map("p1" -> 10))
      val clause2 = ClauseWithParams("y = 20", Map("p2" -> 20))

      When("combining both clauses using and()")
      val result = clause1.and(clause2)

      Then("the clause string should wrap both expressions in parentheses joined by AND")
      result.clause shouldBe "(x = 10) AND (y = 20)"

      And("the parameter maps should be merged")
      result.params shouldBe Map("p1" -> 10, "p2" -> 20)
    }

    Scenario("Combining standard clauses when one or both parameter maps are empty") {
      Given("a clause with parameters and a clause with an empty parameter map")
      val clauseWithParams = ClauseWithParams("x = 10", Map("p1" -> 10))
      val clauseEmptyParams = ClauseWithParams("y IS NOT NULL", Map.empty)

      When("combining the clause with parameters with the empty-parameter clause")
      val result1 = clauseWithParams.and(clauseEmptyParams)

      Then("the non-empty parameter map should be preserved without re-allocating")
      result1.params shouldBe Map("p1" -> 10)

      When("combining the empty-parameter clause with the populated clause")
      val result2 = clauseEmptyParams.and(clauseWithParams)

      Then("the non-empty parameter map should still be preserved")
      result2.params shouldBe Map("p1" -> 10)
    }

  }
}