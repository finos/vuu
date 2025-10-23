package org.finos.vuu.util

import org.finos.vuu.util.HMACUtils.{sign, verifyAndRemoveSignature}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class HMACUtilsTest extends AnyFeatureSpec with Matchers{

  Feature("HMAC logic for tokens") {

    val input = "MikeyLikesCakes.AndPies.AndBeer."
    val secret = "Steve likes h@m sandwiches"

    Scenario("Check round trip") {

      val signed = sign(input, secret)

      signed shouldNot equal(null)

      val unsigned = verifyAndRemoveSignature(signed, secret)

      unsigned match {
        case x: Left[String, String] => fail(x.value)
        case y: Right[String, String] =>
          y.value should equal(input)
      }
    }

    Scenario("Check invalid input to decoder") {

      val unsigned = verifyAndRemoveSignature("lolcats", secret)

      unsigned match {
        case x: Left[String, String] => {
          x.value should equal("Invalid number of parts")
        }
        case y: Right[String, String] =>
          fail(y.value)
      }
    }

    Scenario("Check invalid signature part to decoder") {

      val unsigned = verifyAndRemoveSignature("lol.cats", secret)

      unsigned match {
        case x: Left[String, String] => {
          x.value should equal("Invalid signature")
        }
        case y: Right[String, String] =>
          fail(y.value)
      }
    }

  }


}
