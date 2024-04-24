package org.finos.vuu.feature.ignite.filter

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.{Column, DataType}
import org.finos.vuu.feature.ignite.filter.SqlFilterColumnValueParser.{ErrorMessage, ParsedResult}
import org.finos.vuu.util.schema.typeConversion.TypeConverter.buildConverterName
import org.finos.vuu.util.schema.{SchemaField, SchemaMapper}

protected trait SqlFilterColumnValueParser {
  def parseColumnValue(columnName: String, columnValue: String): Either[ErrorMessage, ParsedResult[String]]
  def parseColumnValues(columnName: String, columnValues: List[String]): Either[ErrorMessage, ParsedResult[List[String]]]
}

protected object SqlFilterColumnValueParser {
  def apply(schemaMapper: SchemaMapper): SqlFilterColumnValueParser = new ColumnValueParser(schemaMapper)

  case class ParsedResult[T](externalField: SchemaField, data: T)

  type ErrorMessage = String
}

private class ColumnValueParser(private val mapper: SchemaMapper) extends SqlFilterColumnValueParser with StrictLogging {

  override def parseColumnValue(columnName: String, columnValue: String): Either[ErrorMessage, ParsedResult[String]] = {
    mapper.externalSchemaField(columnName) match {
      case Some(f) => RawColumnValueParser(f).parse(columnValue).map(ParsedResult(f, _))
      case None    => Left(externalFieldNotFoundError(columnName))
    }
  }

  override def parseColumnValues(columnName: String, columnValues: List[String]): Either[ErrorMessage, ParsedResult[List[String]]] = {
    mapper.externalSchemaField(columnName) match {
      case Some(f) => parseColumnValues(RawColumnValueParser(f), columnValues)
      case None    => Left(externalFieldNotFoundError(columnName))
    }
  }

  private def parseColumnValues(parser: RawColumnValueParser,
                                columnValues: List[String]): Either[ErrorMessage, ParsedResult[List[String]]] = {
    val (errors, parsedValues) = columnValues.partitionMap(parser.parse)
    val combinedError = errors.mkString("\n")

    if (parsedValues.isEmpty) return Left(combinedError)

    if (errors.nonEmpty) logger.error(s"Failed to parse some of the column values corresponding to " +
      s"the column ${parser.column.name}: \n $combinedError"
    )

    Right(ParsedResult(parser.field, parsedValues))
  }

  private def externalFieldNotFoundError(columnName: String): String =
    s"Failed to find mapped external field for column `$columnName`"

  private case class RawColumnValueParser(field: SchemaField) {
    val column: Column = mapper.tableColumn(field.name).get

    def parse(columnValue: String): Either[ErrorMessage, String] = {
      parseStringToColumnDataType(columnValue)
        .flatMap(convertColumnValueToExternalFieldType)
        .map(convertExternalValueToString)
    }

    private def parseStringToColumnDataType(value: String): Either[ErrorMessage, Any] =
      DataType.parseToDataType(value, column.dataType)

    private def convertColumnValueToExternalFieldType(columnValue: Any): Either[ErrorMessage, Any] =
      mapper.toMappedExternalFieldType(column.name, columnValue)
        .toRight(s"Failed to convert column value `$columnValue` from `${column.dataType}` to external type `${field.dataType}`")

    private def convertExternalValueToString(value: Any): String =
      mapper.convertExternalValueToString(field.name, value).getOrElse(logWarningAndUseDefaultToString(value))

    private def logWarningAndUseDefaultToString(value: Any): String = {
      logger.warn(
        s"Could not find a converter [${buildConverterName(field.dataType, classOf[String])}] " +
          s"required for SQL filters to be applied to ${field.name}. Falling back to using the " +
          s"default `toString`."
      )
      Option(value).map(_.toString).orNull
    }
  }
}
