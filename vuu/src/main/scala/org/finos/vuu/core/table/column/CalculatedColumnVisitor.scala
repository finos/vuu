package org.finos.vuu.core.table.column

import com.typesafe.scalalogging.StrictLogging
import org.antlr.v4.runtime.tree.{ErrorNode, ParseTree, TerminalNode}
import org.finos.vuu.core.table.{Column, DataType}
import org.finos.vuu.grammer.CalculatedColumnParser.{FunctionContext, OperatorContext}
import org.finos.vuu.grammer.{CalculatedColumnBaseVisitor, CalculatedColumnLexer, CalculatedColumnParser}
import org.finos.vuu.viewport.ViewPortColumns

import scala.jdk.CollectionConverters._

class CalculatedColumnVisitor(val columns: ViewPortColumns) extends CalculatedColumnBaseVisitor[CalculatedColumnClause] with StrictLogging {

  override def visitExpression(ctx: CalculatedColumnParser.ExpressionContext): CalculatedColumnClause = {
    logger.debug("VISIT: Expression:" + ctx)
    ExpressionClause(visit(ctx.term()))
  }

  override def visitTerm(ctx: CalculatedColumnParser.TermContext): CalculatedColumnClause = {
    logger.debug("VISIT TERM:" + ctx.getText)

    val children = CollectionHasAsScala(ctx.children).asScala.toList

    children.length match {
      case 1 => processAtomTermClause(ctx)
      case 3 => processOperatorTerm(ctx)
      case 5 => processBracketedOperatorTerm(ctx)
      case 7 => processBracketedOperatorTermWithOperator(ctx)
    }
  }

  override def visitFunction(ctx: CalculatedColumnParser.FunctionContext): CalculatedColumnClause = {
    logger.debug("VISIT FUNCTION:" + ctx)
    val children = CollectionHasAsScala(ctx.children).asScala.toList
    val funcName = children.head.getText
    val clause = children(2) match {
      case ctx: CalculatedColumnParser.AtomContext =>
        ctx.children.size() match {

          case 1 =>
            val argsClauseList = visitAtom(ctx)
            Functions.create(funcName, argsClauseList)
          case _ =>
            val argsClauseList = visitAtom(ctx)
            Functions.create(funcName, argsClauseList)
        }

      case ctx: CalculatedColumnParser.ArgumentsContext =>
        ctx.children.size() match {
          case 1 =>
            val argClause = visitAtom(ctx.children.get(0).asInstanceOf[CalculatedColumnParser.AtomContext])
            Functions.create(funcName, argClause)
          case _ =>
            val argsClauseList = processArguments(ctx)
            Functions.create(funcName, argsClauseList)
        }
      //this has to be an if
      case ctx: CalculatedColumnParser.TermContext =>
        children.head.getText match {
          case "if" =>
            processIfStatement(funcName, children, ctx)
          case "or" =>
            processOrAndStatement(funcName, children, ctx)
          case "and" =>
            processOrAndStatement(funcName, children, ctx)
          case _ =>
            processGenericTerm(funcName, children, ctx)
        }


    }
    clause
  }

  private def processOrAndStatement(funcName: String, children: List[ParseTree], ctx: CalculatedColumnParser.TermContext): CalculatedColumnClause = {
    val terms = children.filter(pt => pt.isInstanceOf[CalculatedColumnParser.TermContext])
      .map(_.asInstanceOf[CalculatedColumnParser.TermContext])
      .map(visitTerm)
    Functions.create(children.head.getText, terms)
  }

  private def processGenericTerm(funcName: String, children: List[ParseTree], ctx: CalculatedColumnParser.TermContext): CalculatedColumnClause = {
    val terms = children.filter(pt => pt.isInstanceOf[CalculatedColumnParser.TermContext])
      .map(_.asInstanceOf[CalculatedColumnParser.TermContext])
      .map(visitTerm)
    Functions.create(children.head.getText, terms)
  }

  private def processIfStatement(funcName: String, children: List[ParseTree], ctx: CalculatedColumnParser.TermContext): CalculatedColumnClause = {
    val ifClauseTerm = visitTerm(children(2).asInstanceOf[CalculatedColumnParser.TermContext])
    val thenClause = visitTerm(children(4).asInstanceOf[CalculatedColumnParser.TermContext])
    val elseClause = visitTerm(children(6).asInstanceOf[CalculatedColumnParser.TermContext])
    Functions.createIf(funcName, ifClauseTerm, thenClause, elseClause)
  }

  override def visitAtom(ctx: CalculatedColumnParser.AtomContext): CalculatedColumnClause = {
    logger.debug("VISIT: ATOM" + ctx)
    super.visitAtom(ctx)
    val clause = ctx.children.get(0) match {
      case term: TerminalNode =>
        term.getSymbol.getType match {
          case CalculatedColumnLexer.TRUE =>
            LiteralBooleanColumnClause(true)
          case CalculatedColumnLexer.FALSE =>
            LiteralBooleanColumnClause(false)
          case CalculatedColumnLexer.ID =>
            processIDSymbol(term)
          case CalculatedColumnLexer.INT =>
            logger.debug("VISIT: ATOM - Processing Literal int: " + term.getText)
            LiteralIntColumnClause(term.getText.toInt)
          case CalculatedColumnLexer.FLOAT =>
            logger.debug("VISIT: ATOM - Processing Literal float: " + term.getText)
            LiteralDoubleColumnClause(term.getText.toDouble)
          case CalculatedColumnLexer.STRING =>
            logger.debug("VISIT: ATOM - Processing Literal string: " + term.getText)
            LiteralStringColumnClause(term.getText.drop(1).dropRight(1))
        }
      case term: FunctionContext =>
        logger.debug("VISIT ATOM: FunctionContext: " + term.getText)
        visitFunction(term)
      case _ => null
    }
    clause
  }

