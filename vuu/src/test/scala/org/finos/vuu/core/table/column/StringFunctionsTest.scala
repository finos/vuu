package org.finos.vuu.core.table.column

import org.finos.vuu.core.table.column.CalculatedColumnClauseTest.{areEqual, containErrorMsg, givenClause, givenColumn, givenRow}
import org.finos.vuu.core.table.column.StringFunctions.CalcColumnFunctionsParsingException
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class StringFunctionsTest extends AnyFeatureSpec with Matchers {
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
      val clauses = List(AdditionClause(List.empty))
      val res = TextFunction(clauses).calculate(givenRow())
      containErrorMsg(res, "unable to apply")
    }
  }
}
