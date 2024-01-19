package org.finos.vuu.feature.ignite.filter

import org.finos.vuu.core.filter.FilterSpecParser
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class IgniteFilterGrammarTest extends AnyFeatureSpec with Matchers {


  val filterTreeVisitor = new IgniteIndexFilterTreeVisitor

  Feature("Applying the parsed filters yields expected results") {
    Scenario("Equality comparison to STRING") {

      val filterString = "ric = \"AAPL.L\""

      val filterClause: IgniteIndexFilterClause = FilterSpecParser.parse[IgniteIndexFilterClause](filterString, filterTreeVisitor)
      val criteria = filterClause.toCriteria()

      criteria should have length 1
    }
  }

}