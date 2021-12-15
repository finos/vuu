//package io.venuu.vuu.core.table.column
//
//import io.venuu.vuu.grammer.{CalculatedColumnParser, FilterLexer}
//import org.antlr.v4.runtime.{CharStreams, CommonTokenStream}
//import org.scalatest.featurespec.AnyFeatureSpec
//import org.scalatest.matchers.should.Matchers
//
///**
//  * Created by chris on 16/09/2016.
//  */
//class CalculatedColumnParseTest extends AnyFeatureSpec with Matchers {
//
//  def parse(s: String): Unit = {
//
//    val input = CharStreams.fromString(s)
//    val lexer = new FilterLexer(input)
//    val tokens = new CommonTokenStream(lexer)
//    val parser = new CalculatedColumnParser(tokens)
//
//    val tree = parser.expression() // begin parsing at init rule
//
//    System.out.println(tree.toStringTree(parser)) // print LISP-style tree
//  }
//
//  ignore("check calc column grammer"){
//
//    ignore("run samples of grammer, and check parse or fail"){
//
//      val samples = List(
//        "1 + 2",
//        "3*4",
//        "(bid * ask) / 2"
//      )
//
//      samples.foreach( parse )
//
//    }
//
//  }
//
//}
