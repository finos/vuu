package org.finos.vuu.feature.ignite.schema

import org.finos.vuu.feature.ignite.schema.EntitySchema.{ColumnName, Index, IndexName}
import org.finos.vuu.feature.ignite.schema.ExternalDataType.{ExternalDataType, fromString}
import org.finos.vuu.feature.ignite.schema.ExternalEntitySchemaBuilder.InvalidIndexException

import scala.collection.mutable
import scala.collection.mutable.ListBuffer
import scala.reflect.runtime.universe.{MethodSymbol, TypeTag, typeOf}

trait ExternalEntitySchema {
  val schemaFields: List[SchemaField]
  val index: List[Index] = List.empty
}

case class DefaultExternalEntitySchema private (private val columnDef: mutable.LinkedHashMap[ColumnName, ExternalDataType],
                                                override val index: List[Index]) extends ExternalEntitySchema {

  override val schemaFields: List[SchemaField] = columnDef.zipWithIndex.map(
    {case ((name, dType), i) => SchemaField(name, dType, i)}
  ).toList
}

object EntitySchema {
  type ColumnName = String
  type IndexName = String
  type Index = (IndexName, List[ColumnName])
}

object ExternalDataType extends Enumeration {
  type ExternalDataType = Class[_]
  val Int : ExternalDataType =  classOf[Int]
  val String : ExternalDataType =  classOf[String]
  val Double : ExternalDataType =  classOf[Double]
  val Long : ExternalDataType =  classOf[Long]

  def fromString(s: String): ExternalDataType = {
    s.trim.toLowerCase match {
      case "string" => ExternalDataType.String
      case "double" => ExternalDataType.Double
      case "int"    => ExternalDataType.Int
      case "long"   => ExternalDataType.Long
      case _        => throw new RuntimeException(s"Unsupported type passed: $s")
    }
  }
}

object ExternalEntitySchemaBuilder {
  def apply(fieldDef: mutable.LinkedHashMap[ColumnName, ExternalDataType] = mutable.LinkedHashMap.empty,
            index: ListBuffer[Index] = ListBuffer.empty): ExternalEntitySchemaBuilder =
    new ExternalEntitySchemaBuilder(fieldDef, index)

  final class InvalidIndexException(error: String) extends RuntimeException(error)
}

case class ExternalEntitySchemaBuilder(private val fieldDef: mutable.LinkedHashMap[ColumnName, ExternalDataType],
                                       private val index: ListBuffer[Index]) {

  def withColumn(columnName: ColumnName, dataType: ExternalDataType): ExternalEntitySchemaBuilder =
    new ExternalEntitySchemaBuilder(fieldDef.addOne(columnName -> dataType), index)

  def withIndex(indexName: IndexName, fields: List[ColumnName]): ExternalEntitySchemaBuilder =
    new ExternalEntitySchemaBuilder(fieldDef, index :+ (indexName, fields))

  def withCaseClass[T: TypeTag]: ExternalEntitySchemaBuilder = {
    val namesToTypes = typeOf[T].members.sorted.collect {
      case m: MethodSymbol if m.isCaseAccessor =>
        m.name.toString -> fromString(m.returnType.toString)
    }
    new ExternalEntitySchemaBuilder(fieldDef.addAll(namesToTypes), index)
  }

  def build(): ExternalEntitySchema = {
    val validationError = validateSchema
    if (validationError.nonEmpty) throw new InvalidIndexException(validationError.get)

    DefaultExternalEntitySchema(fieldDef, index.toList)
  }

  private type ValidationError = Option[String]
  private def validateSchema = indexAppliedOnAbsentField()
  private def indexAppliedOnAbsentField(): ValidationError = {
    val error = index
      .flatMap({ case (indexName, fields) => fields.map((indexName, _)) })
      .filter({ case (_, f) => !fieldDef.contains(f) })
      .zipWithIndex
      .map({ case ((indexName, f), i) => s"${i + 1}) Field `$f` in index `$indexName` not found in schema." })
      .mkString(" ")

    Option(error).filter(_.nonEmpty)
  }
}
