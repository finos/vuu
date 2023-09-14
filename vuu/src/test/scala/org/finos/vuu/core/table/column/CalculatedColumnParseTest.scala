package org.finos.vuu.core.table.column

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.column.CalculatedColumnFixture._
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class CalculatedColumnParseTest extends AnyFeatureSpec with Matchers with StrictLogging {


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
      concatenate(x,y, ...z)
    logic:
      =if( condition, then, else )
      =or( x, y )
      =and(cond1, cond2, cond...)
   */




  Feature("check calc column grammar") {

    Scenario("run samples of grammar, and check parse or fail") {

      val samples = List(
        "=or(starts(orderId, \"NYC\"), min(120, quantity) > 122)",
        "=if(price > 100, \"true\", \"false\")",
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
        "=quantity / price"
      )

      samples.foreach(parse)

    }

  }
}
