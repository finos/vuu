package org.finos.vuu.core.table.column

import org.finos.vuu.core.table.column.CalculatedColumnClause.OptionResult
import org.finos.vuu.core.table.column.CalculatedColumnClauseTest.{areEqual, givenColumn, givenRow}
import org.finos.vuu.core.table.{Column, RowData, RowWithData, SimpleColumn}
import org.scalatest.Assertion
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class CalculatedColumnClauseTest extends AnyFeatureSpec with Matchers {

  Feature("IntColumnClause") {
    Scenario("can calculate int column value") {
      val clause = IntColumnClause(givenColumn("int-column"))

      val result = clause.calculate(givenRow(m = Map("int-column" -> 10)))

      areEqual(result, 10)
    }

    Scenario("can handle null column value") {
      val clause = IntColumnClause(givenColumn("int-column"))

      val result = clause.calculate(givenRow(m = Map("int-column" -> null)))

      result.getValue shouldEqual None
    }

    Scenario("returns error if value could not be parsed to int") {
      val clause = IntColumnClause(givenColumn("column", classOf[String]))

      val result = clause.calculate(givenRow(m = Map("column" -> "abc")))

      result.isError shouldBe true
      result.getError shouldEqual "java.lang.NumberFormatException: For input string: \"abc\""
    }
  }

  Feature("DoubleColumnClause") {
    Scenario("can calculate double column value") {
      val clause = DoubleColumnClause(givenColumn("double-column"))

      val result = clause.calculate(givenRow(m = Map("double-column" -> 10.5)))

      areEqual(result, 10.5)
    }

    Scenario("can handle null column value") {
      val clause = DoubleColumnClause(givenColumn("double-column"))

      val result = clause.calculate(givenRow(m = Map("double-column" -> null)))

      result.getValue shouldEqual None
    }

    Scenario("returns error if value could not be parsed to double") {
      val clause = DoubleColumnClause(givenColumn("column"))

      val result = clause.calculate(givenRow(m = Map("column" -> "abc")))

      result.isError shouldBe true
      result.getError shouldEqual "java.lang.NumberFormatException: For input string: \"abc\""
    }
  }

  Feature("LongColumnClause") {
    Scenario("can calculate long column value") {
      val clause = LongColumnClause(givenColumn("long-column"))

      val result = clause.calculate(givenRow(m = Map("long-column" -> 10L)))

      areEqual(result, 10L)
    }

    Scenario("can handle null column value") {
      val clause = LongColumnClause(givenColumn("long-column"))

      val result = clause.calculate(givenRow(m = Map("long-column" -> null)))

      result.getValue shouldEqual None
    }

    Scenario("returns error if value could not be parsed to long") {
      val clause = LongColumnClause(givenColumn("column"))

      val result = clause.calculate(givenRow(m = Map("column" -> "abc")))

      result.isError shouldBe true
      result.getError shouldEqual "java.lang.NumberFormatException: For input string: \"abc\""
    }
  }

  Feature("BooleanColumnClause") {
    Scenario("can calculate boolean column value") {
      val clause = BooleanColumnClause(givenColumn("bool-column"))

      val result = clause.calculate(givenRow(m = Map("bool-column" -> true)))

      areEqual(result, true)
    }

    Scenario("can calculate where column value is parsable to boolean") {
      val clause = BooleanColumnClause(givenColumn("bool-column"))

      val result = clause.calculate(givenRow(m = Map("bool-column" -> "false")))

      areEqual(result, false)
    }

    Scenario("can handle null column value") {
      val clause = BooleanColumnClause(givenColumn("bool-column"))

      val result = clause.calculate(givenRow(m = Map("bool-column" -> null)))

      result.getValue shouldEqual None
    }

    Scenario("returns error if value could not be parsed to boolean") {
      val clause = BooleanColumnClause(givenColumn("column"))

      val result = clause.calculate(givenRow(m = Map("column" -> "abc")))

      result.isError shouldBe true
    }
  }

  Feature("StringColumnClause") {
    Scenario("can calculate string column value") {
      val clause = StringColumnClause(givenColumn("str-column"))

      val result = clause.calculate(givenRow(m = Map("str-column" -> "value")))

      areEqual(result, "value")
    }

    Scenario("can calculate where column value is parsable to string") {
      val clause = StringColumnClause(givenColumn("str-column"))

      val result = clause.calculate(givenRow(m = Map("str-column" -> 10.55)))

      areEqual(result, "10.55")
    }

    Scenario("can handle null column value") {
      val clause = StringColumnClause(givenColumn("str-column"))

      val result = clause.calculate(givenRow(m = Map("str-column" -> null)))

      result.getValue shouldEqual None
    }
  }

  Feature("NullCalculatedColumnClause") {
    Scenario("calculate should return empty optional Result") {
      val result = NullCalculatedColumnClause().calculate(givenRow("1", Map("field" -> "value")))
      result.isSuccess should be (true)
      result.getValue shouldEqual Option.empty
    }
  }

  Feature("ErrorClause") {
    Scenario("calculate should return error message in expected format") {
      val result = ErrorClause("MSG").calculate(givenRow())
      result.isError should be (true)
      result.getError shouldEqual "[ERROR] ErrorClause MSG"
    }
  }
}

object CalculatedColumnClauseTest extends Matchers {
  def givenClause(value: Any): CalculatedColumnClause = {
    value match {
      case null => IntColumnClause(givenColumn("non-existent"))
      case s: String => LiteralStringColumnClause(s)
      case d: Double => LiteralDoubleColumnClause(d)
      case i: Int => LiteralIntColumnClause(i)
      case l: Long => LiteralLongColumnClause(l)
      case b: Boolean => LiteralBooleanColumnClause(b)
    }
  }

  def givenColumn(name: String, t: Class[_] = classOf[Any]): Column = SimpleColumn(name, -1, t)

  def givenRow(key: String = "key", m: Map[String, Any] = Map.empty): RowData = RowWithData(key, m)

  def areEqual[T](res: OptionResult[T], v: T): Assertion = {
    res.isSuccess shouldBe true
    res.getValue.nonEmpty shouldBe true
    res.getValue.get shouldEqual v
  }

  def containErrorMsg(res: OptionResult[Any], msg: String): Assertion = {
    res.isError shouldBe true
    res.getError should include regex msg
  }
}