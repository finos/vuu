package org.finos.vuu.core

object DataConstants {
  final val EmptyString = ""

  def isEmptyString(s: String): Boolean = s == null || s == EmptyString

}
