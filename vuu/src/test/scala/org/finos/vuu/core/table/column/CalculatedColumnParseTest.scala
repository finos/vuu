package org.finos.vuu.core.table.column

import org.finos.vuu.grammer.{CalculatedColumnLexer, CalculatedColumnParser}
import org.antlr.v4.runtime.{CharStreams, CommonTokenStream}
import org.finos.vuu.core.filter.FilterTreeVisitor
import org.finos.vuu.core.table.RowWithData
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class CalculatedColumnParseTest extends AnyFeatureSpec with Matchers {

  def parse(s: String): Unit = {

    val input = CharStreams.fromString(s)
    val lexer = new CalculatedColumnLexer(input)
    val tokens = new CommonTokenStream(lexer)
    val parser = new CalculatedColumnParser(tokens)

    val tree = parser.expression() // begin parsing at init rule

    System.out.println(tree.toStringTree(parser)) // print LISP-style tree

    val eval = new CalculatedColumnVisitor()

    val result = eval.visit(tree)

    System.out.println(result) // print LISP-style tree

    val row = RowWithData("foo", Map("price" -> 12.23, "quantity" -> 200))

    println(result.calculate(row))
  }

  /*
  we will use the LibreOffice definitions for functions: https://help.libreoffice.org/7.1/en-US/text/scalc/01/04060110.html?&DbPAR=CALC&System=UNIX

    math:
      abs
      min(x, y, z...)
      max(x,y,z....)
      sum(x, y, ...z)
      round(x, dps)
      rounddown(x, sigfig)
      roundup(x, sigfig)
      log10(number)
      log(number, logBase)
      ln(number)
      sqrt(number)
      sign(number)
      int(number)
    string:
      len(x)
      upper(x)
      lower(x)
      replace(x, y)
      left(x, y)
      right(x, y)
      search
      substitute()
    logic:
      =if( condition, then, else )
      =or( x, y )
      =and(cond1, cond2, cond...)
   */


  Feature("check calc column grammar"){

    Scenario("run samples of grammar, and check parse or fail"){

      val samples = List(
        "=price*quantity"
//        "=abs(negpos)",
//        "=min(colx, coly)",
//        "=max(colx, coly, colz)",
//        "=(bid * ask) / 2",
//        "=concatenate(max(colx, coly), text(quantity))",
//        "=right(client, 3)",
//        "=left(client, 3)"
      )

      samples.foreach( parse )

    }

  }

}
