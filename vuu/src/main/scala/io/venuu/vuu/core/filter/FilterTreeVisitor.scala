package io.venuu.vuu.core.filter

import com.ibm.icu.impl.LocaleDisplayNamesImpl.DataTableType
import io.venuu.toolbox.ImmutableArray
import io.venuu.vuu.core.index.IndexedField
import io.venuu.vuu.core.table.{DataType, RowData}
import io.venuu.vuu.grammer.FilterParser._
import io.venuu.vuu.grammer.{FilterBaseVisitor, FilterParser}
import io.venuu.vuu.viewport.RowSource
import org.antlr.v4.runtime.tree.TerminalNode

import scala.collection.JavaConversions._

trait FilterClause{
  def filter(data: RowData): Boolean
  def filterAll(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = {

    val columns = source.asTable.getTableDef.columns.toList

    val pks = primaryKeys.toArray

    val filtered = pks.filter( key => {
      this.filter(source.pullRow(key, columns))
    })

    ImmutableArray.from(filtered)
  }
}
trait DataAndTypeClause extends FilterClause{

  def toType(s: String, dt: Int): Any = {
    dt match {
      case FilterParser.INT => s.toInt
      case FilterParser.FLOAT => s.toDouble
      case FilterParser.FALSE => false
      case FilterParser.TRUE => true
      case FilterParser.STRING => s
      case FilterParser.ID => s
    }
  }
}


case class OrClause(and: FilterClause, ors: List[FilterClause]) extends FilterClause{

  override def filterAll(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = {
    (and.filterAll(source, primaryKeys) ++ filterAllByOrs(source, primaryKeys)).distinct
  }

  def filterAllByOrs(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = {
    val resultOrs = ors.map( or => or.filterAll(source, primaryKeys) ).foldLeft(ImmutableArray.empty[String])((left, right) => left.++(right) )
    (resultOrs).distinct
  }

  def filterByOrs(data: RowData): Boolean = {
    ors.find( fc => fc.filter(data) ) match {
      case Some(fc) => true
      case None => false
    }
  }

  override def filter(data: RowData): Boolean = {
    and.filter(data) || filterByOrs(data)
  }
}

case class AndClause(terms: List[FilterClause]) extends FilterClause {

  override def filterAll(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = {
    terms.foldLeft(primaryKeys)((prePks, term) => term.filterAll(source, prePks))
  }

  override def filter(data: RowData): Boolean = {
    val successTerms = for(term <- terms if term.filter(data) ) yield term
    successTerms.size == terms.size
  }
}

case class TermClause(column: String, dataAndTypeClause: DataAndTypeClause) extends FilterClause{
  override def filterAll(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = {
    dataAndTypeClause.filterAll(source, primaryKeys)
  }

  override def filter(data: RowData): Boolean = dataAndTypeClause.filter(data)
}

case class EqualsClause(column: String, dataType: Int, value: String) extends DataAndTypeClause{

  val toType: Any = toType(value, dataType)

  override def filterAll(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = {
    val asColumn = source.asTable.columnForName(column)
    source.asTable.indexForColumn(asColumn) match {
      case Some(ix: IndexedField[String]) if asColumn.dataType == DataType.StringDataType =>
        ix.rowKeysForValue(value)
      case Some(ix: IndexedField[Int]) if asColumn.dataType == DataType.IntegerDataType =>
        ix.rowKeysForValue(value.toInt)
      case Some(ix: IndexedField[Long]) if asColumn.dataType == DataType.LongDataType =>
        ix.rowKeysForValue(value.toLong)
      case None =>
        EqualsClause.super.filterAll(source, primaryKeys)
    }
  }

  override def filter(data: RowData): Boolean = {
    val datum = data.get(column)
    if( datum != null && datum.equals(toType)) true
    else false
  }
}

case class NotEqualsClause(column: String, dataType: Int, value: String)  extends DataAndTypeClause{

  val toType: Any = toType(value, dataType)

  override def filter(data: RowData): Boolean = {
    val datum = data.get(column)

    if( datum == null || !datum.equals(toType)) true
    else false
  }
}

case class GreaterThanClause(column: String, dataType: Int, value: String)  extends DataAndTypeClause{
  val asDouble = value.toDouble

  override def filter(data: RowData): Boolean = {
    val datum = data.get(column)

    if(datum == null)
      false
    else
      asDouble < datum.toString.toDouble
  }
}

case class StartsClause(column: String, dataType: Int, value: String)  extends DataAndTypeClause{

  override def filter(data: RowData): Boolean = {
    val datum = data.get(column)

    if(datum == null)
      false
    else
      datum.toString.startsWith(value)
  }
}

case class EndsClause(column: String, dataType: Int, value: String)  extends DataAndTypeClause{

  override def filter(data: RowData): Boolean = {
    val datum = data.get(column)

    if(datum == null)
      false
    else
      datum.toString.endsWith(value)
  }
}

case class LessThanClause(column: String, dataType: Int, value: String)  extends DataAndTypeClause{

  val asDouble = value.toDouble

  override def filter(data: RowData): Boolean = {
    val datum = data.get(column)

    if(datum == null)
      false
    else
      asDouble > data.toString.toDouble
  }
}

case class InClause(column: String, dataType: Int, values: List[String])  extends DataAndTypeClause{

  override def filter(data: RowData): Boolean = {
    val datum = data.get(column)
    if(datum == null)
      false
    else
      values.contains(datum.toString)
  }
}

class FilterTreeVisitor extends FilterBaseVisitor[FilterClause]{

  override def visitExpression(ctx: ExpressionContext): FilterClause = {
    visitOr_expression(ctx.or_expression())
  }

  override def visitOr_expression(ctx: Or_expressionContext): FilterClause = {
    println("Or")
    val and = visit(ctx.and_expression())
    val ors = ctx.or_expression().map(or => visit(or) ).toList
    OrClause(and, ors)
  }

  //override def visitExpression(ctx: ExpressionContext): Unit = {println("Expr")}

  override def visitAnd_expression(ctx: And_expressionContext): FilterClause = {
    println("And")
    val terms = ctx.term().map( term => visit(term)).toList
    AndClause(terms)
  }

  override def visitTerm(ctx: TermContext): FilterClause = {

    println("Term")
    val atom1 = ctx.atom(0)
    val op = ctx.operator()
    val column = atom1.getText

    //println("column = " + atom1.getText + " op " + op.getText)

    //println("op = " + op.getText)
    //val atom2 = ctx.atom(1)
    var atomType = -1
    var value =

    ctx.atom().drop(1).foreach( atom => {

      atomType = atom.getChild(0).asInstanceOf[TerminalNode].getSymbol.getType

//      val dType = atomType match {
//        case FilterParser.FALSE => "Bool = false"
//        case FilterParser.TRUE => "Bool = true"
//        case FilterParser.FLOAT => "Float"
//        case FilterParser.INT => "Int"
//        case FilterParser.STRING => "String"
//        case x => println(s"unknown => ${x}")
//      }



      //visitAtom(atom)
    })

    val termClause = op.getText match {
      case ">"  =>
        val (dt, value) = parseTypeAndValue(ctx.atom().drop(1).head)
        GreaterThanClause(column, dt, value)
      case "="  =>
        val (dt, value) = parseTypeAndValue(ctx.atom().drop(1).head)
        EqualsClause(column, dt, value)
      case "!=" =>
        val (dt, value) = parseTypeAndValue(ctx.atom().drop(1).head)
        NotEqualsClause(column, dt, value)
      case "<"  =>
        val (dt, value) = parseTypeAndValue(ctx.atom().drop(1).head)
        LessThanClause(column, dt, value)
      case "in" =>
        val (dt, value) = parseTypeAndValueList(ctx.atom().drop(1).toList)
        InClause(column, dt, value)
      case "starts" =>
        val (dt, value) = parseTypeAndValue(ctx.atom().drop(1).head)
        StartsClause(column, dt, value)
      case "ends" =>
        val (dt, value) = parseTypeAndValue(ctx.atom().drop(1).head)
        EndsClause(column, dt, value)

    }

    TermClause(atom1.getText, termClause)
  }

  private def parseTypeAndValue(ctx: AtomContext):(Int, String) = {
    val atomType = ctx.getChild(0).asInstanceOf[TerminalNode].getSymbol.getType
    val text = ctx.getText
    (atomType, text)
  }

  private def parseTypeAndValueList(ctx: List[AtomContext]):(Int, List[String]) = {
    val atomType = ctx(0).getChild(0).asInstanceOf[TerminalNode].getSymbol.getType

    (atomType, ctx.map( ctx => ctx.getText).toList)
  }

  //private def

//  override def visitAtom(ctx: AtomContext): Unit = {
//    //val index = ctx.getRuleIndex
//
//    val index = ctx.getChild(0).asInstanceOf[TerminalNode].getSymbol.getType
//
//    val dType = index match {
//      case FilterParser.FALSE => "Bool = false"
//      case FilterParser.TRUE => "Bool = true"
//      case FilterParser.FLOAT => "Float"
//      case FilterParser.INT => "Int"
//      case FilterParser.STRING => "String"
//      case x => println(s"unknown => ${x}")
//    }
//
//    print("atom " + ctx.getText + " " + dType + "\n")
//
//    //println("Atom")
//  }

  //override def visitOperator(ctx: OperatorContext): Unit = {println("Operator")}
}
