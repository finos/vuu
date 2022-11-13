package org.finos.vuu.core.filter

import org.finos.vuu.core.sort.AntlrBasedFilter
import org.finos.vuu.core.sort.FilterAndSortFixture._
import org.finos.vuu.core.table.{RowWithData, SimpleDataTable}
import org.finos.vuu.grammer.{FilterLexer, FilterParser}
import org.antlr.v4.runtime.{ANTLRInputStream, CommonTokenStream}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class FilterGrammerTest extends AnyFeatureSpec with Matchers {

  Feature("Check the grammer"){

    def parse(s: String) = {

      val input = new ANTLRInputStream(s);
      val lexer = new FilterLexer(input);
      val tokens = new CommonTokenStream(lexer);
      val parser = new FilterParser(tokens);

      val tree = parser.expression(); // begin parsing at init rule

      System.out.println(tree.toStringTree(parser)); // print LISP-style tree
    }

    def visitClause(s: String): FilterClause = {

      println("========")

      val input = new ANTLRInputStream(s);
      val  lexer = new FilterLexer(input);
      val  tokens = new CommonTokenStream(lexer);
      val parser = new FilterParser(tokens);

      val tree = parser.expression(); // begin parsing at init rule

      val eval = new FilterTreeVisitor();

      val result = eval.visit(tree);

      result
    }

    def doFilter(clause: FilterClause, table: SimpleDataTable) = {

      val filter = new AntlrBasedFilter(clause)

      val result = filter.dofilter(table, table.primaryKeys)

      val asTable = result.toArray.map( key => ( (key, table.pullRow(key, table.columns().toList).asInstanceOf[RowWithData] ) ) ).toList

      asTable
    }


    def withFilter(filter: String)(expectedFn: => List[RowWithData]): Unit = {

      val clause = visitClause(filter)

      println(clause)

      val table = setupTable2()

      val expected = expectedFn

      val result = doFilter(clause, table)

      expectRows(result, expected)
    }

    Scenario("test normal filter scenarios"){

      withFilter("ric = AAPL.L"){
        List(
          RowWithData("NYC-0004",Map("tradeTime" -> 5l,"quantity" -> null,"ric" -> "AAPL.L","orderId" -> "NYC-0004","onMkt" -> false,"trader" -> "chris","ccyCross" -> "GBPUSD"))
        )
      }

      withFilter("ric in [AAPL.L,BT.L]"){
        List(
          RowWithData("NYC-0004",Map("tradeTime" -> 5l,"quantity" -> null,"ric" -> "AAPL.L","orderId" -> "NYC-0004","onMkt" -> false,"trader" -> "chris","ccyCross" -> "GBPUSD")),
          RowWithData("LDN-0002",Map("tradeTime" -> 1l,"quantity" -> 100.0d,"ric" -> "BT.L","orderId" -> "LDN-0002","onMkt" -> true,"trader" -> "steve","ccyCross" -> "GBPUSD")),
          RowWithData("LDN-0008",Map("tradeTime" -> 5l,"quantity" -> 100.0d,"ric" -> "BT.L","orderId" -> "LDN-0008","onMkt" -> true,"trader" -> "chris","ccyCross" -> "GBPUSD"))
        )
      }

      withFilter("ric in [AAPL.L,BT.L]"){
        List(
          RowWithData("NYC-0004",Map("tradeTime" -> 5l,"quantity" -> null,"ric" -> "AAPL.L","orderId" -> "NYC-0004","onMkt" -> false,"trader" -> "chris","ccyCross" -> "GBPUSD")),
          RowWithData("LDN-0002",Map("tradeTime" -> 1l,"quantity" -> 100.0d,"ric" -> "BT.L","orderId" -> "LDN-0002","onMkt" -> true,"trader" -> "steve","ccyCross" -> "GBPUSD")),
          RowWithData("LDN-0008",Map("tradeTime" -> 5l,"quantity" -> 100.0d,"ric" -> "BT.L","orderId" -> "LDN-0008","onMkt" -> true,"trader" -> "chris","ccyCross" -> "GBPUSD"))
        )
      }

      withFilter("tradeTime > 4"){
        List(
          RowWithData("NYC-0002",Map("ric" -> "VOD.L","orderId" -> "NYC-0002","onMkt" -> false,"trader" -> "steve","ccyCross" -> "GBPUSD","tradeTime" -> 6l,"quantity" -> 100.0d)),
          RowWithData("NYC-0010",Map("ric" -> "VOD.L","orderId" -> "NYC-0010","onMkt" -> true,"trader" -> "steve","ccyCross" -> "GBPUSD","tradeTime" -> 6l,"quantity" -> null)),
          RowWithData("NYC-0011",Map("ric" -> "VOD/L","orderId" -> "NYC-0011","onMkt" -> true,"trader" -> "steve","ccyCross" -> "GBPUSD","tradeTime" -> 6l,"quantity" -> null)),
          RowWithData("NYC-0012",Map("ric" -> "VOD\\L","orderId" -> "NYC-0012","onMkt" -> true,"trader" -> "steve","ccyCross" -> "GBPUSD","tradeTime" -> 6l,"quantity" -> null)),
          RowWithData("NYC-0013",Map("ric" -> "VOD\\L","orderId" -> "NYC-0013","onMkt" -> true,"trader" -> "rahúl","ccyCross" -> "$GBPUSD","tradeTime" -> 6l,"quantity" -> null)),
          RowWithData("NYC-0004",Map("ric" -> "AAPL.L","orderId" -> "NYC-0004","onMkt" -> false,"trader" -> "chris","ccyCross" -> "GBPUSD","tradeTime" -> 5l,"quantity" -> null)),
          RowWithData("LDN-0008",Map("ric" -> "BT.L","orderId" -> "LDN-0008","onMkt" -> true,"trader" -> "chris","ccyCross" -> "GBPUSD","tradeTime" -> 5l,"quantity" -> 100.0d))
        )
      }

      withFilter("tradeTime > 4 or orderId = LDN-0002"){
        List(
          RowWithData("NYC-0002",Map("ric" -> "VOD.L","orderId" -> "NYC-0002","onMkt" -> false,"trader" -> "steve","ccyCross" -> "GBPUSD","tradeTime" -> 6l,"quantity" -> 100.0d)),
          RowWithData("NYC-0010",Map("ric" -> "VOD.L","orderId" -> "NYC-0010","onMkt" -> true,"trader" -> "steve","ccyCross" -> "GBPUSD","tradeTime" -> 6l,"quantity" -> null)),
          RowWithData("NYC-0011",Map("ric" -> "VOD/L","orderId" -> "NYC-0011","onMkt" -> true,"trader" -> "steve","ccyCross" -> "GBPUSD","tradeTime" -> 6l,"quantity" -> null)),
          RowWithData("NYC-0012",Map("ric" -> "VOD\\L","orderId" -> "NYC-0012","onMkt" -> true,"trader" -> "steve","ccyCross" -> "GBPUSD","tradeTime" -> 6l,"quantity" -> null)),
          RowWithData("NYC-0013",Map("ric" -> "VOD\\L","orderId" -> "NYC-0013","onMkt" -> true,"trader" -> "rahúl","ccyCross" -> "$GBPUSD","tradeTime" -> 6l,"quantity" -> null)),
          RowWithData("NYC-0004",Map("ric" -> "AAPL.L","orderId" -> "NYC-0004","onMkt" -> false,"trader" -> "chris","ccyCross" -> "GBPUSD","tradeTime" -> 5l,"quantity" -> null)),
          RowWithData("LDN-0008",Map("ric" -> "BT.L","orderId" -> "LDN-0008","onMkt" -> true,"trader" -> "chris","ccyCross" -> "GBPUSD","tradeTime" -> 5l,"quantity" -> 100.0d)),
          RowWithData("LDN-0002",Map("ric" -> "BT.L","orderId" -> "LDN-0002","onMkt" -> true,"trader" -> "steve","ccyCross" -> "GBPUSD","tradeTime" -> 1l,"quantity" -> 100.0d))
        )
      }

      withFilter("orderId starts LDN"){
        List(
          RowWithData("LDN-0001",Map("tradeTime" -> 2l,"quantity" -> 100.0d,"ric" -> "VOD.L","orderId" -> "LDN-0001","onMkt" -> true,"trader" -> "chris","ccyCross" -> "GBPUSD")),
          RowWithData("LDN-0002",Map("tradeTime" -> 1l,"quantity" -> 100.0d,"ric" -> "BT.L","orderId" -> "LDN-0002","onMkt" -> true,"trader" -> "steve","ccyCross" -> "GBPUSD")),
          RowWithData("LDN-0003",Map("tradeTime" -> 3l,"quantity" -> null,"ric" -> "VOD.L","orderId" -> "LDN-0003","onMkt" -> true,"trader" -> "chris","ccyCross" -> "GBPUSD")),
          RowWithData("LDN-0008",Map("tradeTime" -> 5l,"quantity" -> 100.0d,"ric" -> "BT.L","orderId" -> "LDN-0008","onMkt" -> true,"trader" -> "chris","ccyCross" -> "GBPUSD"))
        )
      }

      withFilter("orderId ends 08"){
        List(
          RowWithData("LDN-0008",Map("tradeTime" -> 5l,"quantity" -> 100.0d,"ric" -> "BT.L","orderId" -> "LDN-0008","onMkt" -> true,"trader" -> "chris","ccyCross" -> "GBPUSD"))
        )
      }

      //bug: with less than
      withFilter("quantity < 100"){
        List()
      }

      //reserved chars in teh grammar
      withFilter("ric = \"VOD/L\""){
        List(
          RowWithData("NYC-0011",Map("ric" -> "VOD/L","orderId" -> "NYC-0011","onMkt" -> true,"trader" -> "steve","ccyCross" -> "GBPUSD","tradeTime" -> 6l,"quantity" -> null))
        )
      }

      //unicode
      withFilter("trader = \"rahúl\""){
        List(
          RowWithData("NYC-0013",Map("ric" -> "VOD\\L","orderId" -> "NYC-0013","onMkt" -> true,"trader" -> "rahúl","ccyCross" -> "$GBPUSD","tradeTime" -> 6l,"quantity" -> null))
        )
      }

      //special chars
      withFilter("ccyCross = \"$GBPUSD\""){
        List(
          RowWithData("NYC-0013",Map("ric" -> "VOD\\L","orderId" -> "NYC-0013","onMkt" -> true,"trader" -> "rahúl","ccyCross" -> "$GBPUSD","tradeTime" -> 6l,"quantity" -> null))
        )
      }

    }
  }

}
