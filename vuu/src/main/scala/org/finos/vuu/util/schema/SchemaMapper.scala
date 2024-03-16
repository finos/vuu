package org.finos.vuu.util.schema

import org.finos.vuu.core.table.Column


/**
 * This class provides utility methods related to mapping external fields to internal columns
 * and vice versa.
 *
 * @note For now converter functions i.e. `toInternalRowMap` doesn't perform any type-checks and/or
 * type conversions. That feature is part of our roadmap and will be introduced in near
 * future.
 * */
trait SchemaMapper {
  def tableColumn(extFieldName: String): Option[Column]
  def externalSchemaField(columnName: String): Option[SchemaField]
  def toInternalRowMap(externalValues: List[_]): Map[String, Any]
  def toInternalRowMap(externalDto: Product): Map[String, Any]
}

object SchemaMapper {
  /**
   * Builds a schema mapper from the following:
   *
   * @param externalSchema schema representing external fields.
   * @param internalColumns an array of internal Vuu columns.
   * @param columnNameByExternalField a map from external field names to internal column names.
   * */
  def apply(externalSchema: ExternalEntitySchema,
            internalColumns: Array[Column],
            columnNameByExternalField: Map[String, String]): SchemaMapper = {
    val validationError = validateSchema(externalSchema, internalColumns, columnNameByExternalField)
    if (validationError.nonEmpty) throw InvalidSchemaMapException(validationError.get)

    new SchemaMapperImpl(externalSchema, internalColumns, columnNameByExternalField)
  }

  /**
   * Builds a schema mapper from the following:
   *
   * @param externalSchema schema representing external fields.
   * @param internalColumns an array of internal Vuu columns.
   *
   * @note Similar to `apply(ExternalEntitySchema, Array[Column], Map[String, String])`
   * except that this method builds the `field->column` map from the passed fields
   * and columns matching them by their indexes (`Column.index` and `SchemaField.index`).
   *
   * @see [[SchemaMapper.apply]]
   * */
  def apply(externalSchema: ExternalEntitySchema, internalColumns: Array[Column]): SchemaMapper = {
    val columnNameByExternalField = mapFieldsToColumns(externalSchema.fields, internalColumns)
    SchemaMapper(externalSchema, internalColumns, columnNameByExternalField)
  }

  private def mapFieldsToColumns(fields: List[SchemaField], columns: Array[Column]): Map[String, String] = {
    fields.flatMap(f => columns.find(_.index == f.index).map(col => (f.name, col.name))).toMap
  }

  private type ValidationError = Option[String]
  private def validateSchema(externalSchema: ExternalEntitySchema,
                             internalColumns: Array[Column],
                             fieldsMap: Map[String, String]): ValidationError = {
    Iterator(
      () => hasUniqueColumnNames(fieldsMap.values.toList),
      () => externalFieldsInMapConformsToExternalSchema(externalSchema, fieldsMap.keys),
      () => internalFieldsInMapConformsToTableColumns(internalColumns, fieldsMap.values)
    ).map(_()).find(_.nonEmpty).flatten
  }

  private def hasUniqueColumnNames(columnNames: List[String]): ValidationError = {
    Option.when(columnNames.distinct.size != columnNames.size)(s"Fields map contains duplicated column names")
  }

  private def externalFieldsInMapConformsToExternalSchema(externalSchema: ExternalEntitySchema,
                                                          externalFields: Iterable[String]): ValidationError = {
    externalFields
      .find(field => externalSchema.fields.forall(_.name != field))
      .map(f => s"Field `$f` not found in external schema")
  }

  private def internalFieldsInMapConformsToTableColumns(columns: Array[Column],
                                                        internalFields: Iterable[String]): ValidationError = {
    internalFields
      .find(columnName => columns.forall(_.name != columnName))
      .map(columnName => s"Column `$columnName` not found in internal columns")
  }

  final case class InvalidSchemaMapException(message: String) extends RuntimeException(message)
}

private class SchemaMapperImpl(private val externalSchema: ExternalEntitySchema,
                               private val internalColumns: Array[Column],
                               private val columnNameByExternalField: Map[String, String]) extends SchemaMapper {
  private val externalFieldByColumnName: Map[String, SchemaField] = getExternalSchemaFieldsByColumnName
  private val internalColumnByExtFieldName: Map[String, Column] = getTableColumnByExternalField

  override def tableColumn(extFieldName: String): Option[Column] = internalColumnByExtFieldName.get(extFieldName)
  override def externalSchemaField(columnName: String): Option[SchemaField] = externalFieldByColumnName.get(columnName)
  override def toInternalRowMap(externalValues: List[_]): Map[String, Any] = toInternalRowMap(externalValues.toArray)
  override def toInternalRowMap(externalDto: Product): Map[String, Any] = toInternalRowMap(externalDto.productIterator.toArray)

  private def toInternalRowMap(externalValues: Array[_]): Map[String, Any] = {
    externalFieldByColumnName.keys.map(columnName => {
      val field = externalSchemaField(columnName).get
      val columnValue = externalValues(field.index) // @todo add type conversion conforming to the passed schema
      (columnName, columnValue)
    }).toMap
  }

  private def getExternalSchemaFieldsByColumnName =
    externalSchema.fields.flatMap(f =>
      Option.when(columnNameByExternalField.contains(f.name))(columnNameByExternalField(f.name), f)
    ).toMap

  private def getTableColumnByExternalField =
    columnNameByExternalField.flatMap({
      case (extFieldName, columnName) => internalColumns.find(_.name == columnName).map((extFieldName, _))
    })
}
