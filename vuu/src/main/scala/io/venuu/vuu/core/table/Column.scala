/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.
 *
 * Created by chris on 25/08/15.
 *
 */
package io.venuu.vuu.core.table

import io.venuu.vuu.api.TableDef

object DataType {

  val StringDataType = classOf[String]
  val BooleanDataType = classOf[Boolean]
  val IntegerDataType = classOf[Int]
  val LongDataType = classOf[Long]
  val DoubleDataType = classOf[Double]
  val NoDataType = classOf[AnyRef]

  def fromString(s: String): Class[_] = {
    s.trim.toLowerCase match {
      case "char" => classOf[Char]
      case "string" => classOf[String]
      case "double" => classOf[Double]
      case "boolean" => classOf[Boolean]
      case "int" => classOf[Int]
      case "long" => classOf[Long]
    }
  }

  def asString(c: Class[_]): String = {
    c.getTypeName match {
      case "java.lang.String" => "string"
      case x => x.toLowerCase
      //        case c: Class[Boolean] => "boolean"
      //        case c: Class[Int] => "int"
      //        case c: Class[Long] => "long"
    }
  }

}

object Columns {
  def fromNames(names: String*): Array[Column] = {
    names.zipWithIndex.map({ case (nameAndDt, index) => {

      val (name :: dataType :: _) = nameAndDt.split(":").toList

      val dtClass = DataType.fromString(dataType)

      new SimpleColumn(name, index, dtClass)
    }

    }).toArray
  }

  def from(table: TableDef, names: Seq[String]): Array[Column] = {
    table.columns.filter(c => names.contains(c.name)).map(c => new JoinColumn(c.name, c.index, c.dataType, table, c))
  }

  def allFrom(table: TableDef): Array[Column] = {
    table.columns.map(c => new JoinColumn(c.name, c.index, c.dataType, table, c))
  }

  def aliased(table: TableDef, aliases: (String, String)*): Array[Column] = {
    val aliased = aliases.map(tuple => (tuple._1 -> tuple._2)).toMap
    table.columns.filter(c => aliased.contains(c.name)) map (c => new AliasedJoinColumn(aliased.get(c.name).get, c.index, c.dataType, table, c).asInstanceOf[Column])
  }

  def calculated(name: String, definition: String): Array[Column] = ???

  def allFromExcept(table: TableDef, excludeColumns: String*): Array[Column] = {

    val excluded = excludeColumns.map(s => (s -> 1)).toMap

    table.columns.filterNot(c => excluded.contains(c.name)).map(c => new JoinColumn(c.name, c.index, c.dataType, table, c))
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

case class SimpleColumn(val name: String, val index: Int, val dataType: Class[_]) extends Column {
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

  override def hashCode(): Int = (sourceTable.name + "." + sourceColumn + "@" + name).hashCode

  override def getDataFullyQualified(data: RowData): Any = data.get(sourceTable.fullyQuallifiedColumnName(name))

  override def getData(data: RowData): Any = data.get(name)

  override def equals(obj: scala.Any): Boolean = {
    if (obj.isInstanceOf[JoinColumn]) {
      val other = obj.asInstanceOf[JoinColumn]
      other.sourceColumn.name == this.sourceColumn.name && other.sourceTable.name == this.sourceTable.name
    } else
      false
  }
}


