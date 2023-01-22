package org.finos.vuu.core.table.column

import org.antlr.v4.runtime.{CharStreams, CommonTokenStream}
import org.finos.vuu.core.table.{CalculatedColumn, Column, DataType}
import org.finos.vuu.grammer.{CalculatedColumnLexer, CalculatedColumnParser}
import org.finos.vuu.viewport.ViewPortColumns

object CalculatedColumnFactory {

  def parse(columns: ViewPortColumns, name: String, dataType: String, definition: String): Column = {

      val dt = DataType.fromString(dataType)
      val input = CharStreams.fromString(definition)
      val lexer = new CalculatedColumnLexer(input)
      val tokens = new CommonTokenStream(lexer)
      val parser = new CalculatedColumnParser(tokens)
      val tree = parser.expression()
      val eval = new CalculatedColumnVisitor(columns)
      val clause = eval.visit(tree)
      CalculatedColumn(name, clause, columns.count(), dt)
  }

}
