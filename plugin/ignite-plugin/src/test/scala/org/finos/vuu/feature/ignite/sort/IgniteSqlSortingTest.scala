package org.finos.vuu.feature.ignite.sort

import org.finos.vuu.core.sort.SortDirection
import org.finos.vuu.feature.ignite.TestInput.createTestOrderEntity
import org.finos.vuu.feature.ignite.{IgniteTestsBase, TestOrderEntity}

class IgniteSqlSortingTest extends IgniteTestsBase {

  val sortBuilder = new IgniteSqlSortBuilder()

  Feature("Ignite SQL sort by") {
    Scenario("supports STRING field DESCENDING") {
      givenOrderExistInIgnite(
        createTestOrderEntity(id = 1, ric = "C"),
        createTestOrderEntity(id = 2, ric = "A"),
        createTestOrderEntity(id = 3, ric = "B"),
      )

      val filterResult = applySort("ric", SortDirection.Descending)

      assertEquavalent(
        filterResult.toArray,
        Array(
          createTestOrderEntity(id = 1, ric = "C"),
          createTestOrderEntity(id = 3, ric = "B"),
          createTestOrderEntity(id = 2, ric = "A"),
        )
      )
    }

    Scenario("supports STRING field ASCENDING") {
      givenOrderExistInIgnite(
        createTestOrderEntity(id = 1, ric = "C"),
        createTestOrderEntity(id = 2, ric = "A"),
        createTestOrderEntity(id = 3, ric = "B"),
      )

      val filterResult = applySort("ric", SortDirection.Ascending)

      assertEquavalent(
        filterResult.toArray,
        Array(
          createTestOrderEntity(id = 2, ric = "A"),
          createTestOrderEntity(id = 3, ric = "B"),
          createTestOrderEntity(id = 1, ric = "C"),

        )
      )
    }

    Scenario("supports INT field") {
      givenOrderExistInIgnite(
        createTestOrderEntity(id = 1, ric = "HIGH", quantity = 30),
        createTestOrderEntity(id = 2, ric = "LOW", quantity = 10),
        createTestOrderEntity(id = 3, ric = "MEDIUM", quantity = 20),
      )

      val filterResult = applySort("quantity", SortDirection.Ascending)

      assertEquavalent(
        filterResult.toArray,
        Array(
          createTestOrderEntity(id = 2, ric = "LOW", quantity = 10),
          createTestOrderEntity(id = 3, ric = "MEDIUM", quantity = 20),
          createTestOrderEntity(id = 1, ric = "HIGH", quantity = 30),
        )
      )
    }

    Scenario("when multiple sort fields are specified first column takes precedence") {
      givenOrderExistInIgnite(
        createTestOrderEntity(id = 1, ric = "C-10", quantity = 10),
        createTestOrderEntity(id = 2, ric = "B-20", quantity = 20),
        createTestOrderEntity(id = 3, ric = "A-10", quantity = 10),

      )

      val filterResult = applySort(
        Map(
          ("quantity", SortDirection.Ascending),
          ("ric", SortDirection.Ascending),
        ))

      assertEquavalent(
        filterResult.toArray,
        Array(
          createTestOrderEntity(id = 3, ric = "A-10", quantity = 10),
          createTestOrderEntity(id = 1, ric = "C-10", quantity = 10),
          createTestOrderEntity(id = 2, ric = "B-20", quantity = 20),
        )
      )
    }

    Scenario("preserve original order when no sort specified") {
      givenOrderExistInIgnite(
        createTestOrderEntity(id = 1, ric = "A", quantity = 30),
        createTestOrderEntity(id = 2, ric = "B", quantity = 10),
        createTestOrderEntity(id = 3, ric = "C", quantity = 20),
      )

      val filterResult = applySort(Map())

      assertEquavalent(
        filterResult.toArray,
        Array(
          createTestOrderEntity(id = 1, ric = "A", quantity = 30),
          createTestOrderEntity(id = 2, ric = "B", quantity = 10),
          createTestOrderEntity(id = 3, ric = "C", quantity = 20),
        )
      )
    }
  }

  private def applySort(columnName: String, sortDirection: SortDirection.TYPE): Iterable[TestOrderEntity] = {
    applySort(Map((columnName, sortDirection)))
  }
  private def applySort(columnNameToDirection:Map[String, SortDirection.TYPE]): Iterable[TestOrderEntity] = {
    val sortQuery = sortBuilder.toSql(columnNameToDirection, x => mapToMatchingIgniteColumnName(x))
    igniteTestStore.getSortBy(sortQuery)
  }

  private def mapToMatchingIgniteColumnName(tableColumnName:String) = Some(tableColumnName)
}