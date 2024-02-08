package org.finos.vuu.example.ignite.schema

import scala.jdk.CollectionConverters.IterableHasAsJava
import org.apache.ignite.cache.{QueryEntity, QueryIndex, QueryIndexType}
import org.finos.vuu.core.module.simul.model.ChildOrder

object IgniteChildOrderEntity {

  private val _schema: IgniteEntitySchema = createSchema()

  def getSchema: IgniteEntitySchema = _schema

  def buildQueryEntity: QueryEntity = _schema.queryEntity(classOf[Int], classOf[ChildOrder])

  def getListToChildOrder: List[_] => ChildOrder = {
    val converter = ChildOrder.getClass.getMethods
    .find(x => x.getName == "apply" && x.isBridge)
    .get

    values =>
      converter.invoke(ChildOrder, values map (_.asInstanceOf[AnyRef]): _*).asInstanceOf[ChildOrder]
  }

  private def createSchema(): IgniteEntitySchema = {
    IgniteEntitySchemaBuilder()
      .withCaseClass[ChildOrder]
      .withIndex(new QueryIndex(List("parentId").asJavaCollection, QueryIndexType.SORTED).setName("PARENTID_IDX"))
      .withIndex(new QueryIndex(List("id").asJavaCollection, QueryIndexType.SORTED).setName("CHILDID_IDX"))
      .build()
  }
}
