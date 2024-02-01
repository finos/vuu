package org.finos.vuu.feature.ignite.schema

import org.finos.vuu.core.table.Column

trait SchemaMapper {
  def tableColumns: Array[Column]

  def tableColumn(extFieldName: String): Option[Column]

  def externalSchemaField(columnName: String): Option[SchemaField]

  def toTableRowData(values: List[_]): Map[String, Any]
}

object SchemaMapper {
  def apply(externalSchema: ExternalStoreEntitySchema, tableColumnByExternalField: Map[String, Column]): SchemaMapper = {
    validateSchema(externalSchema, tableColumnByExternalField)
    new SchemaMapperImpl(externalSchema, tableColumnByExternalField)
  }

  private def validateSchema(externalSchema: ExternalStoreEntitySchema, tableColumnByExternalField: Map[String, Column]): Unit = {
    tableColumnByExternalField.keys.foreach(
      fieldName => {
        val exists = externalSchema.schemaFields.exists(_.name == fieldName)
        if (!exists) throw InvalidSchemaMapException(s"Field `$fieldName` not found in external schema")
      }
    )
  }

  final case class InvalidSchemaMapException(message: String) extends RuntimeException(message)
}

private class SchemaMapperImpl(private val externalSchema: ExternalStoreEntitySchema,
                                 private val tableColumnByExternalField: Map[String, Column]) extends SchemaMapper {
  private val _schemaFields = externalSchema.schemaFields
  private val externalSchemaFieldsByColumnName: Map[String, SchemaField] = getExternalSchemaFieldsByColumnName

  override def tableColumns: Array[Column] = tableColumnByExternalField.values.toArray
  override def tableColumn(extFieldName: String): Option[Column] = tableColumnByExternalField.get(extFieldName)
  override def externalSchemaField(columnName: String): Option[SchemaField] = externalSchemaFieldsByColumnName.get(columnName)
  override def toTableRowData(values: List[_]): Map[String, Any] = {
    tableColumns.map(column => {
      val f = externalSchemaField(column.name).get
      val columnValue = values(f.index) // @todo add type conversion conforming to the passed schema
      (column.name, columnValue)
    }).toMap
  }

  private def getExternalSchemaFieldsByColumnName = {
    _schemaFields.map(
      f => if (tableColumnByExternalField.contains(f.name)) (tableColumnByExternalField(f.name).name, f) else null
    ).filter(v => v != null).toMap
  }
}
