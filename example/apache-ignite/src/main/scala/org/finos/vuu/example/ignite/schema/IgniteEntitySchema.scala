package org.finos.vuu.example.ignite.schema

import org.apache.ignite.cache.{QueryEntity, QueryIndex}
import org.finos.vuu.example.ignite.schema.EntitySchema.ColumnName
import org.finos.vuu.example.ignite.schema.IgniteDataType.{IgniteDataType, fromString}
import org.finos.vuu.example.ignite.schema.IgniteEntitySchemaBuilder.InvalidIndexException
import org.finos.vuu.feature.ignite.schema.{ExternalStoreEntitySchema, SchemaField}

import scala.collection.mutable
import scala.collection.mutable.ListBuffer
import scala.jdk.CollectionConverters._
import scala.reflect.runtime.universe.{MethodSymbol, TypeTag, typeOf}

case class IgniteEntitySchema private (private val columnDef: mutable.LinkedHashMap[ColumnName, IgniteDataType],
                              queryIndex: List[QueryIndex]) extends ExternalStoreEntitySchema {

  override val schemaFields: List[SchemaField] = columnDef.zipWithIndex.map(
    {case ((name, dType), i) => SchemaField(name, dType, i)}
  ).toList

  def queryEntity(keyClass: Class[_], valueClass: Class[_]): QueryEntity = {
    val fields = new java.util.LinkedHashMap[String, String](
      columnDef.map({case (name, dType) => (name, dType.getName)})
    .asJava)

    new QueryEntity(keyClass, valueClass).setFields(fields).setIndexes(queryIndex.asJava)
  }
}

object EntitySchema {
  type ColumnName = String
}

object IgniteDataType extends Enumeration {
  type IgniteDataType = Class[_]
  val Int : IgniteDataType =  classOf[Int]
  val String : IgniteDataType =  classOf[String]
  val Double : IgniteDataType =  classOf[Double]
  val Long : IgniteDataType =  classOf[Long]

  def fromString(s: String): IgniteDataType = {
    s.trim.toLowerCase match {
      case "string" => IgniteDataType.String
      case "double" => IgniteDataType.Double
      case "int"    => IgniteDataType.Int
      case "long"   => IgniteDataType.Long
      case _        => throw new RuntimeException(s"Unsupported type passed: $s")
    }
  }
}

object IgniteEntitySchemaBuilder {
  def apply(fieldDef: mutable.LinkedHashMap[ColumnName, IgniteDataType] = mutable.LinkedHashMap.empty,
            index: ListBuffer[QueryIndex] = ListBuffer.empty): IgniteEntitySchemaBuilder =
    new IgniteEntitySchemaBuilder(fieldDef, index)

  final class InvalidIndexException(error: String) extends RuntimeException(error)
}

case class IgniteEntitySchemaBuilder(private val fieldDef: mutable.LinkedHashMap[ColumnName, IgniteDataType],
                                     private val index: ListBuffer[QueryIndex]) {

  def withColumn(columnName: ColumnName, dataType: IgniteDataType): IgniteEntitySchemaBuilder =
    new IgniteEntitySchemaBuilder(fieldDef.addOne(columnName -> dataType), index)

  def withIndex(queryIndex: QueryIndex): IgniteEntitySchemaBuilder =
    new IgniteEntitySchemaBuilder(fieldDef, index :+ queryIndex)

  def withCaseClass[T: TypeTag]: IgniteEntitySchemaBuilder = {
    val namesToTypes = typeOf[T].members.sorted.collect {
      case m: MethodSymbol if m.isCaseAccessor =>
          m.name.toString -> fromString(m.returnType.toString)
    }
    new IgniteEntitySchemaBuilder(fieldDef.addAll(namesToTypes), index)
  }

  def build(): IgniteEntitySchema = {
    val validationError = validateSchema
    if (validationError.nonEmpty) throw new InvalidIndexException(validationError.get)

    IgniteEntitySchema(fieldDef, index.toList)
  }

  private type ValidationError = Option[String]
  private def validateSchema = indexAppliedOnAbsentField()
  private def indexAppliedOnAbsentField(): ValidationError = {
    index.foreach(_.getFieldNames.asScala.foreach(name =>
      if (!fieldDef.contains(name)) return Some(s"Field `$name` not found in schema.")
    ))
    None
  }
}