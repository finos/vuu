package io.venuu.vuu.viewport

import org.scalatest.{FeatureSpec, GivenWhenThen, Matchers}

class RangeSubtractTest extends FeatureSpec with Matchers with GivenWhenThen{

  val scenarios = List(
                      (ViewPortRange(0, 10), ViewPortRange(5, 15), ViewPortRange(10, 15)),
                      (ViewPortRange(5, 15), ViewPortRange(0, 10), ViewPortRange(0, 5)),
                      (ViewPortRange(5, 15), ViewPortRange(20, 30), ViewPortRange(20, 30)),
                      (ViewPortRange(20, 30), ViewPortRange(0, 10), ViewPortRange(0, 10)),
  )

  feature("Subtract one range from another and get the keys"){

    scenario("Check the differences between 2 ranges"){

      scenarios.foreach {
        case (firstRange, secondRange, expectedSubtract) => {
          firstRange.subtract(secondRange).from shouldEqual expectedSubtract.from
          firstRange.subtract(secondRange).to shouldEqual expectedSubtract.to
        }
      }
    }
  }
}
