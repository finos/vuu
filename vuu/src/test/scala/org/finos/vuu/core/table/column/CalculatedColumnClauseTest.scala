package org.finos.vuu.core.table.column

import org.finos.vuu.core.table.column.CalculatedColumnClause.OptionResult
import org.finos.vuu.core.table.column.CalculatedColumnClauseTest.{areEqual, containErrorMsg, givenClause, givenColumn, givenRow}
import org.finos.vuu.core.table.column.Functions.CalcColumnFunctionsParsingException
import org.finos.vuu.core.table.{Column, RowData, RowWithData, SimpleColumn}
import org.scalatest.Assertion
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.TableDrivenPropertyChecks.forAll
import org.scalatest.prop.Tables.Table

class CalculatedColumnClauseTest extends AnyFeatureSpec with Matchers {

  Feature("EqualsClause") {
    forAll(Table(
      ("test", "clause1", "clause2", "expected"),
      ("match", givenClause("field"), givenClause("field"), true),
      ("not matched", givenClause("field"), givenClause("fieldX"), false),
      ("null match with null", givenClause(null), givenClause(null), true),
      ("null match with non-null", givenClause(null), givenClause("field"), false),
    ))((test, c1, c2, expected) => {
      Scenario(s"should return $expected when $test") {
        val res = EqualsClause(c1, c2).calculate(givenRow())
        areEqual(res, expected)
      }
    })

    Scenario("should return error when one of the clauses return error") {
      val successClause = givenClause(10.5)
      val errorClause = AddClause(List.empty)

      EqualsClause(successClause, errorClause).calculate(givenRow()).isError shouldBe true
      EqualsClause(errorClause, successClause).calculate(givenRow()).isError shouldBe true
      EqualsClause(errorClause, errorClause).calculate(givenRow()).isError shouldBe true
    }
  }

  Feature("GreaterThanClause") {
    forAll(Table(
      ("test", "clause1", "clause2", "expected"),
      ("(numeric) left < right", givenClause(10.5), givenClause(11L), false),
      ("(numeric) left > right", givenClause(11), givenClause(5.99), true),
      ("(boolean) left < right", givenClause(false), givenClause(true), false),
      ("(boolean) left > right", givenClause(true), givenClause(false), true),
      ("(string) left < right", givenClause("game"), givenClause("name"), false),
      ("(string) left > right", givenClause("name"), givenClause("game"), true),
    ))((test, c1, c2, expected) => {
      Scenario(s"should return $expected when $test") {
        val res = GreaterThanClause(c1, c2).calculate(givenRow())
        areEqual(res, expected)
      }
    })

    Scenario("should return error when one of the clauses evaluate to null") {
      val successClause = givenClause(10.5)
      val nullClause = givenClause(null)

      GreaterThanClause(successClause, nullClause).calculate(givenRow()).isError shouldBe true
      GreaterThanClause(nullClause, successClause).calculate(givenRow()).isError shouldBe true
      GreaterThanClause(nullClause, nullClause).calculate(givenRow()).isError shouldBe true
    }

    Scenario("should return error when one of the clauses return error") {
      val successClause = givenClause(10.5)
      val errorClause = AddClause(List.empty)

      GreaterThanClause(successClause, errorClause).calculate(givenRow()).isError shouldBe true
      GreaterThanClause(errorClause, successClause).calculate(givenRow()).isError shouldBe true
      GreaterThanClause(errorClause, errorClause).calculate(givenRow()).isError shouldBe true
    }
  }

