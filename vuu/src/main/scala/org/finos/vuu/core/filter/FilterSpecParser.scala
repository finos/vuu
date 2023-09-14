package org.finos.vuu.core.filter

import com.typesafe.scalalogging.StrictLogging
import org.antlr.v4.runtime.misc.ParseCancellationException
import org.antlr.v4.runtime.{BailErrorStrategy, BaseErrorListener, CharStreams, CommonTokenStream, RecognitionException, Recognizer}
import org.finos.vuu.grammar.{FilterLexer, FilterParser}

object FilterSpecParser extends StrictLogging {

  // Lexer doesn't support error-handling policy, so we make do with listener (see https://github.com/antlr/antlr4/issues/3849)
  private class BailOnErrorListener extends BaseErrorListener{
    override def syntaxError(recognizer: Recognizer[_, _], offendingSymbol: Any, line: Int, charPositionInLine: Int, msg: String, e: RecognitionException): Unit =
      throw new ParseCancellationException(e)
  }

  def parse(s: String): FilterClause = {
    logger.debug(s"Parsing filterspec [$s]")

    val input = CharStreams.fromString(s)
    val lexer = new FilterLexer(input)
    val tokens = new CommonTokenStream(lexer)
    val parser = new FilterParser(tokens)

    // do not try to make sense of broken syntax
    lexer.removeErrorListeners()
    lexer.addErrorListener(new BailOnErrorListener)
    parser.setErrorHandler(new BailErrorStrategy)

    val tree = parser.start()
    val eval = new FilterTreeVisitor()
    val result = eval.visit(tree)
    logger.debug(s"Parsed $result")
    result
  }

}
