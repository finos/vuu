package io.venuu.vuu.core.filter

import com.typesafe.scalalogging.StrictLogging
import io.venuu.vuu.grammer.FilterBaseVisitor
import io.venuu.vuu.grammer.FilterParser._
import org.antlr.v4.runtime.tree.TerminalNode

import scala.jdk.CollectionConverters._

class FilterTreeVisitor extends FilterBaseVisitor[FilterClause] with StrictLogging {

  override def visitExpression(ctx: ExpressionContext): FilterClause = {
    visitOr_expression(ctx.or_expression())
  }

  override def visitOr_expression(ctx: Or_expressionContext): FilterClause = {
    logger.debug("Or")
    val and = visit(ctx.and_expression())
    val ors = ListHasAsScala(ctx.or_expression()).asScala.map(or => visit(or)).toList
    OrClause(and, ors)
  }

  override def visitAnd_expression(ctx: And_expressionContext): FilterClause = {
    logger.debug("And")
    val terms = ListHasAsScala(ctx.term()).asScala.map(term => visit(term)).toList
    AndClause(terms)
  }

  override def visitTerm(ctx: TermContext): FilterClause = {
    logger.debug("Term")
    val atom1 = ctx.atom(0)
    val op = ctx.operator()
    val column = atom1.getText

    //var atomType = -1
    //    var value: Unit =
    //
    //      ListHasAsScala(ctx.atom()).asScala.drop(1).foreach( atom => {
    //
    //      atomType = atom.getChild(0).asInstanceOf[TerminalNode].getSymbol.getType
    //    })

    val termClause = op.getText match {
      case ">" =>
        val (dt, value) = parseTypeAndValue(ListHasAsScala(ctx.atom()).asScala.drop(1).head)
        GreaterThanClause(column, dt, value)
      case "=" =>
        val (dt, value) = parseTypeAndValue(ListHasAsScala(ctx.atom()).asScala.drop(1).head)
        EqualsClause(column, dt, value)
      case "!=" =>
        val (dt, value) = parseTypeAndValue(ListHasAsScala(ctx.atom()).asScala.drop(1).head)
        NotEqualsClause(column, dt, value)
      case "<" =>
        val (dt, value) = parseTypeAndValue(ListHasAsScala(ctx.atom()).asScala.drop(1).head)
        LessThanClause(column, dt, value)
      case "in" =>
        val (dt, value) = parseTypeAndValueList(ListHasAsScala(ctx.atom()).asScala.drop(1).toList)
        InClause(column, dt, value)
      case "starts" =>
        val (dt, value) = parseTypeAndValue(ListHasAsScala(ctx.atom()).asScala.drop(1).head)
        StartsClause(column, dt, value)
      case "ends" =>
        val (dt, value) = parseTypeAndValue(ListHasAsScala(ctx.atom()).asScala.drop(1).head)
        EndsClause(column, dt, value)

    }

    TermClause(atom1.getText, termClause)
  }

  private def parseTypeAndValue(ctx: AtomContext): (Int, String) = {
    val atomType = ctx.getChild(0).asInstanceOf[TerminalNode].getSymbol.getType
    val text = ctx.getText
    (atomType, text)
  }

  private def parseTypeAndValueList(ctx: List[AtomContext]): (Int, List[String]) = {
    val atomType = ctx.head.getChild(0).asInstanceOf[TerminalNode].getSymbol.getType
    (atomType, ctx.map(ctx => ctx.getText))
  }
}
