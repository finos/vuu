package org.finos.vuu.core.table.column

import com.typesafe.scalalogging.StrictLogging
import org.antlr.v4.runtime.tree.{ErrorNode, TerminalNode}
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.table.{Column, DataType}
import org.finos.vuu.grammer.CalculatedColumnParser.{FALSE, FunctionContext}
import org.finos.vuu.grammer.FilterParser.AtomContext
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
      case 8 => processIfStatement(ctx)
    }

    //super.visitTerm(ctx)

    //val operator = ctx.operator()

    //    operator.size() match {
    //      //this case is for non math operators (so functions basically)
    //      case 0 =>
    //          println("no operator")
    //          null
    //      case _ => processOperatorTerm(ctx)
    //    }
  }

  override def visitFunction(ctx: CalculatedColumnParser.FunctionContext): CalculatedColumnClause = {
    logger.debug("VISIT FUNCTION:" + ctx)
    val children = CollectionHasAsScala(ctx.children).asScala.toList
    val funcName = children.head.getText
    val clause = children(2) match {
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
      case ctx: CalculatedColumnParser.TermContext => {
        children.head.getText match {
          case "if" =>
            val ifClauseTerm = visitTerm(children(2).asInstanceOf[CalculatedColumnParser.TermContext])
            val thenClause = visitTerm(children(4).asInstanceOf[CalculatedColumnParser.TermContext])
            val elseClause = visitTerm(children(6).asInstanceOf[CalculatedColumnParser.TermContext])
            Functions.createIf(funcName, ifClauseTerm, thenClause, elseClause)
          case "or" =>
            val terms = children.filter(pt => pt.isInstanceOf[CalculatedColumnParser.TermContext])
              .map(_.asInstanceOf[CalculatedColumnParser.TermContext])
              .map(visitTerm)
            Functions.create(children.head.getText, terms)
          case "and" =>
            val terms = children.filter(pt => pt.isInstanceOf[CalculatedColumnParser.TermContext])
              .map(_.asInstanceOf[CalculatedColumnParser.TermContext])
              .map(visitTerm)
            Functions.create(children.head.getText, terms)
        }
      }

    }
    clause
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
    //    node.getSymbol.getType match {
    //      case CalculatedColumnLexer.LPAREN =>
    //        logger.info("\t\t open paretheses")
    //
    //      case CalculatedColumnLexer.RPAREN =>
    //        logger.info("\t\t close paretheses")
    //    }
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

    val leftClause = leftChild match {
      case ctx: CalculatedColumnParser.AtomContext => visitAtom(ctx)
      case ctx: CalculatedColumnParser.TermContext => visitTerm(ctx)
      case node: TerminalNode => null
    }

    val rightClause = rightChild match {
      case ctx: CalculatedColumnParser.AtomContext => visitAtom(ctx)
      case ctx: CalculatedColumnParser.TermContext => visitTerm(ctx)
      case node: TerminalNode => null
    }

    operator.getText match {
      case "*" => MultiplyClause(leftClause, rightClause) //MultiplyClause(List(leftClause, rightClause))
      case "+" => AddClause(leftClause, rightClause)
      case "-" => SubtractClause(leftClause, rightClause)
      case "/" => DivideClause(leftClause, rightClause)
      case "=" => EqualsClause(leftClause, rightClause)
      case ">" => GreaterThanClause(leftClause, rightClause)
    }

  }

  private def processBracketedOperatorTerm(ctx: CalculatedColumnParser.TermContext): CalculatedColumnClause = {

    //val operator = ctx.operator.get(0)

    val children = CollectionHasAsScala(ctx.children).asScala.toList

    val leftChild = children(1)
    val op = children(2)
    val rightChild = children(3)

    logger.debug(" left:" + leftChild.getText + " op:" + op.getText + " right:" + rightChild.getText)

    val leftClause = leftChild match {
      case ctx: CalculatedColumnParser.AtomContext => visitAtom(ctx)
      case ctx: CalculatedColumnParser.TermContext => visitTerm(ctx)
      case node: TerminalNode => null
    }

    val rightClause = rightChild match {
      case ctx: CalculatedColumnParser.AtomContext => visitAtom(ctx)
      case ctx: CalculatedColumnParser.TermContext => visitTerm(ctx)
      case node: TerminalNode => null
    }

    op.getText match {
      case "*" => MultiplyClause(leftClause, rightClause) //MultiplyClause(List(leftClause, rightClause))
      case "+" => AddClause(leftClause, rightClause)
      case "-" => SubtractClause(leftClause, rightClause)
      case "/" => DivideClause(leftClause, rightClause)
    }

  }

  private def processIfStatement(ctx: CalculatedColumnParser.TermContext): CalculatedColumnClause = {

    val children = CollectionHasAsScala(ctx.children).asScala.toList

    val function = children.head
    val bracket1 = children(1)
    val condition = children(2)
    val comma1 = children(3)
    val thenStatement = children(4)
    val comma2 = children(5)
    val elseStatement = children(6)
    val bracket2 = children(7)

    null

  }

  private def processBracketedOperatorTermWithOperator(ctx: CalculatedColumnParser.TermContext): CalculatedColumnClause = {

    //val operator = ctx.operator.get(0)

    val children = CollectionHasAsScala(ctx.children).asScala.toList

    val firstBracket = children.head
    val leftChild = children(1)
    val op = children(2)
    val rightChild = children(3)
    val SecondBracket = children(4)
    val operator2 = children(5)
    val secondRightChild = children(6)

    logger.debug(" left:" + leftChild.getText + " op:" + op.getText + " right:" + rightChild.getText)

    val leftClause = leftChild match {
      case ctx: CalculatedColumnParser.AtomContext => visitAtom(ctx)
      case ctx: CalculatedColumnParser.TermContext => visitTerm(ctx)
      case node: TerminalNode => null
    }

    val rightClause = rightChild match {
      case ctx: CalculatedColumnParser.AtomContext => visitAtom(ctx)
      case ctx: CalculatedColumnParser.TermContext => visitTerm(ctx)
      case node: TerminalNode => null
    }

    op.getText match {
      case "*" => MultiplyClause(leftClause, rightClause) //MultiplyClause(List(leftClause, rightClause))
      case "+" => AddClause(leftClause, rightClause)
      case "-" => SubtractClause(leftClause, rightClause)
      case "/" => DivideClause(leftClause, rightClause)
    }

    val leftCompoundClause = op.getText match {
      case "*" => MultiplyClause(leftClause, rightClause) //MultiplyClause(List(leftClause, rightClause))
      case "+" => AddClause(leftClause, rightClause)
      case "-" => SubtractClause(leftClause, rightClause)
      case "/" => DivideClause(leftClause, rightClause)
    }

    val secondRightClause = secondRightChild match {
      case ctx: CalculatedColumnParser.AtomContext => visitAtom(ctx)
      case ctx: CalculatedColumnParser.TermContext => visitTerm(ctx)
      case node: TerminalNode => null
    }

    operator2.getText match {
      case "*" => MultiplyClause(leftCompoundClause, secondRightClause) //MultiplyClause(List(leftClause, rightClause))
      case "+" => AddClause(leftCompoundClause, secondRightClause)
      case "-" => SubtractClause(leftCompoundClause, secondRightClause)
      case "/" => DivideClause(leftCompoundClause, secondRightClause)
    }

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
    val column = getColumn(term.getText) match {
      case Some(column) => column
      case None => throw new RuntimeException("Column not found")
    }

    logger.debug("VISIT ATOM: TerminalNode: " + term.getText + " " + column)
    column.dataType match {
      case DataType.IntegerDataType => IntColumnClause(column)
      case DataType.LongDataType => LongColumnClause(column)
      case DataType.DoubleDataType => DoubleColumnClause(column)
      case DataType.StringDataType => StringColumnClause(column)
      case DataType.BooleanDataType => BooleanColumnClause(column)
    }
  }
}
