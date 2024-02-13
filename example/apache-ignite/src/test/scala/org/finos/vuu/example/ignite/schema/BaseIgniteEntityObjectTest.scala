package org.finos.vuu.example.ignite.schema

import org.finos.vuu.feature.ignite.schema.ExternalEntitySchemaBuilder
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import scala.collection.mutable
import scala.jdk.CollectionConverters.{CollectionHasAsScala, MapHasAsScala}

class BaseIgniteEntityObjectTest extends AnyFeatureSpec with Matchers {

  Feature("buildQueryEntity") {
    val testSchema = ExternalEntitySchemaBuilder()
      .withCaseClass[TestDto]
      .withIndex("TEST_INDEX", List("name"))
      .build()

    Scenario("Can build query entity") {
      val queryEntity = BaseIgniteEntityObject.buildQueryEntity(testSchema, classOf[Long], classOf[TestDto])

      queryEntity.getFields.asScala shouldEqual mutable.LinkedHashMap.empty.addAll(List(("name", "java.lang.String"), ("value", "double")))
      queryEntity.getIndexes.size shouldEqual 1
      queryEntity.getIndexes.asScala.head.getName shouldEqual "TEST_INDEX"
    }
  }

  Feature("entityConverter") {
    Scenario("Can build Dto from list of values") {
      val dto = BaseIgniteEntityObject.entityConverter[TestDto](TestDto)(List("TestObject", 25.5))

      dto shouldEqual TestDto(name = "TestObject", value = 25.5)
    }
  }
}


private case class TestDto(name: String, value: Double)