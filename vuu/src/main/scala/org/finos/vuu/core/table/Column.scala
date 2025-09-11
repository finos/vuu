package org.finos.vuu.core.table

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.table.DefaultColumnNames.allDefaultColumns
import org.finos.vuu.core.table.column.CalculatedColumnClause
import org.finos.vuu.core.table.datatype.{Decimal, EpochTimestamp}
import org.finos.vuu.util.schema.ExternalEntitySchema
import org.finos.vuu.util.types.{DefaultTypeConverters, TypeConverterContainerBuilder}

import scala.util.Try

object DataType {

  // if a new type's added, make sure that both methods `parseToDataType` & `fromString` can support it
  final val CharDataType: Class[Char] = classOf[Char]
  final val StringDataType: Class[String] = classOf[String]
  final val BooleanDataType: Class[Boolean] = classOf[Boolean]
  final val IntegerDataType: Class[Int] = classOf[Int]
  final val LongDataType: Class[Long] = classOf[Long]
  final val DoubleDataType: Class[Double] = classOf[Double]
  final val EpochTimestampType: Class[EpochTimestamp] = classOf[EpochTimestamp]
  final val DecimalType: Class[Decimal] = classOf[Decimal]
  final val NoDataType: Class[AnyRef] = classOf[AnyRef]

  def fromString(s: String): Class[_] = {
    s.trim.toLowerCase match {
      case "char" => CharDataType
      case "string" => StringDataType
      case "double" => DoubleDataType
      case "boolean" => BooleanDataType
      case "int" => IntegerDataType
      case "long" => LongDataType
      case "epochtimestamp" => EpochTimestampType
      case "decimal" => DecimalType
    }
  }

  def asString(c: Class[_]): String = {
    c.getTypeName match {
      case "java.lang.String" => "string"
      case "org.finos.vuu.core.table.datatype.EpochTimestamp" => "epochtimestamp"
      case "org.finos.vuu.core.table.datatype.Decimal" => "decimal"
      case x => x.toLowerCase
    }
  }

  def parseToDataType[T](value: String, t: Class[T]): Option[T] = {
    Try(typeConverterContainer.convert[String, T](value, classOf[String], t).get).toOption
  }

  private val typeConverterContainer = TypeConverterContainerBuilder()
    .withoutDefaults()
    .withConverter(DefaultTypeConverters.stringToCharConverter)
    .withConverter(DefaultTypeConverters.stringToBooleanConverter)
    .withConverter(DefaultTypeConverters.stringToIntConverter)
    .withConverter(DefaultTypeConverters.stringToLongConverter)
    .withConverter(DefaultTypeConverters.stringToDoubleConverter)
    .withConverter(DefaultTypeConverters.stringToEpochTimestampConverter)
    .withConverter(DefaultTypeConverters.stringToDecimalConverter)
    .build()
}

object Columns {
  def fromNames(names: String*): Array[Column] = {
    fromNames(names.toArray)
  }

  def fromNames(names: Array[String]): Array[Column] = names.zipWithIndex.map({ case (nameAndDt, index) =>

    val splitDef = nameAndDt.split(":").toList

    splitDef.size match {
      case 2 =>
        val name :: dataType :: _ = nameAndDt.split(":").toList
        val dtClass = DataType.fromString(dataType)
        SimpleColumn(name, index, dtClass)
      case 1 =>
        throw new Exception("Not datatype defined for column:" + splitDef)
    }

  }).toArray

  def from(table: TableDef, names: Seq[String]): Array[Column] = {
    table.columns.filter(c => names.contains(c.name)).map(c => new JoinColumn(c.name, c.index, c.dataType, table, c))
  }

  /**
   * Note: this method returns all columns of a given table, including the default columns of vuuCreatedTimestamp and vuuUpdatedTimestamp
   * @return JoinColumn based on all columns of a given table except the default columns
   */
  def allFrom(table: TableDef): Array[Column] = {
    allFromExcept(table)
  }

  def aliased(table: TableDef, aliases: (String, String)*): Array[Column] = {
    val aliased = aliases.map(tuple => tuple._1 -> tuple._2).toMap
    table.columns.filter(c => aliased.contains(c.name)) map (c => new AliasedJoinColumn(aliased(c.name), c.index, c.dataType, table, c).asInstanceOf[Column])
  }

  /**
   * Note: this method excludes the default columns of vuuCreatedTimestamp and vuuUpdatedTimestamp
   */
  def allFromExcept(table: TableDef, excludeColumns: String*): Array[Column] = {
    val columnsToExclude = excludeColumns ++ allDefaultColumns

    val excluded = columnsToExclude.map(s => s -> 1).toMap

    table.columns.filterNot(c => excluded.contains(c.name)).map(c => new JoinColumn(c.name, c.index, c.dataType, table, c))
  }

  /**
   * Create columns that use same name, type, order as the external entity fields
   * */
  def fromExternalSchema(externalSchema: ExternalEntitySchema): Array[Column] = {
    externalSchema.fields.map(field => SimpleColumn(field.name, field.index, field.dataType))
      .toArray
  }

}

trait Column {
  def name: String

  def index: Int

  def dataType: Class[_]

  def getData(data: RowData): Any

  def getDataFullyQualified(data: RowData): Any

  override def hashCode(): Int = name.hashCode()
}

object NoColumn extends Column {
  override def name: String = "NoColumn"

  override def index: Int = -1

  override def dataType: Class[_] = DataType.NoDataType

  override def getData(data: RowData): Any = None

  override def getDataFullyQualified(data: RowData): Any = None
}

case class SimpleColumn(name: String, index: Int, dataType: Class[_]) extends Column {
  override def getData(data: RowData): Any = {
    data.get(name)
  }

  override def getDataFullyQualified(data: RowData): Any = getData(data)
}

class AliasedJoinColumn(name: String, index: Int, dataType: Class[_], sourceTable: TableDef, sourceColumn: Column) extends JoinColumn(name, index, dataType, sourceTable, sourceColumn) {
  override def hashCode(): Int = (sourceTable.name + "." + sourceColumn + "@" + name).hashCode

  override def getData(data: RowData): Any = data.get(sourceColumn.name)

  override def getDataFullyQualified(data: RowData): Any = data.get(sourceTable.fullyQuallifiedColumnName(sourceColumn.name))
}

class JoinColumn(name: String, index: Int, dataType: Class[_], val sourceTable: TableDef, val sourceColumn: Column) extends SimpleColumn(name, index, dataType) {

  override def toString: String = s"JoinColumn($name, ${sourceTable.name}:${sourceColumn.name})"

  override def hashCode(): Int = (sourceTable.name + "." + sourceColumn + "@" + name).hashCode

  override def getDataFullyQualified(data: RowData): Any = data.get(sourceTable.fullyQuallifiedColumnName(name))

  override def getData(data: RowData): Any = data.get(name)

  override def equals(obj: scala.Any): Boolean = {
    obj match {
      case other: JoinColumn =>
        other.sourceColumn.name == this.sourceColumn.name && other.sourceTable.name == this.sourceTable.name
      case _ => false
    }
  }
}

case class CalculatedColumn(name: String, clause: CalculatedColumnClause, index: Int, dataType: Class[_]) extends Column with StrictLogging {

  override def getData(data: RowData): Any = clause.calculate(data).fold[Any](
    errMsg  => { logger.error(errMsg + " Returning `null`."); null },
    success => success.orNull
  )

  override def getDataFullyQualified(data: RowData): Any = getData(data)
}
