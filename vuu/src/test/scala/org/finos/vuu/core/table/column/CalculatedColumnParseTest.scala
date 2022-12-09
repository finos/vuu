package org.finos.vuu.core.table.column

import org.antlr.v4.runtime.{CharStreams, CommonTokenStream}
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.core.table.{Columns, RowWithData}
import org.finos.vuu.grammer.{CalculatedColumnLexer, CalculatedColumnParser}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class CalculatedColumnParseTest extends AnyFeatureSpec with Matchers {

  def parse(s: String): Unit = {

    val input = CharStreams.fromString(s)
    val lexer = new CalculatedColumnLexer(input)
    val tokens = new CommonTokenStream(lexer)
    val parser = new CalculatedColumnParser(tokens)

    val tree = parser.expression() // begin parsing at init rule

    System.out.println("IN:" + s)
    System.out.println("OUT" + tree.toStringTree(parser)) // print LISP-style tree

    val tableDef = TableDef(
        "CalColTest",
         "id",
          Columns.fromNames("id".string(), "price".double(), "quantity".long(),
                            "sigfig".double(), "negpos".double(),
                            "i1".int(), "i2".int(), "i3".int(),
                            "text1".string(), "text2".string(),
                            "bid".double(), "ask".double()
          )
    )

    val eval = new CalculatedColumnVisitor(tableDef)

    val result = eval.visit(tree)

    System.out.println(result) // print LISP-style tree

    val row = RowWithData("foo", Map("price" -> 12.23D, "quantity" -> 200L, "id" -> "foo", "i1" -> 100, "i2" -> 10, "i3" -> 1, "bid" -> 99.00D, "ask" -> 101.01D))

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
      cos(number)
      int(number)
    string:
      len(x)
      upper(x)
      lower(x)
      replace(x, y, count)
      replaceAll(x, y)
      left(x, y)
      right(x, y)
      search()
    logic:
      =if( condition, then, else )
      =or( x, y )
      =and(cond1, cond2, cond...)
   */


  Feature("check calc column grammar"){

    Scenario("run samples of grammar, and check parse or fail"){

      val samples = List(
        "=bid",
        "=200",
        "=bid+(price*quantity)",
        "=(price*quantity)*bid",
        "=price*quantity*bid",
        "=(i1-i2)-i3",
        "=(bid*ask)+(price-quantity)",
        "=(bid*100)+(price-50)",
        "=bid*100+price-50",
        "=bid*100.00+price-50.0*bid/price",
        "=price*quantity",
        "=(bid + ask) / 2",
        "=min(min(i1, i3), i2)",
        "=min(i1, i2)",
        "=text(i1, i2)",
        "=max(100, 200, 300)",
        "=concatenate(max(i1, i2), text(quantity))",
//        "=right(client, 3)",
//        "=left(client, 3)"
      )

      samples.foreach( parse )

    }

  }

}
