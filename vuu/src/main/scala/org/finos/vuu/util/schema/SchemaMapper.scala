package org.finos.vuu.util.schema

import org.finos.vuu.core.table.Column
import org.finos.vuu.util.schema.typeConversion.{TypeConverter, TypeConverterContainer, TypeConverterContainerBuilder, TypeUtils}


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
  def toMappedExternalFieldType(columnName: String, columnValue: Any): Option[Any]
  def toMappedInternalColumnType(extFieldName: String, extFieldValue: Any): Option[Any]
  def convertExternalValueToString(extFieldName: String, extFieldValue: Any): Option[String]
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
   * @param typeConverterContainer pass this if your types aren't matched exactly. Also @see [[TypeConverterContainer]]
   * */
  def apply(externalSchema: ExternalEntitySchema,
            internalColumns: Array[Column],
            columnNameByExternalField: Map[String, String],
            typeConverterContainer: TypeConverterContainer): SchemaMapper = {
    val validationError = validateSchema(externalSchema, internalColumns, columnNameByExternalField, typeConverterContainer)
    if (validationError.nonEmpty) throw InvalidSchemaMapException(validationError.get)

    new SchemaMapperImpl(externalSchema, internalColumns, columnNameByExternalField, typeConverterContainer)
  }

  /**
   * Builds a schema mapper from the following:
   *
   * @param externalSchema schema representing external fields.
   * @param internalColumns an array of internal Vuu columns.
   * @param columnNameByExternalField a map from external field names to internal column names.
   *
   * @note Similar to `apply(ExternalEntitySchema, Array[Column], Map[String, String], TypeConverterContainer)`
   * except that this uses a default `TypeConverterContainer`. For the list of default type
   * converters used @see [[org.finos.vuu.util.schema.typeConversion.DefaultTypeConverters]]
   * */
  def apply(externalSchema: ExternalEntitySchema,
            internalColumns: Array[Column],
            columnNameByExternalField: Map[String, String]): SchemaMapper = {
    SchemaMapper(externalSchema, internalColumns, columnNameByExternalField, TypeConverterContainerBuilder().build())
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
                             fieldsMap: Map[String, String],
                             typeConverterContainer: TypeConverterContainer): ValidationError = {
    Iterator(
      () => hasUniqueColumnNames(fieldsMap.values.toList),
      () => externalFieldsInMapConformsToExternalSchema(externalSchema, fieldsMap.keys),
      () => internalFieldsInMapConformsToTableColumns(internalColumns, fieldsMap.values),
      () => canSupportRequiredTypeConversions(extFieldToColMap(externalSchema, internalColumns, fieldsMap), typeConverterContainer)
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

  private def canSupportRequiredTypeConversions(extFieldToColMap: Map[SchemaField, Column],
                                                container: TypeConverterContainer): ValidationError = {
    val errorStr = extFieldToColMap.iterator
      .flatMap({ case (extF, col) => Seq((extF.dataType, col.dataType), (col.dataType, extF.dataType)) })
      .filter({ case (t1, t2) => !TypeUtils.areTypesEqual(t1, t2) && container.typeConverter(t1, t2).isEmpty })
      .map({ case (t1, t2) => s"[ ${TypeConverter.buildConverterName(t1, t2)} ]" })
      .mkString("\n")

    Option(errorStr).filter(_.nonEmpty).map("Following `TypeConverter`(s) are required but not found:\n" + _)
  }

  private def extFieldToColMap(extSchema: ExternalEntitySchema, columns: Array[Column], fieldsMap: Map[String, String]): Map[SchemaField, Column] = {
    fieldsMap.map({ case (extFieldName, columnName) =>
      val extField = extSchema.fields.find(_.name == extFieldName).get
      val column = columns.find(_.name == columnName).get
      (extField, column)
    })
  }

  final case class InvalidSchemaMapException(message: String) extends RuntimeException(message)
}

private class SchemaMapperImpl(private val externalSchema: ExternalEntitySchema,
                               private val internalColumns: Array[Column],
                               private val columnNameByExternalField: Map[String, String],
                               private val typeConverterContainer: TypeConverterContainer) extends SchemaMapper {
  private val externalFieldByColumnName: Map[String, SchemaField] = getExternalSchemaFieldsByColumnName
  private val internalColumnByExtFieldName: Map[String, Column] = getTableColumnByExternalField
  private val extFieldsMap: Map[String, SchemaField] = externalSchema.fields.map(f => (f.name, f)).toMap

  override def tableColumn(extFieldName: String): Option[Column] = internalColumnByExtFieldName.get(extFieldName)
  override def externalSchemaField(columnName: String): Option[SchemaField] = externalFieldByColumnName.get(columnName)

  override def toInternalRowMap(externalValues: List[_]): Map[String, Any] = toInternalRowMap(externalValues.toArray)
  override def toInternalRowMap(externalDto: Product): Map[String, Any] = toInternalRowMap(externalDto.productIterator.toArray)
  private def toInternalRowMap(externalValues: Array[_]): Map[String, Any] = {
    externalFieldByColumnName.map({ case (columnName, extField) =>
      val extFieldValue = externalValues(extField.index)
      // remove this get and make this return Optional (need to guard against conversion error if a user sends in a value not matching the schema type)
      val columnValue = toMappedInternalColumnType(extField.name, extFieldValue).get
      (columnName, columnValue)
    })
  }

  override def toMappedExternalFieldType(columnName: String, columnValue: Any): Option[Any] = {
    externalSchemaField(columnName).flatMap(field => {
      val col = tableColumn(field.name).get
      castToAny(col.dataType).flatMap(typeConverterContainer.convert(columnValue, _, field.dataType))
    })
  }

  override def toMappedInternalColumnType(extFieldName: String, extFieldValue: Any): Option[Any] = {
    tableColumn(extFieldName).flatMap(col => {
      val field = externalSchemaField(col.name).get
      castToAny(field.dataType).flatMap(typeConverterContainer.convert(extFieldValue, _, col.dataType))
    })
  }

  override def convertExternalValueToString(extFieldName: String, extFieldValue: Any): Option[String] = {
    extFieldsMap.get(extFieldName).flatMap(
      f => castToAny(f.dataType).flatMap(typeConverterContainer.convert(extFieldValue, _, classOf[String]))
    )
  }

  private def castToAny(cls: Class[_]): Option[Class[Any]] = cls match {
    case c: Class[Any] => Some(c)
    case _             => None
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
