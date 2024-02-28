package org.finos.vuu.core.sort

import org.finos.vuu.core.table.{Column, RowData, RowWithData, SimpleColumn}
import org.scalatest.BeforeAndAfterEach
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.util.Comparator

class SortComparesTest extends AnyFeatureSpec with Matchers with BeforeAndAfterEach {

  override def beforeEach(): Unit = TestComparator.clear()

  Feature("compareString") {
    val rowData1 = RowWithData("id-2", Map("stringField" -> "XXX"))
    val rowData2 = RowWithData("id-3", Map("stringField" -> "YYY"))
    val rowData3 = RowWithData("id-1", Map("stringField" -> "ZZZ"))

    val ascending = List(rowData1, rowData2, rowData3)
    val unordered = List(rowData1, rowData3, rowData2)
    val col = column("stringField")

    Scenario("can support `A` sort direction") {
      TestComparator.register((o1, o2) => SortCompares.compareString(o1, o2, col, 'A'))

      unordered.sorted(TestComparator.compare) shouldEqual ascending
    }

    Scenario("can support `D` sort direction") {
      TestComparator.register((o1, o2) => SortCompares.compareString(o1, o2, col, 'D'))

      unordered.sorted(TestComparator.compare) shouldEqual ascending.reverse
    }
  }

  Feature("compareInt") {
    val rowData1 = RowWithData("id-2", Map("intField" -> -10))
    val rowData2 = RowWithData("id-3", Map("intField" -> 0))
    val rowData3 = RowWithData("id-1", Map("intField" -> 7))
    val rowData4 = RowWithData("id-4", Map("intField" -> 10))

    val ascending = List(rowData1, rowData2, rowData3, rowData4)
    val unordered = List(rowData1, rowData3, rowData4, rowData2)
    val col = column("intField")

    Scenario("can support `A` sort direction") {
      TestComparator.register((o1, o2) => SortCompares.compareInt(o1, o2, col, 'A'))

      unordered.sorted(TestComparator.compare) shouldEqual ascending
    }

    Scenario("can support `D` sort direction") {
      TestComparator.register((o1, o2) => SortCompares.compareInt(o1, o2, col, 'D'))

      unordered.sorted(TestComparator.compare) shouldEqual ascending.reverse
    }
  }

  Feature("compareLong") {
    val rowData1 = RowWithData("id-2", Map("longField" -> -10L))
    val rowData2 = RowWithData("id-3", Map("longField" -> 0L))
    val rowData3 = RowWithData("id-1", Map("longField" -> 7L))
    val rowData4 = RowWithData("id-4", Map("longField" -> 10L))

    val ascending = List(rowData1, rowData2, rowData3, rowData4)
    val unordered = List(rowData3, rowData1, rowData4, rowData2)
    val col = column("longField")

    Scenario("can support `A` sort direction") {
      TestComparator.register((o1, o2) => SortCompares.compareLong(o1, o2, col, 'A'))

      unordered.sorted(TestComparator.compare) shouldEqual ascending
    }

    Scenario("can support `D` sort direction") {
      TestComparator.register((o1, o2) => SortCompares.compareLong(o1, o2, col, 'D'))

      unordered.sorted(TestComparator.compare) shouldEqual ascending.reverse
    }
  }

  Feature("compareDouble") {
    val rowData1 = RowWithData("id-2", Map("doubleField" -> -10.9))
    val rowData2 = RowWithData("id-3", Map("doubleField" -> 0.0))
    val rowData3 = RowWithData("id-1", Map("doubleField" -> 5.7))
    val rowData4 = RowWithData("id-4", Map("doubleField" -> 5.71))

    val ascending = List(rowData1, rowData2, rowData3, rowData4)
    val unordered = List(rowData1, rowData3, rowData4, rowData2)
    val col = column("doubleField")

    Scenario("can support `A` sort direction") {
      TestComparator.register((o1, o2) => SortCompares.compareDouble(o1, o2, col, 'A'))

      unordered.sorted(TestComparator.compare) shouldEqual ascending
    }

    Scenario("can support `D` sort direction") {
      TestComparator.register((o1, o2) => SortCompares.compareDouble(o1, o2, col, 'D'))

      unordered.sorted(TestComparator.compare) shouldEqual ascending.reverse
    }
  }

  Feature("compareChar") {
    val rowData1 = RowWithData("id-2", Map("charField" -> '5'))
    val rowData2 = RowWithData("id-3", Map("charField" -> 'A'))
    val rowData3 = RowWithData("id-1", Map("charField" -> 'Z'))
    val rowData4 = RowWithData("id-4", Map("charField" -> 'a'))

    val ascending = List(rowData1, rowData2, rowData3, rowData4)
    val unordered = List(rowData4, rowData1, rowData3, rowData2)
    val col = column("charField")

    Scenario("can support `A` sort direction") {
      TestComparator.register((o1, o2) => SortCompares.compareChar(o1, o2, col, 'A'))

      unordered.sorted(TestComparator.compare) shouldEqual ascending
    }

    Scenario("can support `D` sort direction") {
      TestComparator.register((o1, o2) => SortCompares.compareChar(o1, o2, col, 'D'))

      unordered.sorted(TestComparator.compare) shouldEqual ascending.reverse
    }
  }

  private def column(name: String): Column = SimpleColumn(name, -1, classOf[Any])

  private object TestComparator extends Comparator[RowData] {
    private type RowComparator = (RowData, RowData) => Int
    private val dummyTestComparator: RowComparator =  (_, _) => 0
    private var testComparator: RowComparator = dummyTestComparator

    override def compare(o1: RowData, o2: RowData): Int = testComparator(o1, o2)

    def register(testComparator: RowComparator): Unit = {
      this.testComparator = testComparator
    }

    def clear(): Unit = {
      this.testComparator = dummyTestComparator
    }
  }
}
