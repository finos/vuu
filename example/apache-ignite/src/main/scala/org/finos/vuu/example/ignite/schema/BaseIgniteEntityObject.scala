package org.finos.vuu.example.ignite.schema

import org.apache.ignite.cache.{QueryEntity, QueryIndex, QueryIndexType}
import org.finos.vuu.util.schema.ExternalEntitySchema

import scala.collection.mutable
import scala.jdk.CollectionConverters._

object BaseIgniteEntityObject {

  def buildQueryEntity(schema: ExternalEntitySchema, keyClass: Class[_], valueClass: Class[_]): QueryEntity = {
    val fields = new java.util.LinkedHashMap[String, String](
      mutable.LinkedHashMap.empty.addAll(schema.fields.map(f => (f.name, f.dataType.getName))).asJava
    )

    val queryIndex = schema.indexes.map(index =>
      new QueryIndex(index.fields.asJavaCollection, QueryIndexType.SORTED).setName(index.name)
    )

    new QueryEntity(keyClass, valueClass).setFields(fields).setIndexes(queryIndex.asJava)
  }

  def entityConverter[ReturnType](obj: Object): List[_] => ReturnType = {
    val converter = obj.getClass.getMethods.find(x => x.getName == "apply" && x.isBridge).get
    values => converter.invoke(obj, values.map(_.asInstanceOf[AnyRef]): _*).asInstanceOf[ReturnType]
  }
}