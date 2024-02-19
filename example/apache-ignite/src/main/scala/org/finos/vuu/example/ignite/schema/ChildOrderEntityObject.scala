package org.finos.vuu.example.ignite.schema

import org.apache.ignite.cache.QueryEntity
import org.finos.vuu.core.module.simul.model.ChildOrder
import org.finos.vuu.util.schema.{ExternalEntitySchema, ExternalEntitySchemaBuilder}

object ChildOrderEntityObject {
  private val _schema = createSchema()
  def getSchema: ExternalEntitySchema = _schema
  def buildQueryEntity: QueryEntity = BaseIgniteEntityObject.buildQueryEntity(_schema, classOf[Int], classOf[ChildOrder])
  def getListToChildOrder: List[_] => ChildOrder = BaseIgniteEntityObject.entityConverter[ChildOrder](ChildOrder)

  private def createSchema(): ExternalEntitySchema = {
    ExternalEntitySchemaBuilder()
      .withCaseClass[ChildOrder]
      .withIndex("PARENTID_IDX", List("parentId"))
      .withIndex("CHILDID_IDX", List("id"))
      .build()
  }
}
