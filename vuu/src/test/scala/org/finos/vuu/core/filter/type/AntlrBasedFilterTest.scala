package org.finos.vuu.core.filter.`type`

import org.finos.vuu.core.filter.{AndClause, EqualsClause, GreaterThanClause, InClause, LessThanClause}
import org.finos.vuu.core.sort.FilterAndSortFixture.{setupTable, setupTable2}
import org.finos.vuu.viewport.ViewPortColumns
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class AntlrBasedFilterTest extends AnyFeatureSpec with Matchers {

  Feature("Equals") {

    Scenario("Equals filter with no index and not first in chain") {

      val table = setupTable()

      val antlrFilter = AntlrBasedFilter(AndClause(List(EqualsClause("ric", "AAPL.L"), EqualsClause("onMkt", "false"))))

      val results = antlrFilter.doFilter(table, table.primaryKeys, ViewPortColumns(table.columns().toList), false)

      results.length shouldEqual 1
      results.head shouldEqual "NYC-0004"
    }

    Scenario("Equals filter with no index and first in chain") {

      val table = setupTable()

      val antlrFilter = AntlrBasedFilter(AndClause(List(EqualsClause("ric", "AAPL.L"), EqualsClause("onMkt", "false"))))

      val results = antlrFilter.doFilter(table, table.primaryKeys, ViewPortColumns(table.columns().toList), true)

      results.length shouldEqual 1
      results.head shouldEqual "NYC-0004"
    }

    Scenario("Equals filter with index and not first in chain") {

      val table = setupTable2()

      val antlrFilter = AntlrBasedFilter(AndClause(List(EqualsClause("ric", "AAPL.L"), EqualsClause("onMkt", "false"))))

      val results = antlrFilter.doFilter(table, table.primaryKeys, ViewPortColumns(table.columns().toList), false)

      results.length shouldEqual 1
      results.head shouldEqual "NYC-0004"
    }

    Scenario("Equals filter with index and first in chain") {

      val table = setupTable2()

      val antlrFilter = AntlrBasedFilter(AndClause(List(EqualsClause("ric", "AAPL.L"), EqualsClause("onMkt", "false"))))

      val results = antlrFilter.doFilter(table, table.primaryKeys, ViewPortColumns(table.columns().toList), true)

      results.length shouldEqual 1
      results.head shouldEqual "NYC-0004"
    }

  }

  Feature("In") {

    Scenario("In filter with no index and not first in chain") {

      val table = setupTable()

      val antlrFilter = AntlrBasedFilter(AndClause(List(InClause("ric", List("AAPL.L")), InClause("onMkt", List("false")))))

      val results = antlrFilter.doFilter(table, table.primaryKeys, ViewPortColumns(table.columns().toList), false)

      results.length shouldEqual 1
      results.head shouldEqual "NYC-0004"
    }

    Scenario("In filter with no index and first in chain") {

      val table = setupTable()

      val antlrFilter = AntlrBasedFilter(AndClause(List(InClause("ric", List("AAPL.L")), InClause("onMkt", List("false")))))

      val results = antlrFilter.doFilter(table, table.primaryKeys, ViewPortColumns(table.columns().toList), true)

      results.length shouldEqual 1
      results.head shouldEqual "NYC-0004"
    }

    Scenario("In filter with index and not first in chain") {

      val table = setupTable2()

      val antlrFilter = AntlrBasedFilter(AndClause(List(InClause("ric", List("AAPL.L")), InClause("onMkt", List("false")))))

      val results = antlrFilter.doFilter(table, table.primaryKeys, ViewPortColumns(table.columns().toList), false)

      results.length shouldEqual 1
      results.head shouldEqual "NYC-0004"
    }

    Scenario("In filter with index and first in chain") {

      val table = setupTable2()

      val antlrFilter = AntlrBasedFilter(AndClause(List(InClause("ric", List("AAPL.L")), InClause("onMkt", List("false")))))

      val results = antlrFilter.doFilter(table, table.primaryKeys, ViewPortColumns(table.columns().toList), true)

      results.length shouldEqual 1
      results.head shouldEqual "NYC-0004"
    }




  }

  Feature("Greater and less than") {

    Scenario("Greater and less than filter with no index and not first in chain") {

      val table = setupTable()

      val antlrFilter = AntlrBasedFilter(AndClause(List(GreaterThanClause("tradeTime", 3d), LessThanClause("tradeTime", 6d))))

      val results = antlrFilter.doFilter(table, table.primaryKeys, ViewPortColumns(table.columns().toList), false)

      results.length shouldEqual 2
      results.toList shouldEqual List("NYC-0004","LDN-0008")
    }

    Scenario("Greater and less than filter with no index and first in chain") {

      val table = setupTable()

      val antlrFilter = AntlrBasedFilter(AndClause(List(GreaterThanClause("tradeTime", 3d), LessThanClause("tradeTime", 6d))))

      val results = antlrFilter.doFilter(table, table.primaryKeys, ViewPortColumns(table.columns().toList), true)

      results.length shouldEqual 2
      results.toList shouldEqual List("NYC-0004", "LDN-0008")
    }

    Scenario("Greater and less than filter with index and not first in chain") {

      val table = setupTable2()

      val antlrFilter = AntlrBasedFilter(AndClause(List(GreaterThanClause("tradeTime", 3d), LessThanClause("tradeTime", 6d))))

      val results = antlrFilter.doFilter(table, table.primaryKeys, ViewPortColumns(table.columns().toList), false)

      results.length shouldEqual 2
      results.toList shouldEqual List("NYC-0004", "LDN-0008")
    }

    Scenario("Greater and less than filter with index and first in chain") {

      val table = setupTable2()

      val antlrFilter = AntlrBasedFilter(AndClause(List(GreaterThanClause("tradeTime", 3d), LessThanClause("tradeTime", 6d))))

      val results = antlrFilter.doFilter(table, table.primaryKeys, ViewPortColumns(table.columns().toList), true)

      results.length shouldEqual 2
      results.toList shouldEqual List("NYC-0004", "LDN-0008")
    }

  }

}
