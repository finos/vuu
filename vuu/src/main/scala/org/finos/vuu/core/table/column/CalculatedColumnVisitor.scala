package org.finos.vuu.core.table.column

import com.typesafe.scalalogging.StrictLogging
import org.antlr.v4.runtime.tree.{ErrorNode, TerminalNode}
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.table.DataType
import org.finos.vuu.grammer.CalculatedColumnParser.FunctionContext
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
    visit(ctx.term())
    //super.visitExpression(ctx)
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
    logger.info("VISIT TERM:" + ctx)
    super.visitTerm(ctx)

    val operator = ctx.operator()
    val atoms = ctx.atom()

    val clause: CalculatedColumnClause = if(operator.size() > 0) {
      val opText = operator.get(0).getText
      opText match {
        case "*" =>
          val atomClauses = (0 until atoms.size()).map(i => visitAtom(atoms.get(i)).asInstanceOf[NumericClause]).toList
          MultiplyClause(atomClauses)
        case _ =>
          NullCalculatedColumnClause()
      }
    }
    else{
      NullCalculatedColumnClause()
    }
    clause
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
    //super.visitAtom(ctx)
    val clause = ctx.children.get(0) match {
      case term: TerminalNode =>
        term.getSymbol.getType match {
          case CalculatedColumnLexer.ID => processIDSymbol(term)
          case CalculatedColumnLexer.INT => {
            logger.info("VISIT: ATOM - Processing Literal: " + term.getText )
            LiteralIntColumnClause(Integer.parseInt(term.getText))
          }
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
    super.visitTerminal(node)
  }

  override def aggregateResult(aggregate: CalculatedColumnClause, nextResult: CalculatedColumnClause): CalculatedColumnClause = {
    logger.info("VISIT: Aggregate Results" + aggregate)
    super.aggregateResult(aggregate, nextResult)
  }

  override def visitErrorNode(node: ErrorNode): CalculatedColumnClause = {
    logger.error("VISIT ERROR:" + node)
    super.visitErrorNode(node)
  }
}
