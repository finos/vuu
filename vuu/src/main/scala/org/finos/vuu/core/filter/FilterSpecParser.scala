package org.finos.vuu.core.filter

import com.typesafe.scalalogging.StrictLogging
import org.antlr.v4.runtime.{CharStreams, CommonTokenStream}
import org.finos.vuu.grammer.{FilterLexer, FilterParser}

object FilterSpecParser extends StrictLogging {

  def parse(s: String): FilterClause = {

    logger.debug(s"Parsing filterspec [$s]")

    val input = CharStreams.fromString(s)
    val lexer = new FilterLexer(input)
    val tokens = new CommonTokenStream(lexer)
    val parser = new FilterParser(tokens)

    val tree = parser.expression()

    val eval = new FilterTreeVisitor()

    val result = eval.visit(tree)

    logger.debug(s"Parsed $result")

    result
  }

}
