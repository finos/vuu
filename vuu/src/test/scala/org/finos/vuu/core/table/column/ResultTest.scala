package org.finos.vuu.core.table.column

import org.finos.vuu.util.schema.ExternalEntitySchemaBuilder
import org.finos.vuu.util.schema.ExternalEntitySchemaBuilder.InvalidIndexException
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