  Feature("LesserThanClause") {
    forAll(Table(
      ("test", "clause1", "clause2", "expected"),
      ("(numeric) left > right", givenClause(25.5), givenClause(5.5), false),
      ("(numeric) left < right", givenClause(20), givenClause(110.01), true),
      ("(boolean) left > right", givenClause(true), givenClause(false), false),
      ("(boolean) left < right", givenClause(false), givenClause(true), true),
      ("(string) left > right", givenClause("name"), givenClause("game"), false),
      ("(string) left < right", givenClause("game"), givenClause("name"), true),
    ))((test, c1, c2, expected) => {
      Scenario(s"should return $expected when $test") {
        val res = LesserThanClause(c1, c2).calculate(givenRow())
        areEqual(res, expected)
      }
    })

    Scenario("should return error when one of the clauses evaluate to null") {
      val successClause = givenClause(10.5)
      val nullClause = givenClause(null)

      LesserThanClause(successClause, nullClause).calculate(givenRow()).isError shouldBe true
      LesserThanClause(nullClause, successClause).calculate(givenRow()).isError shouldBe true
      LesserThanClause(nullClause, nullClause).calculate(givenRow()).isError shouldBe true
    }

    Scenario("should return error when one of the clauses return error") {
      val successClause = givenClause(10.5)
      val errorClause = AddClause(List.empty)

      LesserThanClause(successClause, errorClause).calculate(givenRow()).isError shouldBe true
      LesserThanClause(errorClause, successClause).calculate(givenRow()).isError shouldBe true
      LesserThanClause(errorClause, errorClause).calculate(givenRow()).isError shouldBe true
    }
  }

  Feature("LenFunction") {
    Scenario("can return length of the string clause") {
      val clause = givenClause("LengthOf9")
      val result = LenFunction(clause).calculate(givenRow())
      areEqual(result, 9)
    }

    Scenario("returns error if non-string clause") {
      val clause = givenClause(10.5)
      val result = LenFunction(clause).calculate(givenRow())
      containErrorMsg(result, "cannot be applied to non-string")
    }

    Scenario("returns error if string clause passed with null value") {
      val clause = StringColumnClause(givenColumn("non-existent"))
      val result = LenFunction(clause).calculate(givenRow())
      containErrorMsg(result, "cannot have clauses that evaluate to `null`")
    }
  }

  Feature("LowerFunction") {
    Scenario("can convert single string clause to lower-case") {
      val clauses = List(givenClause("LeNGth"))
      val result = LowerFunction(clauses).calculate(givenRow())
      areEqual(result, "length")
    }

    Scenario("can convert mixture of types to lower-case") {
      val clauses = List(givenClause("LeNGth"), givenClause(10.5))
      val result = LowerFunction(clauses).calculate(givenRow())
      areEqual(result, "length10.5")
    }

    Scenario("returns error if string clause passed with null value") {
      val clauses = List(givenClause("LeNGth"), StringColumnClause(givenColumn("non-existent")))
      val result = LowerFunction(clauses).calculate(givenRow())
      containErrorMsg(result, "cannot have clauses that evaluate to `null`")
    }
  }

  Feature("UpperFunction") {
    Scenario("can convert single string clause to upper-case") {
      val clauses = List(givenClause("Length"))
      val result = UpperFunction(clauses).calculate(givenRow())
      areEqual(result, "LENGTH")
    }

    Scenario("can convert mixture of types to upper-case") {
      val clauses = List(givenClause("Length"), givenClause(10.5))
      val result = UpperFunction(clauses).calculate(givenRow())
      areEqual(result, "LENGTH10.5")
    }

    Scenario("returns error if string clause passed with null value") {
      val clauses = List(givenClause("Length"), StringColumnClause(givenColumn("non-existent")))
      val result = UpperFunction(clauses).calculate(givenRow())
      containErrorMsg(result, "cannot have clauses that evaluate to `null`")
    }
  }

  Feature("ReplaceFunction") {
    Scenario("can find and replace target substring with replacement substring") {
      val clauses = List(givenClause("a string"), givenClause("a"), givenClause("the"))
      val result = ReplaceFunction(clauses).calculate(givenRow())
      areEqual(result, "the string")
    }

    Scenario("can apply replace on a mixture of types") {
      val clauses = List(givenClause(100.5), givenClause(0.5), givenClause(1.25))
      val result = ReplaceFunction(clauses).calculate(givenRow())
      areEqual(result, "101.25")
    }

    Scenario("returns error if one of the clauses passed evaluates to null") {
      val clauses = List(givenClause("something"), givenClause("some"), givenClause(null))
      val result = ReplaceFunction(clauses).calculate(givenRow())
      containErrorMsg(result, "cannot have clauses that evaluate to `null`")
    }

    Scenario("throws expected exception if number of clauses passed are less than 3") {
      val clauses = List(givenClause("something"), givenClause("some"))
      val ex = intercept[CalcColumnFunctionsParsingException](ReplaceFunction(clauses).calculate(givenRow()))
      ex.getMessage should include ("sub-clauses should have a length of 3")
    }
  }

