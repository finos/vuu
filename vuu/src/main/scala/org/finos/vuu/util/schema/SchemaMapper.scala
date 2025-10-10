package org.finos.vuu.util.schema

import org.finos.vuu.core.table.Column
import org.finos.vuu.util.schema.SchemaMapper.InvalidSchemaMapException
import org.finos.vuu.util.types.*

import scala.util.Try


/**
 * This class provides utility methods related to mapping external fields to internal columns
 * and vice versa.
 * */
trait SchemaMapper {
  def internalVuuColumn(extFieldName: String): Option[Column]
  def externalSchemaField(columnName: String): Option[SchemaField]
  def toMappedExternalFieldType(columnName: String, columnValue: Any): Option[Any]
  def toMappedInternalColumnType(extFieldName: String, extFieldValue: Any): Option[Any]
  def toInternalRowMap(externalValues: List[_]): Map[String, Any]
  def toInternalRowMap(externalDto: Product): Map[String, Any]
}

object SchemaMapper {
  final case class InvalidSchemaMapException(message: String) extends RuntimeException(message)
}

private class SchemaMapperImpl(private val externalSchema: ExternalEntitySchema,
                               private val internalColumns: Array[Column],
                               private val columnNameByExternalField: Map[String, String],
                               private val typeConverterContainer: TypeConverterContainer) extends SchemaMapper {
  private val externalFieldByColumnName: Map[String, SchemaField] = getExternalSchemaFieldsByColumnName
  private val internalColumnByExtFieldName: Map[String, Column] = getTableColumnByExternalField

  override def internalVuuColumn(extFieldName: String): Option[Column] = internalColumnByExtFieldName.get(extFieldName)
  override def externalSchemaField(columnName: String): Option[SchemaField] = externalFieldByColumnName.get(columnName)

  override def toInternalRowMap(externalValues: List[_]): Map[String, Any] = toInternalRowMap(externalValues.toArray)
  override def toInternalRowMap(externalDto: Product): Map[String, Any] = toInternalRowMap(externalDto.productIterator.toArray)
  private def toInternalRowMap(externalValues: Array[_]): Map[String, Any] = {
    externalFieldByColumnName.map({ case (columnName, extField) =>
      val extFieldValue = externalValues(extField.index)
      // @todo remove this get and make this return Optional (need to guard against conversion error if a user sends in a value not matching the schema type)
      val columnValue = toMappedInternalColumnType(extField.name, extFieldValue).get
      (columnName, columnValue)
    })
  }

  override def toMappedExternalFieldType(columnName: String, columnValue: Any): Option[Any] = {
    externalSchemaField(columnName).flatMap(field => {
      val col = internalVuuColumn(field.name).get
      safeTypeConvert(columnValue, castToAny(col.dataType), field.dataType)
    })
  }

  override def toMappedInternalColumnType(extFieldName: String, extFieldValue: Any): Option[Any] = {
    internalVuuColumn(extFieldName).flatMap(col => {
      val field = externalSchemaField(col.name).get
      safeTypeConvert(extFieldValue, castToAny(field.dataType), col.dataType)
    })
  }

  /**
   * Required since we're using `Any` type, so good to guard against any values being passed in that doesn't
   * match the field/column type.
   * */
  private def safeTypeConvert[T](value: Any, fromClass: Class[Any], toClass: Class[T]): Option[T] = {
    Try(typeConverterContainer.convert(value, fromClass, toClass).get).toOption
  }

  private def castToAny(cls: Class[_]): Class[Any] = cls.asInstanceOf[Class[Any]]

  private def getExternalSchemaFieldsByColumnName =
    externalSchema.fields.flatMap(f =>
      Option.when(columnNameByExternalField.contains(f.name))(columnNameByExternalField(f.name), f)
    ).toMap

  private def getTableColumnByExternalField =
    columnNameByExternalField.flatMap({
      case (extFieldName, columnName) => internalColumns.find(_.name == columnName).map((extFieldName, _))
    })
}

object SchemaMapperBuilder {

  /**
   * Returns a builder to build schema mapper using the following:
   *
   * @param externalSchema schema representing external fields.
   * @param internalColumns an array of internal Vuu columns.
   */
  def apply(externalSchema: ExternalEntitySchema, internalColumns: Array[Column]): SchemaMapperBuilder = {
    val defaultTypeConverterContainer = TypeConverterContainerBuilder().build()

    new SchemaMapperBuilder(
      externalSchema,
      internalColumns,
      mapFieldsToColumns(externalSchema.fields, internalColumns),
      defaultTypeConverterContainer
    )
  }

  private def mapFieldsToColumns(fields: List[SchemaField], columns: Array[Column]): Map[String, String] = {
    fields.flatMap(f => columns.find(_.index == f.index).map(col => (f.name, col.name))).toMap
  }
}

case class SchemaMapperBuilder (externalSchema: ExternalEntitySchema,
                                internalColumns: Array[Column],
                                fieldsMap: Map[String, String],
                                typeConverterContainer: TypeConverterContainer) {

  /**
   * This method replaces the default map `external-field -> internal-vuu-column`. Default map is basically
   * built from the passed fields and columns matching and performs a simple mapping by their indexes e.g.
   * `Column.index` and `SchemaField.index`.
   * */
  def withFieldsMap(m: Map[String, String]): SchemaMapperBuilder = {
    this.copy(fieldsMap = m)
  }

  /**
   * This method replaces the default `TypeConverterContainer` with the user defined container. For the list of
   * default type converters used @see [[DefaultTypeConverters]].
   *
   * Replace only if you have a type mapping not supported by the default converters.
  * */
  def withTypeConverters(tcc: TypeConverterContainer): SchemaMapperBuilder = {
    this.copy(typeConverterContainer = tcc)
  }

  def build(): SchemaMapper = {
    val validationError = validateSchema(externalSchema, internalColumns, fieldsMap, typeConverterContainer)
    if (validationError.nonEmpty) throw InvalidSchemaMapException(validationError.get)

    new SchemaMapperImpl(externalSchema, internalColumns, fieldsMap, typeConverterContainer)
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
}
