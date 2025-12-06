package org.finos.vuu.core.table

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.table.column.CalculatedColumnClause
import org.finos.vuu.core.table.datatype.EpochTimestamp
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
    }
  }

  def asString(c: Class[_]): String = {
    c.getTypeName match {
      case "java.lang.String" => "string"
      case "org.finos.vuu.core.table.datatype.EpochTimestamp" => "epochtimestamp"
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
    .build()
}

object Columns {
  def fromNames(names: String*): Array[Column] = {
    fromNames(names.toArray)
  }

  def fromNames(names: Array[String]): Array[Column] = names.zipWithIndex.map({ case (nameAndDt, index) =>

    val splitDef = nameAndDt.split(":").toList

    splitDef match {
      case name :: dataType :: _ =>
        val dtClass = DataType.fromString(dataType)
        SimpleColumn(name, index, dtClass)
      case _ => throw new Exception(s"Invalid format: $nameAndDt")
    }
    
  }).toArray

  def from(table: TableDef, names: Seq[String]): Array[Column] = {
    table.customColumns.filter(c => names.contains(c.name)).map(c => JoinColumn(c.name, c.index, c.dataType, table, c, isAlias = false))
  }

  /**
   * Note: this method returns all columns of a given table, excluding the default columns
   * @return JoinColumn based on all columns of a given table except the default columns
   */
  def allFrom(table: TableDef): Array[Column] = {
    table.customColumns.map(c => JoinColumn(c.name, c.index, c.dataType, table, c, isAlias = false))
  }

  def aliased(table: TableDef, aliases: (String, String)*): Array[Column] = {
    val aliased = aliases.map(tuple => tuple._1 -> tuple._2).toMap
    table.customColumns.filter(c => aliased.contains(c.name)).map(c => JoinColumn(aliased(c.name), c.index, c.dataType, table, c, isAlias = true).asInstanceOf[Column])
  }

  /**
   * Note: this method excludes the default columns 
   */
  def allFromExcept(table: TableDef, excludeColumns: String*): Array[Column] = {
    val excluded = excludeColumns.toSet
    table.customColumns.filterNot(c => excluded.contains(c.name)).map(c => JoinColumn(c.name, c.index, c.dataType, table, c, isAlias = false))
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

}

trait JoinColumn extends Column {
  def sourceTable: TableDef
  def sourceColumn: Column
}

object JoinColumn {

  def apply(name: String, index: Int, dataType: Class[_], sourceTable: TableDef, sourceColumn: Column, isAlias: Boolean): JoinColumn = {
    if (isAlias) {
      AliasedJoinColumn(name, index, dataType, sourceTable, sourceColumn)
    } else {
      SimpleJoinColumn(name, index, dataType, sourceTable, sourceColumn)
    }
  }

}

case class NoColumn() extends Column {
  override def name: String = "NoColumn"

  override def index: Int = -1

  override def dataType: Class[_] = DataType.NoDataType

  override def getData(data: RowData): Any = None

  override def getDataFullyQualified(data: RowData): Any = None

  override def hashCode(): Int = -1

  override def equals(obj: scala.Any): Boolean = {
    obj match {
      case _ : NoColumn => true
      case _ => false
    }
  }

}

case class SimpleColumn(name: String, index: Int, dataType: Class[_]) extends Column {
  override def getData(data: RowData): Any = {
    data.get(name)
  }

  override def getDataFullyQualified(data: RowData): Any = getData(data)

  private lazy val hash: Int = name.hashCode * dataType.hashCode()

  override def hashCode(): Int = hash

  override def equals(obj: scala.Any): Boolean = {
    obj match {
      case other: SimpleColumn =>
        this.name == other.name &&
          this.dataType == other.dataType
      case _ => false
    }
  }

}

private case class SimpleJoinColumn(name: String, index: Int, dataType: Class[_], sourceTable: TableDef, sourceColumn: Column) extends JoinColumn {

  override def toString: String = s"${sourceTable.name}.$sourceColumn@$name"

  override def getData(data: RowData): Any = data.get(name)

  override def getDataFullyQualified(data: RowData): Any = data.get(sourceTable.fullyQuallifiedColumnName(name))

  private lazy val hash: Int = name.hashCode * dataType.hashCode() * sourceTable.name.hashCode * sourceColumn.name.hashCode

  override def hashCode(): Int = hash

  override def equals(obj: scala.Any): Boolean = {
    obj match {
      case other: SimpleJoinColumn =>
        this.sourceTable.name == other.sourceTable.name &&
          this.sourceColumn.name == other.sourceColumn.name &&
          this.name == other.name &&
          this.dataType == other.dataType
      case _ => false
    }
  }
}

private case class AliasedJoinColumn(name: String, index: Int, dataType: Class[_], sourceTable: TableDef, sourceColumn: Column) extends JoinColumn {

  override def toString: String = s"${sourceTable.name}.$sourceColumn@alias($name)"

  override def getData(data: RowData): Any = data.get(sourceColumn.name)

  override def getDataFullyQualified(data: RowData): Any = data.get(sourceTable.fullyQuallifiedColumnName(sourceColumn.name))

  private lazy val hash: Int = name.hashCode * dataType.hashCode() * sourceTable.name.hashCode * sourceColumn.name.hashCode

  override def hashCode(): Int = hash

  override def equals(obj: scala.Any): Boolean = {
    obj match {
      case other: AliasedJoinColumn =>
        this.sourceTable.name == other.sourceTable.name &&
          this.sourceColumn.name == other.sourceColumn.name &&
          this.name == other.name &&
          this.dataType == other.dataType
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

  override def hashCode(): Int = name.hashCode * dataType.hashCode()

  override def equals(obj: Any): Boolean = obj match {
    case that: CalculatedColumn => that.name == name && that.dataType == this.dataType
    case _ => false
  }

}