  Feature("LeftFunction") {
    Scenario("can return substring with the specified number of characters from the left") {
      val clauses = List(givenClause("fixed-income"), givenClause(5L))
      val result = LeftFunction(clauses).calculate(givenRow())
      areEqual(result, "fixed")
    }

    Scenario("returns string unchanged when count is more than the length of the string") {
      val clauses = List(givenClause("fixed-income"), givenClause(20))
      val result = LeftFunction(clauses).calculate(givenRow())
      areEqual(result, "fixed-income")
    }

    Scenario("can apply left on a non-string type") {
      val clauses = List(givenClause(100.5), givenClause(2))
      val result = LeftFunction(clauses).calculate(givenRow())
      areEqual(result, "10")
    }

    Scenario("when count clause is a double then converts it to an int") {
      val clauses = List(givenClause("fixed-income"), givenClause(5.75))
      val result = LeftFunction(clauses).calculate(givenRow())
      areEqual(result, "fixed")
    }

    Scenario("returns error if count clause is not of numeric data-type") {
      val clauses = List(givenClause("something"), givenClause(false))
      val result = LeftFunction(clauses).calculate(givenRow())
      containErrorMsg(result, "count clause` should have a numeric datatype")
    }

    Scenario("returns error if count clause evaluates to null") {
      val clauses = List(givenClause("something"), givenClause(null))
      val result = LeftFunction(clauses).calculate(givenRow())
      containErrorMsg(result, "cannot have clauses that evaluate to `null`")
    }

    Scenario("returns error if source string clause evaluates to null") {
      val clauses = List(givenClause(null), givenClause(2))
      val result = LeftFunction(clauses).calculate(givenRow())
      containErrorMsg(result, "cannot have clauses that evaluate to `null`")
    }

    Scenario("throws expected exception if number of clauses passed are less than 2") {
      val clauses = List(givenClause("something"))
      val ex = intercept[CalcColumnFunctionsParsingException](LeftFunction(clauses).calculate(givenRow()))
      ex.getMessage should include ("sub-clauses should have a length of 2")
    }
  }

  Feature("RightFunction") {
    Scenario("can return substring with the specified number of characters from the right") {
      val clauses = List(givenClause("fixed-income"), givenClause(6L))
      val result = RightFunction(clauses).calculate(givenRow())
      areEqual(result, "income")
    }

    Scenario("returns string unchanged when count is more than the length of the string") {
      val clauses = List(givenClause("fixed-income"), givenClause(20))
      val result = RightFunction(clauses).calculate(givenRow())
      areEqual(result, "fixed-income")
    }

    Scenario("can apply right on a non-string type") {
      val clauses = List(givenClause(100.5), givenClause(3))
      val result = RightFunction(clauses).calculate(givenRow())
      areEqual(result, "0.5")
    }

    Scenario("when count clause is a double then converts it to an int") {
      val clauses = List(givenClause("fixed-income"), givenClause(6.75))
      val result = RightFunction(clauses).calculate(givenRow())
      areEqual(result, "income")
    }

    Scenario("returns error if count clause is not of numeric data-type") {
      val clauses = List(givenClause("something"), givenClause(false))
      val result = RightFunction(clauses).calculate(givenRow())
      containErrorMsg(result, "count clause` should have a numeric datatype")
    }

    Scenario("returns error if count clause evaluates to null") {
      val clauses = List(givenClause("something"), givenClause(null))
      val result = RightFunction(clauses).calculate(givenRow())
      containErrorMsg(result, "cannot have clauses that evaluate to `null`")
    }

    Scenario("returns error if source string clause evaluates to null") {
      val clauses = List(givenClause(null), givenClause(2))
      val result = RightFunction(clauses).calculate(givenRow())
      containErrorMsg(result, "cannot have clauses that evaluate to `null`")
    }

    Scenario("throws expected exception if number of clauses passed are less than 2") {
      val clauses = List(givenClause("something"))
      val ex = intercept[CalcColumnFunctionsParsingException](RightFunction(clauses).calculate(givenRow()))
      ex.getMessage should include ("sub-clauses should have a length of 2")
    }
  }

