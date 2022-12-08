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

  private def processAtomTermClause(ctx: CalculatedColumnParser.TermContext): CalculatedColumnClause = {
    ctx.getChild(0) match {
      case ctx: CalculatedColumnParser.AtomContext => visitAtom(ctx)
      case ctx: CalculatedColumnParser.TermContext => visitTerm(ctx)
    }
  }

  private def processOperatorTerm(ctx: CalculatedColumnParser.TermContext): CalculatedColumnClause = {

    val operator = ctx.operator.get(0)

    val children = CollectionHasAsScala(ctx.children).asScala.filter(_.getText != "(").filter(_.getText != ")").toList

    val leftChild = children(0)
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
      case "*" =>  MultiplyClause(leftClause, rightClause) //MultiplyClause(List(leftClause, rightClause))
      case "+" =>  AddClause(leftClause, rightClause)
      case "-" =>  SubtractClause(leftClause, rightClause)
      case "/" =>  DivideClause(leftClause, rightClause)
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

  private def processBracketedOperatorTermWithOperator(ctx: CalculatedColumnParser.TermContext): CalculatedColumnClause = {

    //val operator = ctx.operator.get(0)

    val children = CollectionHasAsScala(ctx.children).asScala.toList

    val firstBracket = children(0)
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



  /**
   * {@inheritDoc }
   *
   * <p>The default implementation returns the result of calling
   * {@link # visitChildren} on {@code ctx}.</p>
   */
  override def visitFunction(ctx: CalculatedColumnParser.FunctionContext): CalculatedColumnClause = {
    logger.debug("VISIT FUNCTION:" + ctx)
    val children = CollectionHasAsScala(ctx.children).asScala.toList
    val funcName = children.head.getText
    val argsClauseList = children(2) match {
      case ctx: CalculatedColumnParser.ArgumentsContext => processArguments(ctx)
    }
    Functions.create(funcName, argsClauseList)
  }

  private def processArguments(ctx: CalculatedColumnParser.ArgumentsContext): List[CalculatedColumnClause] = {
    val args = ctx.children.asScala.filter(_.getText != ",").map(_.asInstanceOf[CalculatedColumnParser.AtomContext])
    args.map(visitAtom(_)).toList
  }

  /**
   * {@inheritDoc }
   *
   * <p>The default implementation returns the result of calling
   * {@link # visitChildren} on {@code ctx}.</p>
   */
  override def visitAtom(ctx: CalculatedColumnParser.AtomContext): CalculatedColumnClause = {
    logger.debug("VISIT: ATOM" + ctx)
    super.visitAtom(ctx)
    val clause = ctx.children.get(0) match {
      case term: TerminalNode =>
        term.getSymbol.getType match {
          case CalculatedColumnLexer.ID =>
            processIDSymbol(term)
          case CalculatedColumnLexer.INT =>
            logger.debug("VISIT: ATOM - Processing Literal int: " + term.getText )
            LiteralIntColumnClause(term.getText.toInt)
          case CalculatedColumnLexer.FLOAT =>
            logger.debug("VISIT: ATOM - Processing Literal float: " + term.getText)
            LiteralDoubleColumnClause(term.getText.toDouble)
          case CalculatedColumnLexer.STRING =>
            logger.debug("VISIT: ATOM - Processing Literal string: " + term.getText)
            LiteralStringColumnClause(term.getText)
        }
      case term: FunctionContext =>
        logger.debug("VISIT ATOM: FunctionContext: " + term.getText)
        visitFunction(term)
      case _ => null
    }
    clause
  }

  private def processIDSymbol(term: TerminalNode): CalculatedColumnClause = {
    val column = tableDef.columnForName(term.getText)
    logger.debug("VISIT ATOM: TerminalNode: " + term.getText + " " + column)
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
//  override def visitArguments(ctx: CalculatedColumnParser.ArgumentsContext): CalculatedColumnClause = {
//    logger.info("VISIT: Arguments" + ctx)
//    //super.visitArguments(ctx)
//    val children = ctx.children.asScala.toList.
//    null
//
//  }


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

//  override def aggregateResult(aggregate: CalculatedColumnClause, nextResult: CalculatedColumnClause): CalculatedColumnClause = {
//    //logger.info("VISIT: Aggregate Results" + aggregate)
//    super.aggregateResult(aggregate, nextResult)
//  }

  override def visitErrorNode(node: ErrorNode): CalculatedColumnClause = {
    logger.error("VISIT ERROR:" + node)
    super.visitErrorNode(node)
  }
}