  override def visitTerminal(node: TerminalNode): CalculatedColumnClause = {
    logger.debug("VISIT: TERMINAL: " + node.getText)
      super.visitTerminal(node)
  }

  override def visitErrorNode(node: ErrorNode): CalculatedColumnClause = {
    logger.error("VISIT ERROR:" + node)
    super.visitErrorNode(node)
  }

  private def processAtomTermClause(ctx: CalculatedColumnParser.TermContext): CalculatedColumnClause = {
    ctx.getChild(0) match {
      case ctx: CalculatedColumnParser.AtomContext => visitAtom(ctx)
      case ctx: CalculatedColumnParser.TermContext => visitTerm(ctx)
    }
  }


  private def processIfTermClause(ctx: CalculatedColumnParser.TermContext): CalculatedColumnClause = {
    ctx.getChild(0) match {
      case ctx: CalculatedColumnParser.AtomContext => visitAtom(ctx)
      case ctx: CalculatedColumnParser.TermContext => visitTerm(ctx)
    }
  }

  private def processOperatorTerm(ctx: CalculatedColumnParser.TermContext): CalculatedColumnClause = {

    val operator = ctx.operator.get(0)

    val children = CollectionHasAsScala(ctx.children).asScala.filter(_.getText != "(").filter(_.getText != ")").toList

    val leftChild = children.head
    val op = children(1)
    val rightChild = children(2)

    logger.debug(" left:" + leftChild.getText + " op:" + op.getText + " right:" + rightChild.getText)

    val leftClause = processOperatorSideTerm(leftChild)

    val rightClause = processOperatorSideTerm(rightChild)

    processOperatorClause(operator, leftClause, rightClause)
  }

  private def processOperatorSideTerm(child: ParseTree): CalculatedColumnClause = {
    child match {
      case ctx: CalculatedColumnParser.AtomContext => visitAtom(ctx)
      case ctx: CalculatedColumnParser.TermContext => visitTerm(ctx)
      case _ => NullCalculatedColumnClause()
    }
  }

  private def processOperatorClause(operator: OperatorContext, leftClause: CalculatedColumnClause, rightClause: CalculatedColumnClause): CalculatedColumnClause = {
    operator.getText match {
      case "*" => MultiplyClause(leftClause, rightClause) //MultiplyClause(List(leftClause, rightClause))
      case "+" => AddClause(leftClause, rightClause)
      case "-" => SubtractClause(leftClause, rightClause)
      case "/" => DivideClause(leftClause, rightClause)
      case "=" => EqualsClause(leftClause, rightClause)
      case ">" => GreaterThanClause(leftClause, rightClause)
      case "<" => LessThanClause(leftClause, rightClause)
    }
  }

  private def processBracketedOperatorTerm(ctx: CalculatedColumnParser.TermContext): CalculatedColumnClause = {

    val operator = ctx.operator.get(0)

    val children = CollectionHasAsScala(ctx.children).asScala.toList

    val leftChild :: op :: rightChild :: _ = children

    logger.debug(" left:" + leftChild.getText + " op:" + op.getText + " right:" + rightChild.getText)

    val leftClause = processOperatorSideTerm(leftChild)

    val rightClause = processOperatorSideTerm(rightChild)

    processOperatorClause(operator, leftClause, rightClause)
  }


  private def processBracketedOperatorTermWithOperator(ctx: CalculatedColumnParser.TermContext): CalculatedColumnClause = {

    val operator = ctx.operator.get(0)

    val children = CollectionHasAsScala(ctx.children).asScala.toList

    val firstBracket = children.head
    val leftChild = children(1)
    val op = children(2)
    val rightChild = children(3)
    val SecondBracket = children(4)
    val operator2 = children(5)
    val secondRightChild = children(6)

    logger.debug(" left:" + leftChild.getText + " op:" + op.getText + " right:" + rightChild.getText)

    val leftClause = processOperatorSideTerm(leftChild)

    val rightClause = processOperatorSideTerm(rightChild)

    val leftCompoundClause = processOperatorClause(operator, leftClause, rightClause)

    val secondRightClause = processOperatorSideTerm(secondRightChild)

    processOperatorClause(operator2.asInstanceOf[OperatorContext], leftCompoundClause, secondRightClause)

  }

  private def processArguments(ctx: CalculatedColumnParser.ArgumentsContext): List[CalculatedColumnClause] = {
    val args = ctx.children.asScala.filter(_.getText != ",").map(_.asInstanceOf[CalculatedColumnParser.AtomContext])
    args.map(visitAtom).toList
  }

  private def getColumn(name: String): Option[Column] = {
    columns.getColumnForName(name)
  }

  //  override def aggregateResult(aggregate: CalculatedColumnClause, nextResult: CalculatedColumnClause): CalculatedColumnClause = {
  //    //logger.info("VISIT: Aggregate Results" + aggregate)
  //    super.aggregateResult(aggregate, nextResult)
  //  }

  private def processIDSymbol(term: TerminalNode): CalculatedColumnClause = {
    getColumn(term.getText) match {
      case Some(column) =>
        logger.debug("VISIT ATOM: TerminalNode: " + term.getText + " " + column)
        column.dataType match {
          case DataType.IntegerDataType => IntColumnClause(column)
          case DataType.LongDataType => LongColumnClause(column)
          case DataType.DoubleDataType => DoubleColumnClause(column)
          case DataType.StringDataType => StringColumnClause(column)
          case DataType.BooleanDataType => BooleanColumnClause(column)
        }
      case None => ErrorClause("Column not found:" + term.getText)
    }

  }
}
