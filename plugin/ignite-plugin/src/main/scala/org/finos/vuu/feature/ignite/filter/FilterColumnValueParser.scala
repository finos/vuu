package org.finos.vuu.feature.ignite.filter

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.{Column, DataType}
import org.finos.vuu.feature.ignite.filter.FilterColumnValueParser.{ErrorMessage, ParsedResult}
import org.finos.vuu.util.schema.{SchemaField, SchemaMapper}

protected trait FilterColumnValueParser {
  def parse(columnName: String, columnValue: String): Either[ErrorMessage, ParsedResult[Any]]
  def parse(columnName: String, columnValues: List[String]): Either[ErrorMessage, ParsedResult[List[Any]]]
}

protected object FilterColumnValueParser {
  def apply(schemaMapper: SchemaMapper): FilterColumnValueParser = {
    new ColumnValueParser(schemaMapper)
  }

  case class ParsedResult[T](externalField: SchemaField, externalData: T)

  type ErrorMessage = String

  val STRING_DATA_TYPE: Class[String] = classOf[String]
}

private class ColumnValueParser(private val mapper: SchemaMapper) extends FilterColumnValueParser with StrictLogging {

  override def parse(columnName: String, columnValue: String): Either[ErrorMessage, ParsedResult[Any]] = {
    mapper.externalSchemaField(columnName) match {
      case Some(f) => RawColumnValueParser(f).parse(columnValue).map(ParsedResult(f, _))
      case None    => Left(externalFieldNotFoundError(columnName))
    }
  }

  override def parse(columnName: String, columnValues: List[String]): Either[ErrorMessage, ParsedResult[List[Any]]] = {
    mapper.externalSchemaField(columnName) match {
      case Some(f) => parseValues(RawColumnValueParser(f), columnValues)
      case None    => Left(externalFieldNotFoundError(columnName))
    }
  }

  private def parseValues(parser: RawColumnValueParser,
                          columnValues: List[String]): Either[ErrorMessage, ParsedResult[List[Any]]] = {
    val (errors, parsedValues) = columnValues.partitionMap(parser.parse)
    val combinedError = errors.mkString("\n")

    if (parsedValues.isEmpty) {
      Left(combinedError)
    } else {
      if (errors.nonEmpty) logger.error(
        s"Failed to parse some of the column values corresponding to the column ${parser.column.name}: \n $combinedError"
      )
      Right(ParsedResult(parser.field, parsedValues))
    }
  }

  private def externalFieldNotFoundError(columnName: String): String =
    s"Failed to find mapped external field for column `$columnName`"

  private case class RawColumnValueParser(field: SchemaField) {
    val column: Column = mapper.tableColumn(field.name).get

    def parse(columnValue: String): Either[ErrorMessage, Any] = {
      parseStringToColumnDataType(columnValue).flatMap(convertColumnValueToExternalFieldType)
    }

    private def parseStringToColumnDataType(value: String): Either[ErrorMessage, Any] =
      DataType.parseToDataType(value, column.dataType) match {
        case Some(v) => Right(v)
        case None    => Left(s"Failed to parse column value '$value' to data type `${column.dataType}`.")
      }

    private def convertColumnValueToExternalFieldType(columnValue: Any): Either[ErrorMessage, Any] =
      mapper.toMappedExternalFieldType(column.name, columnValue)
        .toRight(s"Failed to convert column value `$columnValue` from `${column.dataType}` to external type `${field.dataType}`")
  }
}
