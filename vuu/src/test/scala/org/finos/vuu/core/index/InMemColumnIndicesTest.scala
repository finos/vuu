package org.finos.vuu.core.index

import org.finos.vuu.api.{Index, Indices, TableDef}
import org.finos.vuu.core.table.datatype.EpochTimestamp
import org.finos.vuu.core.table.{Column, DataType, RowData, RowWithData, SimpleColumn}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class InMemColumnIndicesTest extends AnyFeatureSpec with Matchers {

  def createIndices(columnName: String, dataType: Class[_]): (Column, InMemColumnIndices) = {
    val column: Column = SimpleColumn(columnName, 0, dataType)
    val tableDef = new TableDef(
      name = "test" + columnName,
      keyField = columnName,
      customColumns = Array(column),
      indices = Indices.apply(Index.apply(columnName)),
      joinFields = List.empty
    )

    (column, InMemColumnIndices(tableDef))
  }

  def createRow(key: String, col: Column, value: Any): RowData = {
    RowWithData(key, Map(col.name -> value))
  }

  Feature("Edge cases") {

    Scenario("Test unindexed field") {
      val column: Column = SimpleColumn("empty", 0, DataType.StringDataType)
      val tableDef = new TableDef(
        name = "test" + column.name,
        keyField = column.name,
        customColumns = Array(column),
        indices = Indices.apply(),
        joinFields = List.empty
      )
      val indices = InMemColumnIndices.apply(tableDef)

      val rowKey = "row-1"
      val indexField = indices.indexForColumn(column).isEmpty shouldBe true

      // 1. Insert
      indices.insert(createRow(rowKey, column, "A"))

      // 2. Update to new value
      indices.update(createRow(rowKey, column, "A"), createRow(rowKey, column, "B"))

      // 3. Update to null
      indices.update(createRow(rowKey, column, "B"), createRow(rowKey, column, null))

      // 4. Update from null to value
      indices.update(createRow(rowKey, column, null), createRow(rowKey, column, "C"))

      // 5. Remove
      indices.remove(createRow(rowKey, column, "C"))
    }

    Scenario("Test invalid column data type") {
      val exception = intercept[UnsupportedOperationException] {
        createIndices("testCol", DataType.NoDataType)
      }
      exception.getMessage.contains("Unsupported type") shouldBe true
    }

    Scenario("Test invalid column name") {
      val column: Column = SimpleColumn("empty", 0, DataType.StringDataType)
      val tableDef = new TableDef(
        name = "test" + column.name,
        keyField = column.name,
        customColumns = Array(column),
        indices = Indices.apply(Index.apply("missing")),
        joinFields = List.empty
      )

      val exception = intercept[NullPointerException] {
        InMemColumnIndices(tableDef)
      }
    }

  }

  Feature("Test changes to Indexed fields") {

    Scenario("Correctly route data through IndexUpdaters for Strings") {
      val (column, indices) = createIndices("testCol", DataType.StringDataType)
      val rowKey = "row-1"
      val indexField = indices.indexForColumn(column).get.asInstanceOf[IndexedField[String]]

      // 1. Insert
      indices.insert(createRow(rowKey, column, "A"))
      val result = indexField.find("A")
      result.length shouldEqual 1
      result.apply(0) shouldEqual rowKey

      // 2. Update to new value
      indices.update(createRow(rowKey, column, "A"), createRow(rowKey, column, "B"))
      val result2 = indexField.find("A")
      result2.length shouldEqual 0
      val result3 = indexField.find("B")
      result3.length shouldEqual 1
      result3.apply(0) shouldEqual rowKey

      // 3. Update to null
      indices.update(createRow(rowKey, column, "B"), createRow(rowKey, column, null))
      val result4 = indexField.find("B")
      result4.length shouldEqual 0

      // 4. Update from null to value
      indices.update(createRow(rowKey, column, null), createRow(rowKey, column, "C"))
      val result5 = indexField.find("C")
      result5.length shouldEqual 1
      result5.apply(0) shouldEqual rowKey

      // 5. Remove
      indices.remove(createRow(rowKey, column, "C"))
      val result6 = indexField.find("C")
      result6.length shouldEqual 0
    }

    Scenario("Correctly route data through IndexUpdaters for Ints") {
      val (column, indices) = createIndices("testCol", DataType.IntegerDataType)
      val rowKey = "row-1"
      val indexField = indices.indexForColumn(column).get.asInstanceOf[IndexedField[Int]]

      // 1. Insert
      indices.insert(createRow(rowKey, column, 1))
      val result = indexField.find(1)
      result.length shouldEqual 1
      result.apply(0) shouldEqual rowKey

      // 2. Update to new value
      indices.update(createRow(rowKey, column, 1), createRow(rowKey, column, 2))
      val result2 = indexField.find(1)
      result2.length shouldEqual 0
      val result3 = indexField.find(2)
      result3.length shouldEqual 1
      result3.apply(0) shouldEqual rowKey

      // 3. Update to null
      indices.update(createRow(rowKey, column, 2), createRow(rowKey, column, null))
      val result4 = indexField.find(2)
      result4.length shouldEqual 0

      // 4. Update from null to value
      indices.update(createRow(rowKey, column, null), createRow(rowKey, column, 3))
      val result5 = indexField.find(3)
      result5.length shouldEqual 1
      result5.apply(0) shouldEqual rowKey

      // 5. Remove
      indices.remove(createRow(rowKey, column, 3))
      val result6 = indexField.find(3)
      result6.length shouldEqual 0
    }

    Scenario("Correctly route data through IndexUpdaters for Long") {
      val (column, indices) = createIndices("testCol", DataType.LongDataType)
      val rowKey = "row-1"
      val indexField = indices.indexForColumn(column).get.asInstanceOf[IndexedField[Long]]

      // 1. Insert
      indices.insert(createRow(rowKey, column, 1L))
      val result = indexField.find(1L)
      result.length shouldEqual 1
      result.apply(0) shouldEqual rowKey

      // 2. Update to new value
      indices.update(createRow(rowKey, column, 1L), createRow(rowKey, column, 2L))
      val result2 = indexField.find(1L)
      result2.length shouldEqual 0
      val result3 = indexField.find(2L)
      result3.length shouldEqual 1
      result3.apply(0) shouldEqual rowKey

      // 3. Update to null
      indices.update(createRow(rowKey, column, 2L), createRow(rowKey, column, null))
      val result4 = indexField.find(2L)
      result4.length shouldEqual 0

      // 4. Update from null to value
      indices.update(createRow(rowKey, column, null), createRow(rowKey, column, 3L))
      val result5 = indexField.find(3L)
      result5.length shouldEqual 1
      result5.apply(0) shouldEqual rowKey

      // 5. Remove
      indices.remove(createRow(rowKey, column, 3L))
      val result6 = indexField.find(3L)
      result6.length shouldEqual 0
    }

    Scenario("Correctly route data through IndexUpdaters for Double") {
      val (column, indices) = createIndices("testCol", DataType.DoubleDataType)
      val rowKey = "row-1"
      val indexField = indices.indexForColumn(column).get.asInstanceOf[IndexedField[Double]]

      // 1. Insert
      indices.insert(createRow(rowKey, column, 1.0))
      val result = indexField.find(1.0)
      result.length shouldEqual 1
      result.apply(0) shouldEqual rowKey

      // 2. Update to new value
      indices.update(createRow(rowKey, column, 1.0), createRow(rowKey, column, 2.0))
      val result2 = indexField.find(1.0)
      result2.length shouldEqual 0
      val result3 = indexField.find(2.0)
      result3.length shouldEqual 1
      result3.apply(0) shouldEqual rowKey

      // 3. Update to null
      indices.update(createRow(rowKey, column, 2.0), createRow(rowKey, column, null))
      val result4 = indexField.find(2.0)
      result4.length shouldEqual 0

      // 4. Update from null to value
      indices.update(createRow(rowKey, column, null), createRow(rowKey, column, 3.0))
      val result5 = indexField.find(3.0)
      result5.length shouldEqual 1
      result5.apply(0) shouldEqual rowKey

      // 5. Remove
      indices.remove(createRow(rowKey, column, 3.0))
      val result6 = indexField.find(3.0)
      result6.length shouldEqual 0
    }

    Scenario("Correctly route data through IndexUpdaters for Boolean") {
      val (column, indices) = createIndices("testCol", DataType.BooleanDataType)
      val rowKey = "row-1"
      val indexField = indices.indexForColumn(column).get.asInstanceOf[IndexedField[Boolean]]

      // 1. Insert
      indices.insert(createRow(rowKey, column, true))
      val result = indexField.find(true)
      result.length shouldEqual 1
      result.apply(0) shouldEqual rowKey

      // 2. Update to new value
      indices.update(createRow(rowKey, column, true), createRow(rowKey, column, false))
      val result2 = indexField.find(true)
      result2.length shouldEqual 0
      val result3 = indexField.find(false)
      result3.length shouldEqual 1
      result3.apply(0) shouldEqual rowKey

      // 3. Update to null
      indices.update(createRow(rowKey, column, false), createRow(rowKey, column, null))
      val result4 = indexField.find(false)
      result4.length shouldEqual 0

      // 4. Update from null to value
      indices.update(createRow(rowKey, column, null), createRow(rowKey, column, true))
      val result5 = indexField.find(true)
      result5.length shouldEqual 1
      result5.apply(0) shouldEqual rowKey

      // 5. Remove
      indices.remove(createRow(rowKey, column, true))
      val result6 = indexField.find(true)
      result6.length shouldEqual 0
    }

    Scenario("Correctly route data through IndexUpdaters for Chars") {
      val (column, indices) = createIndices("testCol", DataType.CharDataType)
      val rowKey = "row-1"
      val indexField = indices.indexForColumn(column).get.asInstanceOf[IndexedField[Char]]

      // 1. Insert
      indices.insert(createRow(rowKey, column, 'A'))
      val result = indexField.find('A')
      result.length shouldEqual 1
      result.apply(0) shouldEqual rowKey

      // 2. Update to new value
      indices.update(createRow(rowKey, column, 'A'), createRow(rowKey, column, 'B'))
      val result2 = indexField.find('A')
      result2.length shouldEqual 0
      val result3 = indexField.find('B')
      result3.length shouldEqual 1
      result3.apply(0) shouldEqual rowKey

      // 3. Update to null
      indices.update(createRow(rowKey, column, 'B'), createRow(rowKey, column, null))
      val result4 = indexField.find('B')
      result4.length shouldEqual 0

      // 4. Update from null to value
      indices.update(createRow(rowKey, column, null), createRow(rowKey, column, 'C'))
      val result5 = indexField.find('C')
      result5.length shouldEqual 1
      result5.apply(0) shouldEqual rowKey

      // 5. Remove
      indices.remove(createRow(rowKey, column, 'C'))
      val result6 = indexField.find('C')
      result6.length shouldEqual 0
    }

    Scenario("Correctly route data through IndexUpdaters for EpochTimestamp") {
      val (column, indices) = createIndices("testCol", DataType.EpochTimestampType)
      val rowKey = "row-1"
      val indexField = indices.indexForColumn(column).get.asInstanceOf[IndexedField[EpochTimestamp]]

      // 1. Insert
      indices.insert(createRow(rowKey, column, EpochTimestamp(1L)))
      val result = indexField.find(EpochTimestamp(1L))
      result.length shouldEqual 1
      result.apply(0) shouldEqual rowKey

      // 2. Update to new value
      indices.update(createRow(rowKey, column, EpochTimestamp(1L)), createRow(rowKey, column, EpochTimestamp(2L)))
      val result2 = indexField.find(EpochTimestamp(1L))
      result2.length shouldEqual 0
      val result3 = indexField.find(EpochTimestamp(2L))
      result3.length shouldEqual 1
      result3.apply(0) shouldEqual rowKey

      // 3. Update to null
      indices.update(createRow(rowKey, column, EpochTimestamp(2L)), createRow(rowKey, column, null))
      val result4 = indexField.find(EpochTimestamp(2L))
      result4.length shouldEqual 0

      // 4. Update from null to value
      indices.update(createRow(rowKey, column, null), createRow(rowKey, column, EpochTimestamp(3L)))
      val result5 = indexField.find(EpochTimestamp(3L))
      result5.length shouldEqual 1
      result5.apply(0) shouldEqual rowKey

      // 5. Remove
      indices.remove(createRow(rowKey, column, EpochTimestamp(3L)))
      val result6 = indexField.find(EpochTimestamp(3L))
      result6.length shouldEqual 0
    }

  }

}