package org.finos.vuu.example.ignite.schema

import org.apache.ignite.cache.QueryEntity
import org.finos.vuu.core.module.simul.model.ChildOrder
import org.finos.vuu.feature.ignite.utils.buildQueryEntity
import org.finos.vuu.util.schema.{ExternalEntitySchema, ExternalEntitySchemaBuilder}

object ChildOrderSchema {
  val schema: ExternalEntitySchema = ExternalEntitySchemaBuilder()
    .withEntity(classOf[ChildOrder])
    .withIndex("PARENTID_IDX", List("parentId"))
    .withIndex("CHILDID_IDX", List("id"))
    .build()

  val queryEntity: QueryEntity = buildQueryEntity(schema, classOf[Int], classOf[ChildOrder])
}