  Feature("OrFunction") {
    Scenario("should return true if any one of the clauses evaluate to true") {
      val clauses = List(givenClause("not-true"), EqualsClause(givenClause(6), givenClause(6.0)), givenClause(false))
      val result = OrFunction(clauses).calculate(givenRow())
      areEqual(result, true)
    }

    Scenario("should short-circuit if any one of the clauses evaluate to true") {
      val clauses = List(givenClause(true), MaxClause(List(givenClause("will-error"))))
      val result = OrFunction(clauses).calculate(givenRow())
      areEqual(result, true)
    }

    Scenario("should return error if one of the clauses errors and no true clause encountered") {
      val clauses = List(givenClause(false), MaxClause(List(givenClause("will-error"))), givenClause(true))
      val result = OrFunction(clauses).calculate(givenRow())
      containErrorMsg(result, "unable to apply")
    }

    Scenario("should return false when no true or error encountered ignoring any non-boolean or non-true clauses") {
      val clauses = List(givenClause(false), givenClause(null), givenClause(3.5))
      val result = OrFunction(clauses).calculate(givenRow())
      areEqual(result, false)
    }
  }

  Feature("AndFunction") {
    Scenario("should return false if any one of the clauses evaluate to false and no error encountered") {
      val clauses = List(EqualsClause(givenClause(6), givenClause(6.0)), givenClause(false))
      val result = AndFunction(clauses).calculate(givenRow())
      areEqual(result, false)
    }

    Scenario("should short-circuit if any one of the clauses evaluate to false") {
      val clauses = List(givenClause(false), MaxClause(List(givenClause("will-error"))))
      val result = AndFunction(clauses).calculate(givenRow())
      areEqual(result, false)
    }

    Scenario("should treat null as false") {
      val clauses = List(givenClause(null), MaxClause(List(givenClause("will-error"))))
      val result = AndFunction(clauses).calculate(givenRow())
      areEqual(result, false)
    }

    Scenario("should treat any non-boolean value as false") {
      val clauses = List(givenClause("i-am-false"), MaxClause(List(givenClause("will-error"))))
      val result = AndFunction(clauses).calculate(givenRow())
      areEqual(result, false)
    }

    Scenario("should return error if one of the clauses errors and no falsey clause encountered") {
      val clauses = List(givenClause(true), MaxClause(List(givenClause("will-error"))), givenClause(false))
      val result = AndFunction(clauses).calculate(givenRow())
      containErrorMsg(result, "unable to apply")
    }

    Scenario("should return true when no falsey value or error encountered") {
      val clauses = List(givenClause(true), GreaterThanClause(givenClause(5.5), givenClause(5.25)))
      val result = AndFunction(clauses).calculate(givenRow())
      areEqual(result, true)
    }
  }

  Feature("IfFunction") {
    Scenario("evaluates and returns `then` clause when condition clause evaluates to true") {
      val condition :: thenClause :: elseClause :: _ = List(givenClause(true), givenClause("then"), givenClause("else"))
      val res = IfFunction(condition, thenClause, elseClause).calculate(givenRow())
      areEqual(res, "then")
    }

    Scenario("evaluates and returns `else` clause when condition clause evaluates to false") {
      val condition :: thenClause :: elseClause :: _ = List(givenClause(false), givenClause("then"), givenClause("else"))
      val res = IfFunction(condition, thenClause, elseClause).calculate(givenRow())
      areEqual(res, "else")
    }

    Scenario("evaluates and returns `else` clause when condition clause evaluates to not true") {
      val condition :: thenClause :: elseClause :: _ = List(givenClause(15.5), givenClause("then"), givenClause("else"))
      val res = IfFunction(condition, thenClause, elseClause).calculate(givenRow())
      areEqual(res, "else")
    }

    Scenario("returns error when condition clause evaluation errors") {
      val condition :: thenClause :: elseClause :: _ = List(DivideClause(List(givenClause("string"))), givenClause("then"), givenClause("else"))
      val res = IfFunction(condition, thenClause, elseClause).calculate(givenRow())
      containErrorMsg(res, "unable to apply")
    }
  }

