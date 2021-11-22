package io.venuu.vuu.core.filter

import com.typesafe.scalalogging.StrictLogging
import io.venuu.vuu.grammer.{FilterLexer, FilterParser}
import org.antlr.v4.runtime.{CharStreams, CommonTokenStream}

/**
  * Created by chris on 31/01/2016.
  */
object FilterSpecParser extends StrictLogging {

  def parse(s: String): FilterClause = {

    logger.debug(s"Parsing filterspec [$s]")

    val input = CharStreams.fromString(s)
    val  lexer = new FilterLexer(input)
    val  tokens = new CommonTokenStream(lexer)
    val parser = new FilterParser(tokens)

    val tree = parser.expression()

    val eval = new FilterTreeVisitor()

    val result = eval.visit(tree)

    logger.info(s"Parsed $result")

    result
  }

}
