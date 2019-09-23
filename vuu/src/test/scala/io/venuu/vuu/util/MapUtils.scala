/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.

 * Created by chris on 28/08/15.

 */
package io.venuu.vuu.util

object MapUtils {

  def expectMap(actual: Map[String, Any])(block: => Map[String, Any] ): Unit = {
    val map = block

  }
}
