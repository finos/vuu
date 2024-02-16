package org.finos.vuu.example.rest

import org.finos.vuu.example.rest.model.Instrument

object TestUtils {
  def testInstrument(id: Long,
                     ric: String = "RIC.L",
                     ccy: String = "CAD",
                     isin: String = "USD0123456789"): Instrument = {
    Instrument(id = id, ccy = ccy, isin = isin, ric = ric)
  }

  def jsonArrayRegex(itemCount: Int): String = s"\\[(\\{[^\\}]*\\},){${itemCount-1}}\\{[^\\}]*\\}\\]"
}
