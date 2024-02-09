package org.finos.vuu.feature.ignite.schema

import org.finos.vuu.core.table.Column

trait SchemaMapper {
  def tableColumn(extFieldName: String): Option[Column]

  def externalSchemaField(columnName: String): Option[SchemaField]

  def toTableRowData(values: List[_]): Map[String, Any]
}

object SchemaMapper {
  def apply(externalSchema: ExternalStoreEntitySchema,
            internalColumns: Array[Column],
            columnNameByExternalField: Map[String, String]): SchemaMapper = {
    val validationError = validateSchema(externalSchema, internalColumns, columnNameByExternalField)
    if (validationError.nonEmpty) throw InvalidSchemaMapException(validationError.get)

    new SchemaMapperImpl(externalSchema, internalColumns, columnNameByExternalField)
  }

  private type ValidationError = Option[String]
  private def validateSchema(externalSchema: ExternalStoreEntitySchema,
                             internalColumns: Array[Column],
                             fieldsMap: Map[String, String]): ValidationError = {
    Iterator(
      () => hasUniqueColumnNames(fieldsMap.values.toList),
      () => externalFieldsInMapConformsToExternalSchema(externalSchema, fieldsMap.keys),
      () => internalFieldsInMapMatchTableColumns(internalColumns, fieldsMap.values)
    ).map(_()).find(_.nonEmpty).flatten
  }

  private def hasUniqueColumnNames(columnNames: List[String]): ValidationError = {
    Option.when(columnNames.distinct.size != columnNames.size)(s"Fields map contains duplicated column names")
  }

  private def externalFieldsInMapConformsToExternalSchema(externalSchema: ExternalStoreEntitySchema,
                                                          externalFields: Iterable[String]): ValidationError = {
    externalFields
      .find(field => externalSchema.schemaFields.forall(_.name != field))
      .map(f => s"Field `$f` not found in external schema")
  }

  private def internalFieldsInMapMatchTableColumns(columns: Array[Column],
                                                   internalFields: Iterable[String]): ValidationError = {
    internalFields
      .find(columnName => columns.forall(_.name != columnName))
      .map(columnName => s"Column `$columnName` not found in internal columns")
      .orElse(Option.when(columns.length > internalFields.size)(s"More internal columns passed than mapped fields"))
  }

  final case class InvalidSchemaMapException(message: String) extends RuntimeException(message)
}

private class SchemaMapperImpl(private val externalSchema: ExternalStoreEntitySchema,
                               private val tableColumns: Array[Column],
                               private val columnNameByExternalField: Map[String, String]) extends SchemaMapper {
  private val externalSchemaFieldsByColumnName: Map[String, SchemaField] = getExternalSchemaFieldsByColumnName
  private val tableColumnByExternalField: Map[String, Column] = getTableColumnByExternalField

  override def tableColumn(extFieldName: String): Option[Column] = tableColumnByExternalField.get(extFieldName)
  override def externalSchemaField(columnName: String): Option[SchemaField] = externalSchemaFieldsByColumnName.get(columnName)
  override def toTableRowData(values: List[_]): Map[String, Any] = {
    tableColumns.map(column => {
      val f = externalSchemaField(column.name).get
      val columnValue = values(f.index) // @todo add type conversion conforming to the passed schema
      (column.name, columnValue)
    }).toMap
  }

  private def getExternalSchemaFieldsByColumnName =
    externalSchema.schemaFields.flatMap(f =>
      Option.when(columnNameByExternalField.contains(f.name))(columnNameByExternalField(f.name), f)
    ).toMap

  private def getTableColumnByExternalField =
    columnNameByExternalField.flatMap({
      case (extFieldName, columnName) => tableColumns.find(_.name == columnName).map((extFieldName, _))
    })
}
