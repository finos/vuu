package org.finos.vuu.util.schema

import org.finos.vuu.util.schema.EntitySchema.{FieldName, IndexName}
import org.finos.vuu.util.schema.ExternalDataType.{ExternalDataType, fromString}
import org.finos.vuu.util.schema.ExternalEntitySchemaBuilder.{InvalidIndexException, toSchemaFields}

import scala.collection.mutable.ListBuffer
import scala.reflect.runtime.universe.{MethodSymbol, TypeTag, typeOf}

trait ExternalEntitySchema {
  val fields: List[SchemaField]
  val indexes: List[SchemaIndex] = List.empty
}

private case class DefaultExternalEntitySchema private (override val fields: List[SchemaField],
                                                        override val indexes: List[SchemaIndex]) extends ExternalEntitySchema

object EntitySchema {
  type FieldName = String
  type IndexName = String
}

object ExternalDataType extends Enumeration {
  type ExternalDataType = Class[_]
  val Int : ExternalDataType =  classOf[Int]
  val String : ExternalDataType =  classOf[String]
  val Double : ExternalDataType =  classOf[Double]
  val Long : ExternalDataType =  classOf[Long]
  val Char : ExternalDataType = classOf[Char]

  def fromString(s: String): ExternalDataType = {
    s.trim.toLowerCase match {
      case "string" => ExternalDataType.String
      case "double" => ExternalDataType.Double
      case "int"    => ExternalDataType.Int
      case "long"   => ExternalDataType.Long
      case "char"   => ExternalDataType.Char
      case _        => throw new RuntimeException(s"Unsupported type passed: $s")
    }
  }
}

object ExternalEntitySchemaBuilder {
  def apply(): ExternalEntitySchemaBuilder = ExternalEntitySchemaBuilder(ListBuffer.empty, ListBuffer.empty)

  def apply(fields: ListBuffer[(FieldName, ExternalDataType)],
            indexes: ListBuffer[SchemaIndex]): ExternalEntitySchemaBuilder =
    new ExternalEntitySchemaBuilder(fields, indexes)

  private def toSchemaFields(fields: ListBuffer[(FieldName, ExternalDataType)]) =
    fields.zipWithIndex.map({ case ((name, dType), i) => SchemaField(name, dType, i) }).toList

  final class InvalidIndexException(error: String) extends RuntimeException(error)
}

case class ExternalEntitySchemaBuilder private (private val fields: ListBuffer[(FieldName, ExternalDataType)],
                                                private val indexes: ListBuffer[SchemaIndex]) {

  def withField(fieldName: FieldName, dataType: ExternalDataType): ExternalEntitySchemaBuilder =
    this.copy(fields = fields.addOne(fieldName -> dataType))

  def withIndex(indexName: IndexName, fields: List[FieldName]): ExternalEntitySchemaBuilder =
    this.copy(indexes = indexes :+ SchemaIndex(indexName, fields))

  def withCaseClass[T: TypeTag]: ExternalEntitySchemaBuilder = {
    val namesToTypes = typeOf[T].members.sorted.collect {
      case m: MethodSymbol if m.isCaseAccessor =>
        m.name.toString -> fromString(m.returnType.toString)
    }
    this.copy(fields = fields.addAll(namesToTypes))
  }

  def build(): ExternalEntitySchema = {
    val validationError = validateSchema
    if (validationError.nonEmpty) throw new InvalidIndexException(validationError.get)

    DefaultExternalEntitySchema(toSchemaFields(fields), indexes.toList)
  }

  private type ValidationError = Option[String]
  private def validateSchema = indexAppliedOnAbsentField()
  private def indexAppliedOnAbsentField(): ValidationError = {
    val error = indexes
      .flatMap(idx => idx.fields.map((idx.name, _)))
      .filter({ case (_, f) => !fields.exists(field => field._1 == f) })
      .zipWithIndex
      .map({ case ((indexName, f), i) => s"${i + 1}) Field `$f` in index `$indexName` not found in schema." })
      .mkString(" ")

    Option(error).filter(_.nonEmpty)
  }
}
