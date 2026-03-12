package org.finos.vuu.core.sort

import org.finos.vuu.core.sort.FilterAndSortFixture.setupTable
import org.finos.vuu.core.table.ViewPortColumnCreator
import org.finos.vuu.net.{SortDef, SortSpec}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class SortSpecParserTest extends AnyFeatureSpec with Matchers {

  Feature("Test sort spec parsing") {

    val table = setupTable()
    val viewPortColumns = ViewPortColumnCreator.create(table, table.columns().map(_.name).toList)

    Scenario("Null specs") {
      val sort = SortSpecParser.parse(null, viewPortColumns)

      sort.isInstanceOf[NoSort.type] shouldBe true
    }

    Scenario("Empty specs") {
      val spec = SortSpec(List.empty)

      val sort = SortSpecParser.parse(spec, viewPortColumns)

      sort.isInstanceOf[NoSort.type] shouldBe true
    }

    Scenario("Spec with only invalid column") {
      val spec = SortSpec(List(SortDef("cookies!", SortDirection.Descending.external)))

      val sort = SortSpecParser.parse(spec, viewPortColumns)

      sort.isInstanceOf[NoSort.type] shouldBe true
    }

    Scenario("Spec with only invalid direction") {
      val validColumn = table.columns().head
      val spec = SortSpec(List(SortDef(validColumn.name, 'Z')))

      val sort = SortSpecParser.parse(spec, viewPortColumns)

      sort.isInstanceOf[NoSort.type] shouldBe true
    }

    Scenario("Spec with a mix of valid and invalid columns and directions") {
      val validColumn = table.columns().head

      val spec = SortSpec(
        List(
          SortDef("cookies!", SortDirection.Descending.external),
          SortDef(validColumn.name, 'Z'),
          SortDef(validColumn.name, SortDirection.Ascending.external),
        )
      )

      val sort = SortSpecParser.parse(spec, viewPortColumns)
      sort.isInstanceOf[GenericSort2] shouldBe true

      val sortImpl = sort.asInstanceOf[GenericSort2]
      val comparator = sortImpl.rowDataComparator

      comparator.isInstanceOf[SingleColumnRowDataComparatorImpl] shouldBe true
    }

  }

}
