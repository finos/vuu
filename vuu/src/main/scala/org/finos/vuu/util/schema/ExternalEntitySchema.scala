package org.finos.vuu.util.schema

import org.finos.vuu.util.schema.EntitySchema.{ExternalDataType, FieldName, IndexName}
import org.finos.vuu.util.schema.ExternalEntitySchemaBuilder.{InvalidIndexException, toSchemaFields}

import scala.collection.mutable.ListBuffer

trait ExternalEntitySchema {
  /**
   * @return schema fields sorted by their index (SchemaField.index).
   * */
  def fields: List[SchemaField]

  def indexes: List[SchemaIndex] = List.empty

  /**
   * @param values represents a list of values corresponding to the fields in the schema.
   * @return a map from field names to the passed values matched by field.index that is
   *         value at position 0 gets matched with the field x where x.index == 0.
   *
   * The method doesn't check for the types of passed values and would skip any fields
   * that do not have a corresponding value e.g. when `values.length` < `fields.length`.
   * */
  def toMap(values: List[_]): Map[FieldName, Any] = fields.map(_.name).zip(values).toMap
}

private case class DefaultExternalEntitySchema (override val fields: List[SchemaField],
                                                override val indexes: List[SchemaIndex]) extends ExternalEntitySchema

object EntitySchema {
  type FieldName = String
  type IndexName = String
  type ExternalDataType = Class[_]
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

case class ExternalEntitySchemaBuilder (fields: ListBuffer[(FieldName, ExternalDataType)],
                                        indexes: ListBuffer[SchemaIndex]) {

  def withField(fieldName: FieldName, dataType: ExternalDataType): ExternalEntitySchemaBuilder =
    this.copy(fields = fields.addOne(fieldName -> dataType))

  def withIndex(indexName: IndexName, fields: List[FieldName]): ExternalEntitySchemaBuilder =
    this.copy(indexes = indexes :+ SchemaIndex(indexName, fields))

  def withEntity(cls: Class[_]): ExternalEntitySchemaBuilder = {
    val namesToTypes = cls.getDeclaredFields.filter(!_.isSynthetic).map(f => (f.getName, f.getType))
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
