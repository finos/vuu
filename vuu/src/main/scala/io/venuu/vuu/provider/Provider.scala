/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.

 * Created by chris on 15/12/14.

 */
package io.venuu.vuu.provider

import io.venuu.toolbox.lifecycle.LifecycleEnabled

trait Provider extends LifecycleEnabled {

  def subscribe(key: String): Unit

  //def processUpdate(key: String, data: Map[String, Any])
  //def processDelete(key: String, data: Map[String, Any])

}
