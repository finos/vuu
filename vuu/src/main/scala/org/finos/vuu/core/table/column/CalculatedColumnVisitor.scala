package org.finos.vuu.core.table.column

import com.typesafe.scalalogging.StrictLogging
import org.antlr.v4.runtime.tree.{ErrorNode, TerminalNode}
import org.finos.vuu.grammer.{CalculatedColumnBaseVisitor, CalculatedColumnParser}

import scala.jdk.CollectionConverters._

class CalculatedColumnVisitor extends CalculatedColumnBaseVisitor[CalculatedColumnClause] with StrictLogging {
  /**
   * {@inheritDoc  }
   *
   * <p>The default implementation returns the result of calling
   * {@link #   visitChildren} on {@code ctx}.</p>
   */
  override def visitExpression(ctx: CalculatedColumnParser.ExpressionContext): CalculatedColumnClause = {
    println("Expression:" + ctx)
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
    println("OPERATOR: " + ctx.getChild(0))
    null
  }

  /**
   * {@inheritDoc }
   *
   * <p>The default implementation returns the result of calling
   * {@link # visitChildren} on {@code ctx}.</p>
   */
  override def visitTerm(ctx: CalculatedColumnParser.TermContext): CalculatedColumnClause = {
    super.visitTerm(ctx)
    logger.info("VISIT TERM:" + ctx)
    val operator = ctx.operator()
    val atoms = ctx.atom()

    val opText = operator.get(0).getText

    val clause = opText match {
      case "*" =>
        MultiplyClause(DoubleColumnClause(atoms.get(0).getText), IntColumnClause(atoms.get(1).getText))
    }
//
//
//    val atoms = ctx.atom()
//    println()
    clause
  }

  /**
   * {@inheritDoc }
   *
   * <p>The default implementation returns the result of calling
   * {@link # visitChildren} on {@code ctx}.</p>
   */
  override def visitFunction(ctx: CalculatedColumnParser.FunctionContext): CalculatedColumnClause = {
    super.visitFunction(ctx)
    logger.info("VISIT FUNCTION:" + ctx)
    null
  }

  /**
   * {@inheritDoc }
   *
   * <p>The default implementation returns the result of calling
   * {@link # visitChildren} on {@code ctx}.</p>
   */
  override def visitAtom(ctx: CalculatedColumnParser.AtomContext): CalculatedColumnClause = {
    super.visitAtom(ctx)
    logger.info("VISIT ATOM:" + ctx)

    val atom = ctx.children.get(0) match {
      case term: TerminalNode =>
        IntColumnClause(term.getText)
      case x =>
        IntColumnClause(x.toString)
    }

    atom
  }

  /**
   * {@inheritDoc }
   *
   * <p>The default implementation returns the result of calling
   * {@link # visitChildren} on {@code ctx}.</p>
   */
  override def visitArguments(ctx: CalculatedColumnParser.ArgumentsContext): CalculatedColumnClause = super.visitArguments(ctx)



  override def visitErrorNode(node: ErrorNode): CalculatedColumnClause = super.visitErrorNode(node)
}
