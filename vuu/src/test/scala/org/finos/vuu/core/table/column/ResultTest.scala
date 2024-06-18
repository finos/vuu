package org.finos.vuu.core.table.column

import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.util.Optional

class ResultTest extends AnyFeatureSpec with Matchers {

  private val successfulResult: Result[Double] = Result(57.5)
  private val erroredResult: Result[Double] = Error("Some error msg")

  Feature("isSuccess") {
    Scenario("should return true when successful result") {
      successfulResult.isSuccess shouldBe true
    }

    Scenario("should return false when unsuccessful result") {
      erroredResult.isSuccess shouldBe false
    }
  }

  Feature("isError") {
    Scenario("should return true when unsuccessful result") {
      erroredResult.isError shouldBe true
    }

    Scenario("should return false when successful result") {
      successfulResult.isError shouldBe false
    }
  }

  Feature("map") {
    Scenario("can perform map on a successful result") {
      successfulResult.map(d => d * 2) shouldEqual Success(115.0)
    }

    Scenario("skips map applied on an unsuccessful result") {
      erroredResult.map(d => d * 2) shouldEqual Error("Some error msg")
    }
  }

  Feature("flatMap") {
    Scenario("can perform flat map on a successful result") {
      successfulResult.flatMap(d => Success(d + " + String")) shouldEqual Success("57.5 + String")
    }

    Scenario("skips flat map applied on an unsuccessful result") {
      erroredResult.flatMap(d => Success(d + " + String")) shouldEqual Error("Some error msg")
    }
  }

  Feature("fold") {
    Scenario("can fold success result") {
      successfulResult.fold(_ => Double.NaN, v => v) shouldEqual 57.5
    }

    Scenario("can fold error result") {
      erroredResult.fold(msg => s"Error -> $msg", _ => "Success") shouldEqual s"Error -> ${erroredResult.getError}"
    }
  }

  Feature("join") {
    Scenario("can join two success results") {
      successfulResult.join(Result(2.0))((v1, v2) => v1 * v2) shouldEqual Success(115D)
    }

    Scenario("returns passed result unchanged if it is an error but self is a success") {
      successfulResult.join(erroredResult)((v1, v2) => v1 * v2) shouldEqual erroredResult
    }

    Scenario("returns self unchanged if self is an error but passed result is a success") {
      erroredResult.join(successfulResult)((v1, v2) => v1 * v2) shouldEqual erroredResult
    }

    Scenario("returns self unchanged if both passed and self results are errors") {
      val newError: Result[Double] = Error("new error")
      erroredResult.join(newError)((v1, v2) => v1 * v2) shouldEqual erroredResult
    }
  }

  Feature("joinWithErrors") {
    Scenario("can join two success results") {
      successfulResult.joinWithErrors(Result(2.0))((v1, v2) => v1 * v2, errorSep = "\n") shouldEqual Success(115D)
    }

    Scenario("returns passed result unchanged if it is an error but self is a success") {
      successfulResult.joinWithErrors(erroredResult)((v1, v2) => v1 * v2, "\n") shouldEqual erroredResult
    }

    Scenario("returns self unchanged if self is an error but passed result is a success") {
      erroredResult.joinWithErrors(successfulResult)((v1, v2) => v1 * v2, "\n") shouldEqual erroredResult
    }

    Scenario("returns concatenated error if both passed and self results are errors") {
      val newError: Result[Double] = Error("new error")
      erroredResult.joinWithErrors(newError)((v1, v2) => v1 * v2, "\n") shouldEqual Error("Some error msg\nnew error")
    }
  }

  Feature("toEither") {
    Scenario("can convert success to Either.Right") {
      successfulResult.toEither shouldEqual Right(57.5)
    }

    Scenario("can convert error to Either.Left") {
      erroredResult.toEither shouldEqual Left("Some error msg")
    }
  }

  Feature("toOption") {
    Scenario("can convert success to Option.Some") {
      successfulResult.toOption shouldEqual Some(57.5)
    }

    Scenario("can convert error to Option.None") {
      erroredResult.toOption shouldEqual None
    }
  }

  Feature("toOptional | [java.util.Optional]") {
    Scenario("can convert success to Optional[v]") {
      successfulResult.toOptional shouldEqual Optional.of(57.5)
    }

    Scenario("can convert error to Optional.empty") {
      erroredResult.toOptional shouldEqual Optional.empty()
    }
  }

  Feature("getValue") {
    Scenario("can extract value from successful result") {
      successfulResult.getValue shouldEqual 57.5
    }

    Scenario("throws when extracting value from an unsuccessful result") {
      val exception = intercept[Exception](erroredResult.getValue)
      exception.getMessage should include regex "cannot get value.* from.* error"
    }
  }

  Feature("getError") {
    Scenario("throws when extracting error from a successful result") {
      val exception = intercept[Exception](successfulResult.getError)
      exception.getMessage should include regex "cannot get error.* from.* success"
    }

    Scenario("can extract error from unsuccessful result") {
      erroredResult.getError shouldEqual "Some error msg"
    }
  }

}