  Feature("StartsFunction") {
    Scenario("should return true when string starts with the given substring") {
      val clauses = List(givenClause("very long day"), givenClause("very"))
      val res = StartsFunction(clauses).calculate(givenRow())
      areEqual(res, true)
    }

    Scenario("should be able to handle non-string clauses") {
      val clauses = List(givenClause(true), givenClause("tr"))
      val res = StartsFunction(clauses).calculate(givenRow())
      areEqual(res, true)
    }

    Scenario("should return false when string does not start with the given substring") {
      val clauses = List(givenClause("10% return"), givenClause(5))
      val res = StartsFunction(clauses).calculate(givenRow())
      areEqual(res, false)
    }

    Scenario("should return error when either string or substring clauses evaluate to null") {
      val clauses = List(givenClause("10% return"), givenClause(null))
      val res = StartsFunction(clauses).calculate(givenRow())
      containErrorMsg(res, "cannot have clauses that evaluate to `null`")
    }

    Scenario("throws expected exception if number of clauses passed are less than 2") {
      val clauses = List(givenClause("something"))
      val ex = intercept[CalcColumnFunctionsParsingException](StartsFunction(clauses).calculate(givenRow()))
      ex.getMessage should include ("sub-clauses should have a length of 2")
    }
  }

  Feature("EndsFunction") {
    Scenario("should return true when string ends with the given substring") {
      val clauses = List(givenClause("very long day"), givenClause("day"))
      val res = EndsFunction(clauses).calculate(givenRow())
      areEqual(res, true)
    }

    Scenario("should be able to handle non-string clauses") {
      val clauses = List(givenClause(100.5), givenClause(".5"))
      val res = EndsFunction(clauses).calculate(givenRow())
      areEqual(res, true)
    }

    Scenario("should return false when string does not end with the given substring") {
      val clauses = List(givenClause("profit = 10%"), givenClause("5%"))
      val res = EndsFunction(clauses).calculate(givenRow())
      areEqual(res, false)
    }

    Scenario("should return error when either string or substring clauses evaluate to null") {
      val clauses = List(givenClause(null), givenClause("substring"))
      val res = EndsFunction(clauses).calculate(givenRow())
      containErrorMsg(res, "cannot have clauses that evaluate to `null`")
    }
  }

  Feature("ContainsFunction") {
    Scenario("should return true when string contains the given substring") {
      val clauses = List(givenClause("very long day"), givenClause("long"))
      val res = ContainsFunction(clauses).calculate(givenRow())
      areEqual(res, true)
    }

    Scenario("should be able to handle non-string clauses") {
      val clauses = List(givenClause(100.5), givenClause("00.5"))
      val res = ContainsFunction(clauses).calculate(givenRow())
      areEqual(res, true)
    }

    Scenario("should return false when string does not contain the given substring") {
      val clauses = List(givenClause("profit = 10%"), givenClause("= 15%"))
      val res = ContainsFunction(clauses).calculate(givenRow())
      areEqual(res, false)
    }

    Scenario("should return error when either string or substring clauses evaluate to null") {
      val clauses = List(givenClause(null), givenClause("substring"))
      val res = ContainsFunction(clauses).calculate(givenRow())
      containErrorMsg(res, "cannot have clauses that evaluate to `null`")
    }
  }

  Feature("TextFunction") {
    Scenario("should concatenate passed clauses into a single string") {
      val clauses = List(givenClause(10.5), givenClause("%"), givenClause(" and "), givenClause(true))
      val res = TextFunction(clauses).calculate(givenRow())
      areEqual(res, "10.5% and true")
    }

    Scenario("should return error if any of the clauses evaluate to null") {
      val clauses = List(givenClause(10.5), givenClause("%"), givenClause(null))
      val res = TextFunction(clauses).calculate(givenRow())
      containErrorMsg(res, "cannot have clauses that evaluate to `null`")
    }

    Scenario("should return error if any of the clauses error") {
      val clauses = List(AddClause(List.empty))
      val res = TextFunction(clauses).calculate(givenRow())
      containErrorMsg(res, "unable to apply")
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
    Scenario("error message returned should be in expected format") {
      val result = ErrorClause("MSG").calculate(givenRow())
      result.isError should be (true)
      result.getError shouldEqual "[ERROR] ErrorClause - MSG"
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