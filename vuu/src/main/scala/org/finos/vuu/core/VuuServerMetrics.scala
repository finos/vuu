package org.finos.vuu.core

object VuuServerMetrics {
  final val prefix: String = "org.finos.vuu"

  def toJmxName(suffix: String): String = {
      prefix + "." + suffix
  }

}
