package org.finos.vuu.feature.ignite.utils

import org.finos.vuu.util.schema.ExternalEntitySchemaBuilder
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import scala.collection.mutable
import scala.jdk.CollectionConverters.{CollectionHasAsScala, MapHasAsScala}

class buildQueryEntityTest extends AnyFeatureSpec with Matchers {

  Feature("buildQueryEntity") {
    val testSchema = ExternalEntitySchemaBuilder()
      .withCaseClass[TestDto]
      .withIndex("TEST_INDEX", List("name"))
      .build()

    Scenario("Can build query entity") {
      val queryEntity = buildQueryEntity(testSchema, classOf[Long], classOf[TestDto])

      queryEntity.getFields.asScala shouldEqual mutable.LinkedHashMap.empty.addAll(List(("name", "java.lang.String"), ("value", "double")))
      queryEntity.getIndexes.size shouldEqual 1
      queryEntity.getIndexes.asScala.head.getName shouldEqual "TEST_INDEX"
    }
  }

  private case class TestDto(name: String, value: Double)
}
