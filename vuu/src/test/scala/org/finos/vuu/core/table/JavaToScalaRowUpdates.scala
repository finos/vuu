package org.finos.vuu.core.table

import org.scalatest.OneInstancePerTest
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.util
import scala.jdk.CollectionConverters.MapHasAsScala

class JavaToScalaRowUpdates extends AnyFeatureSpec with Matchers with OneInstancePerTest {

  Feature("Check updating with java classes to scala") {

    Scenario("row update") {

      val javaMap = new util.HashMap[String, Any]();

      javaMap.put("id", 1);
      javaMap.put("foo", 1.234d);
      javaMap.put("bar", "barbar");
      javaMap.put("myBool", true);
      javaMap.put("myLong", 200L);

      val row = new RowWithData("1", javaMap.asScala.toMap);

      row.get("id") should equal(1)
      row.get("foo") should equal(1.234d)
      row.get("bar") should equal("barbar")
      row.get("myBool") should equal(true)
      row.get("myLong") should equal(200L)
    }
  }

}
