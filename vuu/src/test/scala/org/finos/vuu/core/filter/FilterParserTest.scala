package org.finos.vuu.core.filter

import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class FilterParserTest extends AnyFeatureSpec with Matchers {

  Feature("IN filter") {
    Scenario("can parse multiple string values") {
      val filter = "ric in [\"RIC.HK\", \"RIC.LDN\"]"

      val parsedFilter = parseFilter(filter)

      getInnerClause(parsedFilter) shouldEqual InClause("ric", List("RIC.HK", "RIC.LDN"))
    }

    Scenario("can parse multiple numeric values") {
      val filter = "price in [-10, 10.5, 15]"

      val parsedFilter = parseFilter(filter)

      getInnerClause(parsedFilter) shouldEqual InClause("price", List("-10", "10.5", "15"))
    }
  }

  Feature("EQUALS filter"){
    Scenario("can parse string value") {
      val filter = "ric = \"RIC.HK\""

      val parsedFilter = parseFilter(filter)

      getInnerClause(parsedFilter) shouldEqual EqualsClause("ric", "RIC.HK")
    }

    Scenario("can parse string value \"null\"") {
      val filter = "ric = \"null\""

      val parsedFilter = parseFilter(filter)

      getInnerClause(parsedFilter) shouldEqual EqualsClause("ric", "null")
    }

    Scenario("can parse numeric value") {
      val filter = "price = 10.5"

      val parsedFilter = parseFilter(filter)

      getInnerClause(parsedFilter) shouldEqual EqualsClause("price", "10.5")
    }

    Scenario("can parse negative numeric value") {
      val filter = "price = -10.5"

      val parsedFilter = parseFilter(filter)

      getInnerClause(parsedFilter) shouldEqual EqualsClause("price", "-10.5")
    }

    Scenario("can parse boolean value") {
      val filter = "isActive = false"

      val parsedFilter = parseFilter(filter)

      getInnerClause(parsedFilter) shouldEqual EqualsClause("isActive", "false")
    }
  }

  Feature("NOT-EQUALS filter"){
    Scenario("can parse string value") {
      val filter = "ric != \"RIC.HK\""

      val parsedFilter = parseFilter(filter)

      getInnerClause(parsedFilter) shouldEqual NotClause(EqualsClause("ric", "RIC.HK"))
    }

    Scenario("can parse string value \"null\"") {
      val filter = "ric != \"null\""

      val parsedFilter = parseFilter(filter)

      getInnerClause(parsedFilter) shouldEqual NotClause(EqualsClause("ric", "null"))
    }

    Scenario("can parse numeric value") {
      val filter = "price != 10.5"

      val parsedFilter = parseFilter(filter)

      getInnerClause(parsedFilter) shouldEqual NotClause(EqualsClause("price", "10.5"))
    }

    Scenario("can parse boolean value") {
      val filter = "isActive != false"

      val parsedFilter = parseFilter(filter)

      getInnerClause(parsedFilter) shouldEqual NotClause(EqualsClause("isActive", "false"))
    }
  }

  private def parseFilter(s: String) = FilterSpecParser.parse(s)

  private def getInnerClause(clause: FilterClause): FilterClause = {
    clause.asInstanceOf[OrClause].subclauses.head.asInstanceOf[AndClause].subclauses.head
  }
}
