package org.finos.vuu.core.table

import org.finos.vuu.api.{ColumnBuilder, TableDef}
import org.finos.vuu.core.table.column.NullCalculatedColumnClause
import org.finos.vuu.util.types.TypeUtils
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.TableDrivenPropertyChecks._

class ColumnTest extends AnyFeatureSpec with Matchers {

  Feature("DataType.parseToDataType") {
    forAll(Table(
      ("data-type", "string-input", "expected-output"),
      (DataType.BooleanDataType, "false", false),
      (DataType.CharDataType, "8", '8'),
      (DataType.StringDataType, "name", "name"),
      (DataType.IntegerDataType, "27", 27),
      (DataType.LongDataType, "33", 33L),
      (DataType.DoubleDataType, "33.55", 33.55),
    ))((dataType, stringInput, expectedOutput) => {
      Scenario(s"can parse string '$stringInput' to `$dataType` type") {
        val parsedValue = DataType.parseToDataType(stringInput, dataType)

        parsedValue shouldEqual Some(expectedOutput)
        TypeUtils.areTypesEqual(dataType, parsedValue.get.getClass) shouldBe true
      }
    })

    forAll(Table(
      ("data-type", "string-input"),
      (DataType.BooleanDataType, "falseX"),
      (DataType.IntegerDataType, "27.5"),
      (DataType.LongDataType, "33.5"),
      (DataType.DoubleDataType, "12x1"),
    ))((dataType, stringInput) => {
      Scenario(s"should return empty when string '$stringInput' cannot be parsed to `$dataType` type") {
        val parsedValue = DataType.parseToDataType(stringInput, dataType)

        parsedValue shouldBe empty
      }
    })

  }

  Feature("Columns.allFromExceptDefaultColumns") {
    Scenario("Create join columns for all columns in table def except default columns") {
      val tableDef = TableDef(
        name = "TestTable",
        keyField = "Id",
        columns =
          new ColumnBuilder()
            .addString("Id")
            .addString("Name")
            .addInt("Account")
            .build()
      )

      val joinColumns = Columns.allFrom(tableDef)
      joinColumns.length shouldEqual 3
      joinColumns.map(_.name) should contain theSameElementsAs Array("Id", "Name", "Account")
    }
  }

  Feature("Columns.allFromExcept") {
    Scenario("Create join columns for all columns in table def except given columns and default columns") {
      val tableDef = TableDef(
        name = "TestTable",
        keyField = "Id",
        columns =
          new ColumnBuilder()
            .addString("Id")
            .addString("Name")
            .addInt("Account")
            .build()
      )

      val joinColumns = Columns.allFromExcept(tableDef, "Name")
      joinColumns.length shouldEqual 2
      joinColumns.map(_.name) should contain theSameElementsAs Array("Id", "Account")
    }
  }

  Feature("Equals and Hashcode") {

    Scenario("Simple column equals and hashcode") {

      val column1 = SimpleColumn("cakes", 0, DataType.StringDataType)

      val column2 = SimpleColumn("pies", 0, DataType.StringDataType)
      column1 shouldNot equal(column2)

      val column3 = SimpleColumn("cakes", 0, DataType.IntegerDataType)
      column1 shouldNot equal (column3)

      val column4 = SimpleColumn("cakes", 0, DataType.StringDataType)
      column1 shouldEqual column4
      column1.hashCode() shouldEqual column4.hashCode()
    }

    Scenario("Simple join column equals and hashcode") {

      val joinedColumn = SimpleColumn("type", 0, DataType.StringDataType)
      val tableDef = TableDef.apply("treats", "type", Array(joinedColumn))
      val column1 = SimpleJoinColumn("cakes", 0, DataType.StringDataType, tableDef, joinedColumn)

      val column2 = SimpleJoinColumn("pies", 0, DataType.StringDataType, tableDef, joinedColumn)
      column1 shouldNot equal(column2)

      val column3 = SimpleJoinColumn("cakes", 0, DataType.IntegerDataType, tableDef, joinedColumn)
      column1 shouldNot equal (column3)

      val column4 = SimpleJoinColumn("cakes", 0, DataType.StringDataType, tableDef, joinedColumn)
      column1 shouldEqual column4
      column1.hashCode() shouldEqual column4.hashCode()

      val joinedColumn2 = SimpleColumn("lol", 0, DataType.StringDataType)
      val tableDef2 = TableDef.apply("treats", "type", Array(joinedColumn2))
      val column5 = SimpleJoinColumn("cakes", 0, DataType.StringDataType, tableDef2, joinedColumn2)
      column1 shouldNot equal (column5)

      val tableDef3 = TableDef.apply("snacks", "type", Array(joinedColumn))
      val column6 = SimpleJoinColumn("cakes", 0, DataType.StringDataType, tableDef3, joinedColumn)
      column1 shouldNot equal (column6)
    }

    Scenario("Simple join alias column equals and hashcode") {

      val joinedColumn = SimpleColumn("type", 0, DataType.StringDataType)
      val tableDef = TableDef.apply("treats", "type", Array(joinedColumn))
      val column1 = AliasedJoinColumn("cakes", 0, DataType.StringDataType, tableDef, joinedColumn)

      val column2 = AliasedJoinColumn("pies", 0, DataType.StringDataType, tableDef, joinedColumn)
      column1 shouldNot equal(column2)

      val column3 = AliasedJoinColumn("cakes", 0, DataType.IntegerDataType, tableDef, joinedColumn)
      column1 shouldNot equal (column3)

      val column4 = AliasedJoinColumn("cakes", 0, DataType.StringDataType, tableDef, joinedColumn)
      column1 shouldEqual column4
      column1.hashCode() shouldEqual column4.hashCode()

      val joinedColumn2 = SimpleColumn("lol", 0, DataType.StringDataType)
      val tableDef2 = TableDef.apply("treats", "type", Array(joinedColumn2))
      val column5 = AliasedJoinColumn("cakes", 0, DataType.StringDataType, tableDef2, joinedColumn2)
      column1 shouldNot equal (column5)

      val tableDef3 = TableDef.apply("snacks", "type", Array(joinedColumn))
      val column6 = AliasedJoinColumn("cakes", 0, DataType.StringDataType, tableDef3, joinedColumn)
      column1 shouldNot equal (column6)
    }

    Scenario("Calculated column equals and hashcode") {

      val clause = new NullCalculatedColumnClause
      val column1 = CalculatedColumn("cakes", clause, 0, DataType.StringDataType)

      val column2 = CalculatedColumn("pies", clause, 0, DataType.StringDataType)
      column1 shouldNot equal(column2)

      val column3 = CalculatedColumn("cakes", clause, 0, DataType.IntegerDataType)
      column1 shouldNot equal (column3)

      val column4 = CalculatedColumn("cakes", clause, 0, DataType.StringDataType)
      column1 shouldEqual column4
      column1.hashCode() shouldEqual column4.hashCode()
    }

  }

}
