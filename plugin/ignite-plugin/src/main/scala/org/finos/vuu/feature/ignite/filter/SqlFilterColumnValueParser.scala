package org.finos.vuu.feature.ignite.filter

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.{Column, DataType}
import org.finos.vuu.feature.ignite.filter.SqlFilterColumnValueParser.{ErrorMessage, ParsedResult, STRING_DATA_TYPE}
import org.finos.vuu.util.schema.{SchemaField, SchemaMapper}
import org.finos.vuu.util.types.TypeUtils

protected trait SqlFilterColumnValueParser {
  def parseColumnValue(columnName: String, columnValue: String): Either[ErrorMessage, ParsedResult[String]]
  def parseColumnValues(columnName: String, columnValues: List[String]): Either[ErrorMessage, ParsedResult[List[String]]]
}

protected object SqlFilterColumnValueParser {
  def apply(schemaMapper: SchemaMapper, toStringContainer: SqlStringConverterContainer): SqlFilterColumnValueParser = {
    new ColumnValueParser(schemaMapper, toStringContainer)
  }

  case class ParsedResult[T](externalField: SchemaField, data: T)

  type ErrorMessage = String

  val STRING_DATA_TYPE: Class[String] = classOf[String]
}

private class ColumnValueParser(private val mapper: SchemaMapper,
                                private val toStringContainer: SqlStringConverterContainer
                               ) extends SqlFilterColumnValueParser with StrictLogging {

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

    def parse(columnValue: String): Either[ErrorMessage, String] = {
      parseStringToColumnDataType(columnValue)
        .flatMap(convertColumnValueToExternalFieldType)
        .map(convertExternalValueToString)
        .flatMap(checkForSqlInjection)
    }

    private def parseStringToColumnDataType(value: String): Either[ErrorMessage, Any] =
      DataType.parseToDataType(value, column.dataType)

    private def convertColumnValueToExternalFieldType(columnValue: Any): Either[ErrorMessage, Any] =
      mapper.toMappedExternalFieldType(column.name, columnValue)
        .toRight(s"Failed to convert column value `$columnValue` from `${column.dataType}` to external type `${field.dataType}`")

    private def convertExternalValueToString(value: Any): String =
      if (TypeUtils.areTypesEqual(field.dataType, STRING_DATA_TYPE)) {
        quotedString(defaultToString(value))
      } else {
        toStringContainer.toString(value, field.dataType.asInstanceOf[Class[Any]])
          .getOrElse(addQuotesIfRequired(defaultToString(value), field.dataType))
      }

    private def defaultToString(value: Any): String = Option(value).map(_.toString).orNull

    private def addQuotesIfRequired(v: String, dataType: Class[_]): String =
      if (requireQuotes(dataType)) quotedString(v) else v

    private def quotedString(s: String) = s"'$s'"

    private object requireQuotes {
      def apply(dt: Class[_]): Boolean = {
        dataTypesRequiringQuotes.contains(dt)
      }

      private val dataTypesRequiringQuotes: Set[Class[_]] = Set(
        classOf[Char],
        classOf[java.lang.Character],
        classOf[java.sql.Date],
      )
    }
  }

  /**
   * This adds a limitation on what can be passed to the filters in order to prevent SQL injection attacks.
   */
  private def checkForSqlInjection(v: String): Either[ErrorMessage, String] = {
    val isSingleQuotedAndNotContainsAnyOtherSingleQuotes = v.matches("^'[^']+'$")
    val isNotQuotedAndContainsOnlyDigits = v.matches("[0-9]+([.][0-9]+)?")

    if (
      isSingleQuotedAndNotContainsAnyOtherSingleQuotes ||
      isNotQuotedAndContainsOnlyDigits
    ) {
      Right(v)
    } else {
      logger.warn(s"Potential SQL injection noticed with $v")
      Left(s"Invalid value passed to filters: $v")
    }
  }
}
