package org.finos.vuu.example.rest

object TestUtils {
  def jsonArrayRegex(itemCount: Int): String = s"\\[(\\{[^\\}]*\\},){${itemCount-1}}\\{[^\\}]*\\}\\]"
}
