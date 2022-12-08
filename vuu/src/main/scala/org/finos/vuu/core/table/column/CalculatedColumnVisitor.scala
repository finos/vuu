package org.finos.vuu.core.table.column

import com.typesafe.scalalogging.StrictLogging
import org.antlr.v4.runtime.tree.{ErrorNode, TerminalNode}
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.table.DataType
import org.finos.vuu.grammer.CalculatedColumnParser.{FunctionContext, TermContext}
import org.finos.vuu.grammer.FilterParser.AtomContext
import org.finos.vuu.grammer.{CalculatedColumnBaseVisitor, CalculatedColumnLexer, CalculatedColumnParser}

import scala.jdk.CollectionConverters._

class CalculatedColumnVisitor(val tableDef: TableDef) extends CalculatedColumnBaseVisitor[CalculatedColumnClause] with StrictLogging {
  /**
   * {@inheritDoc  }
   *
   * <p>The default implementation returns the result of calling
   * {@link #   visitChildren} on {@code ctx}.</p>
   */
  override def visitExpression(ctx: CalculatedColumnParser.ExpressionContext): CalculatedColumnClause = {
    logger.info("VISIT: Expression:" + ctx)
    val term = visit(ctx.term())
    term
  }

  /**
   * {@inheritDoc }
   *
   * <p>The default implementation returns the result of calling
   * {@link # visitChildren} on {@code ctx}.</p>
   */
  override def visitOperator(ctx: CalculatedColumnParser.OperatorContext): CalculatedColumnClause = {
//    super.visitOperator(ctx)
//    ctx match {
//      case ctx.NEQ() => println("NEQ")
//    }
    logger.info("VISIT: OPERATOR: " + ctx.getChild(0))
    null
  }

  /**
   * {@inheritDoc }
   *
   * <p>The default implementation returns the result of calling
   * {@link # visitChildren} on {@code ctx}.</p>
   */
  override def visitTerm(ctx: CalculatedColumnParser.TermContext): CalculatedColumnClause = {
    logger.info("VISIT TERM:" + ctx.getText)

    ctx.operator().size() match {
      case 1 => processOperatorTerm(ctx)
      case _ => null
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

  private def processOperatorTerm(ctx: CalculatedColumnParser.TermContext): CalculatedColumnClause = {

    val operator = ctx.operator.get(0)

    val children = CollectionHasAsScala(ctx.children).asScala.filter(_.getText != "(").filter(_.getText != ")").toList

    val leftChild = children(0)
    val op = children(1)
    val rightChild = children(2)

    logger.info(" left:" + leftChild.getText + " op:" + op.getText + " right:" + rightChild.getText)

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
      case "*" =>  MultiplyClause(List(leftClause, rightClause))
      case "+" =>  AddClause(List(leftClause, rightClause))
      case "-" =>  SubtractClause(List(leftClause, rightClause))
    }

  }



  /**
   * {@inheritDoc }
   *
   * <p>The default implementation returns the result of calling
   * {@link # visitChildren} on {@code ctx}.</p>
   */
  override def visitFunction(ctx: CalculatedColumnParser.FunctionContext): CalculatedColumnClause = {
    logger.info("VISIT FUNCTION:" + ctx)
    super.visitFunction(ctx)
  }

  /**
   * {@inheritDoc }
   *
   * <p>The default implementation returns the result of calling
   * {@link # visitChildren} on {@code ctx}.</p>
   */
  override def visitAtom(ctx: CalculatedColumnParser.AtomContext): CalculatedColumnClause = {
    logger.info("VISIT: ATOM" + ctx)
    super.visitAtom(ctx)
    val clause = ctx.children.get(0) match {
      case term: TerminalNode =>
        term.getSymbol.getType match {
          case CalculatedColumnLexer.ID =>
            processIDSymbol(term)
          case CalculatedColumnLexer.INT =>
            logger.info("VISIT: ATOM - Processing Literal int: " + term.getText )
            LiteralIntColumnClause(term.getText.toInt)
          case CalculatedColumnLexer.FLOAT =>
            logger.info("VISIT: ATOM - Processing Literal float: " + term.getText)
            LiteralDoubleColumnClause(term.getText.toDouble)
          case CalculatedColumnLexer.STRING =>
            logger.info("VISIT: ATOM - Processing Literal string: " + term.getText)
            LiteralStringColumnClause(term.getText)
        }

      case term: FunctionContext =>
        logger.info("VISIT ATOM: FunctionContext: " + term.getText)
        visitFunction(term)
    }

    clause
  }

  private def processIDSymbol(term: TerminalNode): CalculatedColumnClause = {
    val column = tableDef.columnForName(term.getText)
    logger.info("VISIT ATOM: TerminalNode: " + term.getText + " " + column)
    column.dataType match {
      case DataType.IntegerDataType => IntColumnClause(column)
      case DataType.LongDataType => LongColumnClause(column)
      case DataType.DoubleDataType => DoubleColumnClause(column)
      case DataType.StringDataType => StringColumnClause(column)
      case DataType.BooleanDataType => BooleanColumnClause(column)
    }
  }

  /**
   * {@inheritDoc }
   *
   * <p>The default implementation returns the result of calling
   * {@link # visitChildren} on {@code ctx}.</p>
   */
  override def visitArguments(ctx: CalculatedColumnParser.ArgumentsContext): CalculatedColumnClause = {
    logger.info("VISIT: Arguments" + ctx)
    super.visitArguments(ctx)
  }


  override def visitTerminal(node: TerminalNode): CalculatedColumnClause = {
    logger.info("VISIT: TERMINAL: " + node.getText)
//    node.getSymbol.getType match {
//      case CalculatedColumnLexer.LPAREN =>
//        logger.info("\t\t open paretheses")
//
//      case CalculatedColumnLexer.RPAREN =>
//        logger.info("\t\t close paretheses")
//    }
    super.visitTerminal(node)
  }

  override def aggregateResult(aggregate: CalculatedColumnClause, nextResult: CalculatedColumnClause): CalculatedColumnClause = {
    //logger.info("VISIT: Aggregate Results" + aggregate)
    super.aggregateResult(aggregate, nextResult)
  }

  override def visitErrorNode(node: ErrorNode): CalculatedColumnClause = {
    logger.error("VISIT ERROR:" + node)
    super.visitErrorNode(node)
  }
}
